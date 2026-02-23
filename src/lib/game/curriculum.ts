import type { VocabLevel } from "@/types";

/** Study units per vocab tier — shared by study mode and daily challenge. */
export const TIER_UNITS: Record<VocabLevel, { id: string; label: string }[]> = {
  3: [
    { id: "story-elements", label: "Unit 1: Story Elements & Characters" },
    { id: "context-clues", label: "Unit 2: Context Clues & Word Meaning" },
    { id: "main-idea", label: "Unit 3: Main Idea & Supporting Details" },
  ],
  4: [
    { id: "text-structure", label: "Unit 1: Text Structure & Sequence" },
    { id: "compare-contrast", label: "Unit 2: Compare/Contrast & Point of View" },
    { id: "evidence", label: "Unit 3: Citing Evidence & Inference" },
  ],
  5: [
    { id: "theme-craft", label: "Unit 1: Theme & Author's Craft" },
    { id: "figurative-language", label: "Unit 2: Figurative Language & Tone" },
    { id: "analysis-writing", label: "Unit 3: Analysis & Revision Language" },
  ],
  6: [
    { id: "argument-evidence", label: "Unit 1: Argument, Claims, and Evidence" },
    { id: "literary-analysis", label: "Unit 2: Literary Analysis & Theme Development" },
    { id: "informational", label: "Unit 3: Informational Text & Synthesis" },
  ],
  7: [
    { id: "rhetoric-devices", label: "Unit 1: Rhetoric & Authorial Choices" },
    { id: "argumentation", label: "Unit 2: Argumentation & Counterclaims" },
    { id: "precision-style", label: "Unit 3: Precision, Connotation, and Style" },
  ],
  "english1": [
    { id: "preap1-close-reading", label: "Unit 1: Pre-AP E1 Close Reading Basics" },
    { id: "preap1-evidence", label: "Unit 2: Textual Evidence & Commentary" },
    { id: "preap1-claims", label: "Unit 3: Claims, Reasoning, and Organization" },
    { id: "preap1-style", label: "Unit 4: Style, Diction, and Revision Moves" },
  ],
  "english2": [
    { id: "preap2-analysis", label: "Unit 1: Pre-AP E2 Author's Choices & Analysis" },
    { id: "preap2-synthesis", label: "Unit 2: Source Integration & Synthesis" },
    { id: "preap2-argument", label: "Unit 3: Argument Development & Counterargument" },
    { id: "preap2-style", label: "Unit 4: Syntax, Nuance, and Voice" },
  ],
  "english3": [
    { id: "amerlit-origins", label: "Unit 1: U.S. Origins, Puritan & Enlightenment Texts" },
    { id: "amerlit-romantic", label: "Unit 2: Romanticism & Transcendentalism" },
    { id: "amerlit-realism", label: "Unit 3: Realism, Regionalism, and Naturalism" },
    { id: "amerlit-modern", label: "Unit 4: Modernism to Contemporary American Voices" },
  ],
  "ap-lang": [
    { id: "aplang-rhetorical-situation", label: "Unit 1: Rhetorical Situation" },
    { id: "aplang-claims-evidence", label: "Unit 2: Claims & Evidence" },
    { id: "aplang-reasoning-organization", label: "Unit 3: Reasoning & Organization" },
    { id: "aplang-style", label: "Unit 4: Style" },
    { id: "aplang-synthesis", label: "Unit 5: Synthesis & Argument" },
  ],
  "ap-lit": [
    { id: "aplit-short-fiction", label: "Unit 1: Short Fiction" },
    { id: "aplit-poetry", label: "Unit 2: Poetry" },
    { id: "aplit-long-fiction", label: "Unit 3: Longer Fiction or Drama" },
    { id: "aplit-analysis-writing", label: "Unit 4: Literary Argument Writing" },
    { id: "aplit-theme-complexity", label: "Unit 5: Theme, Complexity, and Interpretation" },
  ],
};

/** Skill tags used to filter questions per unit. */
export const UNIT_SKILL_TAG_FILTERS: Record<string, string[]> = {
  "story-elements": ["definitions"],
  "context-clues": ["context-clues", "definitions"],
  "main-idea": ["definitions", "synonyms"],
  "text-structure": ["definitions", "context-clues"],
  "compare-contrast": ["definitions", "antonyms", "synonyms"],
  "evidence": ["context-clues", "definitions"],
  "theme-craft": ["definitions", "context-clues"],
  "figurative-language": ["definitions", "synonyms"],
  "analysis-writing": ["definitions", "context-clues", "word-forms"],
  "argument-evidence": ["definitions", "context-clues"],
  "literary-analysis": ["definitions", "synonyms"],
  "informational": ["definitions", "context-clues"],
  "rhetoric-devices": ["definitions", "context-clues"],
  "argumentation": ["definitions", "antonyms", "synonyms"],
  "precision-style": ["definitions", "word-forms", "synonyms"],
  "preap1-close-reading": ["context-clues", "definitions"],
  "preap1-evidence": ["context-clues", "definitions"],
  "preap1-claims": ["definitions", "synonyms", "antonyms"],
  "preap1-style": ["definitions", "word-forms", "synonyms"],
  "preap2-analysis": ["context-clues", "definitions"],
  "preap2-synthesis": ["context-clues", "definitions", "synonyms"],
  "preap2-argument": ["definitions", "antonyms", "synonyms"],
  "preap2-style": ["definitions", "word-forms", "synonyms"],
  "amerlit-origins": ["definitions", "context-clues"],
  "amerlit-romantic": ["definitions", "context-clues", "synonyms"],
  "amerlit-realism": ["definitions", "context-clues"],
  "amerlit-modern": ["definitions", "context-clues", "antonyms"],
  "aplang-rhetorical-situation": ["definitions", "context-clues"],
  "aplang-claims-evidence": ["definitions", "context-clues", "synonyms"],
  "aplang-reasoning-organization": ["definitions", "context-clues"],
  "aplang-style": ["definitions", "synonyms", "antonyms"],
  "aplang-synthesis": ["definitions", "context-clues", "word-forms"],
  "aplit-short-fiction": ["definitions", "context-clues"],
  "aplit-poetry": ["definitions", "synonyms", "context-clues"],
  "aplit-long-fiction": ["definitions", "context-clues"],
  "aplit-analysis-writing": ["definitions", "word-forms", "synonyms"],
  "aplit-theme-complexity": ["definitions", "context-clues", "antonyms"],
};

/** Level display names for daily challenge (e.g. "AP Lang"). */
export const LEVEL_DISPLAY: Record<string, string> = {
  "3": "Grade 3",
  "4": "Grade 4",
  "5": "Grade 5",
  "6": "Grade 6",
  "7": "Grade 7",
  "english1": "Pre-AP English 1",
  "english2": "Pre-AP English 2",
  "english3": "American Literature",
  "ap-lang": "AP Lang",
  "ap-lit": "AP Lit",
};
