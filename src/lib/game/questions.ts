import { Question, VocabGrade, VocabLevel } from "@/types";
import { seededShuffle } from "./matchmaking";

// Grade 3 vocabulary (simple tier 2 words)
const GRADE3_VOCAB: Question[] = [
  { id: "g3_01", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'consider' mean?", choices: ["To ignore", "To think about carefully", "To forget", "To run away"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_02", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'purpose' mean?", choices: ["A mistake", "The reason for something", "A type of food", "A loud noise"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_03", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'several' mean?", choices: ["Only one", "More than a few", "None", "Too many"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_04", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'similar' mean?", choices: ["Very different", "Almost the same", "Completely opposite", "Strange"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_05", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'explain' mean?", choices: ["To hide", "To make clear or describe", "To confuse", "To forget"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_06", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'perhaps' mean?", choices: ["Never", "Maybe or possibly", "Always", "Definitely not"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_07", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'result' mean?", choices: ["The beginning", "What happens because of something", "A question", "A guess"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_08", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'usually' mean?", choices: ["Never", "Most of the time", "Rarely", "Only once"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_09", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'character' mean?", choices: ["A number", "A person in a story", "A color", "A place"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_10", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'setting' mean?", choices: ["A character", "Where and when a story happens", "The ending", "A problem"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_11", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'plot' mean?", choices: ["A character", "The main events of a story", "The setting", "A single scene"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_12", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'inference' mean?", choices: ["A fact stated directly", "A conclusion from clues", "A guess with no evidence", "A question"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_13", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'decide' mean?", choices: ["To wonder", "To make a choice", "To forget", "To ask"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_14", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'describe' mean?", choices: ["To hide", "To tell what something is like", "To guess", "To forget"], answer_index: 1, gradeLevel: 3 },
  { id: "g3_15", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'different' mean?", choices: ["The same", "Not the same", "Similar", "Boring"], answer_index: 1, gradeLevel: 3 },
];

// Grade 4 vocabulary
const GRADE4_VOCAB: Question[] = [
  { id: "g4_01", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'compare' mean?", choices: ["To ignore", "To show how things are alike", "To destroy", "To forget"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_02", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'contrast' mean?", choices: ["To show similarities", "To show differences", "To agree", "To copy"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_03", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'evidence' mean?", choices: ["A guess", "Proof or facts that support something", "A story", "An opinion"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_04", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'conclude' mean?", choices: ["To begin", "To reach a decision or end", "To ignore", "To ask"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_05", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'summarize' mean?", choices: ["To add details", "To give a brief overview", "To confuse", "To lengthen"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_06", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'predict' mean?", choices: ["To forget", "To guess what will happen", "To describe the past", "To ignore"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_07", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'organize' mean?", choices: ["To scatter", "To arrange in order", "To lose", "To mix up"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_08", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'sequence' mean?", choices: ["Random order", "The order of events", "A single event", "The end"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_09", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'main idea' mean?", choices: ["A small detail", "The most important point", "The title", "A character"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_10", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'detail' mean?", choices: ["The main idea", "A small piece of information", "The whole story", "A guess"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_11", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'passage' mean?", choices: ["A door", "A short section of text", "A long book", "A picture"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_12", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'opinion' mean?", choices: ["A proven fact", "A personal view or belief", "A question", "A summary"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_13", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'persuade' mean?", choices: ["To confuse", "To convince someone", "To forget", "To ask"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_14", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'inform' mean?", choices: ["To hide", "To give information", "To guess", "To entertain"], answer_index: 1, gradeLevel: 4 },
  { id: "g4_15", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'entertain' mean?", choices: ["To bore", "To amuse or interest", "To teach", "To confuse"], answer_index: 1, gradeLevel: 4 },
];

// Grade 5 vocabulary
const GRADE5_VOCAB: Question[] = [
  { id: "g5_01", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'analyze' mean?", choices: ["To ignore", "To examine closely", "To guess", "To summarize"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_02", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'determine' mean?", choices: ["To wonder", "To figure out or decide", "To forget", "To ask"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_03", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'develop' mean?", choices: ["To shrink", "To grow or expand", "To destroy", "To ignore"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_04", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'identify' mean?", choices: ["To lose", "To recognize or name", "To forget", "To hide"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_05", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'influence' mean?", choices: ["To ignore", "To affect or have an impact on", "To copy", "To forget"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_06", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'structure' mean?", choices: ["Chaos", "How something is organized", "A random order", "The end"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_07", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'theme' mean?", choices: ["A character", "The main message of a story", "The setting", "A detail"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_08", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'conflict' mean?", choices: ["Agreement", "A struggle or problem", "The solution", "The beginning"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_09", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'resolution' mean?", choices: ["The problem", "How a conflict is solved", "The beginning", "A character"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_10", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'context' mean?", choices: ["The answer", "The surrounding information", "A guess", "The title"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_11", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'evaluate' mean?", choices: ["To ignore", "To judge or assess", "To create", "To forget"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_12", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'interpret' mean?", choices: ["To copy", "To explain the meaning of", "To ignore", "To forget"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_13", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'support' mean?", choices: ["To oppose", "To back up with evidence", "To ignore", "To guess"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_14", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'convey' mean?", choices: ["To hide", "To communicate or express", "To forget", "To confuse"], answer_index: 1, gradeLevel: 5 },
  { id: "g5_15", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'demonstrate' mean?", choices: ["To hide", "To show or prove", "To guess", "To forget"], answer_index: 1, gradeLevel: 5 },
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
];

// Florida Grade 8 / English 1 / Pre-AP English 1 vocabulary (primary curriculum)
const FLORIDA_GRADE8_VOCAB: Question[] = [
  { id: "fl001", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'adept' mean?", choices: ["Clumsy and unskilled", "Skilled and expert", "Lazy and slow", "Confused and lost"], answer_index: 1 },
  { id: "fl002", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'advocate' mean?", choices: ["To oppose strongly", "To support or argue for", "To ignore completely", "To criticize harshly"], answer_index: 1 },
  { id: "fl003", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'agile' mean?", choices: ["Slow and heavy", "Quick and nimble", "Loud and noisy", "Quiet and shy"], answer_index: 1 },
  { id: "fl004", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'analogy' mean?", choices: ["A direct statement", "A comparison between two things", "A type of question", "A long story"], answer_index: 1 },
  { id: "fl005", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'anarchy' mean?", choices: ["Strict order and rules", "Absence of government or chaos", "A type of government", "Peaceful agreement"], answer_index: 1 },
  { id: "fl006", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'apprehend' mean?", choices: ["To release someone", "To arrest or understand", "To ignore something", "To celebrate"], answer_index: 1 },
  { id: "fl007", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'ardent' mean?", choices: ["Cold and distant", "Passionate and enthusiastic", "Boring and dull", "Angry and hostile"], answer_index: 1 },
  { id: "fl008", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'articulate' mean?", choices: ["Mumbled and unclear", "Able to express clearly", "Quiet and reserved", "Rude and harsh"], answer_index: 1 },
  { id: "fl009", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'assimilate' mean?", choices: ["To reject or separate", "To absorb and integrate", "To argue against", "To destroy completely"], answer_index: 1 },
  { id: "fl010", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'atrocity' mean?", choices: ["A kind act", "An extremely cruel or wicked act", "A small mistake", "A celebration"], answer_index: 1 },
  { id: "fl011", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'audacious' mean?", choices: ["Timid and shy", "Bold and daring", "Quiet and reserved", "Boring and plain"], answer_index: 1 },
  { id: "fl012", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'augment' mean?", choices: ["To decrease or reduce", "To increase or add to", "To remove completely", "To ignore"], answer_index: 1 },
  { id: "fl013", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'avid' mean?", choices: ["Uninterested and bored", "Enthusiastic and eager", "Angry and upset", "Tired and sleepy"], answer_index: 1 },
  { id: "fl014", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "What does 'benign' mean?", choices: ["Harmful and dangerous", "Gentle and harmless", "Loud and aggressive", "Cold and unfriendly"], answer_index: 1 },
  { id: "fl015", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'bizarre' mean?", choices: ["Normal and ordinary", "Strange and unusual", "Beautiful and elegant", "Boring and dull"], answer_index: 1 },
  { id: "fl016", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'cache' mean?", choices: ["Something displayed openly", "A hidden storage of valuables", "A type of vehicle", "A loud noise"], answer_index: 1 },
  { id: "fl017", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'capacious' mean?", choices: ["Tiny and cramped", "Spacious and roomy", "Dark and gloomy", "Bright and shiny"], answer_index: 1 },
  { id: "fl018", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'chastise' mean?", choices: ["To praise warmly", "To scold or punish", "To ignore completely", "To reward generously"], answer_index: 1 },
  { id: "fl019", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'cite' mean?", choices: ["To ignore a source", "To quote or reference", "To destroy evidence", "To forget something"], answer_index: 1 },
  { id: "fl020", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'commemorate' mean?", choices: ["To forget an event", "To honor or remember", "To criticize harshly", "To destroy something"], answer_index: 1 },
  { id: "fl021", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'component' mean?", choices: ["The whole thing", "A part or element", "Something useless", "A duplicate"], answer_index: 1 },
  { id: "fl022", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'confiscate' mean?", choices: ["To give something away", "To seize by authority", "To borrow temporarily", "To lose accidentally"], answer_index: 1 },
  { id: "fl023", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'connoisseur' mean?", choices: ["A beginner", "An expert judge of quality", "A careless person", "A critic who hates everything"], answer_index: 1 },
  { id: "fl024", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'conscientious' mean?", choices: ["Careless and lazy", "Careful and thorough", "Rude and mean", "Confused and lost"], answer_index: 1 },
  { id: "fl025", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'contagious' mean?", choices: ["Impossible to spread", "Spreading by contact", "Rare and uncommon", "Easy to cure"], answer_index: 1 },
  { id: "fl026", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'crucial' mean?", choices: ["Unimportant", "Extremely important", "Optional", "Rare"], answer_index: 1 },
  { id: "fl027", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'culminate' mean?", choices: ["To begin something", "To reach the highest point", "To fail completely", "To pause midway"], answer_index: 1 },
  { id: "fl028", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'deceptive' mean?", choices: ["Honest and clear", "Misleading or false", "Helpful and kind", "Boring and plain"], answer_index: 1 },
  { id: "fl029", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'decipher' mean?", choices: ["To encode a message", "To decode or figure out", "To destroy something", "To ignore completely"], answer_index: 1 },
  { id: "fl030", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'deplore' mean?", choices: ["To celebrate", "To strongly disapprove", "To ignore", "To encourage"], answer_index: 1 },
  { id: "fl031", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'desolate' mean?", choices: ["Crowded and busy", "Empty and barren", "Colorful and lively", "Warm and cozy"], answer_index: 1 },
  { id: "fl032", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'deter' mean?", choices: ["To encourage", "To discourage or prevent", "To help someone", "To join in"], answer_index: 1 },
  { id: "fl033", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'dialect' mean?", choices: ["A formal language", "A regional variety of language", "A type of music", "A written document"], answer_index: 1 },
  { id: "fl034", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'dire' mean?", choices: ["Mild and harmless", "Extremely serious", "Happy and cheerful", "Boring and dull"], answer_index: 1 },
  { id: "fl035", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'discern' mean?", choices: ["To ignore", "To perceive or recognize", "To forget", "To destroy"], answer_index: 1 },
  { id: "fl036", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'disdain' mean?", choices: ["Deep respect", "Contempt or scorn", "Love and affection", "Confusion"], answer_index: 1 },
  { id: "fl037", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'doctrine' mean?", choices: ["A random opinion", "A set of beliefs or teachings", "A type of food", "A short story"], answer_index: 1 },
  { id: "fl038", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'eccentric' mean?", choices: ["Normal and ordinary", "Unconventional and odd", "Boring and plain", "Angry and hostile"], answer_index: 1 },
  { id: "fl039", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'embargo' mean?", choices: ["Free trade", "A ban on trade", "A celebration", "A type of ship"], answer_index: 1 },
  { id: "fl040", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'embark' mean?", choices: ["To finish a journey", "To begin a journey", "To cancel plans", "To stay home"], answer_index: 1 },
  { id: "fl041", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'encroach' mean?", choices: ["To retreat", "To intrude or advance gradually", "To help someone", "To celebrate"], answer_index: 1 },
  { id: "fl042", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'endeavor' mean?", choices: ["To give up", "To try or attempt", "To ignore", "To criticize"], answer_index: 1 },
  { id: "fl043", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'enigma' mean?", choices: ["Something obvious", "A puzzle or mystery", "A clear answer", "A simple task"], answer_index: 1 },
  { id: "fl044", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'epoch' mean?", choices: ["A brief moment", "A distinct period of time", "A type of food", "A small object"], answer_index: 1 },
  { id: "fl045", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'exemplify' mean?", choices: ["To hide an example", "To serve as an example", "To destroy evidence", "To confuse someone"], answer_index: 1 },
  { id: "fl046", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'facilitate' mean?", choices: ["To block or hinder", "To make easier", "To complicate", "To ignore"], answer_index: 1 },
  { id: "fl047", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'fallacy' mean?", choices: ["A proven fact", "A false belief or error", "A strong argument", "A clear truth"], answer_index: 1 },
  { id: "fl048", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'feasible' mean?", choices: ["Impossible", "Possible and practical", "Ridiculous", "Very difficult"], answer_index: 1 },
  { id: "fl049", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'foreboding' mean?", choices: ["A feeling of joy", "A sense of impending doom", "Excitement", "Relief"], answer_index: 1 },
  { id: "fl050", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'forfeit' mean?", choices: ["To gain something", "To give up or lose", "To win easily", "To keep safely"], answer_index: 1 },
  { id: "fl051", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'formidable' mean?", choices: ["Weak and easy", "Inspiring fear or respect", "Boring", "Friendly"], answer_index: 1 },
  { id: "fl052", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'fortify' mean?", choices: ["To weaken", "To strengthen", "To destroy", "To ignore"], answer_index: 1 },
  { id: "fl053", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'foster' mean?", choices: ["To prevent growth", "To encourage or promote", "To destroy", "To ignore"], answer_index: 1 },
  { id: "fl054", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'gaunt' mean?", choices: ["Plump and healthy", "Thin and bony", "Strong and muscular", "Colorful"], answer_index: 1 },
  { id: "fl055", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'gingerly' mean?", choices: ["Roughly and carelessly", "Cautiously and carefully", "Quickly and boldly", "Loudly"], answer_index: 1 },
  { id: "fl056", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'grapple' mean?", choices: ["To avoid completely", "To struggle or wrestle with", "To ignore", "To celebrate"], answer_index: 1 },
  { id: "fl057", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'gullible' mean?", choices: ["Skeptical and shrewd", "Easily fooled", "Angry and hostile", "Wise and experienced"], answer_index: 1 },
  { id: "fl058", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'haggard' mean?", choices: ["Fresh and rested", "Looking exhausted", "Happy and cheerful", "Well-dressed"], answer_index: 1 },
  { id: "fl059", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'haven' mean?", choices: ["A dangerous place", "A safe place or refuge", "A crowded area", "A barren wasteland"], answer_index: 1 },
  { id: "fl060", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'hindrance' mean?", choices: ["Help or assistance", "An obstacle or barrier", "A solution", "A celebration"], answer_index: 1 },
  { id: "fl061", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'imperative' mean?", choices: ["Optional", "Absolutely necessary", "Unimportant", "Rare"], answer_index: 1 },
  { id: "fl062", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'instill' mean?", choices: ["To remove", "To implant gradually", "To forget", "To destroy"], answer_index: 1 },
  { id: "fl063", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'intervene' mean?", choices: ["To stay out of it", "To come between and help", "To ignore", "To make worse"], answer_index: 1 },
  { id: "fl064", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'intricate' mean?", choices: ["Simple and plain", "Complex and detailed", "Boring", "Large"], answer_index: 1 },
  { id: "fl065", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'jurisdiction' mean?", choices: ["Lack of authority", "Authority or control over an area", "A type of food", "A random place"], answer_index: 1 },
  { id: "fl066", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'languish' mean?", choices: ["To thrive", "To grow weak or suffer", "To celebrate", "To work hard"], answer_index: 1 },
  { id: "fl067", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'lucrative' mean?", choices: ["Unprofitable", "Producing wealth", "Risky", "Boring"], answer_index: 1 },
  { id: "fl068", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'memoir' mean?", choices: ["A fictional novel", "A personal account of one's life", "A scientific report", "A poem"], answer_index: 1 },
  { id: "fl069", subject: "vocabulary", difficulty: 3, skill_tag: "definitions", prompt: "What does 'mercenary' mean?", choices: ["A volunteer", "Motivated only by money", "A generous person", "A teacher"], answer_index: 1 },
  { id: "fl070", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'pivotal' mean?", choices: ["Unimportant", "Crucial or central", "Optional", "Minor"], answer_index: 1 },
  { id: "fl071", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'plausible' mean?", choices: ["Impossible to believe", "Seemingly reasonable", "Ridiculous", "Proven false"], answer_index: 1 },
  { id: "fl072", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'prodigy' mean?", choices: ["A slow learner", "A young person with exceptional talent", "An average student", "A failure"], answer_index: 1 },
  { id: "fl073", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'proficient' mean?", choices: ["Unskilled", "Competent and skilled", "Beginner", "Clumsy"], answer_index: 1 },
  { id: "fl074", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'profound' mean?", choices: ["Shallow and superficial", "Deep and intense", "Simple", "Boring"], answer_index: 1 },
  { id: "fl075", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'pseudonym' mean?", choices: ["A real name", "A fake name used by an author", "A title", "A nickname"], answer_index: 1 },
  { id: "fl076", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'rebuke' mean?", choices: ["To praise", "To criticize sharply", "To ignore", "To help"], answer_index: 1 },
  { id: "fl077", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'renounce' mean?", choices: ["To embrace", "To formally reject", "To support", "To celebrate"], answer_index: 1 },
  { id: "fl078", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'renown' mean?", choices: ["Obscurity", "Fame and recognition", "Shame", "Wealth"], answer_index: 1 },
  { id: "fl079", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'sage' mean?", choices: ["A foolish person", "A wise person", "A young child", "An enemy"], answer_index: 1 },
  { id: "fl080", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'serene' mean?", choices: ["Chaotic and noisy", "Calm and peaceful", "Angry", "Confused"], answer_index: 1 },
  { id: "fl081", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'servile' mean?", choices: ["Proud and independent", "Overly submissive", "Bold", "Generous"], answer_index: 1 },
  { id: "fl082", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'spontaneous' mean?", choices: ["Planned in advance", "Unplanned and impulsive", "Boring", "Predictable"], answer_index: 1 },
  { id: "fl083", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'stamina' mean?", choices: ["Weakness", "Endurance and energy", "Laziness", "Confusion"], answer_index: 1 },
  { id: "fl084", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'sublime' mean?", choices: ["Ordinary", "Of supreme excellence", "Ugly", "Boring"], answer_index: 1 },
  { id: "fl085", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'subside' mean?", choices: ["To increase", "To lessen or calm down", "To explode", "To grow"], answer_index: 1 },
  { id: "fl086", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'succumb' mean?", choices: ["To resist successfully", "To give in or yield", "To fight back", "To win"], answer_index: 1 },
  { id: "fl087", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'tedious' mean?", choices: ["Exciting and fun", "Boring and tiresome", "Quick and easy", "Interesting"], answer_index: 1 },
  { id: "fl088", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'teem' mean?", choices: ["To be empty", "To be full of", "To drain", "To dry up"], answer_index: 1 },
  { id: "fl089", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'tirade' mean?", choices: ["A short compliment", "A long angry speech", "A peaceful discussion", "A song"], answer_index: 1 },
  { id: "fl090", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'tycoon' mean?", choices: ["A poor person", "A wealthy business leader", "A beginner", "A worker"], answer_index: 1 },
  { id: "fl091", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'ungainly' mean?", choices: ["Graceful", "Awkward and clumsy", "Beautiful", "Strong"], answer_index: 1 },
  { id: "fl092", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'vie' mean?", choices: ["To cooperate", "To compete", "To ignore", "To surrender"], answer_index: 1 },
  { id: "fl093", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'vilify' mean?", choices: ["To praise", "To speak badly of", "To help", "To honor"], answer_index: 1 },
  { id: "fl094", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'voracious' mean?", choices: ["Having no appetite", "Extremely eager or hungry", "Picky", "Full"], answer_index: 1 },
  { id: "fl095", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "What does 'wrangle' mean?", choices: ["To agree peacefully", "To argue or dispute", "To cooperate", "To celebrate"], answer_index: 1 },
  // Context clues & synonyms for variety
  { id: "fl096", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "The diplomat was adept at negotiating between the two nations. What does 'adept' mean?", choices: ["Clumsy", "Skilled", "Lazy", "Confused"], answer_index: 1 },
  { id: "fl097", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "Her audacious plan to climb the mountain alone shocked everyone. What does 'audacious' mean?", choices: ["Timid", "Bold", "Boring", "Careful"], answer_index: 1 },
  { id: "fl098", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "The desolate landscape had no trees or signs of life. What does 'desolate' mean?", choices: ["Crowded", "Empty and barren", "Colorful", "Warm"], answer_index: 1 },
  { id: "fl099", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "He spoke with such fervor that his articulate arguments convinced the jury. What does 'articulate' mean?", choices: ["Mumbled", "Expressed clearly", "Quiet", "Rude"], answer_index: 1 },
  { id: "fl100", subject: "vocabulary", difficulty: 3, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'formidable'?", choices: ["Weak", "Daunting", "Friendly", "Simple"], answer_index: 1 },
  { id: "fl101", subject: "vocabulary", difficulty: 3, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'profound'?", choices: ["Shallow", "Deep", "Simple", "Boring"], answer_index: 1 },
  { id: "fl102", subject: "vocabulary", difficulty: 3, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'lucrative'?", choices: ["Profitable", "Unprofitable", "Risky", "Easy"], answer_index: 1 },
  { id: "fl103", subject: "vocabulary", difficulty: 3, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'spontaneous'?", choices: ["Impulsive", "Planned", "Random", "Fun"], answer_index: 1 },
  // More context-clues variants
  { id: "fl104", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "The bazaar was teeming with vendors selling spices and crafts. What does 'teeming' mean?", choices: ["Empty", "Full of", "Quiet", "Expensive"], answer_index: 1 },
  { id: "fl105", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "His meticulous notes made it easy to study for the exam. What does 'meticulous' mean?", choices: ["Sloppy", "Very careful", "Brief", "Confusing"], answer_index: 1 },
  { id: "fl106", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "The fortress was fortified with thick walls and guards. What does 'fortified' mean?", choices: ["Weakened", "Strengthened", "Abandoned", "Decorated"], answer_index: 1 },
  { id: "fl107", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "She had a voracious appetite and finished three plates. What does 'voracious' mean?", choices: ["Small", "Extremely eager", "Picky", "Strange"], answer_index: 1 },
  { id: "fl108", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "The judge's rebuke made the lawyer apologize. What does 'rebuke' mean?", choices: ["Praise", "Sharp criticism", "Question", "Advice"], answer_index: 1 },
  { id: "fl109", subject: "vocabulary", difficulty: 3, skill_tag: "context-clues", prompt: "His prodigious memory allowed him to recall every detail. What does 'prodigious' mean?", choices: ["Poor", "Remarkably great", "Average", "Fading"], answer_index: 1 },
  // More synonym variants
  { id: "fl110", subject: "vocabulary", difficulty: 2, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'ardent'?", choices: ["Cold", "Passionate", "Boring", "Quiet"], answer_index: 1 },
  { id: "fl111", subject: "vocabulary", difficulty: 2, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'bizarre'?", choices: ["Normal", "Strange", "Beautiful", "Small"], answer_index: 1 },
  { id: "fl112", subject: "vocabulary", difficulty: 2, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'crucial'?", choices: ["Optional", "Critical", "Rare", "Minor"], answer_index: 1 },
  { id: "fl113", subject: "vocabulary", difficulty: 2, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'deceptive'?", choices: ["Honest", "Misleading", "Helpful", "Clear"], answer_index: 1 },
  { id: "fl114", subject: "vocabulary", difficulty: 2, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'feasible'?", choices: ["Impossible", "Achievable", "Ridiculous", "Rare"], answer_index: 1 },
  { id: "fl115", subject: "vocabulary", difficulty: 2, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'intricate'?", choices: ["Simple", "Complex", "Large", "Boring"], answer_index: 1 },
  { id: "fl116", subject: "vocabulary", difficulty: 2, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'lucrative'?", choices: ["Unprofitable", "Profitable", "Risky", "Small"], answer_index: 1 },
  { id: "fl117", subject: "vocabulary", difficulty: 2, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'serene'?", choices: ["Chaotic", "Calm", "Loud", "Busy"], answer_index: 1 },
  { id: "fl118", subject: "vocabulary", difficulty: 2, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'tedious'?", choices: ["Exciting", "Tiresome", "Quick", "Easy"], answer_index: 1 },
  // More antonym variants
  { id: "fl119", subject: "vocabulary", difficulty: 2, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'ardent'?", choices: ["Passionate", "Indifferent", "Warm", "Eager"], answer_index: 1 },
  { id: "fl120", subject: "vocabulary", difficulty: 2, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'crucial'?", choices: ["Important", "Trivial", "Central", "Key"], answer_index: 1 },
  { id: "fl121", subject: "vocabulary", difficulty: 2, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'feasible'?", choices: ["Possible", "Impossible", "Practical", "Reasonable"], answer_index: 1 },
  { id: "fl122", subject: "vocabulary", difficulty: 2, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'proficient'?", choices: ["Skilled", "Inept", "Expert", "Capable"], answer_index: 1 },
  { id: "fl123", subject: "vocabulary", difficulty: 2, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'serene'?", choices: ["Calm", "Turbulent", "Peaceful", "Quiet"], answer_index: 1 },
  { id: "fl124", subject: "vocabulary", difficulty: 2, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'voracious'?", choices: ["Hungry", "Satisfied", "Eager", "Ravenous"], answer_index: 1 },
  // Fill-in / usage style
  { id: "fl125", subject: "vocabulary", difficulty: 1, skill_tag: "definitions", prompt: "Choose the best word to complete: The athlete showed great _____ in the marathon.", choices: ["stamina", "confusion", "laziness", "weakness"], answer_index: 0 },
  { id: "fl126", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "Choose the best word: Her _____ smile made everyone feel welcome.", choices: ["hostile", "serene", "chaotic", "angry"], answer_index: 1 },
  { id: "fl127", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "Choose the best word: The _____ task took hours to complete.", choices: ["quick", "tedious", "exciting", "simple"], answer_index: 1 },
  { id: "fl128", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "Choose the best word: He was _____ to learn new languages.", choices: ["uninterested", "avid", "bored", "tired"], answer_index: 1 },
  { id: "fl129", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "Choose the best word: The storm caused _____ damage to the town.", choices: ["minor", "dire", "mild", "harmless"], answer_index: 1 },
  { id: "fl130", subject: "vocabulary", difficulty: 2, skill_tag: "definitions", prompt: "Choose the best word: She handled the crisis with _____ composure.", choices: ["chaotic", "serene", "noisy", "aggressive"], answer_index: 1 },
].map((q) => ({ ...q, gradeLevel: 8 } as Question));

// PSAT-level vocabulary — challenging words for college-bound students
const PSAT_VOCAB: Question[] = [
  { id: "psat_01", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'ubiquitous' mean?", choices: ["Rare and scarce", "Present everywhere", "Invisible", "Temporary"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_02", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'ameliorate' mean?", choices: ["To worsen", "To make better", "To ignore", "To destroy"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_03", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'taciturn' mean?", choices: ["Very talkative", "Reserved and quiet", "Angry", "Cheerful"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_04", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'sagacious' mean?", choices: ["Foolish", "Wise and shrewd", "Lazy", "Rude"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_05", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'gregarious' mean?", choices: ["Shy and solitary", "Sociable and outgoing", "Hostile", "Boring"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_06", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'laconic' mean?", choices: ["Wordy", "Using few words", "Loud", "Confusing"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_07", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'abate' mean?", choices: ["To increase", "To lessen or decrease", "To begin", "To celebrate"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_08", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'transcend' mean?", choices: ["To fall short", "To go beyond limits", "To copy", "To ignore"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_09", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'intermingle' mean?", choices: ["To separate", "To mix or blend together", "To destroy", "To hide"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_10", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'desiccated' mean?", choices: ["Fresh and moist", "Completely dried out", "Frozen", "Rotten"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_11", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'perspicacious' mean?", choices: ["Dull-witted", "Having keen insight", "Blind", "Confused"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_12", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'equivocate' mean?", choices: ["To speak clearly", "To be deliberately vague", "To agree", "To shout"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_13", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'pragmatic' mean?", choices: ["Idealistic and impractical", "Practical and focused on results", "Lazy", "Stubborn"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_14", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'reticent' mean?", choices: ["Eager to share", "Unwilling to speak", "Angry", "Generous"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_15", subject: "vocabulary", difficulty: 4, skill_tag: "definitions", prompt: "What does 'mitigate' mean?", choices: ["To worsen", "To make less severe", "To ignore", "To cause"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_16", subject: "vocabulary", difficulty: 4, skill_tag: "context-clues", prompt: "The senator's equivocal response left reporters unsure of his position. What does 'equivocal' mean?", choices: ["Clear and direct", "Ambiguous and unclear", "Honest", "Brief"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_17", subject: "vocabulary", difficulty: 4, skill_tag: "synonyms", prompt: "Which word is closest in meaning to 'ubiquitous'?", choices: ["Rare", "Omnipresent", "Hidden", "Temporary"], answer_index: 1, gradeLevel: "psat" },
  { id: "psat_18", subject: "vocabulary", difficulty: 4, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'gregarious'?", choices: ["Sociable", "Reclusive", "Friendly", "Outgoing"], answer_index: 1, gradeLevel: "psat" },
];

// SAT-level vocabulary — especially hard, expert-tier words
const SAT_VOCAB: Question[] = [
  { id: "sat_01", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'obsequious' mean?", choices: ["Defiant and rebellious", "Excessively eager to please", "Indifferent", "Hostile"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_02", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'perspicuous' mean?", choices: ["Confusing", "Clear and easy to understand", "Lengthy", "Obscure"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_03", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'supercilious' mean?", choices: ["Humble", "Arrogantly superior", "Kind", "Shy"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_04", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'trenchant' mean?", choices: ["Mild and vague", "Sharp and incisive", "Boring", "Long-winded"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_05", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'recalcitrant' mean?", choices: ["Obedient", "Stubbornly resistant", "Eager", "Cooperative"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_06", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'sanguine' mean?", choices: ["Pessimistic", "Optimistic and cheerful", "Angry", "Neutral"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_07", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'profligate' mean?", choices: ["Frugal", "Recklessly wasteful", "Careful", "Generous"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_08", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'magnanimous' mean?", choices: ["Petty", "Generous and forgiving", "Stingy", "Resentful"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_09", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'tacit' mean?", choices: ["Explicitly stated", "Implied without being said", "Loud", "Written"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_10", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'pulchritude' mean?", choices: ["Ugliness", "Physical beauty", "Strength", "Intelligence"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_11", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'surreptitious' mean?", choices: ["Open and obvious", "Secret and stealthy", "Honest", "Loud"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_12", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'obdurate' mean?", choices: ["Flexible", "Stubbornly refusing to change", "Kind", "Weak"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_13", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'salubrious' mean?", choices: ["Unhealthy", "Promoting health", "Dangerous", "Boring"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_14", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'verisimilitude' mean?", choices: ["Falseness", "Appearance of being true", "Obvious lie", "Confusion"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_15", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'perfunctory' mean?", choices: ["Thorough and careful", "Done without real interest", "Enthusiastic", "Creative"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_16", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'sycophant' mean?", choices: ["Independent critic", "A flatterer who seeks favor", "Enemy", "Leader"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_17", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'lugubrious' mean?", choices: ["Cheerful", "Mournful and gloomy", "Exciting", "Calm"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_18", subject: "vocabulary", difficulty: 5, skill_tag: "definitions", prompt: "What does 'propitious' mean?", choices: ["Unfavorable", "Favorable and advantageous", "Neutral", "Dangerous"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_19", subject: "vocabulary", difficulty: 5, skill_tag: "context-clues", prompt: "His obsequious manner toward the CEO made his colleagues uncomfortable. What does 'obsequious' mean?", choices: ["Defiant", "Excessively submissive", "Confident", "Honest"], answer_index: 1, gradeLevel: "sat" },
  { id: "sat_20", subject: "vocabulary", difficulty: 5, skill_tag: "antonyms", prompt: "Which word is the OPPOSITE of 'magnanimous'?", choices: ["Generous", "Petty", "Kind", "Forgiving"], answer_index: 1, gradeLevel: "sat" },
];

export const VOCAB_BY_GRADE: Record<VocabGrade, Question[]> = {
  3: GRADE3_VOCAB,
  4: GRADE4_VOCAB,
  5: GRADE5_VOCAB,
  6: GRADE6_VOCAB,
  7: GRADE7_VOCAB,
  8: FLORIDA_GRADE8_VOCAB,
};

/** Extended mapping including PSAT and SAT levels. */
export const VOCAB_BY_LEVEL: Record<VocabLevel, Question[]> = {
  ...VOCAB_BY_GRADE,
  psat: PSAT_VOCAB,
  sat: SAT_VOCAB,
};

export const VOCAB_QUESTIONS: Question[] = [
  ...GRADE3_VOCAB,
  ...GRADE4_VOCAB,
  ...GRADE5_VOCAB,
  ...GRADE6_VOCAB,
  ...GRADE7_VOCAB,
  ...FLORIDA_GRADE8_VOCAB,
  ...PSAT_VOCAB,
  ...SAT_VOCAB,
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

/** Get vocabulary questions for a specific grade (3-8) or level (psat, sat). Used in casual mode. */
export function getVocabQuestionsByGrade(grade: VocabGrade, count: number = 30): Question[] {
  const pool = VOCAB_BY_GRADE[grade] ?? VOCAB_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const sessionSeed = Math.random().toString(36).slice(2, 12);
  return selected.map((q, i) => shuffleQuestionChoices(q, `${sessionSeed}_${q.id}_${i}`));
}

/** Get vocabulary questions for any level (grades 3-8, psat, sat). */
export function getVocabQuestionsByLevel(level: VocabLevel, count: number = 30): Question[] {
  const pool = VOCAB_BY_LEVEL[level] ?? VOCAB_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const sessionSeed = Math.random().toString(36).slice(2, 12);
  return selected.map((q, i) => shuffleQuestionChoices(q, `${sessionSeed}_${q.id}_${i}`));
}

export function getQuestionsForMode(
  subject: "vocabulary" | "punctuation",
  count: number = 20,
  vocabGrade?: VocabGrade | "psat" | "sat"
): Question[] {
  const pool =
    subject === "vocabulary"
      ? vocabGrade
        ? (VOCAB_BY_LEVEL[vocabGrade as VocabLevel] ?? VOCAB_QUESTIONS)
        : VOCAB_QUESTIONS
      : PUNCTUATION_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const sessionSeed = Math.random().toString(36).slice(2, 12);
  return selected.map((q, i) => shuffleQuestionChoices(q, `${sessionSeed}_${q.id}_${i}`));
}

export function getMixedQuestions(count: number = 20): Question[] {
  const all = [...VOCAB_QUESTIONS, ...PUNCTUATION_QUESTIONS];
  const shuffled = all.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const sessionSeed = Math.random().toString(36).slice(2, 12);
  return selected.map((q, i) => shuffleQuestionChoices(q, `${sessionSeed}_${q.id}_${i}`));
}

export function getSeededQuestions(
  subject: "vocabulary" | "punctuation",
  seed: string,
  count: number = 20
): Question[] {
  const pool = subject === "vocabulary" ? VOCAB_QUESTIONS : PUNCTUATION_QUESTIONS;
  const shuffled = seededShuffle(pool, seed);
  const selected = shuffled.slice(0, Math.min(count, pool.length));
  return selected.map((q, i) => shuffleQuestionChoices(q, `${seed}_${q.id}_${i}`));
}
