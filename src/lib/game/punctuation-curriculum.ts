import { Question, PunctuationLevel, SkillTag } from "@/types";

export interface PunctuationCurriculumModule {
  id: string;
  title: string;
  pathway: "3-5" | "6-12";
  summary: string;
  punctuationLevel: PunctuationLevel;
  skillTags: SkillTag[];
}

/**
 * NoRedInk-inspired punctuation scope and sequence.
 * Source pathways are adapted from NoRedInk public pathway/topic listings.
 */
export const PUNCTUATION_CURRICULUM_MODULES: PunctuationCurriculumModule[] = [
  {
    id: "apostrophes-possession",
    title: "Apostrophes for Possession",
    pathway: "3-5",
    summary: "Singular/plural possessives and irregular possessive nouns.",
    punctuationLevel: 1,
    skillTags: ["apostrophes"],
  },
  {
    id: "contractions-and-end-marks",
    title: "Contractions and End Marks",
    pathway: "3-5",
    summary: "Contractions plus periods, question marks, and exclamation points.",
    punctuationLevel: 1,
    skillTags: ["contractions", "end-marks"],
  },
  {
    id: "commas-introductory-elements",
    title: "Commas with Introductory Elements",
    pathway: "3-5",
    summary: "Intro words/phrases and introductory dependent clauses.",
    punctuationLevel: 1,
    skillTags: ["introductory-elements", "commas"],
  },
  {
    id: "dialogue-and-quotation-marks",
    title: "Dialogue and Quotation Marks",
    pathway: "3-5",
    summary: "Direct speech punctuation and end punctuation with quotes.",
    punctuationLevel: 2,
    skillTags: ["dialogue-punctuation", "quotation-marks"],
  },
  {
    id: "commas-nonrestrictive-elements",
    title: "Commas with Nonrestrictive Elements",
    pathway: "3-5",
    summary: "Appositives and nonessential clauses set off with commas.",
    punctuationLevel: 2,
    skillTags: ["nonrestrictive-elements", "commas"],
  },
  {
    id: "coordinate-adjectives",
    title: "Commas Between Coordinate Adjectives",
    pathway: "3-5",
    summary: "Use commas between equal adjectives before a noun.",
    punctuationLevel: 2,
    skillTags: ["coordinate-adjectives", "commas"],
  },
  {
    id: "fragments-run-ons",
    title: "Avoiding Fragments and Run-ons",
    pathway: "6-12",
    summary: "Repair sentence fragments and fused/run-on sentences.",
    punctuationLevel: 2,
    skillTags: ["fragments-run-ons", "conjunctions", "semicolons"],
  },
  {
    id: "semicolon-colon-core",
    title: "Semicolons and Colons",
    pathway: "6-12",
    summary: "Join independent clauses and introduce lists/explanations.",
    punctuationLevel: 3,
    skillTags: ["semicolons", "colons"],
  },
  {
    id: "dashes-parentheses-brackets",
    title: "Dashes and Paired Punctuation",
    pathway: "6-12",
    summary: "Use em dashes, parentheses, and brackets for parenthetical info.",
    punctuationLevel: 3,
    skillTags: ["dashes", "paired-punctuation"],
  },
  {
    id: "hyphens-and-compounds",
    title: "Hyphens in Compound Modifiers",
    pathway: "6-12",
    summary: "Hyphenate compound modifiers before nouns.",
    punctuationLevel: 3,
    skillTags: ["hyphens"],
  },
  {
    id: "conjunctions-and-sentence-variety",
    title: "Conjunctions and Sentence Variety",
    pathway: "6-12",
    summary: "Coordinate/subordinate clauses and varied sentence structures.",
    punctuationLevel: 2,
    skillTags: ["conjunctions", "sentence-variety", "commas"],
  },
  {
    id: "paired-punctuation-mastery",
    title: "Paired Punctuation Mastery",
    pathway: "6-12",
    summary: "Parenthetical commas, dashes, and quotation punctuation choices.",
    punctuationLevel: 3,
    skillTags: ["paired-punctuation", "dashes", "quotation-marks"],
  },
];

export const PUNCTUATION_CURRICULUM_QUESTIONS: Question[] = [
  { id: "pc001", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", punctuationLevel: 1, prompt: "Which sentence shows correct singular possession?", choices: ["The teachers desk was covered in papers.", "The teacher's desk was covered in papers.", "The teachers' desk was covered in papers.", "The teacher desk's was covered in papers."], answer_index: 1 },
  { id: "pc002", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", punctuationLevel: 1, prompt: "Which sentence shows correct plural possession?", choices: ["The players uniforms were muddy.", "The player's uniforms were muddy.", "The players' uniforms were muddy.", "The players uniforms' were muddy."], answer_index: 2 },
  { id: "pc003", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", punctuationLevel: 1, prompt: "Which sentence uses possession correctly with an irregular plural noun?", choices: ["The childrens' books are on the shelf.", "The children's books are on the shelf.", "The childrens books are on the shelf.", "The children book's are on the shelf."], answer_index: 1 },

  { id: "pc004", subject: "punctuation", difficulty: 1, skill_tag: "contractions", punctuationLevel: 1, prompt: "Which contraction is correct?", choices: ["wont", "won't", "wo'nt", "won't'"], answer_index: 1 },
  { id: "pc005", subject: "punctuation", difficulty: 1, skill_tag: "contractions", punctuationLevel: 1, prompt: "Choose the sentence with correct contractions.", choices: ["I cant believe were late.", "I can't believe we're late.", "I can't believe were late.", "I cant believe we're late."], answer_index: 1 },
  { id: "pc006", subject: "punctuation", difficulty: 1, skill_tag: "end-marks", punctuationLevel: 1, prompt: "Which sentence uses the correct end mark?", choices: ["What time does practice start.", "What time does practice start?", "What time does practice start!", "What time does practice start,"], answer_index: 1 },

  { id: "pc007", subject: "punctuation", difficulty: 1, skill_tag: "introductory-elements", punctuationLevel: 1, prompt: "Which sentence correctly punctuates an introductory phrase?", choices: ["Before dinner we finished our homework.", "Before dinner, we finished our homework.", "Before, dinner we finished our homework.", "Before dinner we, finished our homework."], answer_index: 1 },
  { id: "pc008", subject: "punctuation", difficulty: 1, skill_tag: "introductory-elements", punctuationLevel: 1, prompt: "Which sentence correctly uses a comma after an introductory word?", choices: ["Fortunately we caught the bus.", "Fortunately, we caught the bus.", "Fortunately we, caught the bus.", "Fortunately, we, caught the bus."], answer_index: 1 },
  { id: "pc009", subject: "punctuation", difficulty: 1, skill_tag: "commas", punctuationLevel: 1, prompt: "Which sentence uses commas correctly in a list?", choices: ["We packed snacks water and sunscreen.", "We packed snacks, water, and sunscreen.", "We packed, snacks water and sunscreen.", "We packed snacks, water and sunscreen,"], answer_index: 1 },

  { id: "pc010", subject: "punctuation", difficulty: 2, skill_tag: "dialogue-punctuation", punctuationLevel: 2, prompt: "Which sentence punctuates dialogue correctly?", choices: ["\"Please close the door,\" Maya said.", "\"Please close the door\" Maya said.", "\"Please close the door\", Maya said.", "Maya said \"Please close the door.\""], answer_index: 0 },
  { id: "pc011", subject: "punctuation", difficulty: 2, skill_tag: "quotation-marks", punctuationLevel: 2, prompt: "Which sentence correctly places punctuation with quotation marks?", choices: ["He asked, \"Are you ready\"?", "He asked, \"Are you ready?\"", "He asked \"Are you ready?\".", "He asked, \"Are you ready\"."], answer_index: 1 },
  { id: "pc012", subject: "punctuation", difficulty: 2, skill_tag: "dialogue-punctuation", punctuationLevel: 2, prompt: "Which sentence correctly punctuates interrupted dialogue?", choices: ["\"I can't,\" she said, \"find my keys.\"", "\"I can't\" she said, \"find my keys.\"", "\"I can't,\" she said \"find my keys.\"", "\"I can't\", she said, \"find my keys.\""], answer_index: 0 },

  { id: "pc013", subject: "punctuation", difficulty: 2, skill_tag: "nonrestrictive-elements", punctuationLevel: 2, prompt: "Which sentence uses commas correctly with a nonrestrictive clause?", choices: ["My cousin who lives in Denver is visiting.", "My cousin, who lives in Denver, is visiting.", "My cousin who lives in Denver, is visiting.", "My cousin, who lives in Denver is visiting."], answer_index: 1 },
  { id: "pc014", subject: "punctuation", difficulty: 2, skill_tag: "nonrestrictive-elements", punctuationLevel: 2, prompt: "Which sentence uses commas correctly with an appositive?", choices: ["Our principal Dr. Reyes greeted us.", "Our principal, Dr. Reyes, greeted us.", "Our principal Dr. Reyes, greeted us.", "Our principal, Dr. Reyes greeted us."], answer_index: 1 },
  { id: "pc015", subject: "punctuation", difficulty: 2, skill_tag: "commas", punctuationLevel: 2, prompt: "Which sentence uses commas correctly with direct address?", choices: ["Coach can we start warmups now?", "Coach, can we start warmups now?", "Coach can we, start warmups now?", "Coach, can we, start warmups now?"], answer_index: 1 },

  { id: "pc016", subject: "punctuation", difficulty: 2, skill_tag: "coordinate-adjectives", punctuationLevel: 2, prompt: "Which sentence correctly uses commas between coordinate adjectives?", choices: ["It was a long exhausting day.", "It was a long, exhausting day.", "It was a long exhausting, day.", "It was a long, exhausting, day."], answer_index: 1 },
  { id: "pc017", subject: "punctuation", difficulty: 2, skill_tag: "coordinate-adjectives", punctuationLevel: 2, prompt: "Which sentence correctly punctuates coordinate adjectives?", choices: ["She adopted a playful energetic puppy.", "She adopted a playful, energetic puppy.", "She adopted a playful energetic, puppy.", "She adopted a playful, energetic, puppy."], answer_index: 1 },
  { id: "pc018", subject: "punctuation", difficulty: 2, skill_tag: "commas", punctuationLevel: 2, prompt: "Choose the sentence that uses commas correctly in a compound sentence.", choices: ["I wanted to stay, but I had to leave.", "I wanted to stay but, I had to leave.", "I wanted to stay but I had to leave.", "I wanted to stay, but, I had to leave."], answer_index: 0 },

  { id: "pc019", subject: "punctuation", difficulty: 2, skill_tag: "fragments-run-ons", punctuationLevel: 2, prompt: "Which sentence fixes the run-on correctly?", choices: ["The bell rang we went to class.", "The bell rang; we went to class.", "The bell rang, we went to class.", "The bell rang and, we went to class."], answer_index: 1 },
  { id: "pc020", subject: "punctuation", difficulty: 2, skill_tag: "fragments-run-ons", punctuationLevel: 2, prompt: "Which option is a complete sentence (not a fragment)?", choices: ["Because the movie ended late.", "After we finished dinner.", "The movie ended late, so we took a taxi home.", "When the rain finally stopped."], answer_index: 2 },
  { id: "pc021", subject: "punctuation", difficulty: 2, skill_tag: "conjunctions", punctuationLevel: 2, prompt: "Which sentence correctly uses a subordinating conjunction and comma?", choices: ["Although it was cold we still practiced outside.", "Although it was cold, we still practiced outside.", "Although, it was cold we still practiced outside.", "Although it was cold we still, practiced outside."], answer_index: 1 },

  { id: "pc022", subject: "punctuation", difficulty: 3, skill_tag: "semicolons", punctuationLevel: 3, prompt: "Which sentence correctly uses a semicolon between independent clauses?", choices: ["The sky darkened, we hurried home.", "The sky darkened; we hurried home.", "The sky darkened; and we hurried home.", "The sky darkened we hurried home."], answer_index: 1 },
  { id: "pc023", subject: "punctuation", difficulty: 3, skill_tag: "colons", punctuationLevel: 3, prompt: "Which sentence correctly uses a colon to introduce a list?", choices: ["You need three items: tape, scissors, and glue.", "You need three items tape, scissors, and glue.", "You need: three items tape, scissors, and glue.", "You need three items, tape, scissors, and glue."], answer_index: 0 },
  { id: "pc024", subject: "punctuation", difficulty: 3, skill_tag: "semicolons", punctuationLevel: 3, prompt: "Which sentence correctly uses a semicolon with a conjunctive adverb?", choices: ["I was tired; however, I kept studying.", "I was tired however; I kept studying.", "I was tired; however I kept studying.", "I was tired, however; I kept studying."], answer_index: 0 },

  { id: "pc025", subject: "punctuation", difficulty: 3, skill_tag: "dashes", punctuationLevel: 3, prompt: "Which sentence correctly uses em dashes for a parenthetical phrase?", choices: ["The answer-if you check your notes-is obvious.", "The answer, if you check your notes, is obvious.", "The answer-if you check your notes - is obvious.", "The answer-if you check your notes is obvious."], answer_index: 0 },
  { id: "pc026", subject: "punctuation", difficulty: 3, skill_tag: "paired-punctuation", punctuationLevel: 3, prompt: "Which sentence correctly uses parentheses?", choices: ["Our team (which practiced daily) won the finals.", "Our team (which practiced daily won the finals.", "Our team which practiced daily) won the finals.", "Our team (which practiced daily), won the finals."], answer_index: 0 },
  { id: "pc027", subject: "punctuation", difficulty: 3, skill_tag: "paired-punctuation", punctuationLevel: 3, prompt: "Which sentence correctly uses paired commas?", choices: ["My brother, a talented drummer, joined the band.", "My brother a talented drummer, joined the band.", "My brother, a talented drummer joined the band.", "My brother a talented drummer joined, the band."], answer_index: 0 },

  { id: "pc028", subject: "punctuation", difficulty: 3, skill_tag: "hyphens", punctuationLevel: 3, prompt: "Which sentence correctly hyphenates a compound modifier?", choices: ["She bought a high quality backpack.", "She bought a high-quality backpack.", "She bought a high- quality backpack.", "She bought a high quality-backpack."], answer_index: 1 },
  { id: "pc029", subject: "punctuation", difficulty: 3, skill_tag: "hyphens", punctuationLevel: 3, prompt: "Which sentence uses a hyphen correctly?", choices: ["We watched a fast-paced game.", "We watched a fast paced game.", "We watched a fast- paced game.", "We watched a fast paced-game."], answer_index: 0 },
  { id: "pc030", subject: "punctuation", difficulty: 3, skill_tag: "hyphens", punctuationLevel: 3, prompt: "Which sentence is punctuated correctly?", choices: ["It was a well written essay.", "It was a well-written essay.", "It was a well- written essay.", "It was a well written-essay."], answer_index: 1 },

  { id: "pc031", subject: "punctuation", difficulty: 2, skill_tag: "conjunctions", punctuationLevel: 2, prompt: "Which sentence correctly uses a coordinating conjunction?", choices: ["I wanted popcorn, but the line was too long.", "I wanted popcorn but, the line was too long.", "I wanted popcorn, but, the line was too long.", "I wanted popcorn but the line was too long"], answer_index: 0 },
  { id: "pc032", subject: "punctuation", difficulty: 2, skill_tag: "sentence-variety", punctuationLevel: 2, prompt: "Which revision improves sentence variety and punctuation?", choices: ["We finished practice. We went home. We ate dinner.", "After practice, we went home, and then we ate dinner.", "After practice we went home and then we ate dinner.", "After practice, we went home and then we ate dinner, and."], answer_index: 1 },
  { id: "pc033", subject: "punctuation", difficulty: 2, skill_tag: "conjunctions", punctuationLevel: 2, prompt: "Which sentence correctly punctuates a dependent clause at the end?", choices: ["I packed an umbrella because it looked like rain.", "I packed an umbrella, because it looked like rain.", "I packed an umbrella because, it looked like rain.", "I packed an umbrella, because, it looked like rain."], answer_index: 0 },

  { id: "pc034", subject: "punctuation", difficulty: 3, skill_tag: "paired-punctuation", punctuationLevel: 3, prompt: "Which sentence punctuates an interrupter correctly?", choices: ["The project, according to our teacher, is due Friday.", "The project according to our teacher, is due Friday.", "The project, according to our teacher is due Friday.", "The project according to our teacher is due, Friday."], answer_index: 0 },
  { id: "pc035", subject: "punctuation", difficulty: 3, skill_tag: "quotation-marks", punctuationLevel: 3, prompt: "Which sentence correctly punctuates a quotation that ends the sentence?", choices: ["The sign read \"Keep Out.\"", "The sign read, \"Keep Out\".", "The sign read \"Keep Out\".", "The sign read: \"Keep Out\"."], answer_index: 0 },
  { id: "pc036", subject: "punctuation", difficulty: 3, skill_tag: "dashes", punctuationLevel: 3, prompt: "Which sentence correctly uses an em dash for emphasis?", choices: ["One thing was certain-practice mattered most.", "One thing was certain practice mattered most.", "One thing was certain; practice mattered most.", "One thing was certain, practice mattered most."], answer_index: 0 },
];

export function getPunctuationModulesByLevel(level: PunctuationLevel): PunctuationCurriculumModule[] {
  return PUNCTUATION_CURRICULUM_MODULES.filter((module) => module.punctuationLevel === level);
}

export function getPunctuationQuestionsByModule(
  moduleId: string,
  allPunctuationQuestions: Question[],
  count: number = 12
): Question[] {
  const module = PUNCTUATION_CURRICULUM_MODULES.find((m) => m.id === moduleId);
  if (!module) return [];
  const filtered = allPunctuationQuestions.filter((q) =>
    q.subject === "punctuation" && module.skillTags.includes(q.skill_tag)
  );
  const pool = filtered.length >= 8
    ? filtered
    : allPunctuationQuestions.filter(
      (q) => q.subject === "punctuation" && q.punctuationLevel === module.punctuationLevel
    );
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
}
