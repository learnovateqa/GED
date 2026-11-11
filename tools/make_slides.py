#!/usr/bin/env python3
"""Write a plain HTML copy of a session's slides (one 1920 x 1080 page per slide, in the site's design).
   Canva can import this page, so the deck can then be edited in Canva.
   Use:  python3 tools/make_slides.py rla 1      ->  rla/slides/session01.html"""
import json, sys, os, html, re
folder, n = sys.argv[1], int(sys.argv[2])
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = json.load(open(f"{root}/{folder}/session{n:02d}.json", encoding="utf-8"))
course = {"rla": "Reasoning Through Language Arts", "social-studies": "Social Studies"}[folder]
def fmt(s): return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", html.escape(s)).replace("\n", "<br>")
def block(b):
    if "p" in b: return f"<p>{fmt(b['p'])}</p>"
    if "list" in b: return "<ul>" + "".join(f"<li>{fmt(x)}</li>" for x in b["list"]) + "</ul>"
    if "steps" in b: return "<ol>" + "".join(f"<li>{fmt(x)}</li>" for x in b["steps"]) + "</ol>"
    if "flow" in b: return '<div class="flow">' + '<i>→</i>'.join(f"<span>{html.escape(x)}</span>" for x in b["flow"]) + "</div>"
    if "passage" in b: return f'<div class="pass"><b class="lab">{html.escape(b.get("title","Passage"))}</b>{fmt(b["passage"])}</div>'
    if "question" in b: return f"<p><b>Question:</b> {fmt(b['question'])}</p>"
    if "weak" in b: return f'<div class="box weak"><b class="lab">✗ Weak {html.escape(b.get("label","answer"))}</b>{fmt(b["weak"])}' + (f'<small>{fmt(b["note"])}</small>' if b.get("note") else "") + "</div>"
    if "strong" in b: return f'<div class="box strong"><b class="lab">✓ Strong {html.escape(b.get("label","answer"))}</b>{fmt(b["strong"])}' + (f'<small>{fmt(b["note"])}</small>' if b.get("note") else "") + "</div>"
    if "remember" in b: return f'<div class="box gold"><b class="lab">Remember this</b>{fmt(b["remember"])}</div>'
    if "mistake" in b: return f'<div class="box peach"><b class="lab">Common mistake</b>{fmt(b["mistake"])}</div>'
    if "tip" in b: return f'<div class="box blue"><b class="lab">Tip</b>{fmt(b["tip"])}</div>'
    if "table" in b:
        t = b["table"]; return "<table><tr>" + "".join(f"<th>{fmt(h)}</th>" for h in t["head"]) + "</tr>" + "".join("<tr>" + "".join(f"<td>{fmt(c)}</td>" for c in r) + "</tr>" for r in t["rows"]) + "</table>"
    return ""
pages = []
for i, s in enumerate(L["slides"]):
    foot = f'<div class="foot"><span>The GED Academy · Ms. Maria</span><span>{i+1} / {len(L["slides"])}</span></div>'
    if s.get("kind") == "title":
        pages.append(f'<section data-document-role="page" data-label="{html.escape(s["h"])}" class="page title"><p class="eye">{html.escape(course)} · Session {n}</p><h1>{fmt(s["h"])}</h1><p class="sub">{fmt(s.get("sub",""))}</p><p class="by">The GED Academy · Elevate with Ms. Maria · Learnovate</p></section>')
    else:
        pages.append(f'<section data-document-role="page" data-label="{html.escape(s["h"])}" class="page"><div class="band"></div><p class="eye">Session {n} · {html.escape(L["title"])}</p><h2>{fmt(s["h"])}</h2><div class="body">{"".join(block(b) for b in s.get("blocks", []))}</div>{foot}</section>')
css = """
*{box-sizing:border-box}body{margin:0;background:#888;font-family:'Poppins',Arial,sans-serif;color:#1B2A4A}
.page{width:1920px;height:1080px;background:#fff;position:relative;overflow:hidden;padding:110px 120px 90px;font-size:40px;line-height:1.45;margin:0 auto 24px}
.band{position:absolute;left:0;top:0;width:1920px;height:26px;background:#0183A8}
.eye{font-size:24px;letter-spacing:6px;text-transform:uppercase;font-weight:600;margin:0 0 10px;color:#5D6780}
h2{font-size:72px;line-height:1.15;margin:0 0 36px;font-weight:700}
p{margin:0 0 22px}ul,ol{margin:0 0 22px;padding-left:56px}li{margin:10px 0}
.box{border:3px solid #E2E4EC;border-radius:28px;padding:24px 34px;margin:0 0 24px}
.box small{display:block;font-size:30px;margin-top:8px}
.lab{display:block;font-size:24px;letter-spacing:4px;text-transform:uppercase;font-weight:700;margin-bottom:8px}
.weak{background:#FDEBE2;border-color:#F0B79C}.weak .lab{color:#C2410C}
.strong{background:#E3F5EA;border-color:#ABD6B6}.strong .lab{color:#2F8F57}
.gold{background:#FBF0C9;border-color:#DDB94F}.peach{background:#FDE5D2;border-color:#F3C7A5}.blue{background:#DCEBFA;border-color:#A8C7EA}
.pass{border-left:10px solid #0183A8;background:#F4FAFC;border-radius:0 24px 24px 0;padding:24px 34px;margin:0 0 24px}
.flow{display:flex;flex-wrap:wrap;gap:18px;align-items:center;margin:0 0 30px}
.flow span{background:#017A9C;color:#fff;border-radius:22px;padding:16px 30px;font-weight:600}.flow i{font-style:normal;font-weight:700}
table{border-collapse:collapse;width:100%;font-size:36px}th,td{border:3px solid #C9CFDB;padding:16px 22px;text-align:left;vertical-align:top}th{background:#DCEBFA}
.foot{position:absolute;left:120px;right:120px;bottom:36px;display:flex;justify-content:space-between;font-size:24px;color:#5D6780}
.title{background:#DCEEF4;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.title h1{font-size:104px;line-height:1.12;margin:10px 0 24px;max-width:1500px}.title .sub{font-size:48px;color:#2E3B5C}.title .by{font-size:28px;color:#5D6780;margin-top:40px}
"""
out = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>{html.escape(course)} · Session {n} · Slides</title><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"><style>{css}</style></head><body>\n' + "\n".join(pages) + "\n</body></html>\n"
os.makedirs(f"{root}/{folder}/slides", exist_ok=True)
open(f"{root}/{folder}/slides/session{n:02d}.html", "w", encoding="utf-8").write(out)
print("wrote", f"{folder}/slides/session{n:02d}.html", len(pages), "pages")
