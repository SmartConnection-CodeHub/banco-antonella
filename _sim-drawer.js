/* ============================================================
   Banco Antonella · Simulador Drawer (botón lateral derecho)
   · Estilo LEMPAR · slide-in desde derecha con iframe simulador
   · Botón "Guardar / Exportar JSON" para llevar valores a GitHub
   ============================================================ */
(function () {
  if (document.getElementById('smc-gate')) return;
  if (document.getElementById('sim-trigger')) return;

  const STORAGE_KEY = 'banco-antonella-sim-v1';

  // ─── CSS inyectado ───
  const css = `
    @keyframes sim-bob { 0%,100% { transform: translateY(-50%); } 50% { transform: translateY(calc(-50% - 4px)); } }
    @keyframes sim-pulse-burdeo {
      0%,100% { box-shadow: 0 6px 24px rgba(155, 30, 50, .35), 0 0 0 0 rgba(155, 30, 50, .35); }
      50%     { box-shadow: 0 6px 24px rgba(155, 30, 50, .45), 0 0 0 12px rgba(155, 30, 50, 0); }
    }
    @keyframes sim-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes sim-fade-in  { from { opacity: 0; } to { opacity: 1; } }

    #sim-trigger {
      position: fixed;
      top: 50%; right: 18px;
      transform: translateY(-50%);
      z-index: 9998;
      width: 44px; height: 44px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #C24A55, #8E1E32);
      border: 1.5px solid rgba(255, 255, 255, 0.20);
      box-shadow: 0 6px 24px rgba(142, 30, 50, .40), 0 0 0 1px rgba(255,255,255,.08);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: transform .25s cubic-bezier(.4,0,.2,1);
      animation: sim-bob 5s ease-in-out infinite, sim-pulse-burdeo 3s ease-in-out infinite;
    }
    #sim-trigger:hover { transform: translateY(-50%) scale(1.10) rotate(-6deg); }
    #sim-trigger svg { width: 20px; height: 20px; }

    /* mobile · esquina inferior derecha */
    @media (max-width: 800px) {
      #sim-trigger {
        top: auto; bottom: 24px; right: 18px;
        transform: translateY(0);
        animation: sim-pulse-burdeo 3s ease-in-out infinite;
      }
      #sim-trigger:hover { transform: scale(1.08) rotate(-6deg); }
    }

    #sim-backdrop {
      position: fixed; inset: 0; z-index: 9996;
      background: rgba(15, 31, 56, .60);
      backdrop-filter: blur(6px);
      animation: sim-fade-in .25s ease;
    }
    #sim-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 9997;
      width: 540px; max-width: 96vw;
      background: linear-gradient(180deg, #14253E 0%, #0F1F38 100%);
      box-shadow: -20px 0 60px rgba(0,0,0,.5);
      animation: sim-slide-in .35s cubic-bezier(.16,1,.3,1);
      display: flex; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
      overflow: hidden;
    }
    .sim-head {
      padding: 22px 26px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;
      flex-shrink: 0;
    }
    .sim-head-title {
      flex: 1;
    }
    .sim-kicker {
      font: 700 10px var(--font); color: #C49A3A; letter-spacing: .18em;
      text-transform: uppercase; margin-bottom: 4px;
    }
    .sim-h1 {
      font: 800 24px var(--font); color: #fff; letter-spacing: -.012em; margin: 0;
    }
    .sim-h1 em { color: #C49A3A; font-style: normal; }
    .sim-close {
      width: 38px; height: 38px; border-radius: 50%;
      border: none;
      background: rgba(155, 30, 50, .85);
      color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .25s; flex-shrink: 0;
    }
    .sim-close:hover { background: #C24A55; transform: rotate(90deg); }
    .sim-close svg { width: 18px; height: 18px; }

    .sim-toolbar {
      padding: 12px 26px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex; gap: 8px; flex-wrap: wrap;
      flex-shrink: 0;
      background: rgba(0,0,0,0.18);
    }
    .sim-btn {
      appearance: none; border: 1px solid rgba(232,165,184,.30);
      background: rgba(232,165,184,.10); color: #F5E0E8;
      padding: 8px 14px; border-radius: 8px;
      font: 700 11px var(--font); letter-spacing: .06em; text-transform: uppercase;
      cursor: pointer; transition: all .25s;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .sim-btn:hover { background: #C2728F; color: #fff; border-color: #C2728F; }
    .sim-btn.gold { background: rgba(196,154,58,.18); border-color: rgba(196,154,58,.45); color: #F0CB6E; }
    .sim-btn.gold:hover { background: #C49A3A; color: #1B2F4E; }
    .sim-btn.danger { background: rgba(155,30,50,.20); border-color: rgba(194,74,85,.45); color: #FF9AAB; }
    .sim-btn.danger:hover { background: #8E1E32; color: #fff; }

    .sim-body {
      flex: 1; overflow: hidden;
      position: relative;
    }
    .sim-body iframe {
      width: 100%; height: 100%; border: 0;
      background: transparent;
    }

    .sim-toast {
      position: fixed; bottom: 24px; right: 80px; z-index: 99999;
      padding: 14px 22px; background: rgba(196,154,58,.95); color: #1B2F4E;
      border-radius: 12px; font: 700 13px var(--font);
      box-shadow: 0 10px 30px rgba(0,0,0,.30);
      animation: sim-fade-in .25s ease;
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ─── Botón trigger ───
  const trigger = document.createElement('button');
  trigger.id = 'sim-trigger';
  trigger.setAttribute('aria-label', 'Abrir simulador');
  trigger.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 3v18M5 7h7a3 3 0 0 1 0 6H5M5 14h9a3 3 0 0 1 0 6H5"/>
    </svg>
  `;
  document.body.appendChild(trigger);

  // ─── Drawer ───
  let drawer, backdrop;
  function openDrawer() {
    if (drawer) return;
    backdrop = document.createElement('div');
    backdrop.id = 'sim-backdrop';
    backdrop.addEventListener('click', closeDrawer);
    document.body.appendChild(backdrop);

    drawer = document.createElement('aside');
    drawer.id = 'sim-drawer';
    drawer.innerHTML = `
      <div class="sim-head">
        <div class="sim-head-title">
          <div class="sim-kicker">Simulador · Doc 11</div>
          <h2 class="sim-h1"><em>Edita</em> tus números</h2>
        </div>
        <button class="sim-close" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>
      </div>
      <div class="sim-toolbar">
        <button class="sim-btn gold" id="sim-export">💾 Exportar JSON</button>
        <button class="sim-btn" id="sim-copy">📋 Copiar al portapapeles</button>
        <button class="sim-btn danger" id="sim-reset">↺ Restaurar defaults</button>
        <button class="sim-btn" id="sim-fullscreen">🔍 Abrir página completa</button>
      </div>
      <div class="sim-body">
        <iframe id="sim-iframe" src="11-simulador.html?embed=1"></iframe>
      </div>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector('.sim-close').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', escClose);

    drawer.querySelector('#sim-export').addEventListener('click', exportJSON);
    drawer.querySelector('#sim-copy').addEventListener('click', copyJSON);
    drawer.querySelector('#sim-reset').addEventListener('click', resetSim);
    drawer.querySelector('#sim-fullscreen').addEventListener('click', () => {
      window.location.href = '11-simulador.html';
    });
  }
  function closeDrawer() {
    document.removeEventListener('keydown', escClose);
    if (backdrop) { backdrop.remove(); backdrop = null; }
    if (drawer) { drawer.remove(); drawer = null; }
  }
  function escClose(e) { if (e.key === 'Escape') closeDrawer(); }
  trigger.addEventListener('click', openDrawer);

  // ─── Acciones toolbar ───
  function getState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
  }
  function exportJSON() {
    const state = getState();
    const wrap = {
      banco: 'antonella',
      exportedAt: new Date().toISOString(),
      simulator: state,
      readme: 'Para guardar estos valores en el repo · pega este JSON dentro de docs/sim-state.json y commitea.'
    };
    const blob = new Blob([JSON.stringify(wrap, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sim-antonella-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ JSON descargado');
  }
  function copyJSON() {
    const state = getState();
    const txt = JSON.stringify(state, null, 2);
    navigator.clipboard?.writeText(txt).then(() => showToast('📋 Copiado · pega en docs/sim-state.json'));
  }
  function resetSim() {
    if (!confirm('¿Borrar todos los valores guardados del simulador?')) return;
    localStorage.removeItem(STORAGE_KEY);
    // Recargar el iframe para reflejar los defaults
    const iframe = document.getElementById('sim-iframe');
    if (iframe) iframe.src = iframe.src;
    showToast('↺ Valores restaurados');
  }
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'sim-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; }, 2200);
    setTimeout(() => t.remove(), 2700);
  }
})();
