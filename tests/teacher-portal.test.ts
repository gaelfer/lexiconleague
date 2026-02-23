import { describe, expect, it } from "vitest";
import { domainMatches, parseRosterCsv } from "../src/lib/teacher/csv";

describe("teacher portal helpers", () => {
  it("matches school domains case-insensitively", () => {
    expect(domainMatches(["District.K12.ca.us", "example.org"], "TEACHER@district.k12.ca.us")).toBe(true);
    expect(domainMatches(["example.org"], "teacher@other.org")).toBe(false);
  });

  it("parses roster csv and rejects duplicate or blank names", () => {
    const csv = `display_name,student_identifier,notes\nAlice A,AA01,Fast learner\n,AA02,Missing name\nAlice A,AA01,Duplicate\nBob B,,`;
    const parsed = parseRosterCsv(csv);

    expect(parsed.rows).toEqual([
      { display_name: "Alice A", student_identifier: "AA01", notes: "Fast learner" },
      { display_name: "Bob B" },
    ]);
    expect(parsed.errors).toEqual([
      { rowNumber: 3, error: "display_name is required" },
      { rowNumber: 4, error: "duplicate row in CSV" },
    ]);
  });

  it("requires display_name header", () => {
    const parsed = parseRosterCsv("student_identifier,notes\nAA01,Hi");
    expect(parsed.rows).toEqual([]);
    expect(parsed.errors[0]?.error).toContain("display_name");
  });
});
