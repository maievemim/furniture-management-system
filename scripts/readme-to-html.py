"""แปลง README.md → README.html (ธีมเดียวกับเว็บไซต์ + สารบัญด้านข้าง)
ใช้ (ที่โฟลเดอร์โปรเจกต์): python scripts/readme-to-html.py README.md README.html
รันใหม่ทุกครั้งที่แก้ README.md ไม่ต้องติดตั้งอะไรเพิ่ม (ใช้แค่ Python มาตรฐาน)
ตัวแปลง Markdown แบบย่อ รองรับเท่าที่ README ใช้: หัวข้อ ย่อหน้า ตัวหนา โค้ด ลิงก์ ตาราง
รายการ (ชั้นเดียว + บรรทัดต่อ) บล็อกโค้ด และ blockquote
"""
import re, sys, html, unicodedata

md_path, out_path = sys.argv[1], sys.argv[2]

def inline(text):
    # ลิงก์ก่อน (ข้อความในลิงก์อาจมีโค้ด เช่น [`schema.sql`](...)) เก็บเป็น token แล้วค่อยใส่กลับ
    links = []
    def keep(m):
        links.append(f'<a href="{html.escape(m.group(2))}">{inline(m.group(1))}</a>')
        return f'\x00{len(links) - 1}\x00'
    text = re.sub(r'\[((?:[^\]`]|`[^`]*`)+)\]\(([^)\s]+)\)', keep, text)
    result = inline_basic(text)
    return re.sub(r'\x00(\d+)\x00', lambda m: links[int(m.group(1))], result)

def inline_basic(text):
    parts = re.split(r'(`[^`]+`)', text)
    out = []
    for p in parts:
        if p.startswith('`') and p.endswith('`') and len(p) > 1:
            out.append(f'<code>{html.escape(p[1:-1])}</code>')
            continue
        p = html.escape(p, quote=False)
        p = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: f'<a href="{html.escape(m.group(2))}">{m.group(1)}</a>', p)
        p = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', p)
        out.append(p)
    return ''.join(out)

def render_item(lines):
    # บรรทัดต่อที่ขึ้นต้นด้วย "- " = รายการย่อย (ซ้อน 1 ชั้น) ที่เหลือ = ข้อความต่อบรรทัด
    text = [l for l in lines if not l.startswith('- ')]
    sub = [l[2:] for l in lines if l.startswith('- ')]
    html_ = '<br />'.join(inline(x) for x in text)
    if sub:
        html_ += '<ul>' + ''.join(f'<li>{inline(x)}</li>' for x in sub) + '</ul>'
    return f'<li>{html_}</li>'

def convert(md):
    lines = md.split('\n')
    out = []
    i = 0
    para = []
    def flush_para():
        if para:
            out.append('<p>' + '<br />\n'.join(inline(l.strip()) for l in para) + '</p>')
            para.clear()
    while i < len(lines):
        line = lines[i]
        if line.startswith('```'):
            flush_para()
            lang = line[3:].strip()
            buf = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                buf.append(lines[i]); i += 1
            cls = f' class="language-{lang}"' if lang else ''
            out.append(f'<pre><code{cls}>{html.escape(chr(10).join(buf))}</code></pre>')
            i += 1
            continue
        m = re.match(r'^(#{1,6})\s+(.*)$', line)
        if m:
            flush_para()
            n = len(m.group(1))
            out.append(f'<h{n}>{inline(m.group(2))}</h{n}>')
            i += 1
            continue
        if line.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s\-:|]+\|\s*$', lines[i + 1]):
            flush_para()
            cells = lambda l: [c.strip() for c in l.strip().strip('|').split('|')]
            head = cells(line)
            i += 2
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                rows.append(cells(lines[i])); i += 1
            t = ['<table>', '<thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in head) + '</tr></thead>', '<tbody>']
            for r in rows:
                t.append('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>')
            t.append('</tbody></table>')
            out.append('\n'.join(t))
            continue
        if line.startswith('>'):
            flush_para()
            buf = []
            while i < len(lines) and lines[i].startswith('>'):
                buf.append(lines[i][1:].strip()); i += 1
            out.append('<blockquote><p>' + ' '.join(inline(b) for b in buf) + '</p></blockquote>')
            continue
        lm = re.match(r'^(-|\d+\.)\s+(.*)$', line)
        if lm:
            flush_para()
            ordered = lm.group(1) != '-'
            tag = 'ol' if ordered else 'ul'
            start = int(lm.group(1)[:-1]) if ordered else 1
            items = []
            while i < len(lines):
                lm2 = re.match(r'^(-|\d+\.)\s+(.*)$', lines[i])
                if lm2 and (lm2.group(1) != '-') == ordered:
                    items.append([lm2.group(2)]); i += 1
                elif items and re.match(r'^\s+\S', lines[i]):
                    items[-1].append(lines[i].strip()); i += 1  # บรรทัดต่อของรายการ
                else:
                    break
            attr = f' start="{start}"' if ordered and start != 1 else ''
            out.append(f'<{tag}{attr}>' + ''.join(render_item(it) for it in items) + f'</{tag}>')
            continue
        if not line.strip():
            flush_para()
            i += 1
            continue
        para.append(line)
        i += 1
    flush_para()
    return '\n'.join(out)

body = convert(open(md_path, encoding='utf8').read())

def slug(text):
    # แบบเดียวกับ GitHub: ตัวพิมพ์เล็ก เก็บตัวอักษร/ตัวเลข/สระ-วรรณยุกต์/ขีด/ช่องว่าง แล้วแทนช่องว่างด้วย -
    text = html.unescape(re.sub(r'<[^>]+>', '', text)).strip().lower()
    keep = ''.join(c for c in text if c in ' -_' or unicodedata.category(c)[0] in 'LMN')
    return keep.replace(' ', '-')

toc = []
seen = {}
def add_id(m):
    level, inner = m.group(1), m.group(2)
    s = slug(inner)
    n = seen.get(s, 0); seen[s] = n + 1
    if n: s = f'{s}-{n}'
    if level == '2':
        toc.append((s, re.sub(r'<[^>]+>', '', inner)))
    return f'<h{level} id="{s}">{inner}</h{level}>'

body = re.sub(r'<h([1-4])>(.*?)</h\1>', add_id, body)
# ตารางกว้าง: ห่อให้เลื่อนแนวนอนได้บนมือถือ
body = body.replace('<table>', '<div class="table-wrap"><table>').replace('</table>', '</table></div>')
# ลิงก์ภายนอกเปิดแท็บใหม่
body = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', body)

# ตัดหัวข้อ "สารบัญ" เดิม (มีสารบัญด้านข้างแทน)
body = re.sub(r'<h2 id="สารบัญ">.*?</h2>\s*<ul>.*?</ul>', '', body, count=1, flags=re.S)
toc = [t for t in toc if t[0] != 'สารบัญ']

toc_html = '\n'.join(f'<li><a href="#{s}">{html.escape(t)}</a></li>' for s, t in toc)

page = f'''<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ระบบการจัดการการวางเฟอร์นิเจอร์เสมือนจริง · README</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&family=Noto+Serif+Thai:wght@500;600&family=IBM+Plex+Mono&display=swap" rel="stylesheet" />
<style>
:root {{
  --bg: #f4efe8; --surface: #fffdf9; --text: #2b2520; --muted: #6f655b; --border: #e6ddd1;
  --accent: #94683c; --code-bg: #efe7dc; --ink: #2b2520; --ink-text: #fbf8f3; --row: #faf6f0;
  --font-body: 'IBM Plex Sans Thai', system-ui, sans-serif;
  --font-display: 'Noto Serif Thai', 'IBM Plex Sans Thai', serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace;
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --bg: #1d1916; --surface: #262019; --text: #efe7dc; --muted: #b3a797; --border: #3a3129;
    --accent: #d4a574; --code-bg: #302820; --ink: #efe7dc; --ink-text: #1d1916; --row: #2b241d;
  }}
}}
:root[data-theme="dark"] {{
  --bg: #1d1916; --surface: #262019; --text: #efe7dc; --muted: #b3a797; --border: #3a3129;
  --accent: #d4a574; --code-bg: #302820; --ink: #efe7dc; --ink-text: #1d1916; --row: #2b241d;
}}
* {{ box-sizing: border-box; }}
html {{ scroll-behavior: smooth; }}
body {{ margin: 0; background: var(--bg); color: var(--text); font: 16px/1.75 var(--font-body); -webkit-font-smoothing: antialiased; }}
a {{ color: var(--accent); }}
.layout {{ max-width: 1240px; margin: 0 auto; padding: 0 16px; display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 40px; }}
.toc {{ position: sticky; top: 0; align-self: start; max-height: 100vh; overflow-y: auto; padding: 32px 0; }}
.toc-title {{ font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; margin: 0 0 12px; }}
.toc ol {{ list-style: none; margin: 0; padding: 0; counter-reset: t; }}
.toc li {{ counter-increment: t; }}
.toc a {{ display: grid; grid-template-columns: 2rem 1fr; padding: 6px 10px; border-radius: 10px; color: var(--text); text-decoration: none; font-size: 1rem; line-height: 1.45; }}
.toc a::before {{ content: counter(t, decimal-leading-zero); color: var(--muted); font-family: var(--font-mono); }}
.toc a:hover, .toc a.active {{ background: var(--surface); box-shadow: 0 1px 0 var(--border); }}
.toc a.active {{ color: var(--accent); font-weight: 600; }}
main {{ padding: 32px 0 80px; min-width: 0; }}
.doc {{ background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: clamp(20px, 4vw, 48px); }}
h1, h2, h3 {{ font-family: var(--font-display); line-height: 1.35; scroll-margin-top: 20px; }}
h1 {{ font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 600; margin: 0 0 12px; }}
h2 {{ font-size: clamp(1.45rem, 3vw, 1.85rem); font-weight: 600; margin: 56px 0 16px; padding-top: 24px; border-top: 1px solid var(--border); }}
h3 {{ font-size: 1.25rem; font-weight: 600; margin: 32px 0 10px; }}
h1 + p strong, h1 + p {{ color: var(--muted); }}
p, ul, ol {{ margin: 0 0 14px; }}
ul, ol {{ padding-left: 1.4rem; }}
li {{ margin: 4px 0; }}
li > p {{ margin: 0; }}
strong {{ font-weight: 600; }}
code {{ font-family: var(--font-mono); font-size: 1rem; background: var(--code-bg); padding: 1px 6px; border-radius: 6px; overflow-wrap: anywhere; }}
pre {{ background: var(--ink); color: var(--ink-text); padding: 16px 18px; border-radius: 14px; overflow-x: auto; margin: 0 0 16px; }}
pre code {{ background: none; padding: 0; color: inherit; overflow-wrap: normal; white-space: pre; }}
blockquote {{ margin: 0 0 16px; padding: 12px 18px; border-left: 4px solid var(--accent); background: var(--row); border-radius: 0 12px 12px 0; }}
blockquote p {{ margin: 0; }}
.table-wrap {{ overflow-x: auto; margin: 0 0 18px; border: 1px solid var(--border); border-radius: 14px; }}
table {{ width: 100%; border-collapse: collapse; font-size: 1rem; }}
th, td {{ padding: 10px 14px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--border); }}
thead th {{ background: var(--row); font-weight: 600; white-space: nowrap; }}
tbody tr:last-child td {{ border-bottom: 0; }}
tbody tr:nth-child(even) td {{ background: var(--row); }}
.topbar {{ display: none; }}
.theme-btn {{ position: fixed; right: 16px; bottom: 16px; font: 1rem var(--font-body); padding: 8px 16px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; box-shadow: 0 4px 14px rgb(0 0 0 / .12); }}
@media (max-width: 900px) {{
  .layout {{ grid-template-columns: 1fr; gap: 0; }}
  .toc {{ position: static; max-height: none; padding: 16px 0 0; }}
  .toc details {{ background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 10px 14px; }}
  .toc summary {{ cursor: pointer; font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; }}
  .toc-title {{ display: none; }}
  main {{ padding-top: 16px; }}
}}
@media (min-width: 901px) {{ .toc summary {{ display: none; }} }}
</style>
</head>
<body>
<div class="layout">
  <nav class="toc" aria-label="สารบัญ">
    <details open>
      <summary>สารบัญ</summary>
      <p class="toc-title">สารบัญ</p>
      <ol>
{toc_html}
      </ol>
    </details>
  </nav>
  <main>
    <article class="doc">
{body}
    </article>
  </main>
</div>
<button class="theme-btn" type="button" aria-label="สลับโหมดสว่าง/มืด">โหมดมืด</button>
<script>
  // สลับธีม (จำค่าในเครื่องผู้อ่าน)
  const root = document.documentElement, btn = document.querySelector('.theme-btn')
  const dark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  const label = () => (btn.textContent = dark() ? 'โหมดสว่าง' : 'โหมดมืด')
  try {{ const t = localStorage.getItem('readme-theme'); if (t) root.dataset.theme = t }} catch {{}}
  label()
  btn.addEventListener('click', () => {{
    root.dataset.theme = dark() ? 'light' : 'dark'; label()
    try {{ localStorage.setItem('readme-theme', root.dataset.theme) }} catch {{}}
  }})
  // ไฮไลต์หัวข้อที่กำลังอ่านในสารบัญ
  const links = [...document.querySelectorAll('.toc a')]
  const obs = new IntersectionObserver((entries) => {{
    for (const e of entries) if (e.isIntersecting) {{
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id))
    }}
  }}, {{ rootMargin: '0px 0px -75% 0px' }})
  document.querySelectorAll('.doc h2[id]').forEach((h) => obs.observe(h))
  // มือถือ: ปิดสารบัญหลังกดลิงก์
  links.forEach((a) => a.addEventListener('click', () => {{ if (innerWidth <= 900) a.closest('details').open = false }}))
  if (innerWidth <= 900) document.querySelector('.toc details').open = false
</script>
</body>
</html>
'''
open(out_path, 'w', encoding='utf8', newline='\n').write(page)
print('toc', len(toc), 'sections →', out_path)
