/* ===== The GED Academy · shared code =====
   storage · interface language · right-to-left · script fonts · Google Translate · toast · offline file */
(function () {
  const LANGS = window.GED_LANGS, DICT = window.GED_I18N, MORE = window.GED_MORE;
  const me = document.currentScript;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("ged-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("ged-" + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem("ged-" + k); } catch (e) {} }
  };
  let lang = store.get("lang", "en"); if (!DICT[lang]) lang = "en";
  const L = () => LANGS.find(l => l.code === lang) || LANGS[0];
  const t = k => (DICT[lang] && DICT[lang][k]) || DICT.en[k] || k;

  /* ---------- Google Translate (explanations + extra languages) ---------- */
  const gtNow = () => { const m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/); return m ? decodeURIComponent(m[1]) : ""; };
  function gtSet(code) {
    const host = location.hostname, dom = host.split(".").slice(-2).join(".");
    ["", ";domain=" + host, ";domain=." + dom].forEach(d => { document.cookie = "googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/" + d; });
    if (code) document.cookie = "googtrans=/en/" + code + ";path=/";
    location.reload();
  }
  function gtLoad() {
    if (!gtNow() || document.getElementById("gtHost")) return;
    const h = document.createElement("div"); h.id = "gtHost"; document.body.appendChild(h);
    window.gtInit = () => { try { new google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "gtHost"); } catch (e) {} };
    const s = document.createElement("script"); s.src = "https://translate.google.com/translate_a/element.js?cb=gtInit";
    s.onerror = () => toast("Google Translate did not load. Check your internet.");
    document.head.appendChild(s);
  }

  /* ---------- fonts for other scripts (Poppins has Latin letters only) ---------- */
  function loadFont(name) {
    if (!name) { document.documentElement.style.removeProperty("--script"); return; }
    const id = "font-" + name.replace(/\s+/g, "-");
    if (!document.getElementById(id)) {
      const l = document.createElement("link"); l.id = id; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=" + name.replace(/\s+/g, "+") + ":wght@400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
    document.documentElement.style.setProperty("--script", "'" + name + "'");
  }

  /* ---------- put the chosen language on the page ---------- */
  function apply(root) {
    const d = document.documentElement, cur = L();
    const gt = gtNow(), rtl = gt ? /^(ar|ur|fa|ps|he|iw|sd|ug|yi)\b/.test(gt) : !!cur.rtl;
    d.lang = lang; d.dir = rtl ? "rtl" : "ltr";
    /* blocks that are still in English read left to right, until Google Translate changes them */
    document.querySelectorAll("[data-en]").forEach(el => { el.dir = rtl && !gt ? "ltr" : ""; });
    LANGS.forEach(l => d.classList.toggle("lang-" + l.code, l.code === lang));
    loadFont(cur.font);
    (root || document).querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.dataset.i18n);
      if (lang !== "en") { el.setAttribute("translate", "no"); el.classList.add("notranslate"); }
    });
    /* English study content never changes direction and is never translated */
    (root || document).querySelectorAll(".en").forEach(el => { el.dir = "ltr"; el.lang = "en"; el.setAttribute("translate", "no"); el.classList.add("notranslate"); });
    menu(); trbar();
  }
  function setLang(code) { lang = code; store.set("lang", code); if (gtNow()) return gtSet(""); apply(); document.dispatchEvent(new CustomEvent("ged-lang")); }

  /* ---------- language menu ---------- */
  function menu() {
    document.querySelectorAll("[data-langmenu]").forEach(host => {
      const gt = gtNow(), more = gt && !LANGS.some(l => l.code === gt) ? (MORE.find(m => m[0] === gt) || [gt, gt])[1].split(" · ")[0] : "";
      host.innerHTML = `<button class="iconbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Language"><svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/></svg><span class="notranslate" translate="no">${esc(more || L().native)}</span></button>
      <div class="menu notranslate" translate="no" hidden role="menu">
        ${LANGS.map(l => `<button type="button" role="menuitem" data-l="${l.code}" ${l.code === lang && !more ? 'aria-current="true"' : ""}><span>${esc(l.native)}</span><span class="muted small">${l.code.toUpperCase()}</span></button>`).join("")}
        <hr><label class="small muted" style="display:block;padding:2px 8px 6px">${esc(t("more_langs"))}
        <select aria-label="${esc(t("more_langs"))}"><option value="">…</option>${MORE.map(m => `<option value="${m[0]}" ${m[0] === gt ? "selected" : ""}>${esc(m[1])}</option>`).join("")}</select></label>
      </div>`;
      const b = host.querySelector("button"), m = host.querySelector(".menu");
      b.onclick = e => { e.stopPropagation(); m.hidden = !m.hidden; b.setAttribute("aria-expanded", !m.hidden); };
      m.onclick = e => e.stopPropagation();
      m.querySelectorAll("[data-l]").forEach(x => x.onclick = () => { m.hidden = true; setLang(x.dataset.l); });
      m.querySelector("select").onchange = e => { if (e.target.value) { lang = "en"; store.set("lang", "en"); gtSet(e.target.value); } };
    });
  }
  document.addEventListener("click", () => document.querySelectorAll("[data-langmenu] .menu").forEach(m => m.hidden = true));

  /* ---------- bar: offer to translate the explanations ---------- */
  function trbar() {
    const host = document.getElementById("trbar"); if (!host) return;
    const gt = gtNow();
    if (!gt && (lang === "en" || store.get("tr-no", "") === lang)) { host.hidden = true; return; }
    host.hidden = false;
    host.innerHTML = `<div class="wrap notranslate" translate="no"><span>🌐 ${esc(t(gt ? "tr_note" : "tr_q"))}</span><span class="row">${gt
      ? `<button class="btn sm soft" type="button" data-off>${esc(t("tr_off"))}</button>`
      : `<button class="btn sm primary" type="button" data-on>${esc(t("tr_yes"))}</button><button class="iconbtn" type="button" data-x aria-label="Close">✕</button>`}</span></div>`;
    const q = s => host.querySelector(s);
    if (q("[data-off]")) q("[data-off]").onclick = () => gtSet("");
    if (q("[data-on]")) q("[data-on]").onclick = () => gtSet(lang === "fil" ? "tl" : lang);
    if (q("[data-x]")) q("[data-x]").onclick = () => { store.set("tr-no", lang); host.hidden = true; };
  }

  /* ---------- toast ---------- */
  let tt;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => { el.hidden = true; }, 3200);
  }

  window.GED = { esc, t, store, toast, apply, setLang, get lang() { return lang; }, gtNow };
  const start = () => { apply(); gtLoad(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  if (me && me.dataset.sw && "serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register(me.dataset.sw).catch(() => {});
})();
