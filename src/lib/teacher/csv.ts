import { CsvRosterRow } from "@/lib/supabase/teacher-portal";

export interface ParsedCsvRow {
  rowNumber: number;
  display_name: string;
  student_identifier?: string;
  notes?: string;
}

export interface CsvParseResult {
  rows: CsvRosterRow[];
  errors: Array<{ rowNumber: number; error: string }>;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseRosterCsv(input: string): CsvParseResult {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) {
    return { rows: [], errors: [{ rowNumber: 0, error: "CSV is empty" }] };
  }

  const lines = normalized.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], errors: [{ rowNumber: 0, error: "CSV is empty" }] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const displayNameIndex = headers.findIndex((h) => h === "display_name" || h === "name" || h === "student_name");
  const studentIdentifierIndex = headers.findIndex((h) => h === "student_identifier" || h === "student_id" || h === "id");
  const notesIndex = headers.findIndex((h) => h === "notes" || h === "note");

  if (displayNameIndex < 0) {
    return {
      rows: [],
      errors: [{ rowNumber: 1, error: "Missing required column: display_name (or name)" }],
    };
  }

  const rows: CsvRosterRow[] = [];
  const errors: Array<{ rowNumber: number; error: string }> = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const raw = parseCsvLine(lines[i]);
    const rowNumber = i + 1;
    const displayName = (raw[displayNameIndex] ?? "").trim();
    const studentIdentifier = studentIdentifierIndex >= 0 ? (raw[studentIdentifierIndex] ?? "").trim() : "";
    const notes = notesIndex >= 0 ? (raw[notesIndex] ?? "").trim() : "";

    if (!displayName) {
      errors.push({ rowNumber, error: "display_name is required" });
      continue;
    }

    const dedupeKey = `${displayName.toLowerCase()}::${studentIdentifier.toLowerCase()}`;
    if (seen.has(dedupeKey)) {
      errors.push({ rowNumber, error: "duplicate row in CSV" });
      continue;
    }
    seen.add(dedupeKey);

    rows.push({
      display_name: displayName,
      ...(studentIdentifier ? { student_identifier: studentIdentifier } : {}),
      ...(notes ? { notes } : {}),
    });
  }

  return { rows, errors };
}

export function domainMatches(verifiedDomains: string[], schoolEmail: string): boolean {
  const normalizedEmail = schoolEmail.trim().toLowerCase();
  const atIndex = normalizedEmail.indexOf("@");
  if (atIndex <= 0 || atIndex === normalizedEmail.length - 1) {
    return false;
  }
  const emailDomain = normalizedEmail.slice(atIndex + 1);
  return verifiedDomains.some((domain) => domain.trim().toLowerCase() === emailDomain);
}
