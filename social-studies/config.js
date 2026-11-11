/* ===== SUBJECT SETTINGS · Social Studies =====
   API is the web address of the Google Apps Script grade book (see README: "Grade book").
   It is the same address in every subject. Leave it empty to run the site in preview. */
window.CFG = {
  API: "",
  ID: "ss",                           /* short name used in the grade book and for saved progress */
  COURSE: "Social Studies",
  SHORT: "Social Studies",
  TEACHER: "Ms. Maria",
  EMAIL: "maria@me.learnovateqa.com",
  SESSIONS: 12,
  /* this subject's own look: header and welcome colour, its line colour, and the colour of small tags */
  THEME: { bg: "#DDF3E4", line: "#ABD6B6", tint: "#E3F5EA", tintLine: "#ABD6B6", motto: "Read. Identify. Reason. Answer." }
};
