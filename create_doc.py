#!/usr/bin/env python3
"""
create_doc.py · Marketplace SMC Banco · genera HTML branded desde Markdown

Toma un .md con frontmatter YAML y escupe un HTML standalone con:
- Cover branded SMC
- TOC autogenerado desde headers # nivel-1
- Secciones renderizadas
- Nav inter-docs
- auth.js + nav.js inyectados

Uso:
   python3 create_doc.py docs/28-terms-of-service.md            # genera 28-terms-of-service.html
   python3 create_doc.py docs/*.md --apply                       # batch
   python3 create_doc.py docs/28-terms-of-service.md --dry-run   # solo preview

Convención .md:
   ---
   number: 28
   id: terms-of-service
   title: Terms of Service
   subtitle: "ToS adaptado Ley Chile..."
   block: Legal
   author: Compliance
   prev: 27-visual-identity.html
   next: 29-privacy-policy.html
   ---

   # 01 · Sección uno
   Texto markdown...

   # 02 · Otra sección
   - lista
   - lista
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent

# Tipos de bloques visuales soportados.
# Cada uno apunta a una init function en SMCDiagram (resuelta en _diagram-kit.js).
DIAGRAM_KINDS = {
    'hla', 'pipeline', 'erd', 'swatch', 'heatmap',
    'funnel', 'gantt', 'canvas9', 'slides', 'pi-matrix',
    'chart-line', 'chart-bar',
}

# Sidecar JSON cargado en una pasada del .md actual.
_SIDECAR_CACHE = {}


def load_sidecar(md_path, diagram_id):
    """Carga `docs/<doc-stem>/<diagram-id>.json` relativo al .md."""
    stem = md_path.stem
    cand = md_path.parent / stem / f"{diagram_id}.json"
    if cand.exists():
        try:
            return json.loads(cand.read_text(encoding='utf-8'))
        except Exception as ex:
            print(f'⚠️  JSON inválido {cand}: {ex}')
            return {}
    return None


# ============================================================
# PARSER
# ============================================================

def parse_frontmatter(md):
    if not md.startswith('---'):
        return {}, md
    end = md.find('\n---\n', 4)
    if end < 0:
        return {}, md
    yaml_block = md[4:end]
    body = md[end + 5:]
    meta = {}
    for line in yaml_block.splitlines():
        if ':' in line:
            k, v = line.split(':', 1)
            v = v.strip().strip('"').strip("'")
            meta[k.strip()] = v
    return meta, body


def split_sections(body):
    """Divide en bloques nivel `# Title` cada uno."""
    sections = []
    current_title = None
    current_lines = []
    for line in body.splitlines():
        m = re.match(r'^# (.+)$', line)
        if m:
            if current_title is not None:
                sections.append((current_title, '\n'.join(current_lines).strip()))
            current_title = m.group(1).strip()
            current_lines = []
        else:
            current_lines.append(line)
    if current_title is not None:
        sections.append((current_title, '\n'.join(current_lines).strip()))
    return sections


# ============================================================
# MARKDOWN → HTML mini-parser (stdlib only)
# ============================================================

def md_inline(text):
    """Inline markdown: bold · italic · code · links."""
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    return text


def md_to_html(md_text):
    """Convierte un bloque markdown a HTML branded SMC."""
    lines = md_text.splitlines()
    out = []
    i = 0
    in_list = False
    in_table = False
    table_buf = []

    def flush_table():
        nonlocal table_buf
        if not table_buf:
            return
        # parsear pipe table
        rows = [r.strip().strip('|').split('|') for r in table_buf]
        rows = [[c.strip() for c in r] for r in rows]
        # primera fila = header · segunda fila = separador --- · resto datos
        if len(rows) >= 2 and all('-' in c or c == '' for c in rows[1]):
            header = rows[0]
            data = rows[2:]
        else:
            header = rows[0]
            data = rows[1:]
        html = ['<table>']
        html.append('<thead><tr>')
        for h in header:
            html.append(f'<th>{md_inline(h)}</th>')
        html.append('</tr></thead>')
        html.append('<tbody>')
        for r in data:
            html.append('<tr>')
            for c in r:
                html.append(f'<td>{md_inline(c)}</td>')
            html.append('</tr>')
        html.append('</tbody></table>')
        out.append('\n'.join(html))
        table_buf = []

    def flush_list():
        nonlocal in_list
        if in_list:
            out.append('</ul>')
            in_list = False

    while i < len(lines):
        line = lines[i]

        # tabla pipe
        if '|' in line and line.strip().startswith('|'):
            flush_list()
            in_table = True
            table_buf.append(line)
            i += 1
            continue
        elif in_table:
            flush_table()
            in_table = False

        # heading H2
        m = re.match(r'^## (.+)$', line)
        if m:
            flush_list()
            out.append(f'<h3>{md_inline(m.group(1))}</h3>')
            i += 1
            continue

        # heading H3
        m = re.match(r'^### (.+)$', line)
        if m:
            flush_list()
            out.append(f'<h4>{md_inline(m.group(1))}</h4>')
            i += 1
            continue

        # callout box: > [!premise] título   |   > [!hla] my-id  (diagrama)
        m = re.match(r'^> \[!([\w-]+)\](?: (.+))?$', line)
        if m:
            flush_list()
            kind = m.group(1).lower()
            arg = (m.group(2) or '').strip()
            content_lines = []
            i += 1
            while i < len(lines) and lines[i].startswith('>'):
                content_lines.append(lines[i].lstrip('> '))
                i += 1

            # === DIAGRAMA INTERACTIVO ===
            if kind in DIAGRAM_KINDS:
                diagram_id = arg or f'{kind}-1'
                # 1ra línea del cuerpo = caption opcional
                caption = content_lines[0].strip() if content_lines else ''
                cfg = _SIDECAR_CACHE.get(diagram_id, {}) or {}
                # Inyecta data + skeleton
                kind_dash = kind  # 'pi-matrix' etc OK
                host_class = f'diagram-host kind-{kind_dash}'
                json_data = json.dumps(cfg, ensure_ascii=False)
                out.append(f'''<div class="diagram-section">
  {f'<p class="diagram-caption">{md_inline(caption)}</p>' if caption else ''}
  <div class="{host_class}" id="{diagram_id}" data-kind="{kind_dash}"></div>
  <script type="application/json" data-for="{diagram_id}">{json_data}</script>
</div>''')
                continue

            # === CALLOUT NORMAL ===
            title = arg
            box_content = md_to_html('\n'.join(content_lines))
            klass = {
                'premise': 'box-premise', 'anti': 'box-anti',
                'info': 'box-info', 'warning': 'box-warning',
                'success': 'box-success', 'decision': 'box-decision',
            }.get(kind, 'box-info')
            icon = {
                'premise': '🎯', 'anti': '⛔', 'info': '💡',
                'warning': '⚠️', 'success': '✅', 'decision': '📌',
            }.get(kind, '💡')
            out.append(f'<div class="box {klass}"><div class="box-title">{icon} {title}</div>{box_content}</div>')
            continue

        # code block ```
        if line.startswith('```'):
            flush_list()
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].startswith('```'):
                code_lines.append(lines[i])
                i += 1
            out.append('<pre class="ascii">' + '\n'.join(code_lines) + '</pre>')
            i += 1
            continue

        # lista con -
        if line.startswith('- '):
            if not in_list:
                out.append('<ul>')
                in_list = True
            out.append(f'<li>{md_inline(line[2:].strip())}</li>')
            i += 1
            continue
        # lista con 1. 2. etc
        m = re.match(r'^\d+\. (.+)$', line)
        if m:
            if not in_list:
                out.append('<ul>')
                in_list = True
            out.append(f'<li>{md_inline(m.group(1).strip())}</li>')
            i += 1
            continue

        flush_list()

        # blockquote
        if line.startswith('> '):
            out.append(f'<blockquote>{md_inline(line[2:].strip())}</blockquote>')
            i += 1
            continue

        # párrafo
        if line.strip():
            out.append(f'<p>{md_inline(line.strip())}</p>')
        i += 1

    flush_list()
    if in_table:
        flush_table()

    return '\n'.join(out)


# ============================================================
# TEMPLATE
# ============================================================

def render_html(meta, sections):
    number = meta.get('number', '?')
    doc_id = meta.get('id', 'doc')
    title = meta.get('title', 'Sin título')
    subtitle = meta.get('subtitle', '')
    block = meta.get('block', 'Banco')
    author = meta.get('author', 'Cerebro')
    version = meta.get('version', '1.0')
    date = meta.get('date', '2026-05-26')
    status = meta.get('status', '🟢 Activo')
    prev_doc = meta.get('prev', '')
    next_doc = meta.get('next', '')

    # cover
    title_html = title.replace(' & ', '<br>')

    # TOC
    toc_html = '<ol>'
    for idx, (sec_title, _) in enumerate(sections, 1):
        pg = f'{idx + 2:02d}'
        anchor = re.sub(r'[^a-z0-9]+', '-', sec_title.lower()).strip('-')
        toc_html += f'<li><a href="#{anchor}">{md_inline(sec_title)}</a><span class="toc-pg">{pg}</span></li>'
    toc_html += '</ol>'

    # secciones
    sections_html = []
    for idx, (sec_title, sec_body) in enumerate(sections, 1):
        anchor = re.sub(r'[^a-z0-9]+', '-', sec_title.lower()).strip('-')
        num_match = re.match(r'^(\d+)', sec_title)
        h2_num = num_match.group(1) if num_match else f'{idx:02d}'
        h2_title = re.sub(r'^\d+\s*·\s*', '', sec_title)
        pg = f'{idx + 2:02d}'
        body_html = md_to_html(sec_body)
        sections_html.append(f'''<section class="page" id="{anchor}">
  <h2><span class="h2-num">{h2_num}</span>{md_inline(h2_title)}</h2>
  {body_html}
  <div class="page-footer"><span>Banco SMC · {block}</span><span>{pg}</span></div>
</section>''')

    # nav
    nav_prev = f'<a href="{prev_doc}">◂ doc anterior</a>' if prev_doc else '<a href="index.html">◂ banco</a>'
    nav_next = f'<a href="{next_doc}">doc siguiente ▸</a>' if next_doc else '<a href="index.html">índice ▸</a>'

    html = f'''<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>{number} · {title} · Marketplace SMC</title>
<link rel="stylesheet" href="_styles.css">
<link rel="stylesheet" href="_diagram-kit.css">
</head>
<body>
<nav class="doc-nav">{nav_prev}<span class="nav-center">DOC {number:0>2} · {block.upper()}</span>{nav_next}</nav>
<div class="doc">
<section class="cover">
  <div class="cover-header"><div class="cover-brand">SMART CONNECTION</div><div>Banco · {block}</div></div>
  <div class="cover-center">
    <div class="cover-doc-num">Documento {number} · {block}</div>
    <h1 class="cover-title">{title_html}</h1>
    <p class="cover-subtitle">{subtitle}</p>
    <div class="cover-meta">
      <div class="cover-meta-item"><div class="cover-meta-label">Versión</div><div class="cover-meta-value">{version}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">Fecha</div><div class="cover-meta-value">{date}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">Autor</div><div class="cover-meta-value">{author}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">Status</div><div class="cover-meta-value">{status}</div></div>
    </div>
  </div>
  <div class="cover-footer"><div>Smart Connection SpA · Rut 76.811.863-9</div><div>Confidencial</div></div>
</section>

<section class="page toc">
  <div class="toc-title">Tabla de contenidos</div>
  <h1>Índice</h1>
  {toc_html}
</section>

{chr(10).join(sections_html)}

</div>
<nav class="doc-nav">{nav_prev}<span class="nav-center">FIN DOC {number:0>2}</span>{nav_next}</nav>
<script src="auth.js"></script>
<script src="nav.js"></script>
<script src="_diagram-kit.js"></script>
<script>if (window.SMCDiagram && SMCDiagram.boot) SMCDiagram.boot();</script>
</body>
</html>
'''
    return html


# ============================================================
# MAIN
# ============================================================

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('md_paths', nargs='+')
    ap.add_argument('--apply', action='store_true', help='Escribir HTML')
    ap.add_argument('--dry-run', action='store_true', help='Solo preview')
    args = ap.parse_args()

    for md_str in args.md_paths:
        md_path = Path(md_str).expanduser().resolve()
        if not md_path.exists():
            print(f'❌ {md_path} not found')
            continue

        md = md_path.read_text(encoding='utf-8')
        meta, body = parse_frontmatter(md)

        # Pre-carga sidecars JSON · docs/<stem>/*.json
        _SIDECAR_CACHE.clear()
        sidecar_dir = md_path.parent / md_path.stem
        sidecars_loaded = 0
        if sidecar_dir.exists() and sidecar_dir.is_dir():
            for j in sidecar_dir.glob('*.json'):
                try:
                    _SIDECAR_CACHE[j.stem] = json.loads(j.read_text(encoding='utf-8'))
                    sidecars_loaded += 1
                except Exception as ex:
                    print(f'   ⚠️  sidecar inválido {j.name}: {ex}')

        sections = split_sections(body)

        number = meta.get('number', '?')
        doc_id = meta.get('id', md_path.stem)
        out_name = f'{int(number):02d}-{doc_id}.html'
        out_path = ROOT / out_name

        html = render_html(meta, sections)

        print(f'📄 {md_path.name} · {len(sections)} secciones · {sidecars_loaded} sidecars · → {out_name}')
        if args.apply:
            out_path.write_text(html, encoding='utf-8')
            print(f'   ✓ Escrito · {len(html)} bytes')
        else:
            print('   (dry-run · no escrito)')


if __name__ == '__main__':
    main()
