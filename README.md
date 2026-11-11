# The GED Academy

**Elevate with Ms. Maria · Learnovate Qatar**

A learning website for GED® students. It is the sister site of *The English Academy*: the same colours, layout and tone. It is a static site (HTML, CSS, JavaScript, no build step) and is published with GitHub Pages.

> GED® is a registered trademark. This site is not affiliated with or endorsed by GED Testing Service.

| Subject | Status | Folder |
|---|---|---|
| Reasoning Through Language Arts (12 sessions) | **Open** | `rla/` |
| Social Studies (12 sessions) | **Open** (sessions are being added) | `social-studies/` |
| Science | Coming soon | – |
| Mathematical Reasoning | Coming soon | – |

## What each session has

0. **Slides** – one idea per slide in the site's own design, with arrows, swipe, keyboard and full screen (for class or self-study). Slides are written in `sessionNN.json` under `slides`, so they need no image files.
1. **Reviewer** – the full explanation, with weak and strong examples, "Remember this", "Common mistake" and a glossary.
2. **E-workbook** – easy → guided → application → challenge. After Submit, the student sees every answer with a short WHY, and a list of strong skills and skills to practise.
3. **Short quiz** – shows only the final score. No answer key and no review, because students can retry. The quiz is marked by the grade book, so the answers are never on the website.
4. **Checklist and badge.**

Question types: multiple choice, drag and drop (tap an item, then tap a box), drop-down, hot spot (select an area) and fill in the blank.

## Folder layout

```
index.html               homepage
manifest.webmanifest     installable app          sw.js   offline support
icons/                   logo and app icons
assets/
  academy.css            shared colours and components (same as The English Academy)
  i18n.js                menu languages: EN, AR, UR, BN, FIL, ML, SI, TA  (correct translations here)
  core.js                language menu, right-to-left, script fonts, Google Translate
  subjects.js            the four subject cards and their test facts
  hub.css, hub.js        the study hub, shared by every subject
rla/  and  social-studies/
  index.html             the subject hub
  config.js              settings; API = the grade book web address
  data.js                the syllabus; "ready" lists the sessions that are open
  sessionNN.json         all content of one session (the quiz has NO answers in this file)
teacher/index.html       teacher portal
gradebook/Code.gs        the script for the Google Sheet grade book
```

## Grade book (how student work reaches Ms. Maria)

Student progress, workbook results and quiz scores are sent automatically to a Google Sheet that only Ms. Maria can open. Set-up, once:

1. Create a new Google Sheet, for example `GED_Academy_Gradebook`.
2. In the Sheet: **Extensions > Apps Script**. Delete the sample code. Paste all of `gradebook/Code.gs`. Press **Save**.
3. In the toolbar, choose the function **setup** and press **Run**. Allow the permissions. The tabs are created.
4. Go back to the Sheet and reload the page. Use the new menu **GED Academy > Set teacher password** (10 characters or more).
5. In the **Students** tab, type each student: Name, Access code, Group. (Active = `no` blocks a student.)
6. In Apps Script: **Deploy > New deployment > Web app**. Execute as: **Me**. Who has access: **Anyone**. Press **Deploy**.
7. Copy the **Web app URL**. Put it in `rla/config.js` and `social-studies/config.js` (`API: "…"`).
8. Open the teacher portal, sign in, and press **Import quiz answer keys** to load `quiz-keys.json`.

Until step 7 is done, the site runs in **preview**: no sign-in, work is saved on the device only, and the short quiz is closed.

### What is private, and where it lives

| Item | Where it lives | In this public repository? |
|---|---|---|
| Teacher password | Only a salted hash, inside the Apps Script of the Google Sheet. Checked by the Sheet, never by the website. Five wrong tries lock the portal for 10 minutes. | No |
| Access codes, student names, groups | The Students tab of the Google Sheet | No |
| Quiz answer keys | The Quiz_Keys tab of the Google Sheet (imported from `quiz-keys.json`) | No |
| Workbook answer keys | In `sessionNN.json`, because students see them after Submit | Yes (by design) |
| Grade book web address | `config.js`. It does nothing without a valid access code or the teacher password. | Yes (safe) |

Never commit `quiz-keys.json`, the session source files with quiz answers, passwords, access codes or student names. The `private/` folder is ignored by git for this reason.

## Syllabus changes

The site follows Ms. Maria's two student syllabi. These corrections and additions were made (facts checked on ged.com; items marked *teaching judgment* go beyond what ged.com states):

**Both subjects**
- Sessions are labelled by session only. The "Completed" marks were removed, so the site can be reused.
- "Hot spot" is called "select an area" on ged.com. The site uses both names.

**RLA**
- S1: added the exact format (150 minutes, 3 sections, one 10-minute break, 45-minute essay), the passing score (145) and the four-step method.
- S2: added tone, text structure and literary texts (*teaching judgment*; the ged.com sample question is literary).
- S3: added counterclaims, assumptions and persuasive language (*teaching judgment*).
- S4: added types of evidence, common reasoning errors and comparing two texts by purpose, audience and form (*teaching judgment*).
- S5: added comma splices, coordination and subordination, parallel structure, modifiers, and how grammar is tested with drop-down items (*teaching judgment*).
- S6: added confused words, transition words and informal language (*teaching judgment*).
- S7: added the key point that the essay analyses the two arguments and does not ask for the student's own opinion (ged.com: "decide which argument has more convincing evidence"), and the scoring rubric.
- S8: added a step to the framework: show why the other argument is weaker.
- S9: added formal style, sentence variety and a proofreading checklist. S10: added a time plan and rubric self-scoring.
- S11: added practice with every question type.

**Social Studies**
- Title corrected from "Reasoning Through Social Studies" to the official name, **Social Studies**.
- S1: added the drop-down question type (missing from the list), the 70-minute length with no break, the on-screen calculator and the passing score.
- S2: added types of government, natural rights and consent of the governed, and amendments.
- S3: added how a bill becomes a law, judicial review and the Electoral College.
- S4: added the colonial period, westward expansion, the New Deal, the Cold War, women's suffrage and timelines.
- S5: added competition and monopoly, incentives, GDP, banks and interest, monetary policy and trade.
- S6: added map parts and map types, and how geography shapes life.
- S7: added fact, opinion and reasoned judgment, reliability, propaganda and political cartoons.
- S8: added correlation and causation, and comparing two sources.
- S9: added mean, median, mode, range and percent change with the calculator.
- (All Social Studies additions from S2 to S9 are *teaching judgment*.)

## Adding a session

1. Write the session source file with the quiz answers and keep it out of the repository (`private/source/…`).
2. Run `python3 private/split_quiz.py rla 2`. It writes the public `rla/session02.json` (no quiz answers) and adds the key to `private/quiz-keys.json`.
3. Add the session number to `ready` in `rla/data.js`, and change `CACHE` in `sw.js` (for example `ged-v2`).
4. Commit and push. Then import the new `quiz-keys.json` in the teacher portal.

All passages and questions are original. Nothing is copied from GED Testing Service or any published book.
