/**
 * The GED Academy · grade book and teacher portal script
 * Elevate with Ms. Maria · Learnovate Qatar
 *
 * This script lives inside YOUR Google Sheet. The website sends student work to it, and it writes the rows.
 * It holds no passwords and no student data in its code, so it is safe to keep a copy in the public repository.
 *
 * SET-UP (once) — the README has the same steps with more detail:
 *  1. Create a new Google Sheet, for example "GED_Academy_Gradebook".
 *  2. Extensions > Apps Script. Delete the sample code, paste this whole file, and press Save.
 *  3. Choose the function "setup" in the toolbar and press Run. Allow the permissions. It creates every tab.
 *  4. Go back to the Sheet and reload it. A new menu "GED Academy" appears.
 *     Choose GED Academy > Set teacher password, and type your own password (10 characters or more).
 *  5. In the Students tab, type each student: Name, Access code, Group.
 *  6. In Apps Script: Deploy > New deployment > type "Web app" > Execute as: Me > Who has access: Anyone > Deploy.
 *  7. Copy the Web app URL and give it to Claude (it goes into rla/config.js and social-studies/config.js).
 *  8. Open the teacher portal on the website, sign in, and press "Import quiz answer keys" to load quiz-keys.json.
 *  When this code changes later: Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy.
 */

const TAB = { settings: 'Settings', students: 'Students', progress: 'Progress', wb: 'Workbooks', quiz: 'Quiz_Scores', mock: 'Mock_Tests', keys: 'Quiz_Keys' };
const HEAD = {
  Settings: ['Setting', 'Value'],
  Students: ['Name', 'Access code', 'Group', 'Active (yes / no)', 'Notes', 'Name the student typed', 'Last sign-in'],
  Progress: ['Access code', 'Name', 'Subject', 'Sessions completed', 'Data (JSON)', 'Last updated'],
  Workbooks: ['Timestamp', 'Access code', 'Name', 'Subject', 'Session', 'Score', 'Total', 'By level', 'Wrong question numbers'],
  Quiz_Scores: ['Timestamp', 'Access code', 'Name', 'Subject', 'Session', 'Score', 'Total', 'Attempt'],
  Mock_Tests: ['Timestamp', 'Access code', 'Name', 'Subject', 'Session', 'Score', 'Total', 'By skill', 'Wrong question numbers', 'Minutes used'],
  Quiz_Keys: ['Quiz (subject-session)', 'Answer key (JSON) · imported from the teacher portal · do not edit']
};
const SUBJECTS = { rla: 'RLA', ss: 'Social Studies', science: 'Science', math: 'Math' };

/* ---------- small helpers ---------- */
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(name) {
  const s = ss_(); let sh = s.getSheetByName(name);
  if (!sh) { sh = s.insertSheet(name); sh.appendRow(HEAD[name]); sh.setFrozenRows(1); }
  return sh;
}
function rows_(name) { const v = sheet_(name).getDataRange().getValues(); v.shift(); return v; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function clean_(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 200); }
function code_(s) { return clean_(s, 20).toUpperCase(); }
function norm_(s) { return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').replace(/[.!?,;:]+$/, '').trim(); }
function hash_(salt, pw) {
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + pw, Utilities.Charset.UTF_8);
  return b.map(function (x) { return ('0' + ((x + 256) % 256).toString(16)).slice(-2); }).join('');
}

/* ---------- run once ---------- */
function setup() {
  Object.keys(HEAD).forEach(sheet_);
  const st = sheet_(TAB.settings);
  if (st.getLastRow() < 2) {
    st.appendRow(['Teacher password', 'Not set yet. Use the menu: GED Academy > Set teacher password']);
    st.appendRow(['Note', 'The password is never stored in this Sheet or on the website. Only a scrambled code (a salted hash) is kept inside the script.']);
  }
  const s1 = ss_().getSheetByName('Sheet1'); if (s1 && s1.getLastRow() === 0 && ss_().getSheets().length > 1) ss_().deleteSheet(s1);
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('GED Academy').addItem('Set teacher password', 'setPassword').addToUi();
}
function setPassword() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Teacher password', 'Type a new password for the teacher portal (10 characters or more). Do not use a student access code.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const pw = r.getResponseText();
  if (pw.length < 10) { ui.alert('Too short. Use 10 characters or more.'); return; }
  savePassword_(pw);
  ui.alert('Saved. Use this password in the teacher portal.');
}
function savePassword_(pw) {
  const salt = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({ salt: salt, hash: hash_(salt, pw) });
  const st = sheet_(TAB.settings);
  if (st.getLastRow() >= 2) st.getRange(2, 2).setValue('Set on ' + new Date().toDateString() + '. To change it, use the menu again.');
}

/* ---------- the teacher password: checked here, never on the website ---------- */
function teacherOk_(pw) {
  const cache = CacheService.getScriptCache(), fails = Number(cache.get('fails') || 0);
  if (fails >= 5) return 'locked';                                   /* 5 wrong tries: wait 10 minutes */
  const p = PropertiesService.getScriptProperties(), salt = p.getProperty('salt'), hash = p.getProperty('hash');
  if (!salt || !hash) return 'nopassword';
  if (hash_(salt, String(pw || '')) === hash) return 'ok';
  cache.put('fails', String(fails + 1), 600);
  return 'wrong';
}

/* ---------- students ---------- */
function student_(code) {
  const v = rows_(TAB.students);
  for (let i = 0; i < v.length; i++) {
    if (code_(v[i][1]) === code && code) {
      if (/^(no|n|false|0)$/i.test(String(v[i][3]).trim())) return null;
      return { row: i + 2, name: clean_(v[i][0], 80), group: clean_(v[i][2], 60) };
    }
  }
  return null;
}

/* ---------- the website talks to this function ---------- */
function doGet() { return out_({ ok: true, service: 'The GED Academy grade book' }); }
function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad' }); }
  try {
    if (b.action === 'teacher') return out_(teacher_(b));
    if (b.action === 'keys') return out_(keys_(b));
    const code = code_(b.code), st = student_(code);
    if (!st) return out_({ ok: false, error: 'code' });
    const prog = SUBJECTS[b.program] ? b.program : '';
    if (!prog) return out_({ ok: false, error: 'program' });
    const name = st.name || clean_(b.name, 80), lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (b.action === 'login') return out_(login_(b, code, st, prog));
      if (b.action === 'progress') return out_(progress_(b, code, name, prog));
      if (b.action === 'workbook') return out_(workbook_(b, code, name, prog));
      if (b.action === 'quiz') return out_(quiz_(b, code, name, prog));
      if (b.action === 'mock') return out_(mock_(b, code, name, prog));
    } finally { lock.releaseLock(); }
    return out_({ ok: false, error: 'action' });
  } catch (err) { return out_({ ok: false, error: 'server', detail: String(err) }); }
}

function login_(b, code, st, prog) {
  const sh = sheet_(TAB.students);
  sh.getRange(st.row, 6, 1, 2).setValues([[clean_(b.name, 80), new Date()]]);
  let state = null;
  rows_(TAB.progress).forEach(function (r) { if (code_(r[0]) === code && r[2] === SUBJECTS[prog]) { try { state = JSON.parse(r[4]); } catch (e) {} } });
  return { ok: true, name: st.name || clean_(b.name, 80), state: state };
}
function progress_(b, code, name, prog) {
  const sh = sheet_(TAB.progress), v = rows_(TAB.progress), data = JSON.stringify(b.state || {}).slice(0, 45000);
  const row = [code, name, SUBJECTS[prog], Number(b.done) || 0, data, new Date()];
  for (let i = 0; i < v.length; i++) if (code_(v[i][0]) === code && v[i][2] === SUBJECTS[prog]) { sh.getRange(i + 2, 1, 1, row.length).setValues([row]); return { ok: true }; }
  sh.appendRow(row); return { ok: true };
}
function workbook_(b, code, name, prog) {
  sheet_(TAB.wb).appendRow([new Date(), code, name, SUBJECTS[prog], Number(b.session) || 0, Number(b.score) || 0, Number(b.total) || 0,
    clean_(JSON.stringify(b.levels || {}), 300), clean_((b.wrong || []).join(', '), 300)]);
  return { ok: true };
}

/* quiz and mock test answers are marked HERE, with the keys in the Quiz_Keys tab. The website never has the keys. */
function key_(id) {
  const v = rows_(TAB.keys);
  for (let i = 0; i < v.length; i++) if (String(v[i][0]) === id) { try { return JSON.parse(v[i][1]); } catch (e) { return null; } }
  return null;
}
function right_(key, ans) {
  if (Array.isArray(key)) {
    if (!Array.isArray(ans)) return key.map(norm_).indexOf(norm_(ans)) >= 0;      /* a list of accepted words */
    if (key.length !== ans.length) return false;
    for (let i = 0; i < key.length; i++) if (!right_(key[i], ans[i])) return false;
    return true;
  }
  if (ans === null || ans === undefined || Array.isArray(ans)) return false;
  return typeof key === 'number' ? Number(ans) === key && ans !== '' : norm_(key) === norm_(ans);
}
function quiz_(b, code, name, prog) {
  const n = Number(b.session) || 0, key = key_(prog + '-' + n), ans = Array.isArray(b.answers) ? b.answers : [];
  if (!key) return { ok: false, error: 'nokey' };
  let score = 0; key.forEach(function (k, i) { if (right_(k, ans[i])) score++; });
  let attempt = 1; rows_(TAB.quiz).forEach(function (r) { if (code_(r[1]) === code && r[3] === SUBJECTS[prog] && Number(r[4]) === n) attempt++; });
  sheet_(TAB.quiz).appendRow([new Date(), code, name, SUBJECTS[prog], n, score, key.length, attempt]);
  return { ok: true, score: score, total: key.length, attempt: attempt };
}
function mock_(b, code, name, prog) {
  const n = Number(b.session) || 0, key = key_(prog + '-mock-' + n), ans = Array.isArray(b.answers) ? b.answers : [], skills = Array.isArray(b.skills) ? b.skills : [];
  if (!key) return { ok: false, error: 'nokey' };
  let score = 0; const wrong = [], by = {};
  key.forEach(function (k, i) {
    const ok = right_(k, ans[i]), s = clean_(skills[i] || 'General', 40);
    by[s] = by[s] || [0, 0]; by[s][1]++; if (ok) { score++; by[s][0]++; } else wrong.push(i + 1);
  });
  sheet_(TAB.mock).appendRow([new Date(), code, name, SUBJECTS[prog], n, score, key.length, JSON.stringify(by), wrong.join(', '), Number(b.minutes) || '']);
  return { ok: true, score: score, total: key.length, bySkill: by, wrong: wrong };
}

/* ---------- teacher portal ---------- */
function teacher_(b) {
  const ok = teacherOk_(b.password); if (ok !== 'ok') return { ok: false, error: ok };
  const iso = function (d) { return d instanceof Date ? d.toISOString() : String(d); };
  return {
    ok: true,
    students: rows_(TAB.students).filter(function (r) { return r[1]; }).map(function (r) { return { name: r[0], code: code_(r[1]), group: r[2], active: !/^(no|n|false|0)$/i.test(String(r[3]).trim()), typed: r[5], last: r[6] ? iso(r[6]) : '' }; }),
    progress: rows_(TAB.progress).map(function (r) { let s = {}; try { s = JSON.parse(r[4]); } catch (e) {} return { code: code_(r[0]), subject: r[2], done: r[3], state: s, at: iso(r[5]) }; }),
    workbooks: rows_(TAB.wb).map(function (r) { return { at: iso(r[0]), code: code_(r[1]), subject: r[3], session: r[4], score: r[5], total: r[6], levels: r[7], wrong: r[8] }; }),
    quizzes: rows_(TAB.quiz).map(function (r) { return { at: iso(r[0]), code: code_(r[1]), subject: r[3], session: r[4], score: r[5], total: r[6], attempt: r[7] }; }),
    mocks: rows_(TAB.mock).map(function (r) { return { at: iso(r[0]), code: code_(r[1]), subject: r[3], session: r[4], score: r[5], total: r[6], bySkill: r[7], wrong: r[8], minutes: r[9] }; }),
    keys: rows_(TAB.keys).map(function (r) { return String(r[0]); })
  };
}
function keys_(b) {
  const ok = teacherOk_(b.password); if (ok !== 'ok') return { ok: false, error: ok };
  const sh = sheet_(TAB.keys), v = rows_(TAB.keys), keys = b.keys || {};
  let n = 0;
  Object.keys(keys).forEach(function (id) {
    if (!/^[a-z]+(-mock)?-\d+$/.test(id) || !Array.isArray(keys[id])) return;
    const val = JSON.stringify(keys[id]); let done = false;
    for (let i = 0; i < v.length; i++) if (String(v[i][0]) === id) { sh.getRange(i + 2, 2).setValue(val); done = true; }
    if (!done) { sh.appendRow([id, val]); v.push([id, val]); }
    n++;
  });
  return { ok: true, saved: n };
}
