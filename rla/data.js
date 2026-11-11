/* ===== SYLLABUS · GED® Reasoning Through Language Arts · 12 sessions =====
   Based on Ms. Maria's student syllabus, with corrections and additions (see README: "Syllabus changes").
   A session opens on the site when its number is in "ready" and its sessionNN.json file exists. */
window.COURSE = {
  ready: [1],
  tagline: "Twelve sessions. One step at a time.",
  facts: [
    ["Test length", "150 minutes", "3 sections · 10-minute break"],
    ["Essay", "45 minutes", "1 extended response"],
    ["Passing score", "145", "on a scale that goes up to 200"],
    ["Question types", "4 + essay", "multiple choice, drag and drop, select an area, drop-down"]
  ],
  goal: "To build the reading, reasoning, language, writing and test-taking skills you need to prepare for and pass the GED® Reasoning Through Language Arts (RLA) test.",
  outcomes: [
    "Understand and analyze written passages, both informational and literary",
    "Identify main ideas and supporting details",
    "Make logical inferences from a text",
    "Determine the author's purpose and point of view",
    "Understand vocabulary in context",
    "Identify claims, reasons and evidence",
    "Evaluate arguments and the evidence that supports them",
    "Compare two arguments on the same topic",
    "Apply grammar, punctuation and sentence rules",
    "Understand and complete the Extended Response task",
    "Write an organized response that uses evidence from the passages",
    "Use GED test-taking and time-management strategies"
  ],
  phases: [
    { name: "Phase 1 · GED foundation", sessions: [1, 2] },
    { name: "Phase 2 · Reading and argument", sessions: [3, 4] },
    { name: "Phase 3 · Language and grammar", sessions: [5, 6] },
    { name: "Phase 4 · Extended response", sessions: [7, 8, 9, 10] },
    { name: "Phase 5 · RLA mastery and test preparation", sessions: [11, 12] }
  ],
  sessions: [
    { n: 1, title: "GED RLA Introduction & Diagnostic", sub: "Meet the test. Find your starting point.",
      topics: ["GED RLA test structure: 3 sections, 150 minutes, one 10-minute break", "Question types and format: multiple choice, drag and drop, select an area (hot spot), drop-down", "The passing score (145) and what the score levels mean", "Timing and pacing", "Reading expectations: informational and literary texts", "Writing expectations: the 45-minute extended response", "The four-step method: read the question, read the passage, find the evidence, answer", "Diagnostic assessment", "Identifying strengths and areas for improvement"] },
    { n: 2, title: "Reading for Meaning", sub: "Main idea, details, inference, purpose.",
      topics: ["Main idea identification", "Supporting details", "Making logical inferences", "Author's purpose", "Point of view", "Tone and word choice", "Summarizing passages", "Vocabulary in context", "Citing text evidence", "Text structure: sequence, cause and effect, compare and contrast, problem and solution", "Reading literary texts: character, setting, theme"] },
    { n: 3, title: "Analyzing Arguments", sub: "Claim, reasons, evidence.",
      topics: ["What is an argument?", "Identifying the claim", "Analyzing reasons", "Evaluating evidence", "Author's position", "Author's purpose", "Argument structure analysis", "Counterclaims: how an author answers the other side", "Assumptions: what the author believes without saying it", "Persuasive language: loaded words and emotional appeals"],
      key: "What is the author trying to convince me to believe or do?" },
    { n: 4, title: "Evidence, Reasoning & Comparing Arguments", sub: "Which argument is stronger?",
      topics: ["Strong vs. weak evidence", "Relevant vs. irrelevant evidence", "Fact vs. opinion", "Types of evidence: facts, statistics, expert opinion, examples, personal stories", "Logical reasoning", "Common errors in reasoning", "Spotting unsupported claims", "Comparing two arguments", "Comparing two texts on one topic: purpose, audience and form", "Determining which argument is better supported"],
      key: "Which argument is stronger, and what evidence proves it?" },
    { n: 5, title: "Sentence Structure & Grammar", sub: "Complete, correct, clear sentences.",
      topics: ["Complete sentences", "Sentence fragments", "Run-on sentences and comma splices", "Independent and dependent clauses", "Joining ideas: coordination and subordination", "Subject-verb agreement", "Pronoun usage and agreement", "Verb tense consistency", "Parallel structure", "Misplaced and dangling modifiers", "Clear sentence construction", "How grammar is tested: drop-down choices inside a text"] },
    { n: 6, title: "Punctuation & Language Conventions", sub: "Commas, apostrophes, capitals and more.",
      topics: ["Comma usage rules", "Apostrophes and possessives", "Semicolons", "Colons", "Capitalization rules", "Punctuation in context", "Words that are often confused (their / there / they're, its / it's)", "Transition words and how to punctuate them", "Informal language to avoid in formal writing", "Common grammar and usage errors"] },
    { n: 7, title: "Understanding the Extended Response", sub: "What the task asks you to do.",
      topics: ["Extended Response task requirements", "The task is to analyze the two arguments, not to give your own opinion on the topic", "How to read the two passages", "Identifying each author's argument", "Determining which argument is stronger", "Finding relevant evidence", "Planning an effective response", "How the response is scored: the three parts of the rubric"] },
    { n: 8, title: "Building an Evidence-Based Response", sub: "Introduction to conclusion.",
      topics: ["Response structure: Introduction → Claim → Evidence → Explanation → Additional evidence → The weaker argument → Conclusion", "Writing a clear claim about which argument is better supported", "Quoting and paraphrasing evidence from the passages", "Explaining how the evidence supports your claim", "Showing why the other argument is weaker", "Developing and organizing ideas with evidence and logical reasoning"] },
    { n: 9, title: "Writing, Revising & Editing", sub: "Make it clear. Make it correct.",
      topics: ["Essay organization", "Paragraph development", "Integrating evidence", "Writing clear explanations", "Smooth transitions", "Sentence clarity and sentence variety", "Formal style and word choice", "Grammar application", "Revision and editing strategies", "A five-minute proofreading checklist"] },
    { n: 10, title: "Timed Extended Response Practice", sub: "A full 45-minute practice.",
      topics: ["A full 45-minute Extended Response under test conditions", "A time plan: read and plan, write, check", "Reading both passages", "Planning the essay", "Selecting evidence", "Drafting the response", "Reviewing and revising", "Scoring your essay with the rubric", "Post-essay performance analysis: what to improve for a higher score"] },
    { n: 11, title: "RLA Master Review & Mixed Practice", sub: "Everything together.",
      topics: ["Reading comprehension", "Main idea and inferences", "Vocabulary in context", "Author's purpose", "Arguments, claims and evidence", "Logical reasoning", "Grammar and conventions", "Practice with every question type", "Timed mixed GED questions"] },
    { n: 12, title: "RLA Mock Test & Error Analysis", sub: "Timed test and your readiness plan.",
      topics: ["A timed RLA practice test in sections, with a visible clock and a break", "What I got wrong", "Why I got it wrong", "What skill I need to improve", "What strategy to use next time", "What I need to practise before the official GED® test", "A personal readiness and improvement plan"] }
  ],
  cando: [
    ["I CAN READ", "Understand GED passages and identify important information."],
    ["I CAN THINK", "Determine what a question is really asking."],
    ["I CAN ANALYZE", "Identify claims, evidence, reasoning and author's purpose."],
    ["I CAN EVALUATE", "Determine whether evidence supports an argument."],
    ["I CAN USE ENGLISH", "Recognize and correct common grammar, punctuation and sentence errors."],
    ["I CAN WRITE & TEST", "Write organized, evidence-based responses and use my skills under timed GED conditions."]
  ]
};
