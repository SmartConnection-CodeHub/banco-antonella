#!/usr/bin/env python3
"""
inject_diagram.py · helper para inyectar diagramas interactivos en HTMLs manuales.

Uso:
  python3 inject_diagram.py <html> <kind> <id> <json_path> [--after-id=hl] [--title=...] [--caption=...]

Inserta:
  1. <link _diagram-kit.css> en head (si no está)
  2. <script _diagram-kit.js> + boot() al final (si no está)
  3. Sección nueva con <div class="diagram-host" data-kind=X id=Y> + <script type="application/json" data-for=Y>{...}</script>

La sección se inserta DESPUÉS del </section> con id especificado (--after-id).
"""

import argparse
import json
import re
import sys
from pathlib import Path

CSS_LINK = '<link rel="stylesheet" href="_diagram-kit.css">'
KIT_JS   = '<script src="_diagram-kit.js"></script>'
BOOT_JS  = '<script>if (window.SMCDiagram && SMCDiagram.boot) SMCDiagram.boot();</script>'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('html_path')
    ap.add_argument('kind')
    ap.add_argument('id_')
    ap.add_argument('json_path')
    ap.add_argument('--after-id', default=None, help='Insertar la sección DESPUÉS del </section> con este id')
    ap.add_argument('--title', default='')
    ap.add_argument('--caption', default='')
    ap.add_argument('--h2-num', default='00b', help='Número h2 a usar')
    args = ap.parse_args()

    html_path = Path(args.html_path)
    json_path = Path(args.json_path)
    html = html_path.read_text(encoding='utf-8')
    data = json.loads(json_path.read_text(encoding='utf-8'))

    # 1) link css
    if CSS_LINK not in html:
        html = re.sub(r'(<link rel="stylesheet" href="_styles\.css">)',
                      r'\1\n' + CSS_LINK, html, count=1)

    # 2) kit js + boot
    if KIT_JS not in html:
        html = html.replace(
            '<script src="auth.js"></script>\n<script src="nav.js"></script>\n</body>',
            f'<script src="auth.js"></script>\n<script src="nav.js"></script>\n{KIT_JS}\n{BOOT_JS}\n</body>'
        )

    # 3) sección con host + data inline
    section = f'''
<section class="page" id="{args.id_}-section">
  <h2><span class="h2-num">{args.h2_num}</span>{args.title or 'Diagrama interactivo'}</h2>
  {f'<p style="color:#475569;font-size:14px;line-height:1.6;margin-top:-8px;">{args.caption}</p>' if args.caption else ''}
  <div class="diagram-host kind-{args.kind}" id="{args.id_}" data-kind="{args.kind}"></div>
  <script type="application/json" data-for="{args.id_}">{json.dumps(data, ensure_ascii=False)}</script>
  <div class="page-footer"><span>Banco SMC</span><span>—</span></div>
</section>
'''
    if args.after_id:
        # insertar después del </section> que sigue a id="<after-id>"
        pattern = re.compile(rf'(<section class="page" id="{re.escape(args.after_id)}">.*?</section>)', re.DOTALL)
        m = pattern.search(html)
        if m:
            html = html[:m.end()] + section + html[m.end():]
        else:
            print(f'⚠️  No encontró </section id={args.after_id}> · pegando antes de </div></body>')
            html = html.replace('</div>\n<nav class="doc-nav">', section + '</div>\n<nav class="doc-nav">', 1)
    else:
        # Fallback: insertar después del primer </section> que sigue al TOC
        toc_pattern = re.compile(r'(<section class="page toc">.*?</section>)', re.DOTALL)
        m = toc_pattern.search(html)
        if m:
            html = html[:m.end()] + section + html[m.end():]
        else:
            html = html.replace('</div>\n<nav class="doc-nav">', section + '</div>\n<nav class="doc-nav">', 1)

    html_path.write_text(html, encoding='utf-8')
    print(f'✓ {html_path.name} · {args.kind} · {args.id_} · {len(html)} bytes')


if __name__ == '__main__':
    main()
