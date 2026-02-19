import { Question } from "@/types";
import { seededShuffle } from "./matchmaking";

export const VOCAB_QUESTIONS: Question[] = [
  {
    id: "v001",
    subject: "vocabulary",
    difficulty: 1,
    skill_tag: "definitions",
    prompt: "What does 'benevolent' mean?",
    choices: ["Mean and cruel", "Kind and generous", "Loud and boisterous", "Shy and timid"],
    answer_index: 1,
  },
  {
    id: "v002",
    subject: "vocabulary",
    difficulty: 1,
    skill_tag: "definitions",
    prompt: "What does 'arid' mean?",
    choices: ["Very wet", "Very cold", "Very dry", "Very windy"],
    answer_index: 2,
  },
  {
    id: "v003",
    subject: "vocabulary",
    difficulty: 2,
    skill_tag: "synonyms",
    prompt: "Which word is closest in meaning to 'courageous'?",
    choices: ["Fearful", "Brave", "Clumsy", "Quiet"],
    answer_index: 1,
  },
  {
    id: "v004",
    subject: "vocabulary",
    difficulty: 2,
    skill_tag: "antonyms",
    prompt: "Which word is the OPPOSITE of 'ancient'?",
    choices: ["Old", "Historical", "Modern", "Antique"],
    answer_index: 2,
  },
  {
    id: "v005",
    subject: "vocabulary",
    difficulty: 2,
    skill_tag: "definitions",
    prompt: "What does 'luminous' mean?",
    choices: ["Very heavy", "Giving off light", "Completely silent", "Extremely cold"],
    answer_index: 1,
  },
  {
    id: "v006",
    subject: "vocabulary",
    difficulty: 3,
    skill_tag: "context-clues",
    prompt: "The scientist was meticulous in her work, checking every measurement twice. What does 'meticulous' mean?",
    choices: ["Careless and rushed", "Very careful and precise", "Lazy and slow", "Excited and energetic"],
    answer_index: 1,
  },
  {
    id: "v007",
    subject: "vocabulary",
    difficulty: 3,
    skill_tag: "definitions",
    prompt: "What does 'resilient' mean?",
    choices: [
      "Easily broken or defeated",
      "Able to recover quickly from difficulty",
      "Reluctant to try new things",
      "Overly emotional",
    ],
    answer_index: 1,
  },
  {
    id: "v008",
    subject: "vocabulary",
    difficulty: 2,
    skill_tag: "synonyms",
    prompt: "Which word is closest in meaning to 'vivid'?",
    choices: ["Dull", "Faint", "Bright", "Quiet"],
    answer_index: 2,
  },
  {
    id: "v009",
    subject: "vocabulary",
    difficulty: 3,
    skill_tag: "definitions",
    prompt: "What does 'ambiguous' mean?",
    choices: [
      "Perfectly clear and obvious",
      "Open to more than one interpretation",
      "Extremely difficult to complete",
      "Very dangerous",
    ],
    answer_index: 1,
  },
  {
    id: "v010",
    subject: "vocabulary",
    difficulty: 2,
    skill_tag: "definitions",
    prompt: "What does 'tranquil' mean?",
    choices: ["Loud and chaotic", "Peaceful and calm", "Energetic and fast", "Cold and damp"],
    answer_index: 1,
  },
  {
    id: "v011",
    subject: "vocabulary",
    difficulty: 3,
    skill_tag: "word-forms",
    prompt: "What is the noun form of the adjective 'curious'?",
    choices: ["Curiously", "Curiosity", "Curiousness", "Curious"],
    answer_index: 1,
  },
  {
    id: "v012",
    subject: "vocabulary",
    difficulty: 3,
    skill_tag: "antonyms",
    prompt: "Which word is the OPPOSITE of 'verbose'?",
    choices: ["Wordy", "Talkative", "Concise", "Eloquent"],
    answer_index: 2,
  },
  {
    id: "v013",
    subject: "vocabulary",
    difficulty: 4,
    skill_tag: "definitions",
    prompt: "What does 'ephemeral' mean?",
    choices: ["Lasting forever", "Lasting only a short time", "Very important", "Extremely large"],
    answer_index: 1,
  },
  {
    id: "v014",
    subject: "vocabulary",
    difficulty: 4,
    skill_tag: "context-clues",
    prompt:
      "After weeks of drought, the flowers were desiccated, crumbling at the slightest touch. What does 'desiccated' mean?",
    choices: ["Freshly watered", "Completely dried out", "Brightly colored", "Rapidly growing"],
    answer_index: 1,
  },
  {
    id: "v015",
    subject: "vocabulary",
    difficulty: 2,
    skill_tag: "definitions",
    prompt: "What does 'collaborate' mean?",
    choices: [
      "To compete against someone",
      "To work together toward a shared goal",
      "To argue about a topic",
      "To ignore someone's ideas",
    ],
    answer_index: 1,
  },
  {
    id: "v016",
    subject: "vocabulary",
    difficulty: 1,
    skill_tag: "definitions",
    prompt: "What does 'rapid' mean?",
    choices: ["Very slow", "Very fast", "Very large", "Very small"],
    answer_index: 1,
  },
  {
    id: "v017",
    subject: "vocabulary",
    difficulty: 3,
    skill_tag: "synonyms",
    prompt: "Which word is closest in meaning to 'diligent'?",
    choices: ["Lazy", "Hardworking", "Careless", "Distracted"],
    answer_index: 1,
  },
  {
    id: "v018",
    subject: "vocabulary",
    difficulty: 4,
    skill_tag: "definitions",
    prompt: "What does 'tenacious' mean?",
    choices: [
      "Quick to give up",
      "Holding firmly to a purpose despite obstacles",
      "Easily confused",
      "Overly generous",
    ],
    answer_index: 1,
  },
  {
    id: "v019",
    subject: "vocabulary",
    difficulty: 2,
    skill_tag: "antonyms",
    prompt: "Which word is the OPPOSITE of 'transparent'?",
    choices: ["Clear", "Obvious", "Opaque", "Bright"],
    answer_index: 2,
  },
  {
    id: "v020",
    subject: "vocabulary",
    difficulty: 5,
    skill_tag: "definitions",
    prompt: "What does 'obsequious' mean?",
    choices: [
      "Extremely stubborn",
      "Excessively eager to please or obey",
      "Secretly rebellious",
      "Brilliantly intelligent",
    ],
    answer_index: 1,
  },
];

export const PUNCTUATION_QUESTIONS: Question[] = [
  {
    id: "p001",
    subject: "punctuation",
    difficulty: 1,
    skill_tag: "commas",
    prompt: "Which sentence uses a comma correctly?",
    choices: [
      "I like cats, dogs and birds.",
      "I like cats, dogs, and birds.",
      "I like, cats dogs and birds.",
      "I, like cats dogs and birds.",
    ],
    answer_index: 1,
  },
  {
    id: "p002",
    subject: "punctuation",
    difficulty: 1,
    skill_tag: "apostrophes",
    prompt: "Which sentence uses an apostrophe correctly?",
    choices: [
      "The dog wagged it's tail.",
      "The dog wagged its' tail.",
      "The dog wagged its tail.",
      "The dog wagged it tail.",
    ],
    answer_index: 2,
  },
  {
    id: "p003",
    subject: "punctuation",
    difficulty: 2,
    skill_tag: "quotation-marks",
    prompt: "Which sentence uses quotation marks correctly?",
    choices: [
      'She said, "I will be there soon."',
      'She said, "I will be there soon".',
      "She said, 'I will be there soon.'",
      'She "said," I will be there soon.',
    ],
    answer_index: 0,
  },
  {
    id: "p004",
    subject: "punctuation",
    difficulty: 2,
    skill_tag: "apostrophes",
    prompt: "Which sentence is punctuated correctly?",
    choices: [
      "That is Sarahs book.",
      "That is Sarah's book.",
      "That is Sarahs' book.",
      "That is Sarah book's.",
    ],
    answer_index: 1,
  },
  {
    id: "p005",
    subject: "punctuation",
    difficulty: 3,
    skill_tag: "semicolons",
    prompt: "Which sentence correctly uses a semicolon?",
    choices: [
      "I love soccer; and basketball is great too.",
      "She studied hard; she passed the exam.",
      "We went to; the park and the mall.",
      "He is tall; but thin.",
    ],
    answer_index: 1,
  },
  {
    id: "p006",
    subject: "punctuation",
    difficulty: 2,
    skill_tag: "capitalization",
    prompt: "Which sentence is capitalized correctly?",
    choices: [
      "we visited new york city last summer.",
      "We visited New york city last Summer.",
      "We visited New York City last summer.",
      "We Visited New York city last summer.",
    ],
    answer_index: 2,
  },
  {
    id: "p007",
    subject: "punctuation",
    difficulty: 3,
    skill_tag: "commas",
    prompt: "Which sentence uses commas correctly in a complex sentence?",
    choices: [
      "Although it was raining we decided to go outside.",
      "Although, it was raining, we decided to go outside.",
      "Although it was raining, we decided to go outside.",
      "Although it was raining we decided, to go outside.",
    ],
    answer_index: 2,
  },
  {
    id: "p008",
    subject: "punctuation",
    difficulty: 1,
    skill_tag: "apostrophes",
    prompt: "Which contraction is spelled correctly?",
    choices: ["dont", "don't", "do'nt", "don't'"],
    answer_index: 1,
  },
];

export function getQuestionsForMode(
  subject: "vocabulary" | "punctuation",
  count: number = 20
): Question[] {
  const pool = subject === "vocabulary" ? VOCAB_QUESTIONS : PUNCTUATION_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getMixedQuestions(count: number = 20): Question[] {
  const all = [...VOCAB_QUESTIONS, ...PUNCTUATION_QUESTIONS];
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getSeededQuestions(
  subject: "vocabulary" | "punctuation",
  seed: string,
  count: number = 20
): Question[] {
  const pool = subject === "vocabulary" ? VOCAB_QUESTIONS : PUNCTUATION_QUESTIONS;
  const shuffled = seededShuffle(pool, seed);
  return shuffled.slice(0, Math.min(count, pool.length));
}
