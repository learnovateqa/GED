/* ===== The GED Academy · study hub =====
   One copy of this file runs every subject. The subject's own folder holds:
   config.js (settings), data.js (syllabus) and sessionNN.json (the content of each session). */
(function () {
  const { esc, t, store, toast } = GED, $ = s => document.querySelector(s), main = $("#main");
  const two = n => String(n).padStart(2, "0");
  const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  const norm = s => String(s == null ? "" : s).toLowerCase().replace(/[\s ]+/g, " ").replace(/[.!?,;:]+$/, "").trim();
  const LEVELS = [["easy", "Easy", "green"], ["guided", "Guided", "blue"], ["application", "Application", "peach"], ["challenge", "Challenge", "lav"]];
  const TYPE = { mc: "Multiple choice", dropdown: "Drop-down", fill: "Fill in the blank", drag: "Drag and drop", hotspot: "Hot spot (select an area)" };
  const LESSON = {};

  /* ---------- who is signed in, and their saved work ---------- */
  const API = {
    on: () => /^https:\/\/script\.google\.com\//.test(CFG.API || "") || /^http:\/\/localhost/.test(CFG.API || ""),
    async post(body) { const r = await fetch(CFG.API, { method: "POST", body: JSON.stringify(Object.assign({ program: CFG.ID }, body)) }); return r.json(); }
  };
  let auth = store.get("auth", null);                       /* { code, name } — one sign-in for every subject */
  const who = () => (auth ? auth.code : "guest");
  const K = k => CFG.ID + ":" + who() + ":" + k;
  let state = store.get(K("state"), { s: {} });
  const ss = n => (state.s[n] = state.s[n] || {});
  const partsDone = n => { const x = state.s[n] || {}; return { slides: !!x.sl, reviewer: !!x.rev, workbook: !!x.wb, quiz: !!(x.quiz && x.quiz.length), checklist: !!x.badge }; };
  const doneCount = () => Object.keys(state.s).filter(n => state.s[n].badge).length;

  /* Everything a student does is sent to Ms. Maria's grade book without a button.
     If the phone is offline, the message waits in a queue and goes when the internet is back. */
  function send(msg) {
    if (!API.on() || !auth) return;
    const box = store.get("outbox", []); box.push(Object.assign({ program: CFG.ID, code: auth.code, name: auth.name, at: new Date().toISOString() }, msg));
    store.set("outbox", box); flush();
  }
  let busy = false;
  async function flush() {
    if (busy || !API.on()) return; busy = true;
    try {
      let box = store.get("outbox", []);
      while (box.length) { const r = await API.post(box[0]); if (!r || !r.ok) { if (r && r.error === "code") { box.shift(); store.set("outbox", box); continue; } break; } box = store.get("outbox", []); box.shift(); store.set("outbox", box); }
    } catch (e) { /* offline: try again later */ }
    busy = false;
  }
  window.addEventListener("online", flush);
  let saveT;
  function save() {
    store.set(K("state"), state);
    clearTimeout(saveT); saveT = setTimeout(() => send({ action: "progress", done: doneCount(), state }), 1200);
  }

  /* ---------- sign in ---------- */
  function gate(msg) {
    main.innerHTML = `<div class="card t-rose" style="background:var(--c);max-width:480px;margin:6vh auto">
      <p class="eyebrow">🔑 ${esc(t("code_required"))}</p><h1 style="font-size:1.5rem">${esc(CFG.COURSE)}</h1>
      <p>Type the access code from Ms. Maria and your name.</p>
      <form id="gate" autocomplete="off">
        <label class="field"><span>Access code</span><input class="en" name="code" required autocapitalize="characters" inputmode="text" maxlength="12"></label>
        <label class="field"><span>Your full name</span><input class="en" name="name" required maxlength="60" autocomplete="name"></label>
        <p class="err" id="gerr" role="alert">${esc(msg || "")}</p>
        <button class="btn primary" style="width:100%" type="submit">${esc(t("sign_in"))}</button>
      </form>
      <p class="small muted" style="margin-top:12px">No code? <a href="mailto:${esc(CFG.EMAIL)}?subject=${encodeURIComponent("Access code for The GED Academy")}">${esc(t("contact"))}</a></p></div>`;
    $("#gate").onsubmit = async e => {
      e.preventDefault();
      const f = e.target, code = f.code.value.trim().toUpperCase(), name = f.name.value.trim().replace(/\s+/g, " "), btn = f.querySelector("button");
      btn.disabled = true; btn.innerHTML = `<span class="wait">Checking…</span>`;
      try {
        const r = await API.post({ action: "login", code, name });
        if (!r.ok) { $("#gerr").textContent = r.error === "code" ? "This code is not correct. Check it and try again." : "Something went wrong. Please try again."; btn.disabled = false; btn.textContent = t("sign_in"); return; }
        auth = { code, name: r.name || name }; store.set("auth", auth);
        const mine = store.get(K("state"), null);
        state = mergeState(mine, r.state); store.set(K("state"), state);
        signBtn(); route();
      } catch (err) { $("#gerr").textContent = "No internet, or the grade book did not answer. Please try again."; btn.disabled = false; btn.textContent = t("sign_in"); }
    };
  }
  /* keep the most complete record of each session (this phone and the grade book) */
  function mergeState(a, b) {
    a = a && a.s ? a : { s: {} }; b = b && b.s ? b : { s: {} };
    const out = { s: {} };
    new Set([...Object.keys(a.s), ...Object.keys(b.s)]).forEach(n => {
      const x = a.s[n] || {}, y = b.s[n] || {};
      out.s[n] = { rev: x.rev || y.rev, wb: (x.wb && y.wb ? (x.wb.at > y.wb.at ? x.wb : y.wb) : x.wb || y.wb), quiz: (x.quiz || []).length >= (y.quiz || []).length ? x.quiz : y.quiz, check: x.check || y.check, badge: x.badge || y.badge };
    });
    return out;
  }
  function signBtn() {
    const b = $("#signBtn"); if (!b) return;
    b.hidden = !API.on(); if (!API.on()) return;
    b.textContent = auth ? "👤 " + auth.name.split(" ")[0] : "🔑 " + t("sign_in");
    b.onclick = () => {
      if (!auth) return gate();
      if (confirm("Sign out " + auth.name + "?")) { auth = null; store.del("auth"); state = { s: {} }; signBtn(); route(); }
    };
  }

  /* ---------- session content ---------- */
  const ready = n => (COURSE.ready || []).includes(n);
  async function lesson(n) {
    if (LESSON[n]) return LESSON[n];
    const r = await fetch("session" + two(n) + ".json", { cache: "no-cache" }); if (!r.ok) throw new Error("missing");
    const L = await r.json(); linkPassages(L.workbook); linkPassages(L.quiz);
    return (LESSON[n] = L);
  }
  const sess = n => COURSE.sessions.find(s => s.n === n);
  /* Canva slides: canva.json in the subject folder holds one Canva "view" link per session, e.g. { "1": "https://www.canva.com/design/…/view" }.
     When a session has a link, the viewer shows the Canva deck, so edits made in Canva appear on the site at once. */
  const CANVA = {};
  const canvaReady = fetch("canva.json", { cache: "no-cache" }).then(r => (r.ok ? r.json() : {})).then(j => Object.assign(CANVA, j)).catch(() => {});
  const canvaFor = n => { const m = String(CANVA[n] || "").match(/^https:\/\/(?:www\.)?canva\.com\/design\/([A-Za-z0-9_-]+)(?:\/([A-Za-z0-9_-]+))?/); return m ? `https://www.canva.com/design/${m[1]}/${m[2] && !/^(view|edit|watch)$/.test(m[2]) ? m[2] + "/" : ""}view` : ""; };
  /* a question marked "again" shows the passage of the question before it in a fold */
  const linkPassages = items => { let last = ""; items.forEach(it => { if (it.passage) last = it.passage; else if (it.again) it._prev = last; }); return items; };

  /* ====================== QUESTION TYPES ======================
     mc · dropdown · fill · drag (tap an item, then tap a box) · hotspot (tap the right sentence) */
  function qHTML(it, i, total, pre) {
    const id = pre + i;
    let body = "";
    if (it.type === "mc") {
      const order = it._order || it.options.map((_, k) => k);
      body = `<div role="radiogroup" aria-label="Answers">${order.map(k => `<label class="opt en"><input type="radio" name="${id}" value="${k}"><span>${fmt(it.options[k])}</span></label>`).join("")}</div>`;
    } else if (it.type === "dropdown" || it.type === "fill") {
      body = `<p class="cloze en">${fmt(it.text).replace(/\{(\d+)\}/g, (_, j) => it.type === "dropdown"
        ? `<select data-b="${j}" aria-label="Choose for blank ${+j + 1}"><option value="">Choose…</option>${it.blanks[j].options.map((o, k) => `<option value="${k}">${esc(o)}</option>`).join("")}</select>`
        : `<input data-b="${j}" type="text" aria-label="Type the answer for blank ${+j + 1}" autocomplete="off" autocapitalize="off" spellcheck="false">`)}</p>`;
    } else if (it.type === "drag") {
      body = `<p class="hint">Tap an item. Then tap the box where it belongs. Tap an item in a box to move it again.</p>
        <div class="pool en" data-pool>${it.items.map((x, k) => `<button type="button" class="chipb" data-k="${k}" aria-pressed="false">${fmt(x)}</button>`).join("")}</div>
        <div class="bins en">${it.targets.map((x, k) => `<div class="bin" data-bin="${k}" role="button" tabindex="0"><b>${fmt(x)}</b><div class="in"></div></div>`).join("")}</div>`;
    } else if (it.type === "hotspot") {
      body = `<p class="hint">Tap the part of the text that answers the question.</p>
        <p class="hot en">${it.sentences.map((x, k) => `<button type="button" data-k="${k}" aria-pressed="false">${fmt(x)}</button>`).join(" ")}</p>`;
    }
    return `<div class="q" id="${id}" data-i="${i}" data-type="${it.type}">
      <p class="meta"><span>Question ${i + 1} of ${total}</span><span>·</span><span>${TYPE[it.type]}</span></p>
      ${it.again && it._prev ? `<details class="again"><summary>Show the passage again</summary><div class="pass en">${it._prev.split("\n\n").map(p => `<p>${fmt(p)}</p>`).join("")}</div></details>` : ""}
      ${it.passage ? `<div class="pass en">${it.ptitle ? `<b class="ti">${esc(it.ptitle)}</b>` : ""}${it.passage.split("\n\n").map(p => `<p>${fmt(p)}</p>`).join("")}</div>` : ""}
      ${it.q ? `<p class="stem en">${fmt(it.q)}</p>` : ""}${body}<div data-fb></div></div>`;
  }
  /* make the tap-based items work */
  function wire(root, onChange) {
    root.querySelectorAll('.q[data-type="drag"]').forEach(q => {
      const pick = c => q.querySelectorAll(".chipb").forEach(x => x.setAttribute("aria-pressed", x === c && c.getAttribute("aria-pressed") !== "true"));
      q.addEventListener("click", e => {
        if (q.classList.contains("locked")) return;
        const chip = e.target.closest(".chipb"), bin = e.target.closest("[data-bin]"), pool = e.target.closest("[data-pool]"), sel = q.querySelector('.chipb[aria-pressed="true"]');
        if (chip) { pick(chip); return; }
        if (sel && (bin || pool)) { (bin ? bin.querySelector(".in") : pool).appendChild(sel); sel.setAttribute("aria-pressed", "false"); onChange && onChange(); }
      });
      q.querySelectorAll("[data-bin]").forEach(b => b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); b.click(); } }));
    });
    root.querySelectorAll('.q[data-type="hotspot"]').forEach(q => q.addEventListener("click", e => {
      const b = e.target.closest(".hot button"); if (!b || q.classList.contains("locked")) return;
      q.querySelectorAll(".hot button").forEach(x => x.setAttribute("aria-pressed", x === b)); onChange && onChange();
    }));
    root.addEventListener("change", () => onChange && onChange());
    root.addEventListener("input", e => { if (e.target.matches("input[type=text]")) onChange && onChange(); });
  }
  /* read one answer from the page:  mc/hotspot → number · dropdown/drag → numbers · fill → words */
  function read(q, it) {
    if (it.type === "mc") { const r = q.querySelector("input:checked"); return r ? +r.value : null; }
    if (it.type === "hotspot") { const b = q.querySelector('.hot button[aria-pressed="true"]'); return b ? +b.dataset.k : null; }
    if (it.type === "dropdown") return [...q.querySelectorAll("select")].map(s => (s.value === "" ? null : +s.value));
    if (it.type === "fill") return [...q.querySelectorAll("input[data-b]")].map(x => x.value.trim());
    if (it.type === "drag") return it.items.map((_, k) => { const c = q.querySelector(`.chipb[data-k="${k}"]`), b = c.closest("[data-bin]"); return b ? +b.dataset.bin : null; });
  }
  function write(q, it, a) {
    if (a == null) return;
    if (it.type === "mc") { const r = q.querySelector(`input[value="${a}"]`); if (r) r.checked = true; }
    if (it.type === "hotspot") q.querySelectorAll(".hot button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.k === a));
    if (it.type === "dropdown") q.querySelectorAll("select").forEach((s, j) => { if (a[j] != null) s.value = a[j]; });
    if (it.type === "fill") q.querySelectorAll("input[data-b]").forEach((x, j) => { x.value = a[j] || ""; });
    if (it.type === "drag") a.forEach((b, k) => { if (b != null) q.querySelector(`[data-bin="${b}"] .in`).appendChild(q.querySelector(`.chipb[data-k="${k}"]`)); });
  }
  const answered = (it, a) => a != null && (!Array.isArray(a) || a.every(x => x != null && x !== ""));
  function correct(it, a) {
    if (a == null) return false;
    if (it.type === "mc" || it.type === "hotspot") return a === it.answer;
    if (it.type === "dropdown") return it.blanks.every((b, j) => a[j] === b.answer);
    if (it.type === "fill") return it.blanks.every((b, j) => b.accept.map(norm).includes(norm(a[j])));
    if (it.type === "drag") return it.answer.every((x, j) => a[j] === x);
  }
  function keyText(it) {
    if (it.type === "mc") return it.options[it.answer];
    if (it.type === "hotspot") return it.sentences[it.answer];
    if (it.type === "dropdown") return it.blanks.map(b => b.options[b.answer]).join(" · ");
    if (it.type === "fill") return it.blanks.map(b => b.accept[0]).join(" · ");
    if (it.type === "drag") return it.targets.map((x, k) => x + ": " + it.items.filter((_, j) => it.answer[j] === k).join(", ")).join("\n");
  }
  /* after Submit: lock the question, mark it with a tick or cross (never colour alone), show the answer and WHY */
  function reveal(q, it, a) {
    const ok = correct(it, a), M = (good, txt) => `<span class="mark ${good ? "ok" : "bad"}" aria-hidden="true">${good ? "✓" : "✗"}</span><span class="sr">${good ? "Correct" : "Wrong"}${txt ? ": " + txt : ""}</span>`;
    q.classList.add("locked");
    q.querySelectorAll("input,select").forEach(x => { x.disabled = true; });
    if (it.type === "mc") q.querySelectorAll(".opt").forEach(l => {
      const k = +l.querySelector("input").value;
      if (k === it.answer) { l.classList.add("is-ok"); l.insertAdjacentHTML("beforeend", `<span class="tagr">${M(true)} Correct answer</span>`); }
      else if (k === a) { l.classList.add("is-bad"); l.insertAdjacentHTML("beforeend", `<span class="tagr">${M(false)} Your answer</span>`); }
    });
    if (it.type === "hotspot") q.querySelectorAll(".hot button").forEach(b => { const k = +b.dataset.k; if (k === it.answer) { b.classList.add("is-ok"); b.insertAdjacentHTML("beforeend", " ✓"); } else if (k === a) { b.classList.add("is-bad"); b.insertAdjacentHTML("beforeend", " ✗"); } });
    if (it.type === "dropdown") q.querySelectorAll("select").forEach((s, j) => { const g = a && a[j] === it.blanks[j].answer; s.classList.add(g ? "is-ok" : "is-bad"); s.insertAdjacentHTML("afterend", " " + M(g) + " "); });
    if (it.type === "fill") q.querySelectorAll("input[data-b]").forEach((x, j) => { const g = it.blanks[j].accept.map(norm).includes(norm(a && a[j])); x.classList.add(g ? "is-ok" : "is-bad"); x.insertAdjacentHTML("afterend", " " + M(g) + " "); });
    if (it.type === "drag") q.querySelectorAll(".chipb").forEach(c => { const k = +c.dataset.k, g = a && a[k] === it.answer[k]; c.classList.add(g ? "is-ok" : "is-bad"); c.insertAdjacentHTML("beforeend", g ? " ✓" : " ✗"); c.disabled = true; });
    q.querySelector("[data-fb]").innerHTML = `<div class="why ${ok ? "" : "bad"}"><b class="ans">${M(ok)} ${ok ? "Correct." : answered(it, a) ? "Not correct." : "No answer."}</b>
      ${ok && it.type === "mc" ? "" : `<span class="ans en"><b>Answer:</b> ${fmt(keyText(it))}</span>`}<span><b>Why:</b> ${fmt(it.why || "")}</span></div>`;
    return ok;
  }

  /* ====================== PAGES ====================== */
  const tone = n => ["blue", "green", "peach", "lav", "rose", "gold"][(n - 1) % 6];
  function sessionRow(s) {
    const d = partsDone(s.n), open = ready(s.n), n = [d.reviewer, d.workbook, d.quiz, d.checklist].filter(Boolean).length;
    const st = !open ? "⏳ Opens soon" : d.checklist ? "🏅 Done" : n ? `${n} of 4 parts` : "Start →";
    const inner = `<span class="n t-${tone(s.n)}" style="background:var(--c);border-color:var(--b)">${s.n}</span><span class="tx"><b>${esc(s.title)}</b><small>${esc(s.sub || "")}</small></span><span class="st">${st}</span>`;
    return open ? `<a class="srow" href="#/session/${s.n}">${inner}</a>` : `<div class="srow off">${inner}</div>`;
  }
  function sessionList() {
    return COURSE.phases.map(p => `<p class="phase">${esc(p.name)}</p><div class="slist">${COURSE.sessions.filter(s => p.sessions.includes(s.n)).map(sessionRow).join("")}</div>`).join("");
  }
  const preview = () => API.on() ? "" : `<div class="banner">👀 <b>Preview.</b> The grade book is not connected yet. Your work is saved on this device only, and the short quiz cannot be marked.</div>`;

  function pageHome() {
    const done = doneCount(), next = COURSE.sessions.find(s => ready(s.n) && !partsDone(s.n).checklist) || COURSE.sessions[0];
    main.innerHTML = `${preview()}
      <p class="eyebrow">The GED Academy</p><h1>${esc(CFG.COURSE)}</h1>
      <p>${auth ? `Welcome, <b class="en">${esc(auth.name)}</b>. ` : ""}${esc(COURSE.tagline)}</p>
      <div class="card t-rose" style="background:var(--c);display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:14px 0">
        <div class="ring" style="--p:${Math.round(done / CFG.SESSIONS * 100)}"><div><b>${done}/${CFG.SESSIONS}</b><small>SESSIONS</small></div></div>
        <div style="flex:1;min-width:200px"><h3 style="margin:0">${done ? "Keep going" : "Start here"}</h3><p style="margin:4px 0 10px">Session ${next.n}: ${esc(next.title)}</p>
        <a class="btn primary" href="#/session/${next.n}">${done || partsDone(next.n).reviewer ? "Continue" : "Start"} Session ${next.n} <span aria-hidden="true">→</span></a></div>
      </div>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${COURSE.facts.map((f, i) => `<div class="pillar t-${tone(i + 1)}"><small>${esc(f[0])}</small><b>${esc(f[1])}</b><br><span class="small">${esc(f[2])}</span></div>`).join("")}</div>
      <p class="small muted" style="margin-top:6px">Test facts are from ged.com.</p>
      <div class="sh"><span class="no">12</span><h2>${esc(t("sessions"))}</h2></div>${sessionList()}`;
  }
  function pageSessions() { main.innerHTML = `${preview()}<h1>${esc(t("sessions"))}</h1><p>Each session has slides, a reviewer, a workbook, a quiz and a checklist.</p>${sessionList()}`; }

  function stepsBar(n, cur) {
    const d = partsDone(n), P = [...(LESSON[n] && (LESSON[n].slides || canvaFor(n)) ? [["slides", "🖥️", t("slides")]] : []), ["reviewer", "📖", t("reviewer")], ["workbook", "✏️", t("workbook")], ["quiz", "📝", t("quiz")], ["checklist", "🏅", t("checklist")]];
    return `<nav class="steps" aria-label="Parts of this session">${P.map(p => `<a href="#/session/${n}/${p[0]}" class="${d[p[0]] ? "done" : ""}" ${p[0] === cur ? 'aria-current="step"' : ""}><i aria-hidden="true">${d[p[0]] && p[0] !== cur ? "✓" : p[1]}</i>${esc(p[2])}${d[p[0]] ? '<span class="sr"> (done)</span>' : ""}</a>`).join("")}</nav>`;
  }
  function head(L, s) {
    return `<p class="eyebrow">${esc(CFG.COURSE)}</p><h1>Session ${L.n}: ${esc(L.title)}</h1>
      <p class="row" style="gap:6px"><span class="chip">⏱ About ${L.minutes} minutes</span><span class="chip">Session ${L.n} of ${CFG.SESSIONS}</span></p>`;
  }

  /* ---------- Slides: one idea per slide, in the same design as the site. Arrows, swipe, keyboard, full screen. ---------- */
  function pageSlides(L) {
    const cv = canvaFor(L.n);
    if (cv) {
      main.innerHTML = `${head(L)}${stepsBar(L.n, "slides")}
        <div class="cframe"><iframe src="${esc(cv)}?embed" title="Session ${L.n} slides" loading="lazy" allow="fullscreen" allowfullscreen></iframe></div>
        <div class="row" style="margin-top:10px"><a class="btn sm" href="${esc(cv)}" target="_blank" rel="noopener">Open the slides in a new tab</a><span class="small muted">Press ⛶ on the slides for full screen.</span></div>
        <a class="btn primary" style="width:100%;margin-top:12px" href="#/session/${L.n}/reviewer" id="cvDone">Go to the reviewer <span aria-hidden="true">→</span></a>`;
      $("#cvDone").onclick = () => { if (!ss(L.n).sl) { ss(L.n).sl = true; save(); } };
      return;
    }
    const n = L.n, S = L.slides; let i = Math.min(store.get(K("sl" + n), 0), S.length - 1);
    main.innerHTML = `${head(L)}${stepsBar(n, "slides")}
      <div class="deck" id="deck" tabindex="0" aria-roledescription="slide viewer" aria-label="Slides for Session ${n}">
        <div class="slide" id="slide" aria-live="polite"></div>
        <div class="dbar"><button class="iconbtn" type="button" id="dPrev" aria-label="Previous slide">←</button>
          <span class="dcount" id="dCount"></span><div class="bar" style="flex:1"><i id="dBar"></i></div>
          <button class="iconbtn" type="button" id="dFull" aria-label="Full screen" aria-pressed="false">⛶</button>
          <button class="iconbtn dnext" type="button" id="dNext" aria-label="Next slide">→</button></div>
      </div>
      <p class="small muted" style="margin-top:8px">Swipe, or use the arrows. ⛶ opens the slides on the full screen.</p>
      <a class="btn primary" style="width:100%;margin-top:6px" href="#/session/${n}/reviewer">Go to the reviewer <span aria-hidden="true">→</span></a>`;
    const deck = $("#deck"), el = $("#slide");
    const show = k => {
      i = Math.max(0, Math.min(S.length - 1, k)); const sl = S[i]; store.set(K("sl" + n), i);
      el.className = "slide" + (sl.kind ? " s-" + sl.kind : "");
      el.innerHTML = sl.kind === "title"
        ? `<img src="../icons/academy.svg" alt="" class="slogo"><p class="eyebrow">${esc(CFG.COURSE)} · Session ${n}</p><h2>${fmt(sl.h)}</h2>${sl.sub ? `<p class="ssub">${fmt(sl.sub)}</p>` : ""}<p class="sby">The GED Academy · Ms. Maria</p>`
        : `<p class="eyebrow">Session ${n} · ${esc(L.title)}</p><h2>${fmt(sl.h)}</h2><div class="sbody rev">${(sl.blocks || []).map(block).join("")}</div>`;
      el.scrollTop = 0; GED.apply(el);
      $("#dCount").textContent = (i + 1) + " / " + S.length; $("#dBar").style.setProperty("--w", ((i + 1) / S.length * 100) + "%"); $("#dBar").style.width = ((i + 1) / S.length * 100) + "%";
      $("#dPrev").disabled = i === 0; $("#dNext").disabled = i === S.length - 1;
      if (i === S.length - 1 && !ss(n).sl) { ss(n).sl = true; save(); }
    };
    $("#dPrev").onclick = () => show(i - 1); $("#dNext").onclick = () => show(i + 1);
    deck.onkeydown = e => { if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); show(i + 1); } if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); show(i - 1); } if (e.key === "Escape") full(false); };
    let x0 = null, y0 = 0;
    el.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(i + (dx < 0 ? 1 : -1)); }, { passive: true });
    const full = on => {
      deck.classList.toggle("fs", on); document.body.classList.toggle("nofs-scroll", on); $("#dFull").setAttribute("aria-pressed", on); $("#dFull").textContent = on ? "✕" : "⛶";
      try { if (on && deck.requestFullscreen) deck.requestFullscreen().catch(() => {}); else if (!on && document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
      if (on) deck.focus();
    };
    $("#dFull").onclick = () => full(!deck.classList.contains("fs"));
    document.onfullscreenchange = () => { if (!document.fullscreenElement && deck.classList.contains("fs")) full(false); };
    show(i);
  }

  /* ---------- 1 · Reviewer ---------- */
  function block(b) {
    if (b.p) return `<p>${fmt(b.p)}</p>`;
    if (b.list) return `<ul>${b.list.map(x => `<li>${fmt(x)}</li>`).join("")}</ul>`;
    if (b.steps) return `<ol>${b.steps.map(x => `<li>${fmt(x)}</li>`).join("")}</ol>`;
    if (b.flow) return `<div class="flow en">${b.flow.map(x => `<span>${esc(x)}</span>`).join('<i aria-hidden="true">→</i>')}</div>`;
    if (b.passage) return `<div class="pass en">${b.title ? `<b class="ti">${esc(b.title)}</b>` : ""}${b.passage.split("\n\n").map(p => `<p>${fmt(p)}</p>`).join("")}</div>`;
    if (b.question) return `<p class="en"><b>Question:</b> ${fmt(b.question)}</p>`;
    if (b.weak) return `<div class="box weak"><span class="lab">✗ Weak ${esc(b.label || "answer")}</span><span class="en">${fmt(b.weak)}</span>${b.note ? `<span class="note">${fmt(b.note)}</span>` : ""}</div>`;
    if (b.strong) return `<div class="box strong"><span class="lab">✓ Strong ${esc(b.label || "answer")}</span><span class="en">${fmt(b.strong)}</span>${b.note ? `<span class="note">${fmt(b.note)}</span>` : ""}</div>`;
    if (b.remember) return `<div class="box t-gold"><span class="lab">⭐ Remember this</span>${fmt(b.remember)}</div>`;
    if (b.mistake) return `<div class="box t-peach"><span class="lab">⚠️ Common mistake</span>${fmt(b.mistake)}</div>`;
    if (b.tip) return `<div class="box t-blue"><span class="lab">💡 Tip</span>${fmt(b.tip)}</div>`;
    if (b.table) return `<div class="scroll"><table class="tbl"><thead><tr>${b.table.head.map(h => `<th>${fmt(h)}</th>`).join("")}</tr></thead><tbody>${b.table.rows.map(r => `<tr>${r.map(c => `<td>${fmt(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    return "";
  }
  function pageReviewer(L) {
    main.innerHTML = `${head(L)}${stepsBar(L.n, "reviewer")}<div class="rev">
      <div class="box t-blue"><span class="lab">🎯 In this session</span>${fmt(L.intro)}</div>
      ${L.reviewer.map((sec, i) => `<section><h3>${i + 1}. ${esc(sec.h)}</h3>${sec.blocks.map(block).join("")}</section>`).join("")}
      <section><h3>Glossary</h3><div class="box t-lav"><span class="lab">📚 Words to know</span><dl class="gl">${L.glossary.map(g => `<dt class="en">${esc(g[0])}</dt><dd>${fmt(g[1])}</dd>`).join("")}</dl></div></section>
      <a class="btn primary" style="width:100%;margin-top:14px" href="#/session/${L.n}/workbook" id="revDone">I have read this. Go to the workbook <span aria-hidden="true">→</span></a></div>`;
    $("#revDone").onclick = () => { if (!ss(L.n).rev) { ss(L.n).rev = true; save(); } };
  }

  /* ---------- 2 · E-workbook: easy → guided → application → challenge; the key and WHY appear after Submit ---------- */
  function pageWorkbook(L) {
    const items = L.workbook, n = L.n, res = ss(n).wb, last = store.get(K("wbA" + n), null);
    const review = !!(res && last);
    let draft = review ? last : store.get(K("wbD" + n), {});
    let h = "", lv = "";
    items.forEach((it, i) => {
      if (it.level !== lv) { lv = it.level; const m = LEVELS.find(x => x[0] === lv); h += `<div class="lvlh" id="lv-${lv}"><span class="chip t-${m[2]}">${m[1]}</span><h3>${esc({ easy: "Warm up", guided: "Guided practice", application: "Apply it", challenge: "GED-level challenge" }[lv])}</h3></div>`; }
      h += qHTML(it, i, items.length, "w");
    });
    main.innerHTML = `${head(L)}${stepsBar(n, "workbook")}
      <p>Answer all ${items.length} questions. They start easy and get harder. When you submit, you see each answer and <b>why</b>.</p>
      <nav class="lvl" aria-label="Levels">${LEVELS.map(m => `<a href="#/session/${n}/workbook" data-lv="${m[0]}">${m[1]}</a>`).join("")}</nav>
      <div id="wbTop"></div><form id="wb">${h}</form>
      <div id="wbEnd"></div>`;
    main.querySelectorAll("[data-lv]").forEach(a => a.onclick = e => { e.preventDefault(); const el = $("#lv-" + a.dataset.lv); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
    const form = $("#wb"), Q = i => $("#w" + i);
    items.forEach((it, i) => write(Q(i), it, draft[i]));
    const collect = () => { const a = {}; items.forEach((it, i) => { a[i] = read(Q(i), it); }); return a; };
    function summary(r) {
      const lvl = LEVELS.map(m => { const xs = items.map((it, i) => [it, i]).filter(x => x[0].level === m[0]); return [m[1], xs.filter(x => r.ok[x[1]]).length, xs.length]; });
      const sk = {}; items.forEach((it, i) => { const k = it.skill || "General"; sk[k] = sk[k] || [0, 0]; sk[k][1]++; if (r.ok[i]) sk[k][0]++; });
      const strong = Object.keys(sk).filter(k => sk[k][0] / sk[k][1] >= 0.75), weak = Object.keys(sk).filter(k => sk[k][0] / sk[k][1] < 0.75);
      return `<div class="score" role="status"><p class="eyebrow">${esc(CFG.SHORT)} · Session ${n} · Workbook</p><span class="big">${r.score} / ${r.total}</span>
        <div class="bylvl">${lvl.map(x => `<div>${x[0]}<b>${x[1]} / ${x[2]}</b></div>`).join("")}</div>
        <div style="text-align:start">${strong.length ? `<p><b>✓ Your strong skills:</b> ${esc(strong.join(", "))}</p>` : ""}${weak.length ? `<p><b>➜ Skills to practise:</b> ${esc(weak.map(k => `${k} (${sk[k][0]}/${sk[k][1]})`).join(", "))}</p>` : ""}</div>
        <p class="small muted" style="margin:0">${API.on() ? "✓ Saved. Ms. Maria can see your workbook result. You do not need to send it." : "Saved on this device."}</p></div>`;
    }
    function showKey(a, r) {
      items.forEach((it, i) => reveal(Q(i), it, a[i]));
      $("#wbTop").innerHTML = summary(r);
      $("#wbEnd").innerHTML = `<div class="row" style="margin-top:14px"><button class="btn soft" type="button" id="wbAgain">Try the workbook again</button><a class="btn primary" href="#/session/${n}/quiz" style="flex:1">Go to the quiz <span aria-hidden="true">→</span></a></div>`;
      $("#wbAgain").onclick = () => { store.del(K("wbA" + n)); store.del(K("wbD" + n)); pageWorkbook(L); window.scrollTo(0, 0); };
    }
    if (review) { showKey(last, res); return; }
    if (res) $("#wbTop").innerHTML = `<div class="box t-blue">Your last workbook score: <b>${res.score} / ${res.total}</b>. You can do the workbook again here.</div>`;
    wire(form, () => store.set(K("wbD" + n), collect()));
    $("#wbEnd").innerHTML = `<p class="err" id="wbErr" role="alert"></p><button class="btn primary" style="width:100%" type="button" id="wbGo">Submit my workbook</button>`;
    $("#wbGo").onclick = () => {
      const a = collect(), miss = items.map((it, i) => i).filter(i => !answered(items[i], a[i]));
      if (miss.length && !$("#wbGo").dataset.sure) {
        $("#wbErr").textContent = `You have ${miss.length} question${miss.length > 1 ? "s" : ""} with no answer: ${miss.map(i => i + 1).join(", ")}. Answer them, or press Submit again to finish.`;
        $("#wbGo").dataset.sure = 1; Q(miss[0]).scrollIntoView({ behavior: "smooth", block: "center" }); return;
      }
      const ok = items.map((it, i) => correct(it, a[i]));
      const r = { score: ok.filter(Boolean).length, total: items.length, ok, at: new Date().toISOString() };
      const levels = {}; LEVELS.forEach(m => { const xs = items.map((it, i) => i).filter(i => items[i].level === m[0]); levels[m[0]] = xs.filter(i => ok[i]).length + "/" + xs.length; });
      store.set(K("wbA" + n), a); store.del(K("wbD" + n));
      ss(n).wb = r; ss(n).rev = true; save();
      send({ action: "workbook", session: n, score: r.score, total: r.total, levels, wrong: ok.map((x, i) => x ? 0 : i + 1).filter(Boolean) });
      showKey(a, r); window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  /* ---------- 3 · Short quiz: only the final score. No key, no review. Marked by the grade book. ---------- */
  function scoreCard(n, q, i) {
    const d = new Date(q.at);
    return `<div class="score" role="status"><p class="eyebrow">${esc(CFG.SHORT)} · Session ${n} · Short quiz</p><span class="big">${q.score} / ${q.total}</span>
      <p style="margin:6px 0 0"><b class="en">${esc(auth ? auth.name : "")}</b><br><span class="small">Attempt ${i} · ${esc(d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }))}, ${esc(d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }))}</span></p></div>
      <div class="box t-rose">📸 <b>Take a screenshot of your score and send it to Ms. Maria.</b><br>The quiz does not show the answers, because you can try again.</div>`;
  }
  function pageQuiz(L, fresh) {
    const n = L.n, tries = ss(n).quiz || [], top = `${head(L)}${stepsBar(n, "quiz")}`;
    if (!API.on() || !auth) {
      main.innerHTML = `${top}<div class="box t-gold"><b>The short quiz is not open yet.</b><br>The quiz is marked by Ms. Maria's grade book. It opens when the grade book is connected and you are signed in.</div><a class="btn primary" style="width:100%" href="#/session/${n}/checklist">Go to the checklist <span aria-hidden="true">→</span></a>`; return;
    }
    if (tries.length && !fresh) {
      const q = tries[tries.length - 1];
      main.innerHTML = `${top}${scoreCard(n, q, tries.length)}
        ${tries.length > 1 ? `<p class="small muted">All your attempts: ${tries.map((x, i) => `#${i + 1}: ${x.score}/${x.total}`).join(" · ")}</p>` : ""}
        <button class="btn soft" style="width:100%" type="button" id="qAgain">Try the quiz again</button>
        <a class="btn primary" style="width:100%;margin-top:10px" href="#/session/${n}/checklist">Go to the checklist <span aria-hidden="true">→</span></a>`;
      $("#qAgain").onclick = () => { pageQuiz(L, true); window.scrollTo(0, 0); }; return;
    }
    /* new attempt: the answer choices are in a new order each time */
    const items = L.quiz.map(it => it.type === "mc" ? Object.assign({}, it, { _order: it.options.map((_, k) => k).sort(() => Math.random() - 0.5) }) : it);
    main.innerHTML = `${top}<div class="box t-blue"><b>${items.length} questions.</b> No time limit. You see only your final score. You can try again later.</div>
      <form id="qz">${items.map((it, i) => qHTML(it, i, items.length, "z")).join("")}</form>
      <p class="err" id="qErr" role="alert"></p><button class="btn primary" style="width:100%" type="button" id="qGo">Submit my quiz</button>`;
    wire($("#qz"));
    $("#qGo").onclick = async () => {
      const a = items.map((it, i) => read($("#z" + i), it)), miss = items.map((it, i) => i).filter(i => !answered(items[i], a[i])), btn = $("#qGo");
      if (miss.length) { $("#qErr").textContent = `Please answer every question. No answer yet: ${miss.map(i => i + 1).join(", ")}.`; $("#z" + miss[0]).scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      btn.disabled = true; btn.innerHTML = `<span class="wait">Marking your quiz…</span>`;
      try {
        const r = await API.post({ action: "quiz", code: auth.code, name: auth.name, session: n, answers: a });
        if (!r.ok) throw new Error(r.error || "error");
        (ss(n).quiz = ss(n).quiz || []).push({ score: r.score, total: r.total, at: new Date().toISOString() }); save();
        pageQuiz(L); window.scrollTo(0, 0);
      } catch (e) {
        btn.disabled = false; btn.textContent = "Submit my quiz";
        $("#qErr").textContent = e.message === "nokey" ? "This quiz is not ready yet. Please tell Ms. Maria." : e.message === "code" ? "Your access code is not active. Please tell Ms. Maria." : "No internet, or the grade book did not answer. Your answers are still here. Please try again.";
      }
    };
  }

  /* ---------- 4 · Checklist and badge ---------- */
  function pageChecklist(L) {
    const n = L.n, x = ss(n); x.check = x.check || L.checklist.map(() => false);
    const draw = () => {
      const d = partsDone(n), all = x.check.every(Boolean), need = [!d.reviewer && "read the reviewer", !d.workbook && "submit the workbook", API.on() && !d.quiz && "take the short quiz"].filter(Boolean);
      const earned = all && !need.length;
      if (earned && !x.badge) { x.badge = new Date().toISOString(); save(); toast("🏅 Session " + n + " badge earned!"); }
      main.innerHTML = `${head(L)}${stepsBar(n, "checklist")}<h3>Tick what you can do now</h3><p class="muted small">Be honest. If you cannot tick a box, read that part again or ask Ms. Maria.</p>
        <div class="card">${L.checklist.map((c, i) => `<label class="ck"><input type="checkbox" data-c="${i}" ${x.check[i] ? "checked" : ""}><span>I can ${fmt(c)}</span></label>`).join("")}</div>
        <div class="box t-gold" style="text-align:center;margin-top:14px"><div class="badge ${x.badge ? "" : "off"}" aria-hidden="true">🏅</div><b>Session ${n} badge${x.badge ? " earned ✓" : ""}</b><br>
        <span class="small">${x.badge ? "Well done. Ms. Maria can see that you finished this session." : need.length ? "To earn it, you still need to: " + esc(need.join(", ")) + "." : "Tick every box to earn it."}</span></div>
        ${x.badge && ready(n + 1) ? `<a class="btn primary" style="width:100%;margin-top:12px" href="#/session/${n + 1}">Go to Session ${n + 1} <span aria-hidden="true">→</span></a>` : `<a class="btn soft" style="width:100%;margin-top:12px" href="#/sessions">All sessions</a>`}`;
      main.querySelectorAll("[data-c]").forEach(c => c.onchange = () => { x.check[+c.dataset.c] = c.checked; save(); draw(); });
    };
    draw();
  }

  /* ---------- My progress ---------- */
  function pageMe() {
    const rows = COURSE.sessions.map(s => { const x = state.s[s.n] || {}; return `<tr><td>${s.n}</td><td style="white-space:normal;min-width:150px">${esc(s.title)}</td><td>${x.rev ? "✓" : "–"}</td><td>${x.wb ? x.wb.score + "/" + x.wb.total : "–"}</td><td>${x.quiz && x.quiz.length ? x.quiz.map(q => q.score + "/" + q.total).join(", ") : "–"}</td><td>${x.badge ? "🏅" : "–"}</td></tr>`; }).join("");
    main.innerHTML = `${preview()}<h1>${esc(t("progress"))}</h1><p>${auth ? `<b class="en">${esc(auth.name)}</b> · ` : ""}${esc(CFG.COURSE)}</p>
      <div class="card" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><div class="ring" style="--p:${Math.round(doneCount() / CFG.SESSIONS * 100)}"><div><b>${doneCount()}/${CFG.SESSIONS}</b><small>SESSIONS</small></div></div>
      <p style="flex:1;min-width:180px;margin:0">A session is complete when you read the reviewer, submit the workbook, take the quiz and tick the checklist.</p></div>
      <div class="sh"><span class="no">01</span><h2>Badges</h2></div><div class="badges">${COURSE.sessions.map(s => `<div><div class="badge ${(state.s[s.n] || {}).badge ? "" : "off"}" aria-hidden="true">🏅</div>Session ${s.n}<span class="sr">${(state.s[s.n] || {}).badge ? " earned" : " not earned yet"}</span></div>`).join("")}</div>
      <div class="sh"><span class="no">02</span><h2>Scores</h2></div><div class="scroll"><table class="tbl ptable"><thead><tr><th>#</th><th>Session</th><th>Reviewer</th><th>Workbook</th><th>Quiz attempts</th><th>Badge</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  /* ---------- Syllabus ---------- */
  function pageSyllabus() {
    main.innerHTML = `<p class="eyebrow">12-session syllabus</p><h1>${esc(CFG.COURSE)}</h1><p>Prepared for Learnovate students by Ms. Maria.</p>
      <div class="box t-blue"><span class="lab">Course goal</span>${esc(COURSE.goal)}</div>
      <div class="sh"><span class="no">01</span><h2>By the end, you can</h2></div><ul>${COURSE.outcomes.map(o => `<li>${esc(o)}</li>`).join("")}</ul>
      <div class="sh"><span class="no">02</span><h2>The twelve sessions</h2></div>
      ${COURSE.phases.map(p => `<p class="phase">${esc(p.name)}</p>${COURSE.sessions.filter(s => p.sessions.includes(s.n)).map(s => `<div class="card t-${tone(s.n)}" style="margin:8px 0"><span class="pill" style="border:1.5px solid var(--b)">Session ${s.n}</span><h3>${esc(s.title)}</h3><ul style="margin:0;padding-inline-start:1.2em">${s.topics.map(x => `<li>${esc(x)}</li>`).join("")}</ul>${s.key ? `<p class="small" style="margin:8px 0 0"><b>Key question:</b> ${esc(s.key)}</p>` : ""}</div>`).join("")}`).join("")}
      <div class="sh"><span class="no">03</span><h2>What you can do by Session 12</h2></div><div class="grid">${COURSE.cando.map((c, i) => `<div class="pillar t-${tone(i + 1)}"><small>${esc(c[0])}</small>${esc(c[1])}</div>`).join("")}</div>`;
  }

  /* ---------- Help ---------- */
  function pageHelp() {
    const H = (q, a) => `<details class="card" style="margin:8px 0"><summary style="font-weight:600;cursor:pointer;min-height:32px">${q}</summary><div style="margin-top:8px">${a}</div></details>`;
    main.innerHTML = `<h1>${esc(t("help"))}</h1>
      ${H("How do I sign in?", "<p>Ms. Maria gives you an access code. Type the code and your full name. You sign in one time on each phone or computer.</p>")}
      ${H("What do I do in each session?", "<ol><li><b>Slides:</b> look at the main ideas, one slide at a time.</li><li><b>Reviewer:</b> read the notes and examples.</li><li><b>Workbook:</b> answer the questions. After you submit, you see each answer and why.</li><li><b>Quiz:</b> take the short quiz. You see your score only. You can try again.</li><li><b>Checklist:</b> tick what you can do, and earn the badge.</li></ol>")}
      ${H("Do I need to send my work to Ms. Maria?", "<p>No. Your progress, workbook results and quiz scores go to Ms. Maria by themselves. After a quiz, please also take a screenshot of your score and send it to her.</p>")}
      ${H("Why does the quiz not show the answers?", "<p>You can take the quiz again. So the quiz shows your score only. The workbook shows every answer and the reason.</p>")}
      ${H("How do I change the language?", "<p>Press the 🌐 button at the top. Menus change to your language. You can also translate the explanations. Passages and questions always stay in English, like the real test.</p>")}
      ${H("How do I put this on my phone like an app?", "<p><b>Android (Chrome):</b> press ⋮ and then “Add to Home screen” or “Install app”.</p><p><b>iPhone (Safari):</b> press the Share button and then “Add to Home Screen”.</p>")}
      ${H("I have no internet. Can I study?", "<p>Pages you opened before still open. Your work is saved on your phone and goes to Ms. Maria when the internet is back. The short quiz needs internet.</p>")}
      <a class="btn primary" style="margin-top:10px" href="mailto:${esc(CFG.EMAIL)}?subject=${encodeURIComponent("Help: The GED Academy · " + CFG.SHORT)}">${esc(t("contact"))}</a>`;
  }

  /* ---------- router ---------- */
  async function route() {
    const h = location.hash.replace(/^#\/?/, "").split("/"), page = h[0] || "home";
    document.querySelectorAll(".tabs a, .navl a").forEach(a => { const p = a.getAttribute("href").replace(/^#\/?/, "") || "home"; (p === page || (p === "sessions" && page === "session")) ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
    if (API.on() && !auth && page !== "help" && page !== "syllabus") return gate();
    if (page === "session") {
      const n = +h[1], s = sess(n);
      if (!s) { location.hash = "#/sessions"; return; }
      if (!ready(n)) { main.innerHTML = `<p class="eyebrow">${esc(CFG.COURSE)}</p><h1>Session ${n}: ${esc(s.title)}</h1><div class="box t-gold">⏳ <b>This session opens soon.</b> Ms. Maria will tell you when it is ready.</div><ul>${s.topics.map(x => `<li>${esc(x)}</li>`).join("")}</ul><a class="btn soft" href="#/sessions">All sessions</a>`; GED.apply(main); return; }
      main.innerHTML = `<div class="loader"><span class="ldots"><i></i><i></i><i></i><i></i></span><p>Opening Session ${n}…</p></div>`;
      let L; try { L = await lesson(n); await canvaReady; } catch (e) { main.innerHTML = `<div class="box t-peach">This session did not load. Check your internet and try again.</div>`; return; }
      ({ slides: L.slides || canvaFor(n) ? pageSlides : pageReviewer, reviewer: pageReviewer, workbook: pageWorkbook, quiz: pageQuiz, checklist: pageChecklist }[h[2]] || (L.slides || canvaFor(n) ? pageSlides : pageReviewer))(L);
    } else ({ home: pageHome, sessions: pageSessions, me: pageMe, syllabus: pageSyllabus, help: pageHelp }[page] || pageHome)();
    GED.apply(main); main.focus({ preventScroll: true });
  }
  let lastHash = "";
  window.addEventListener("hashchange", () => { const top = location.hash.split("/").slice(0, 4).join("/"); if (top !== lastHash) window.scrollTo(0, 0); lastHash = top; route(); });
  document.addEventListener("ged-lang", () => { signBtn(); route(); });
  new MutationObserver(() => GED.apply(main)).observe(main, { childList: true });
  signBtn(); route(); flush();
})();
