/* ===== SUBJECT SETTINGS · Reasoning Through Language Arts =====
   API is the web address of the Google Apps Script grade book (see README: "Grade book").
   It is the same address in every subject. Leave it empty to run the site in preview. */
window.CFG = {
  API: "",
  ID: "rla",                           /* short name used in the grade book and for saved progress */
  COURSE: "Reasoning Through Language Arts",
  SHORT: "RLA",
  TEACHER: "Ms. Maria",
  EMAIL: "maria@me.learnovateqa.com",
  SESSIONS: 12,
  /* this subject's own look: header and welcome colour, its line colour, and the colour of small tags */
  THEME: { bg: "#F8DFE3", line: "#EFC9D2", tint: "#F9DCE7", tintLine: "#EBB5C9", motto: "Read. Reason. Write." }
};
