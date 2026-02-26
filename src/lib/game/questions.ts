import { Question, VocabGrade, VocabLevel, PunctuationLevel } from "@/types";
import {
  getPunctuationQuestionsByModule as getRawPunctuationQuestionsByModule,
  PUNCTUATION_CURRICULUM_MODULES,
  PUNCTUATION_CURRICULUM_QUESTIONS,
} from "./punctuation-curriculum";

// ── Tier label helpers ─────────────────────────────────────────────────────────
export const VOCAB_LEVEL_LABELS: Record<VocabLevel, string> = {
  3: "Grade 3",
  4: "Grade 4",
  5: "Grade 5",
  6: "Grade 6",
  7: "Grade 7",
  "english1": "English 1",
  "english2": "English 2",
  "english3": "English 3",
  "ap-lang": "AP Language & Composition",
  "ap-lit": "AP Literature & Composition",
};
import { seededShuffle } from "./matchmaking";

/**
 * Vocabulary questions by grade level.
 * Aligned with Common Core and state standards for grades 3-8.
 * Skill tags: definitions, synonyms, antonyms, context-clues, word-forms.
 */
// Grade 3 vocabulary (simple tier 2 words)
const GRADE3_VOCAB: Question[] = [
  { id: "g3_01", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'consider' mean?", choices: ["To skip over", "To think carefully", "To forget quickly", "To run away"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_02", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'purpose' mean?", choices: ["A random mistake", "The reason something happens", "A kind of snack", "A loud crashing sound"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_03", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'several' mean?", choices: ["Only one", "More than a few", "None at all", "Too many to count"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_04", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'similar' mean?", choices: ["Very different", "Almost the same", "Opposite in meaning", "Strange and unusual"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_05", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'explain' mean?", choices: ["To keep secret", "To make something clear", "To confuse others", "To forget details"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_06", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'perhaps' mean?", choices: ["Never", "Maybe or possibly", "Always for sure", "Definitely not ever"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_07", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'result' mean?", choices: ["The starting point", "What happens afterward", "A question someone asks", "A lucky guess only"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_08", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'usually' mean?", choices: ["Never at all", "Most of the time", "Rarely on weekends", "Only one time"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_09", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'character' mean?", choices: ["A number symbol", "A person in a story", "A paint color", "A location only"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_10", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'setting' mean?", choices: ["A main character", "Where and when a story happens", "The ending event", "A problem to solve"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_11", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'plot' mean?", choices: ["A story character", "The sequence of story events", "The place and time", "One short scene only"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_12", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'inference' mean?", choices: ["A direct fact", "A conclusion from clues", "A random wild guess", "A question on a test"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_13", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'decide' mean?", choices: ["To keep wondering", "To make a choice", "To forget the plan", "To ask a question"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_14", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'describe' mean?", choices: ["To hide details", "To tell what it's like", "To guess quickly", "To forget everything"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_15", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'different' mean?", choices: ["Exactly the same", "Not the same", "Kind of similar", "Very boring"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_16", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'discover' mean?", choices: ["To keep hidden", "To find something new", "To forget it", "To lose it forever"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_17", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'enormous' mean?", choices: ["Very tiny", "Very large", "Average-sized", "Perfectly round"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_18", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'famous' mean?", choices: ["Not well known", "Known by many people", "Very quiet", "Brand new"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_19", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'gather' mean?", choices: ["To spread apart", "To collect together", "To lose things", "To hide in secret"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_20", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'journey' mean?", choices: ["A tiny walk", "A trip from place to place", "A quiet rest", "A quick snack"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_21", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'magnificent' mean?", choices: ["Plain and dull", "Very impressive", "Very small", "Quite boring"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_22", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'observe' mean?", choices: ["To ignore it", "To watch carefully", "To forget it", "To guess wildly"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_23", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'peculiar' mean?", choices: ["Perfectly normal", "Strange or unusual", "Very boring", "Loud and noisy"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_24", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'suggest' mean?", choices: ["To order someone", "To offer an idea", "To refuse it", "To forget it"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_25", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'various' mean?", choices: ["Only one kind", "Many different kinds", "None at all", "Exactly the same"], answer_index: 1, gradeLevel: 3 },
];

// Grade 4 vocabulary
const GRADE4_VOCAB: Question[] = [
  { id: "g4_01", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'compare' mean?", choices: ["To skip details", "To show how things are alike", "To break apart", "To forget it"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_02", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'contrast' mean?", choices: ["To show similarities", "To show key differences", "To agree with everything", "To copy exactly"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_03", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'evidence' mean?", choices: ["A lucky guess", "Facts that support a claim", "A made-up story", "A personal opinion"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_04", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'conclude' mean?", choices: ["To begin first", "To reach a final decision", "To ignore all clues", "To ask more questions"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_05", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'summarize' mean?", choices: ["To add extra details", "To give the main points briefly", "To confuse readers", "To make it longer"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_06", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'predict' mean?", choices: ["To forget the past", "To guess what may happen", "To describe old events", "To ignore evidence"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_07", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'organize' mean?", choices: ["To scatter things", "To arrange in order", "To lose your notes", "To mix it up"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_08", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'sequence' mean?", choices: ["Random order", "The order of events", "A single event only", "The ending scene"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_09", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'main idea' mean?", choices: ["A tiny detail", "The most important point", "A chapter title", "A story character"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_10", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'detail' mean?", choices: ["The main idea", "A specific piece of information", "The whole story", "A random guess"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_11", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'passage' mean?", choices: ["A doorway", "A short section of text", "A very long novel", "A photo caption"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_12", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'opinion' mean?", choices: ["A proven fact", "A personal belief", "A test question", "A short summary"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_13", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'persuade' mean?", choices: ["To confuse someone", "To convince someone", "To forget the point", "To ask politely"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_14", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'inform' mean?", choices: ["To keep hidden", "To give information", "To make a guess", "To entertain only"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_15", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'entertain' mean?", choices: ["To bore people", "To amuse or interest", "To teach a lesson", "To confuse readers"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_16", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'convey' mean?", choices: ["To hide meaning", "To communicate clearly", "To forget details", "To confuse others"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_17", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'demonstrate' mean?", choices: ["To hide proof", "To show with evidence", "To guess wildly", "To forget steps"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_18", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'elaborate' mean?", choices: ["To simplify it", "To add useful detail", "To shorten it fast", "To confuse people"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_19", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'emphasize' mean?", choices: ["To ignore it", "To give it extra importance", "To forget it", "To hide it"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_20", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'illustrate' mean?", choices: ["To hide the point", "To explain with examples", "To confuse the class", "To shorten the text"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_21", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'infer' mean?", choices: ["To state directly", "To conclude using evidence", "To guess without clues", "To ask for help"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_22", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'narrate' mean?", choices: ["To listen quietly", "To tell a story", "To forget events", "To hide details"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_23", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'paraphrase' mean?", choices: ["To copy exactly", "To restate in your own words", "To forget the meaning", "To cut it too short"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_24", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'respond' mean?", choices: ["To ignore it", "To reply or react", "To forget it", "To hide from it"], answer_index: 1, gradeLevel: 4 },
];

// Grade 5 vocabulary
const GRADE5_VOCAB: Question[] = [
  { id: "g5_01", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'analyze' mean?", choices: ["To skip details", "To examine closely", "To guess quickly", "To retell briefly"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_02", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'determine' mean?", choices: ["To keep wondering", "To figure out", "To forget it", "To ask only"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_03", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'develop' mean?", choices: ["To shrink down", "To grow over time", "To destroy it", "To ignore it"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_04", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'identify' mean?", choices: ["To lose track", "To recognize correctly", "To forget names", "To hide clues"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_05", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'influence' mean?", choices: ["To ignore completely", "To affect the outcome", "To copy exactly", "To forget details"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_06", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'structure' mean?", choices: ["Pure chaos", "How something is organized", "Random order", "The final ending"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_07", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'theme' mean?", choices: ["A main character", "The central message", "The time and place", "A small detail"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_08", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'conflict' mean?", choices: ["Total agreement", "A struggle or problem", "The final solution", "The opening event"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_09", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'resolution' mean?", choices: ["The central problem", "How a conflict is solved", "The first chapter", "A side character"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_10", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'context' mean?", choices: ["The final answer", "Surrounding information", "A quick guess", "The story title"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_11", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'evaluate' mean?", choices: ["To ignore data", "To judge quality", "To create from scratch", "To forget evidence"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_12", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'interpret' mean?", choices: ["To copy exactly", "To explain meaning", "To ignore context", "To forget ideas"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_13", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'support' mean?", choices: ["To argue against", "To back up with evidence", "To ignore claims", "To guess randomly"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_14", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'convey' mean?", choices: ["To keep hidden", "To communicate clearly", "To forget the point", "To confuse others"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_15", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'demonstrate' mean?", choices: ["To hide proof", "To show with evidence", "To guess only", "To forget steps"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_16", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'emphasize' mean?", choices: ["To ignore it", "To stress importance", "To forget it", "To hide it"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_17", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'hypothesize' mean?", choices: ["To prove already", "To make a testable guess", "To ignore evidence", "To forget the task"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_18", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'modify' mean?", choices: ["To keep unchanged", "To change slightly", "To destroy fully", "To ignore directions"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_19", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'persuade' mean?", choices: ["To confuse others", "To convince someone", "To forget your point", "To ask questions"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_20", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'prioritize' mean?", choices: ["To ignore tasks", "To rank by importance", "To forget deadlines", "To mix up order"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_21", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'revise' mean?", choices: ["To keep unchanged", "To improve by editing", "To destroy writing", "To forget feedback"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_22", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'substantiate' mean?", choices: ["To weaken a claim", "To support with evidence", "To ignore details", "To guess without proof"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_23", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'synthesize' mean?", choices: ["To split apart", "To combine into one", "To forget ideas", "To copy only"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_24", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'verify' mean?", choices: ["To ignore it", "To confirm as true", "To guess it", "To forget it"], answer_index: 1, gradeLevel: 5 },
];

// Grade 6 vocabulary
const GRADE6_VOCAB: Question[] = [
  { id: "g6_01", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'cite' mean?", choices: ["To ignore", "To quote or reference", "To forget", "To guess"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_02", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'paraphrase' mean?", choices: ["To copy exactly", "To restate in your own words", "To forget", "To shorten"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_03", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'claim' mean?", choices: ["A fact", "A statement that needs support", "A question", "An answer"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_04", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'argument' mean?", choices: ["A fight", "A reasoned case for a position", "A question", "A story"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_05", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'relevant' mean?", choices: ["Unrelated", "Connected to the topic", "Random", "Old"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_06", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'coherent' mean?", choices: ["Confusing", "Logical and clear", "Random", "Short"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_07", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'imply' mean?", choices: ["To state directly", "To suggest without saying", "To shout", "To ask"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_08", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'explicit' mean?", choices: ["Hidden", "Clearly stated", "Confusing", "Long"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_09", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'implicit' mean?", choices: ["Obvious", "Suggested but not stated", "Clear", "Direct"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_10", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'perspective' mean?", choices: ["A fact", "A point of view", "The truth", "A lie"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_11", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'tone' mean?", choices: ["Volume", "The attitude or feeling", "The plot", "A character"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_12", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'mood' mean?", choices: ["The weather", "The feeling a text creates", "The setting", "The author"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_13", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'analyze' mean?", choices: ["To summarize", "To examine in detail", "To ignore", "To copy"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_14", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'synthesize' mean?", choices: ["To separate", "To combine into a whole", "To forget", "To copy"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_15", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'credible' mean?", choices: ["Unbelievable", "Trustworthy", "Fake", "Confusing"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_16", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'delineate' mean?", choices: ["To blur", "To describe or outline clearly", "To forget", "To confuse"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_17", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'elucidate' mean?", choices: ["To obscure", "To make clear", "To confuse", "To forget"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_18", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'juxtapose' mean?", choices: ["To separate", "To place side by side for comparison", "To forget", "To mix"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_19", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'substantiate' mean?", choices: ["To weaken", "To provide evidence for", "To ignore", "To guess"], answer_index: 1, gradeLevel: 6 },
  { id: "g6_20", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'underscore' mean?", choices: ["To ignore", "To emphasize", "To forget", "To hide"], answer_index: 1, gradeLevel: 6 },
];

// Grade 7 vocabulary
const GRADE7_VOCAB: Question[] = [
  { id: "g7_01", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'rhetoric' mean?", choices: ["Lies", "Persuasive speaking or writing", "Poetry", "Facts"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_02", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'bias' mean?", choices: ["Fairness", "Preference that affects judgment", "Truth", "Evidence"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_03", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'fallacy' mean?", choices: ["A fact", "A false or flawed argument", "Logic", "Proof"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_04", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'connotation' mean?", choices: ["Dictionary meaning", "Emotional association of a word", "Spelling", "Length"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_05", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'denotation' mean?", choices: ["Emotional meaning", "Literal dictionary meaning", "Tone", "Style"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_06", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'analogy' mean?", choices: ["A fact", "A comparison of similar things", "A contrast", "A definition"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_07", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'allusion' mean?", choices: ["A lie", "An indirect reference", "A direct quote", "A summary"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_08", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'irony' mean?", choices: ["Literal meaning", "When the opposite of expected happens", "Humor", "Sadness"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_09", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'symbolism' mean?", choices: ["Literal description", "Using symbols to represent ideas", "Facts", "Dialogue"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_10", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'figurative' mean?", choices: ["Literal", "Using figures of speech", "Boring", "Short"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_11", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'literal' mean?", choices: ["Figurative", "Exact or actual meaning", "Metaphorical", "Creative"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_12", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'nuance' mean?", choices: ["Obvious difference", "A subtle distinction", "A big change", "A mistake"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_13", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'paradox' mean?", choices: ["A simple truth", "A seeming contradiction", "A fact", "A question"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_14", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'diction' mean?", choices: ["Plot", "Word choice in writing", "Setting", "Character"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_15", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'syntax' mean?", choices: ["Word meaning", "Sentence structure", "Plot", "Theme"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_16", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'juxtaposition' mean?", choices: ["Separation", "Placement of contrasting things side by side", "Agreement", "Confusion"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_17", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'oxymoron' mean?", choices: ["A simple phrase", "A phrase combining opposite ideas", "A long word", "A question"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_18", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'hyperbole' mean?", choices: ["Understatement", "Exaggeration for effect", "Literal truth", "A question"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_19", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'metaphor' mean?", choices: ["Literal comparison", "A comparison without like or as", "A question", "A fact"], answer_index: 1, gradeLevel: 7 },
  { id: "g7_20", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'personification' mean?", choices: ["Describing a person", "Giving human traits to non-human things", "A question", "A fact"], answer_index: 1, gradeLevel: 7 },
];

// English 1 vocabulary (College Board Pre-AP English 1 aligned)
const ENGLISH1_VOCAB: Question[] = [
  { id: "e1_01", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'claim' mean in academic writing?", choices: ["A random detail", "A position that must be supported", "A quotation from a source", "A summary of events"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_02", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'thesis' mean?", choices: ["A broad topic", "A central argument statement", "A rhetorical question", "A transition word"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_03", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'inference' mean?", choices: ["A direct quote", "A conclusion drawn from evidence", "A plot summary", "A grammatical rule"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_04", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'commentary' mean in an analysis paragraph?", choices: ["Copied evidence", "Explanation of why evidence matters", "A title for the essay", "A list of sources"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_05", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'connotation' mean?", choices: ["Dictionary definition only", "Emotional or cultural associations of a word", "Sentence length", "The speaker's accent"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_06", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'denotation' mean?", choices: ["A hidden figurative meaning", "The literal dictionary meaning", "A persuasive appeal", "A type of fallacy"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_07", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'objective' writing mean?", choices: ["Based on personal feelings", "Focused on evidence rather than opinion", "Written in first person", "Using only figurative language"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_08", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'counterclaim' mean?", choices: ["A repeated claim", "An opposing viewpoint to the main claim", "A supporting detail", "A restated thesis"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_09", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'coherent' mean?", choices: ["Unclear and fragmented", "Logical and easy to follow", "Extremely emotional", "Very brief"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_10", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'nuance' mean?", choices: ["An obvious difference", "A subtle distinction in meaning", "A writing error", "A rigid structure"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_11", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "The critic acknowledges one flaw, then mostly praises the film. What does 'acknowledges' most nearly mean?", choices: ["Ignores", "Recognizes", "Invents", "Condemns"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_12", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "Her word choice was precise, so readers could understand her point exactly. What does 'precise' mean?", choices: ["Vague", "Exact", "Lengthy", "Humorous"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_13", subject: "vocabulary", difficulty: 3, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'corroborate'?", choices: ["Contradict", "Confirm", "Question", "Reduce"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_14", subject: "vocabulary", difficulty: 3, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'qualify' (in argument)?", choices: ["Strengthen with limits", "Eliminate", "Plagiarize", "Distract"], answer_index: 0, gradeLevel: "english1" },
  { id: "e1_15", subject: "vocabulary", difficulty: 3, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'explicit'?", choices: ["Direct", "Stated", "Implicit", "Detailed"], answer_index: 2, gradeLevel: "english1" },
  { id: "e1_16", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'diction' mean?", choices: ["Sentence order", "Word choice", "Main conflict", "Text structure"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_17", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'syntax' mean?", choices: ["Word origin", "Sentence structure", "Historical background", "Narrative voice"], answer_index: 1, gradeLevel: "english1" },
  { id: "e1_18", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'transition' mean in writing?", choices: ["A grammar mistake", "A word or phrase connecting ideas", "A conclusion sentence only", "A topic sentence"], answer_index: 1, gradeLevel: "english1" },
];

// English 2 vocabulary (College Board Pre-AP English 2 aligned)
const ENGLISH2_VOCAB: Question[] = [
  { id: "e2_01", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'synthesis' mean in academic writing?", choices: ["Copying one source", "Combining multiple sources into a new insight", "Summarizing one paragraph", "Rewriting the prompt"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_02", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'line of reasoning' mean?", choices: ["A list of quotes", "The logical progression of an argument", "A text's publication date", "A counterclaim only"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_03", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'warrant' mean in argumentation?", choices: ["A citation style", "Reasoning that links evidence to a claim", "An emotional appeal", "An opposing thesis"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_04", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'exigence' mean?", choices: ["The author's favorite genre", "The issue or need that prompts writing", "The essay's title", "The reader's age"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_05", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'rhetorical situation' refer to?", choices: ["Only the thesis statement", "Context of writer, audience, purpose, and occasion", "Only figurative language", "Only grammar rules"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_06", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'concession' mean in an argument?", choices: ["Ignoring opposing views", "Acknowledging an opposing point", "Repeating a claim", "Switching topics"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_07", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'rebuttal' mean?", choices: ["Supporting the counterclaim", "Responding to and challenging an opposing view", "Changing to a narrative", "Citing a source without comment"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_08", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'precision' in style mean?", choices: ["Using as many words as possible", "Using exact language for specific meaning", "Using only formal words", "Avoiding evidence"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_09", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'ambiguity' mean?", choices: ["Complete clarity", "Possibility of more than one meaning", "A factual error", "A topic sentence"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_10", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'paradox' mean?", choices: ["A plain fact", "A statement that seems contradictory but may reveal truth", "A repeated sound", "A transition phrase"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_11", subject: "vocabulary", difficulty: 4, skill_tag: "context-clues", prompt: "The writer integrates data, expert testimony, and historical examples to build one point. What does 'integrates' mean?", choices: ["Separates", "Combines effectively", "Dismisses", "Questions"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_12", subject: "vocabulary", difficulty: 4, skill_tag: "context-clues", prompt: "Her response was measured and diplomatic, not extreme. What does 'measured' most nearly mean?", choices: ["Impulsive", "Carefully controlled", "Uncertain", "Exaggerated"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_13", subject: "vocabulary", difficulty: 4, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'salient'?", choices: ["Minor", "Prominent", "Hidden", "Questionable"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_14", subject: "vocabulary", difficulty: 4, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'substantiate'?", choices: ["Undermine", "Support with evidence", "Delay", "Omit"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_15", subject: "vocabulary", difficulty: 4, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'cohesive'?", choices: ["Unified", "Fragmented", "Logical", "Connected"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_16", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'register' mean in rhetoric?", choices: ["A list of sources", "The level of formality in language", "A paragraph break", "A rhetorical fallacy"], answer_index: 1, gradeLevel: "english2" },
  { id: "e2_17", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'qualifier' mean in argument?", choices: ["A word showing limits or conditions", "A direct quotation", "An emotional appeal only", "A transition that adds evidence"], answer_index: 0, gradeLevel: "english2" },
  { id: "e2_18", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'juxtaposition' mean?", choices: ["Removing evidence", "Placing ideas side by side for contrast", "Writing in first person", "Repeating a thesis"], answer_index: 1, gradeLevel: "english2" },
];

// English 3 vocabulary (American Literature / FLVS-style sequence)
const ENGLISH3_VOCAB: Question[] = [
  { id: "e3_01", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'Puritan' most often describe in early American literature?", choices: ["A romantic movement", "A religiously strict colonial tradition", "A modernist style", "A realist novel"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_02", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'jeremiad' mean?", choices: ["A celebratory speech", "A sermon-like warning about moral decline", "A legal document", "A dramatic monologue"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_03", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'rationalism' mean in Enlightenment-era writing?", choices: ["Knowledge through emotion alone", "Emphasis on reason and logic", "Rejection of evidence", "A poetic meter"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_04", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'Romanticism' emphasize?", choices: ["Industry and machinery", "Emotion, imagination, and nature", "Strict realism only", "Scientific objectivity only"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_05", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'transcendentalism' emphasize?", choices: ["Material wealth", "Individual conscience and spiritual insight", "Military power", "Satirical humor only"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_06", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'Realism' in literature generally focus on?", choices: ["Mythic heroes", "Everyday life and believable characters", "Fantasy worlds", "Epic poetry forms"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_07", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'Regionalism' mean in American literature?", choices: ["Writing without setting", "Emphasizing local culture, dialect, and place", "Only political speeches", "Strictly urban topics"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_08", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'Naturalism' suggest about human life?", choices: ["Humans fully control fate", "Environment and heredity strongly shape outcomes", "Only supernatural causes matter", "Language has no social role"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_09", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'Modernism' in U.S. literature often feature?", choices: ["Linear certainty and optimism", "Fragmentation and experimentation", "Strictly medieval settings", "No symbolism"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_10", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'Harlem Renaissance' refer to?", choices: ["A Roman art period", "A major Black cultural and literary movement in the early 20th century", "A Puritan revival", "A postwar court case"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_11", subject: "vocabulary", difficulty: 4, skill_tag: "context-clues", prompt: "The novel's bleak, detached voice reflects postwar disillusionment. What does 'disillusionment' mean?", choices: ["Growing confidence", "Loss of idealistic beliefs", "Excited optimism", "Religious devotion"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_12", subject: "vocabulary", difficulty: 4, skill_tag: "context-clues", prompt: "The speech challenged social conformity and praised dissent. What does 'dissent' mean?", choices: ["Agreement", "Disagreement with prevailing views", "Silence", "Obedience"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_13", subject: "vocabulary", difficulty: 4, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'canonical'?", choices: ["Unofficial", "Widely accepted as standard", "Outdated", "Mysterious"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_14", subject: "vocabulary", difficulty: 4, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'allusion'?", choices: ["Direct quotation", "Indirect reference", "Detailed summary", "Factual claim"], answer_index: 1, gradeLevel: "english3" },
  { id: "e3_15", subject: "vocabulary", difficulty: 4, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'orthodox'?", choices: ["Traditional", "Conventional", "Heterodox", "Accepted"], answer_index: 2, gradeLevel: "english3" },
  { id: "e3_16", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'manifesto' mean?", choices: ["A private letter", "A public statement of principles and goals", "A historical timeline", "A dramatic scene"], answer_index: 1, gradeLevel: "english3" },
];

// AP Language & Composition vocabulary (College Board AP Lang aligned)
const AP_LANG_VOCAB: Question[] = [
  { id: "aplang_01", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'rhetorical situation' mean?", choices: ["Only an author's tone", "The interaction of writer, audience, purpose, context, and constraints", "The body paragraphs only", "A list of literary devices"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_02", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'exigence' mean?", choices: ["A writing error", "The issue or urgency prompting the text", "A style choice", "A citation format"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_03", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'line of reasoning' refer to?", choices: ["A paragraph indent", "How claims and evidence are connected logically", "The length of the essay", "The publication venue"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_04", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'synthesis' require on AP Lang tasks?", choices: ["Using one source only", "Integrating multiple sources to support an argument", "Copying source language", "Summarizing sources without a claim"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_05", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What is a 'qualifier' in argument writing?", choices: ["A broad overstatement", "A word or phrase that limits a claim", "A direct quote", "A narrative transition"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_06", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'concession' mean in argumentation?", choices: ["Abandoning your claim", "Recognizing a valid opposing point", "Using emotional language only", "Repeating evidence"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_07", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'rebuttal' do?", choices: ["Introduces a new topic", "Responds to and weakens opposing claims", "Summarizes background information", "Defines key terms only"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_08", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'credibility' (ethos) refer to?", choices: ["Sentence length", "Perceived trustworthiness or authority", "Use of rhyme", "Visual formatting"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_09", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'juxtaposition' mean?", choices: ["Repeating a phrase", "Placing ideas side by side for comparison or contrast", "Changing the speaker", "Removing transitions"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_10", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'antithesis' mean?", choices: ["A matching repetition", "A balanced contrast of opposing ideas", "A chronological sequence", "A rhetorical question"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_11", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'anaphora' mean?", choices: ["Ending clauses with the same word", "Repeating words at the start of successive clauses", "Using exaggerated claims", "Addressing an absent person"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_12", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'metonymy' mean?", choices: ["Comparing unlike things directly", "Referring to something by a closely related term", "Using understatement", "A contradiction in terms"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_13", subject: "vocabulary", difficulty: 5, skill_tag: "context-clues", prompt: "The writer tempers the claim by adding 'in most cases' and 'typically.' What rhetorical move is this?", choices: ["Hyperbole", "Qualification", "Digression", "Refutation"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_14", subject: "vocabulary", difficulty: 5, skill_tag: "context-clues", prompt: "Her essay's tone shifts from sardonic to earnest near the conclusion. What does 'sardonic' most nearly mean?", choices: ["Sincerely hopeful", "Bitterly mocking", "Calmly neutral", "Highly technical"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_15", subject: "vocabulary", difficulty: 5, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'germane'?", choices: ["Irrelevant", "Pertinent", "Ambiguous", "Decorative"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_16", subject: "vocabulary", difficulty: 5, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'trenchant'?", choices: ["Vague", "Incisive", "Mild", "Wordy"], answer_index: 1, gradeLevel: "ap-lang" },
  { id: "aplang_17", subject: "vocabulary", difficulty: 5, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'equivocal'?", choices: ["Ambiguous", "Qualified", "Unequivocal", "Conditional"], answer_index: 2, gradeLevel: "ap-lang" },
  { id: "aplang_18", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'cohesion' mean in rhetorical analysis?", choices: ["Lack of evidence", "The way parts of a text connect into a unified whole", "A formal fallacy", "A source citation method"], answer_index: 1, gradeLevel: "ap-lang" },
];

// AP Literature & Composition vocabulary — literary analysis and close reading
const AP_LIT_VOCAB: Question[] = [
  { id: "aplit_01", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'apostrophe' mean in literature?", choices: ["A punctuation mark", "Addressing an absent person or abstract idea", "A type of rhyme", "A poetic foot"], answer_index: 1, gradeLevel: "ap-lit" },
  { id: "aplit_02", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'chiasmus' mean?", choices: ["A circular argument", "A rhetorical structure where elements are reversed", "A type of metaphor", "A poetic refrain"], answer_index: 1, gradeLevel: "ap-lit" },
  { id: "aplit_03", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'ekphrasis' mean?", choices: ["A dramatic monologue", "A vivid literary description of a work of art", "A type of allegory", "An epic simile"], answer_index: 1, gradeLevel: "ap-lit" },
  { id: "aplit_04", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'hamartia' mean?", choices: ["A heroic trait", "A fatal flaw in a tragic character", "An act of fate", "A divine punishment"], answer_index: 1, gradeLevel: "ap-lit" },
  { id: "aplit_05", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'in medias res' mean?", choices: ["At the end", "In the middle of things", "At the beginning", "In a flashback"], answer_index: 1, gradeLevel: "ap-lit" },
  { id: "aplit_06", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'liminal' mean?", choices: ["Final and decisive", "Relating to a threshold or transitional state", "Clearly defined", "Central and stable"], answer_index: 1, gradeLevel: "ap-lit" },
  { id: "aplit_07", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'mimesis' mean?", choices: ["Symbolic representation", "The imitation or representation of the real world", "A narrative summary", "A poetic device"], answer_index: 1, gradeLevel: "ap-lit" },
  { id: "aplit_08", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'polyphony' mean in literature?", choices: ["A single narrator's perspective", "Multiple distinct voices or viewpoints in a text", "A poetic meter", "A type of dialogue"], answer_index: 1, gradeLevel: "ap-lit" },
  { id: "aplit_09", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'synecdoche' mean?", choices: ["A comparison using 'like' or 'as'", "Using a part to represent the whole", "An understatement", "A dramatic irony"], answer_index: 1, gradeLevel: "ap-lit" },
  { id: "aplit_10", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'unreliable narrator' mean?", choices: ["A narrator who uses formal language", "A narrator whose credibility is compromised", "A third-person narrator", "An omniscient narrator"], answer_index: 1, gradeLevel: "ap-lit" },
];

export const VOCAB_BY_GRADE: Record<VocabGrade, Question[]> = {
  3: GRADE3_VOCAB,
  4: GRADE4_VOCAB,
  5: GRADE5_VOCAB,
  6: GRADE6_VOCAB,
  7: GRADE7_VOCAB,
};

/** Extended mapping including all 10 tier levels. */
export const VOCAB_BY_LEVEL: Record<VocabLevel, Question[]> = {
  ...VOCAB_BY_GRADE,
  "english1": ENGLISH1_VOCAB,
  "english2": ENGLISH2_VOCAB,
  "english3": ENGLISH3_VOCAB,
  "ap-lang": AP_LANG_VOCAB,
  "ap-lit": AP_LIT_VOCAB,
};

export const VOCAB_QUESTIONS: Question[] = [
  ...GRADE3_VOCAB,
  ...GRADE4_VOCAB,
  ...GRADE5_VOCAB,
  ...GRADE6_VOCAB,
  ...GRADE7_VOCAB,
  ...ENGLISH1_VOCAB,
  ...ENGLISH2_VOCAB,
  ...ENGLISH3_VOCAB,
  ...AP_LANG_VOCAB,
  ...AP_LIT_VOCAB,
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

/**
 * Punctuation questions by level.
 * Level 1 (Beginner): commas in lists, apostrophes, basic capitalization.
 * Level 2 (Intermediate): quotation marks, commas in complex sentences, semicolons.
 * Level 3 (Advanced): colons, dashes, ellipses, complex punctuation.
 */
const PUNCTUATION_BEGINNER: Question[] = [
  { id: "p001", subject: "punctuation", difficulty: 1, skill_tag: "commas", prompt: "Which sentence uses a comma correctly?", choices: ["I like cats, dogs and birds.", "I like cats, dogs, and birds.", "I like, cats dogs and birds.", "I, like cats dogs and birds."], answer_index: 1, punctuationLevel: 1 },
  { id: "p002", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", prompt: "Which sentence uses an apostrophe correctly?", choices: ["The dog wagged it's tail.", "The dog wagged its' tail.", "The dog wagged its tail.", "The dog wagged it tail."], answer_index: 2, punctuationLevel: 1 },
  { id: "p008", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", prompt: "Which contraction is spelled correctly?", choices: ["dont", "don't", "do'nt", "don't'"], answer_index: 1, punctuationLevel: 1 },
  { id: "p009", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", prompt: "Which is correct?", choices: ["cant", "can't", "ca'nt", "cann't"], answer_index: 1, punctuationLevel: 1 },
  { id: "p010", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", prompt: "Which sentence shows correct possession?", choices: ["The cats bowl is empty.", "The cat's bowl is empty.", "The cats' bowl is empty.", "The cat bowl's is empty."], answer_index: 1, punctuationLevel: 1 },
  { id: "p011", subject: "punctuation", difficulty: 1, skill_tag: "capitalization", prompt: "Which sentence is capitalized correctly?", choices: ["i went to the store.", "I went to the store.", "I Went to the store.", "i went to the Store."], answer_index: 1, punctuationLevel: 1 },
  { id: "p012", subject: "punctuation", difficulty: 1, skill_tag: "capitalization", prompt: "Which sentence is capitalized correctly?", choices: ["monday is my favorite day.", "Monday is my favorite day.", "monday is my Favorite day.", "Monday is my favorite Day."], answer_index: 1, punctuationLevel: 1 },
  { id: "p013", subject: "punctuation", difficulty: 1, skill_tag: "commas", prompt: "Which sentence uses commas correctly in a list?", choices: ["We need milk bread and eggs.", "We need milk, bread, and eggs.", "We need, milk bread and eggs.", "We need milk, bread and eggs."], answer_index: 1, punctuationLevel: 1 },
  { id: "p014", subject: "punctuation", difficulty: 1, skill_tag: "commas", prompt: "Which sentence uses a comma correctly?", choices: ["I have a dog a cat and a bird.", "I have a dog, a cat, and a bird.", "I have a dog, a cat and a bird.", "I have, a dog a cat and a bird."], answer_index: 1, punctuationLevel: 1 },
  { id: "p015", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", prompt: "Which shows correct plural possession?", choices: ["The dogs toys are scattered.", "The dog's toys are scattered.", "The dogs' toys are scattered.", "The dogs toys' are scattered."], answer_index: 2, punctuationLevel: 1 },
  { id: "p016", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", prompt: "Which contraction is correct?", choices: ["theyre", "they're", "theyr'e", "they're'"], answer_index: 1, punctuationLevel: 1 },
  { id: "p017", subject: "punctuation", difficulty: 1, skill_tag: "capitalization", prompt: "Which sentence is capitalized correctly?", choices: ["the sun rises in the east.", "The sun rises in the east.", "The Sun rises in the east.", "the Sun rises in the East."], answer_index: 1, punctuationLevel: 1 },
  { id: "p018", subject: "punctuation", difficulty: 1, skill_tag: "commas", prompt: "Which sentence uses a comma correctly after an introductory word?", choices: ["Yes we can go to the park.", "Yes, we can go to the park.", "Yes we, can go to the park.", "Yes we can go, to the park."], answer_index: 1, punctuationLevel: 1 },
  { id: "p019", subject: "punctuation", difficulty: 1, skill_tag: "apostrophes", prompt: "Which is the correct possessive form?", choices: ["James book", "James's book", "James' book", "James book's"], answer_index: 1, punctuationLevel: 1 },
  { id: "p020", subject: "punctuation", difficulty: 1, skill_tag: "commas", prompt: "Which sentence uses commas correctly?", choices: ["On Tuesday we have gym.", "On Tuesday, we have gym.", "On, Tuesday we have gym.", "On Tuesday we, have gym."], answer_index: 1, punctuationLevel: 1 },
  ...PUNCTUATION_CURRICULUM_QUESTIONS.filter((q) => q.punctuationLevel === 1),
];

const PUNCTUATION_INTERMEDIATE: Question[] = [
  { id: "p003", subject: "punctuation", difficulty: 2, skill_tag: "quotation-marks", prompt: "Which sentence uses quotation marks correctly?", choices: ['She said, "I will be there soon."', 'She said, "I will be there soon".', "She said, 'I will be there soon.'", 'She "said," I will be there soon.'], answer_index: 0, punctuationLevel: 2 },
  { id: "p004", subject: "punctuation", difficulty: 2, skill_tag: "apostrophes", prompt: "Which sentence is punctuated correctly?", choices: ["That is Sarahs book.", "That is Sarah's book.", "That is Sarahs' book.", "That is Sarah book's."], answer_index: 1, punctuationLevel: 2 },
  { id: "p005", subject: "punctuation", difficulty: 2, skill_tag: "semicolons", prompt: "Which sentence correctly uses a semicolon?", choices: ["I love soccer; and basketball is great too.", "She studied hard; she passed the exam.", "We went to; the park and the mall.", "He is tall; but thin."], answer_index: 1, punctuationLevel: 2 },
  { id: "p006", subject: "punctuation", difficulty: 2, skill_tag: "capitalization", prompt: "Which sentence is capitalized correctly?", choices: ["we visited new york city last summer.", "We visited New york city last Summer.", "We visited New York City last summer.", "We Visited New York city last summer."], answer_index: 2, punctuationLevel: 2 },
  { id: "p007", subject: "punctuation", difficulty: 2, skill_tag: "commas", prompt: "Which sentence uses commas correctly in a complex sentence?", choices: ["Although it was raining we decided to go outside.", "Although, it was raining, we decided to go outside.", "Although it was raining, we decided to go outside.", "Although it was raining we decided, to go outside."], answer_index: 2, punctuationLevel: 2 },
  { id: "p021", subject: "punctuation", difficulty: 2, skill_tag: "quotation-marks", prompt: "Which sentence uses quotation marks correctly?", choices: ['He asked, "Where are you going?"', 'He asked, "Where are you going"?', 'He "asked," Where are you going?', "He asked, 'Where are you going?'"], answer_index: 0, punctuationLevel: 2 },
  { id: "p022", subject: "punctuation", difficulty: 2, skill_tag: "semicolons", prompt: "Which sentence correctly uses a semicolon?", choices: ["I have a test tomorrow; I need to study.", "I have a test; tomorrow I need to study.", "I have; a test tomorrow I need to study.", "I have a test tomorrow; and I need to study."], answer_index: 0, punctuationLevel: 2 },
  { id: "p023", subject: "punctuation", difficulty: 2, skill_tag: "commas", prompt: "Which sentence uses commas correctly?", choices: ["After the game we went home.", "After the game, we went home.", "After, the game we went home.", "After the game we, went home."], answer_index: 1, punctuationLevel: 2 },
  { id: "p024", subject: "punctuation", difficulty: 2, skill_tag: "quotation-marks", prompt: "Which sentence punctuates dialogue correctly?", choices: ['"Hello," she said. "How are you?"', '"Hello" she said "How are you?"', '"Hello, she said. How are you?"', '"Hello," she said, "How are you?"'], answer_index: 0, punctuationLevel: 2 },
  { id: "p025", subject: "punctuation", difficulty: 2, skill_tag: "semicolons", prompt: "Which sentence correctly uses a semicolon?", choices: ["The weather was cold; we wore jackets.", "The weather was cold we; wore jackets.", "The weather; was cold we wore jackets.", "The weather was cold; and we wore jackets."], answer_index: 0, punctuationLevel: 2 },
  { id: "p026", subject: "punctuation", difficulty: 2, skill_tag: "commas", prompt: "Which sentence uses commas correctly in a compound sentence?", choices: ["I wanted to play but it was raining.", "I wanted to play, but it was raining.", "I wanted to play but, it was raining.", "I, wanted to play but it was raining."], answer_index: 1, punctuationLevel: 2 },
  { id: "p027", subject: "punctuation", difficulty: 2, skill_tag: "quotation-marks", prompt: "Which sentence uses quotation marks correctly for a title?", choices: ['We read "Charlotte\'s Web" in class.', "We read Charlotte's Web in class.", 'We read "Charlottes Web" in class.', "We read 'Charlotte's Web' in class."], answer_index: 0, punctuationLevel: 2 },
  { id: "p028", subject: "punctuation", difficulty: 2, skill_tag: "commas", prompt: "Which sentence uses commas correctly with a direct address?", choices: ["Sarah please pass the salt.", "Sarah, please pass the salt.", "Sarah please, pass the salt.", "Sarah, please, pass the salt."], answer_index: 1, punctuationLevel: 2 },
  { id: "p029", subject: "punctuation", difficulty: 2, skill_tag: "semicolons", prompt: "Which sentence correctly uses a semicolon before a conjunctive adverb?", choices: ["I was tired; however, I finished my homework.", "I was tired however; I finished my homework.", "I was tired; however I finished my homework.", "I was tired however, I finished my homework."], answer_index: 0, punctuationLevel: 2 },
  { id: "p030", subject: "punctuation", difficulty: 2, skill_tag: "commas", prompt: "Which sentence uses commas correctly with an appositive?", choices: ["My friend Emma loves to read.", "My friend, Emma, loves to read.", "My friend Emma, loves to read.", "My, friend Emma loves to read."], answer_index: 1, punctuationLevel: 2 },
  ...PUNCTUATION_CURRICULUM_QUESTIONS.filter((q) => q.punctuationLevel === 2),
];

const PUNCTUATION_ADVANCED: Question[] = [
  { id: "p031", subject: "punctuation", difficulty: 3, skill_tag: "commas", prompt: "Which sentence uses a colon correctly?", choices: ["I need: milk, eggs, and bread.", "I need the following: milk, eggs, and bread.", "I need the following milk, eggs, and bread.", "I need the following, milk, eggs, and bread."], answer_index: 1, punctuationLevel: 3 },
  { id: "p032", subject: "punctuation", difficulty: 3, skill_tag: "commas", prompt: "Which sentence uses a dash correctly?", choices: ["My sister—the one who lives in Boston—is visiting.", "My sister—the one who lives in Boston is visiting.", "My sister the one who lives in Boston—is visiting.", "My sister—the one who lives in Boston— is visiting."], answer_index: 0, punctuationLevel: 3 },
  { id: "p033", subject: "punctuation", difficulty: 3, skill_tag: "semicolons", prompt: "Which sentence uses a semicolon correctly in a complex list?", choices: ["We visited Paris, France; Rome, Italy; and London, England.", "We visited Paris, France, Rome, Italy, and London, England.", "We visited Paris; France; Rome; Italy; and London; England.", "We visited Paris, France, Rome, Italy and London, England."], answer_index: 0, punctuationLevel: 3 },
  { id: "p034", subject: "punctuation", difficulty: 3, skill_tag: "quotation-marks", prompt: "Which sentence punctuates a quote within a quote correctly?", choices: ['She said, "He told me, \'I will be late.\'"', 'She said, "He told me, "I will be late.""', "She said, 'He told me, \"I will be late.\"'", 'She said "He told me, \'I will be late.\'"'], answer_index: 0, punctuationLevel: 3 },
  { id: "p035", subject: "punctuation", difficulty: 3, skill_tag: "commas", prompt: "Which sentence uses an ellipsis correctly?", choices: ["The quote was...and then he left.", "The quote was . . . and then he left.", "The quote was... and then he left.", "The quote was .... and then he left."], answer_index: 2, punctuationLevel: 3 },
  { id: "p036", subject: "punctuation", difficulty: 3, skill_tag: "commas", prompt: "Which sentence uses a colon correctly to introduce a list?", choices: ["Bring these items: a pencil, paper, and a ruler.", "Bring these items a pencil, paper, and a ruler.", "Bring these items, a pencil, paper, and a ruler.", "Bring: these items a pencil, paper, and a ruler."], answer_index: 0, punctuationLevel: 3 },
  { id: "p037", subject: "punctuation", difficulty: 3, skill_tag: "semicolons", prompt: "Which sentence uses a semicolon correctly?", choices: ["His reasons were clear; he had none.", "His reasons were clear he had none.", "His reasons were clear, he had none.", "His reasons were clear; and he had none."], answer_index: 0, punctuationLevel: 3 },
  { id: "p038", subject: "punctuation", difficulty: 3, skill_tag: "commas", prompt: "Which sentence uses an em dash correctly for emphasis?", choices: ["The answer—if you can believe it—was right in front of us.", "The answer—if you can believe it was right in front of us.", "The answer if you can believe it—was right in front of us.", "The answer—if you can believe it— was right in front of us."], answer_index: 0, punctuationLevel: 3 },
  { id: "p039", subject: "punctuation", difficulty: 3, skill_tag: "quotation-marks", prompt: "Which sentence uses punctuation correctly with a question mark and quotation?", choices: ['Did she say, "I am leaving"?', 'Did she say, "I am leaving?"', 'Did she say "I am leaving?"', 'Did she say, "I am leaving"?'], answer_index: 0, punctuationLevel: 3 },
  { id: "p040", subject: "punctuation", difficulty: 3, skill_tag: "commas", prompt: "Which sentence uses a colon correctly before an explanation?", choices: ["There is one thing I know: practice makes perfect.", "There is one thing I know, practice makes perfect.", "There is one thing I know; practice makes perfect.", "There is one thing I know practice makes perfect."], answer_index: 0, punctuationLevel: 3 },
  { id: "p041", subject: "punctuation", difficulty: 3, skill_tag: "semicolons", prompt: "Which sentence uses a semicolon correctly between independent clauses?", choices: ["The storm was fierce; we stayed indoors.", "The storm was fierce we stayed indoors.", "The storm was fierce, we stayed indoors.", "The storm was fierce; and we stayed indoors."], answer_index: 0, punctuationLevel: 3 },
  { id: "p042", subject: "punctuation", difficulty: 3, skill_tag: "commas", prompt: "Which sentence correctly uses a comma with a nonrestrictive clause?", choices: ["My brother, who lives in Seattle, is a doctor.", "My brother who lives in Seattle is a doctor.", "My brother, who lives in Seattle is a doctor.", "My brother who lives in Seattle, is a doctor."], answer_index: 0, punctuationLevel: 3 },
  { id: "p043", subject: "punctuation", difficulty: 3, skill_tag: "quotation-marks", prompt: "Which sentence punctuates an exclamation within dialogue correctly?", choices: ['She shouted, "Watch out!"', 'She shouted, "Watch out"!', 'She shouted "Watch out!"', 'She shouted, "Watch out"!'], answer_index: 0, punctuationLevel: 3 },
  { id: "p044", subject: "punctuation", difficulty: 3, skill_tag: "commas", prompt: "Which sentence uses a hyphen correctly in a compound modifier?", choices: ["She is a well-known author.", "She is a well known author.", "She is a well-known-author.", "She is a well known-author."], answer_index: 0, punctuationLevel: 3 },
  { id: "p045", subject: "punctuation", difficulty: 3, skill_tag: "semicolons", prompt: "Which sentence uses a semicolon correctly with transitional phrases?", choices: ["I studied all night; as a result, I passed the test.", "I studied all night as a result; I passed the test.", "I studied all night; as a result I passed the test.", "I studied all night, as a result; I passed the test."], answer_index: 0, punctuationLevel: 3 },
  ...PUNCTUATION_CURRICULUM_QUESTIONS.filter((q) => q.punctuationLevel === 3),
];

export const PUNCTUATION_BY_LEVEL: Record<PunctuationLevel, Question[]> = {
  1: PUNCTUATION_BEGINNER,
  2: PUNCTUATION_INTERMEDIATE,
  3: PUNCTUATION_ADVANCED,
};

export const PUNCTUATION_QUESTIONS: Question[] = [
  ...PUNCTUATION_BEGINNER,
  ...PUNCTUATION_INTERMEDIATE,
  ...PUNCTUATION_ADVANCED,
];

export { PUNCTUATION_CURRICULUM_MODULES } from "./punctuation-curriculum";

const DISTRACTOR_LENGTH_SUFFIXES = [
  " in this context",
  " for this example",
  " in this situation",
  " in this case",
];

function stableIndex(seed: string, length: number): number {
  if (length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

function rebalanceChoiceLengths(question: Question, seed: string): Question {
  if (question.subject !== "vocabulary" || question.choices.length < 3) return question;

  const lengths = question.choices.map((choice) => choice.length);
  const correctLength = lengths[question.answer_index];
  const maxLength = Math.max(...lengths);
  const maxCount = lengths.filter((len) => len === maxLength).length;
  const correctIsUniqueLongest = correctLength === maxLength && maxCount === 1;
  if (!correctIsUniqueLongest) return question;

  const distractorIndices = question.choices
    .map((_, index) => index)
    .filter((index) => index !== question.answer_index);
  if (distractorIndices.length === 0) return question;

  const distractorIndex = distractorIndices[stableIndex(`${seed}_${question.id}_d`, distractorIndices.length)];
  const suffix = DISTRACTOR_LENGTH_SUFFIXES[stableIndex(`${seed}_${question.id}_s`, DISTRACTOR_LENGTH_SUFFIXES.length)];
  const current = question.choices[distractorIndex];
  if (current.endsWith(suffix)) return question;

  const choices = [...question.choices];
  choices[distractorIndex] = `${current}${suffix}`;
  return { ...question, choices };
}

export function getPunctuationQuestionsByModule(moduleId: string, count: number = 12): Question[] {
  const selected = getRawPunctuationQuestionsByModule(moduleId, PUNCTUATION_QUESTIONS, count);
  const sessionSeed = Math.random().toString(36).slice(2, 12);
  return selected.map((q, i) => {
    const choiceSeed = `${sessionSeed}_${q.id}_${i}`;
    const rebalanced = rebalanceChoiceLengths(q, choiceSeed);
    return shuffleQuestionChoices(rebalanced, choiceSeed);
  });
}

export function getPunctuationModuleById(moduleId: string) {
  return PUNCTUATION_CURRICULUM_MODULES.find((module) => module.id === moduleId);
}

/** Shuffle answer choices and update answer_index. Uses seed for deterministic shuffle (e.g. ranked). */
export function shuffleQuestionChoices(question: Question, seed?: string): Question {
  const { choices, answer_index } = question;
  const correct = choices[answer_index];
  const indices = choices.map((_, i) => i);
  const shuffledIndices = seed ? seededShuffle(indices, seed) : [...indices].sort(() => Math.random() - 0.5);
  const newChoices = shuffledIndices.map((i) => choices[i]);
  const newAnswerIndex = newChoices.indexOf(correct);
  return { ...question, choices: newChoices, answer_index: newAnswerIndex };
}

/** Get vocabulary questions for a specific grade (3-7). Used in casual mode. */
export function getVocabQuestionsByGrade(grade: VocabGrade, count: number = 30): Question[] {
  const pool = VOCAB_BY_GRADE[grade] ?? VOCAB_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const sessionSeed = Math.random().toString(36).slice(2, 12);
  return selected.map((q, i) => {
    const choiceSeed = `${sessionSeed}_${q.id}_${i}`;
    const rebalanced = rebalanceChoiceLengths(q, choiceSeed);
    return shuffleQuestionChoices(rebalanced, choiceSeed);
  });
}

/** Vocab grade for placement match (neutral assessment — Grade 5). */
export const PLACEMENT_VOCAB_GRADE: VocabGrade = 5;

/** Ordered from easiest to hardest — used for index-based progression. */
const VOCAB_LEVEL_ORDER: VocabLevel[] = [3, 4, 5, 6, 7, "english1", "english2", "english3", "ap-lang", "ap-lit"];

/** Ranked-only difficulty ladder: each vocab level spans exactly 100 MMR. */
const RANKED_MMR_BUCKET_SIZE = 100;
const RANKED_MMR_FLOOR = 800;

/**
 * Ranked-only vocab level from MMR.
 * Each +100 MMR pushes to the next vocab level (grade/class).
 */
export function getVocabGradeForRanked(
  placementGrade: VocabGrade | undefined,
  mmr: number | undefined
): VocabLevel {
  const base: VocabLevel = placementGrade ?? 5;
  const fallbackBaseIdx = Math.max(0, VOCAB_LEVEL_ORDER.indexOf(base));
  const fallbackMMR = RANKED_MMR_FLOOR + fallbackBaseIdx * RANKED_MMR_BUCKET_SIZE + 50;
  const effectiveMMR = mmr ?? fallbackMMR;
  const bucketIdx = Math.floor((effectiveMMR - RANKED_MMR_FLOOR) / RANKED_MMR_BUCKET_SIZE);
  const clampedIdx = Math.max(0, Math.min(VOCAB_LEVEL_ORDER.length - 1, bucketIdx));
  return VOCAB_LEVEL_ORDER[clampedIdx] ?? base;
}

/** Get vocabulary questions for any level (grades 3-7, english1-3, ap-lang, ap-lit). */
export function getVocabQuestionsByLevel(level: VocabLevel, count: number = 30): Question[] {
  const pool = VOCAB_BY_LEVEL[level] ?? VOCAB_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const sessionSeed = Math.random().toString(36).slice(2, 12);
  return selected.map((q, i) => {
    const choiceSeed = `${sessionSeed}_${q.id}_${i}`;
    const rebalanced = rebalanceChoiceLengths(q, choiceSeed);
    return shuffleQuestionChoices(rebalanced, choiceSeed);
  });
}

export function getQuestionsForMode(
  subject: "vocabulary" | "punctuation",
  count: number = 20,
  vocabGrade?: VocabLevel,
  punctuationLevel?: PunctuationLevel
): Question[] {
  const pool =
    subject === "vocabulary"
      ? vocabGrade
        ? (VOCAB_BY_LEVEL[vocabGrade] ?? VOCAB_QUESTIONS)
        : VOCAB_QUESTIONS
      : punctuationLevel
        ? PUNCTUATION_BY_LEVEL[punctuationLevel]
        : PUNCTUATION_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const sessionSeed = Math.random().toString(36).slice(2, 12);
  return selected.map((q, i) => {
    const choiceSeed = `${sessionSeed}_${q.id}_${i}`;
    const rebalanced = rebalanceChoiceLengths(q, choiceSeed);
    return shuffleQuestionChoices(rebalanced, choiceSeed);
  });
}

export function getMixedQuestions(count: number = 20): Question[] {
  const all = [...VOCAB_QUESTIONS, ...PUNCTUATION_QUESTIONS];
  const shuffled = all.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const sessionSeed = Math.random().toString(36).slice(2, 12);
  return selected.map((q, i) => {
    const choiceSeed = `${sessionSeed}_${q.id}_${i}`;
    const rebalanced = rebalanceChoiceLengths(q, choiceSeed);
    return shuffleQuestionChoices(rebalanced, choiceSeed);
  });
}

/** Deterministic mixed questions — same seed always returns same questions in same order. */
export function getSeededMixedQuestions(seed: string, count: number = 30): Question[] {
  const all = [...VOCAB_QUESTIONS, ...PUNCTUATION_QUESTIONS];
  const shuffled = seededShuffle(all, seed);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  return selected.map((q, i) => {
    const choiceSeed = `${seed}_${q.id}_${i}`;
    const rebalanced = rebalanceChoiceLengths(q, choiceSeed);
    return shuffleQuestionChoices(rebalanced, choiceSeed);
  });
}

export function getSeededQuestions(
  subject: "vocabulary" | "punctuation",
  seed: string,
  count: number = 20
): Question[] {
  const pool = subject === "vocabulary" ? VOCAB_QUESTIONS : PUNCTUATION_QUESTIONS;
  const shuffled = seededShuffle(pool, seed);
  const selected = shuffled.slice(0, Math.min(count, pool.length));
  return selected.map((q, i) => {
    const choiceSeed = `${seed}_${q.id}_${i}`;
    const rebalanced = rebalanceChoiceLengths(q, choiceSeed);
    return shuffleQuestionChoices(rebalanced, choiceSeed);
  });
}

/** Seeded questions from a specific vocab level, optionally filtered by unit skill tags. */
export function getSeededQuestionsForUnit(
  level: VocabLevel,
  skillTags: string[],
  seed: string,
  count: number = 20
): Question[] {
  const pool = VOCAB_BY_LEVEL[level] ?? VOCAB_QUESTIONS;
  const filtered = skillTags.length > 0
    ? pool.filter((q) => skillTags.includes(q.skill_tag))
    : pool;
  const usePool = filtered.length >= 8 ? filtered : pool;
  const shuffled = seededShuffle([...usePool], seed);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  return selected.map((q, i) => {
    const choiceSeed = `${seed}_${q.id}_${i}`;
    const rebalanced = rebalanceChoiceLengths(q, choiceSeed);
    return shuffleQuestionChoices(rebalanced, choiceSeed);
  });
}

/** Same as getQuestionsForMode but with a seed for deterministic party sync (same match for all). */
export function getSeededQuestionsForMode(
  subject: "vocabulary" | "punctuation",
  seed: string,
  count: number = 30,
  vocabGrade?: VocabLevel,
  punctuationLevel?: PunctuationLevel
): Question[] {
  const pool =
    subject === "vocabulary"
      ? vocabGrade
        ? (VOCAB_BY_LEVEL[vocabGrade] ?? VOCAB_QUESTIONS)
        : VOCAB_QUESTIONS
      : punctuationLevel
        ? PUNCTUATION_BY_LEVEL[punctuationLevel]
        : PUNCTUATION_QUESTIONS;
  const shuffled = seededShuffle([...pool], seed);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  return selected.map((q, i) => {
    const choiceSeed = `${seed}_${q.id}_${i}`;
    const rebalanced = rebalanceChoiceLengths(q, choiceSeed);
    return shuffleQuestionChoices(rebalanced, choiceSeed);
  });
}
