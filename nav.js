/* ===========================================================
   Marketplace SMC · Banco · Tree Navigation Drawer
   Motion premium · slide-in desde derecha · árbol de docs
   =========================================================== */
(function(){
  // Si está en gate auth · no inyectar nav
  if (document.getElementById('smc-gate')) return;

  const BLOCKS = [
    { id: 'tech', emoji: '📦', name: 'Producto Técnico', color: '#00C1C1', docs: [
      { n: '01', t: 'Vision & Prospect',      f: '01-vision.html',        s: 'ok' },
      { n: '02', t: 'Business Blueprint',     f: '02-bbp.html',           s: 'ok' },
      { n: '03', t: 'Requirements',           f: '03-requirements.html',  s: 'ok' },
      { n: '04', t: 'RFP',                    f: '04-rfp.html',           s: 'ok' },
      { n: '05', t: 'Data Model',             f: '05-data-model.html',    s: 'ok' },
      { n: '06', t: 'API Catalog',            f: '06-api-catalog.html',   s: 'ok' },
      { n: '07', t: 'Architecture',           f: '07-architecture.html',  s: 'ok' },
      { n: '08', t: 'Roadmap',                f: '08-roadmap.html',       s: 'ok' },
    ]},
    { id: 'found', emoji: '👥', name: 'Founders Operation', color: '#C026D3', docs: [
      { n: '12', t: 'Roles Founders',         f: '12-roles-founders.html',   s: 'ok' },
      { n: '14', t: 'Founders Journey',       f: '14-founders-journey.html', s: 'ok' },
      { n: '15', t: 'Valor Interno SMC SpA',  f: '15-value-internal.html',   s: 'ok' },
      { n: '16', t: 'Comparativa Tools',      f: '16-comparativa-tools.html',s: 'ok' },
    ]},
    { id: 'biz', emoji: '💼', name: 'Negocio & Comercio', color: '#F59E0B', docs: [
      { n: '21', t: 'Modelo Comercio',         f: '21-business-comercio.html', s: 'ok' },
      { n: '23', t: 'Financial Model Comercio',f: '23-financial-comercio.html',s: 'ok' },
      { n: '24', t: 'Margen por Canal',        f: '24-margen-canal.html',      s: 'ok' },
    ]},
    { id: 'brand', emoji: '🎙️', name: 'Marca interna', color: '#7C3AED', docs: [
      { n: '25', t: 'Brand Book',             f: '25-brand-book.html',       s: 'ok' },
      { n: '26', t: 'Tone of Voice',          f: '26-tone-of-voice.html',    s: 'ok' },
      { n: '27', t: 'Visual Identity',        f: '27-visual-identity.html',  s: 'ok' },
    ]},
    { id: 'legal', emoji: '⚖️', name: 'Legal', color: '#EF4444', docs: [
      { n: '30', t: 'Templates legales',      f: '30-templates-legal.html',  s: 'ok' },
    ]},
    { id: 'sec', emoji: '⛨', name: 'Seguridad', color: '#3B82F6', docs: [
      { n: '31', t: 'Security Policy',        f: '31-security-policy.html',  s: 'ok' },
      { n: '32', t: 'Incident Response',      f: '32-incident-response.html',s: 'ok' },
    ]},
    { id: 'gov', emoji: '👔', name: 'Gobernanza & Ops', color: '#94A3B8', docs: [
      { n: '33', t: 'PRD Template',           f: '33-prd-template.html',         s: 'ok' },
      { n: '34', t: 'OKRs Framework',         f: '34-okrs-framework.html',       s: 'ok' },
      { n: '35', t: 'Risk Register',          f: '35-risk-register.html',        s: 'ok' },
      { n: '36', t: 'Stakeholder Map · RACI', f: '36-stakeholder-map.html',      s: 'ok' },
      { n: '37', t: 'Runbook · DR Plan',      f: '37-runbook-dr-plan.html',      s: 'ok' },
      { n: '38', t: 'Onboarding Dev',         f: '38-onboarding-dev.html',       s: 'ok' },
      { n: '39', t: 'API SDK · Postman',      f: '39-api-sdk-postman.html',      s: 'ok' },
      { n: '40', t: 'Glosario',               f: '40-glosario.html',             s: 'ok' },
      { n: '41', t: 'Changelog',              f: '41-changelog.html',            s: 'ok' },
    ]},
  ];

  const currentFile = (location.pathname.split('/').pop() || 'index.html');

  const css = `
    @keyframes smc-nav-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes smc-nav-fade-in  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes smc-nav-radar {
      0%   { transform: scale(1);   opacity: 0.85; }
      80%  { opacity: 0; }
      100% { transform: scale(3.2); opacity: 0; }
    }
    @keyframes smc-nav-bob {
      0%, 100% { transform: translateY(-50%) translateX(0); }
      50%      { transform: translateY(-50%) translateX(-3px); }
    }

    /* botón centrado vertical · lateral derecho */
    #smc-nav-toggle {
      position: fixed;
      top: 50%; right: 22px;
      transform: translateY(-50%);
      z-index: 9998;
      width: 56px; height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #0F172A 0%, #0F766E 100%);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 193, 193, 0.45);
      box-shadow: 0 6px 24px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 193, 193, 0.15);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: background .2s ease, box-shadow .2s ease;
      animation: smc-nav-bob 4s ease-in-out infinite;
    }

    /* 2 anillos radar concéntricos · stagger 1s */
    #smc-nav-toggle::before,
    #smc-nav-toggle::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      border: 2px solid #00C1C1;
      animation: smc-nav-radar 2.4s cubic-bezier(.22, 1, .36, 1) infinite;
      pointer-events: none;
    }
    #smc-nav-toggle::after { animation-delay: 1.2s; }

    /* hover · pausa radar · agranda · brilla teal */
    #smc-nav-toggle:hover {
      background: linear-gradient(135deg, #0F766E 0%, #00C1C1 100%);
      box-shadow: 0 8px 32px rgba(0, 193, 193, 0.45), 0 0 0 2px rgba(0, 193, 193, 0.6);
    }
    #smc-nav-toggle:hover,
    #smc-nav-toggle:hover::before,
    #smc-nav-toggle:hover::after,
    #smc-nav-toggle.open,
    #smc-nav-toggle.open::before,
    #smc-nav-toggle.open::after {
      animation: none;
    }
    #smc-nav-toggle.open {
      transform: translateY(-50%) scale(0.95);
    }
    #smc-nav-toggle.open::before,
    #smc-nav-toggle.open::after { opacity: 0; }

    #smc-nav-toggle svg { width: 26px; height: 26px; position: relative; z-index: 1; }
    #smc-nav-toggle .bar { stroke: #00C1C1; stroke-width: 2.5; stroke-linecap: round; transition: all .25s ease; }
    #smc-nav-toggle:hover .bar { stroke: white; }
    #smc-nav-toggle.open .bar-1 { transform: rotate(45deg) translate(4px, 4px); }
    #smc-nav-toggle.open .bar-2 { opacity: 0; }
    #smc-nav-toggle.open .bar-3 { transform: rotate(-45deg) translate(4px, -4px); }
    #smc-nav-toggle.open .bar { stroke: white; }

    /* mobile · botón más chico, esquina inferior */
    @media (max-width: 800px) {
      #smc-nav-toggle {
        top: auto; bottom: 24px; right: 18px;
        transform: translateY(0);
        width: 52px; height: 52px;
        animation: none;
      }
      @keyframes smc-nav-radar {
        0%   { transform: scale(1);   opacity: 0.85; }
        80%  { opacity: 0; }
        100% { transform: scale(2.4); opacity: 0; }
      }
    }

    #smc-nav-backdrop {
      position: fixed; inset: 0; z-index: 9996;
      background: rgba(10, 14, 26, 0.7); backdrop-filter: blur(4px);
      animation: smc-nav-fade-in .25s ease;
    }

    #smc-nav-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 9997;
      width: 380px; max-width: 92vw;
      background: linear-gradient(180deg, #0A0E1A 0%, #0F172A 100%);
      box-shadow: -16px 0 64px rgba(0,0,0,0.5);
      animation: smc-nav-slide-in .35s cubic-bezier(.16, 1, .3, 1);
      display: flex; flex-direction: column;
      font-family: 'Inter', -apple-system, sans-serif;
      overflow: hidden;
    }
    #smc-nav-drawer * { box-sizing: border-box; }
    .smc-nav-head {
      padding: 28px 28px 20px; flex-shrink: 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .smc-nav-brand {
      display: flex; align-items: center; gap: 10px;
      font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
      color: #00C1C1; font-weight: 700; margin-bottom: 14px;
    }
    .smc-nav-brand::before { content: '◆'; }
    .smc-nav-title {
      font-size: 22px; font-weight: 800; color: white; margin: 0;
      letter-spacing: -0.5px;
    }
    .smc-nav-sub {
      font-size: 11px; color: rgba(255,255,255,0.45);
      letter-spacing: 1.5px; text-transform: uppercase; margin-top: 6px;
    }
    .smc-nav-stats {
      display: flex; gap: 16px; margin-top: 14px;
      font-size: 10px; color: rgba(255,255,255,0.4);
      letter-spacing: 1px; text-transform: uppercase;
    }
    .smc-nav-stats strong { color: #00C1C1; font-size: 14px; display: block; }

    .smc-nav-body {
      flex: 1; overflow-y: auto; padding: 16px 0;
    }
    .smc-nav-body::-webkit-scrollbar { width: 6px; }
    .smc-nav-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 6px; }

    .smc-nav-block { margin-bottom: 4px; }
    .smc-nav-block-head {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 28px; cursor: pointer;
      transition: background .15s ease;
      border-left: 3px solid transparent;
    }
    .smc-nav-block-head:hover { background: rgba(255,255,255,0.03); }
    .smc-nav-block-head.has-active { border-left-color: var(--blk-color, #00C1C1); background: rgba(255,255,255,0.03); }
    .smc-nav-block-icon { font-size: 16px; }
    .smc-nav-block-name {
      flex: 1; font-size: 13px; font-weight: 700;
      color: rgba(255,255,255,0.85); letter-spacing: 0.3px;
    }
    .smc-nav-block-count {
      font-size: 10px; color: rgba(255,255,255,0.35);
      font-family: 'JetBrains Mono', monospace; font-weight: 600;
      letter-spacing: 1px;
    }
    .smc-nav-block-arrow {
      transition: transform .25s ease; color: rgba(255,255,255,0.3); font-size: 11px;
    }
    .smc-nav-block.open .smc-nav-block-arrow { transform: rotate(90deg); color: var(--blk-color); }

    .smc-nav-items {
      max-height: 0; overflow: hidden;
      transition: max-height .35s cubic-bezier(.4, 0, .2, 1);
    }
    .smc-nav-block.open .smc-nav-items { max-height: 2000px; }

    .smc-nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 9px 28px 9px 44px;
      text-decoration: none; color: rgba(255,255,255,0.6);
      font-size: 13px; transition: all .15s ease;
      border-left: 3px solid transparent;
      position: relative;
    }
    .smc-nav-item:hover { background: rgba(255,255,255,0.04); color: white; border-left-color: var(--blk-color); }
    .smc-nav-item.active {
      background: rgba(0,193,193,0.08);
      color: white; border-left-color: var(--blk-color);
      font-weight: 600;
    }
    .smc-nav-item.active::after {
      content: ''; position: absolute; right: 18px; top: 50%; transform: translateY(-50%);
      width: 6px; height: 6px; border-radius: 50%; background: var(--blk-color);
      box-shadow: 0 0 8px var(--blk-color);
    }
    .smc-nav-item.pending { opacity: 0.35; cursor: not-allowed; }
    .smc-nav-item.pending:hover { background: transparent; color: rgba(255,255,255,0.4); border-left-color: transparent; }
    .smc-nav-item-num {
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      color: var(--blk-color); font-weight: 700; min-width: 22px;
      opacity: 0.8;
    }
    .smc-nav-item-title { flex: 1; }
    .smc-nav-item-pending {
      font-size: 9px; color: rgba(255,255,255,0.3); letter-spacing: 1px;
      text-transform: uppercase; font-weight: 700;
    }

    .smc-nav-foot {
      padding: 18px 28px; border-top: 1px solid rgba(255,255,255,0.06);
      font-size: 10px; color: rgba(255,255,255,0.3);
      letter-spacing: 1.5px; text-transform: uppercase;
      display: flex; justify-content: space-between;
    }
  `;

  function buildDrawer(){
    const total = BLOCKS.reduce((a, b) => a + b.docs.length, 0);
    const listo = BLOCKS.reduce((a, b) => a + b.docs.filter(d => d.s === 'ok').length, 0);

    const html = `
      <div id="smc-nav-backdrop"></div>
      <aside id="smc-nav-drawer">
        <div class="smc-nav-head">
          <div class="smc-nav-brand">Smart Connection</div>
          <h2 class="smc-nav-title">Banco · Marketplace</h2>
          <div class="smc-nav-sub">v1.0 · 2026-05-26</div>
          <div class="smc-nav-stats">
            <div><strong>${listo}</strong>Listos</div>
            <div><strong>${total - listo}</strong>Pending</div>
            <div><strong>${BLOCKS.length}</strong>Bloques</div>
          </div>
        </div>
        <div class="smc-nav-body">
          ${BLOCKS.map(blk => {
            const hasActive = blk.docs.some(d => d.f === currentFile);
            const okCount = blk.docs.filter(d => d.s === 'ok').length;
            return `
              <div class="smc-nav-block ${hasActive ? 'open' : ''}" style="--blk-color:${blk.color}" data-blk="${blk.id}">
                <div class="smc-nav-block-head ${hasActive ? 'has-active' : ''}">
                  <span class="smc-nav-block-icon">${blk.emoji}</span>
                  <span class="smc-nav-block-name">${blk.name}</span>
                  <span class="smc-nav-block-count">${okCount}/${blk.docs.length}</span>
                  <span class="smc-nav-block-arrow">▸</span>
                </div>
                <div class="smc-nav-items">
                  ${blk.docs.map(d => {
                    const active   = d.f === currentFile;
                    const pending  = d.s === 'pending';
                    const href     = pending ? '#' : d.f;
                    return `
                      <a class="smc-nav-item ${active ? 'active' : ''} ${pending ? 'pending' : ''}" href="${href}" ${pending ? 'onclick="event.preventDefault()"' : ''}>
                        <span class="smc-nav-item-num">${d.n}</span>
                        <span class="smc-nav-item-title">${d.t}</span>
                        ${pending ? '<span class="smc-nav-item-pending">soon</span>' : ''}
                      </a>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
          <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);margin-top:14px">
            <a class="smc-nav-item" href="index.html" style="padding-left:28px;border-left:none">
              <span class="smc-nav-item-num" style="color:#00C1C1">⌂</span>
              <span class="smc-nav-item-title" style="font-weight:600;color:white">Volver al Índice</span>
            </a>
          </div>
        </div>
        <div class="smc-nav-foot">
          <span>PIN · hoku</span>
          <span>Confidencial</span>
        </div>
      </aside>
    `;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.children[0]); // backdrop
    document.body.appendChild(wrap.children[0]); // drawer (now first since prev moved)

    // Listeners
    const toggle  = document.getElementById('smc-nav-toggle');
    const back    = document.getElementById('smc-nav-backdrop');
    const drawer  = document.getElementById('smc-nav-drawer');

    function close(){
      back.style.animation = 'smc-nav-fade-in .2s ease reverse';
      drawer.style.animation = 'smc-nav-slide-in .25s cubic-bezier(.4, 0, 1, 1) reverse';
      toggle.classList.remove('open');
      setTimeout(() => { back.remove(); drawer.remove(); }, 250);
    }

    back.addEventListener('click', close);
    drawer.querySelectorAll('.smc-nav-block-head').forEach(h => {
      h.addEventListener('click', e => {
        e.stopPropagation();
        h.parentElement.classList.toggle('open');
      });
    });
    document.addEventListener('keydown', function escListener(e){
      if (e.key === 'Escape' && document.getElementById('smc-nav-drawer')){
        close();
        document.removeEventListener('keydown', escListener);
      }
    });
  }

  function init(){
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'smc-nav-toggle';
    btn.setAttribute('aria-label', 'Navegación');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none">
        <path class="bar bar-1" d="M4 7h16"/>
        <path class="bar bar-2" d="M4 12h16"/>
        <path class="bar bar-3" d="M4 17h16"/>
      </svg>
    `;
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      const exists = document.getElementById('smc-nav-drawer');
      if (exists){
        document.getElementById('smc-nav-backdrop').click();
      } else {
        btn.classList.add('open');
        buildDrawer();
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
