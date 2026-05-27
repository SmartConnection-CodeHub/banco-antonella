/* ============================================================
   Banco Antonella · Simulador Drawer (botón lateral derecho)
    · slide-in desde derecha con iframe simulador
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
      transition: width .35s cubic-bezier(.16,1,.3,1), left .35s cubic-bezier(.16,1,.3,1);
    }
    #sim-drawer.is-fullscreen {
      width: 100vw !important;
      max-width: 100vw !important;
      left: 0 !important;
    }
    #sim-drawer.is-fullscreen .sim-head { padding: 18px 32px 14px; }
    #sim-drawer.is-fullscreen .sim-toolbar { padding: 12px 32px; }
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
    .sim-btn.save { background: linear-gradient(135deg, #C2728F, #8E5870); border-color: #C2728F; color: #fff; font-weight: 800; }
    .sim-btn.save:hover { background: linear-gradient(135deg, #8E5870, #6E4055); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(194,114,143,.35); }
    .sim-btn.save:active { transform: translateY(0); }

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
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
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
        <button class="sim-btn save" id="sim-save">💾 Guardar cambios</button>
        <button class="sim-btn" id="sim-fullscreen">🔍 Pantalla completa</button>
        <button class="sim-btn danger" id="sim-reset">↺ Reiniciar</button>
      </div>
      <div id="sim-save-status" style="padding:8px 26px;background:rgba(122,210,124,.10);font:600 11px var(--font);color:#A8E0AA;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:8px;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#7AD27C;box-shadow:0 0 8px #7AD27C;"></span>
        <span id="sim-save-msg">Tus cambios se guardan solos · click 💾 Guardar para confirmar</span>
      </div>
      <div class="sim-body">
        <iframe id="sim-iframe" src="11-simulador.html?embed=1"></iframe>
      </div>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector('.sim-close').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', escClose);

    drawer.querySelector('#sim-save').addEventListener('click', saveSnapshot);
    drawer.querySelector('#sim-print').addEventListener('click', printPDF);
    drawer.querySelector('#sim-whatsapp').addEventListener('click', shareWhatsApp);
    drawer.querySelector('#sim-reset').addEventListener('click', resetSim);
    drawer.querySelector('#sim-fullscreen').addEventListener('click', (e) => {
      e.preventDefault();
      drawer.classList.toggle('is-fullscreen');
      const btn = drawer.querySelector('#sim-fullscreen');
      const isFs = drawer.classList.contains('is-fullscreen');
      btn.textContent = isFs ? '↙️ Reducir' : '🔍 Pantalla completa';
      if (backdrop) backdrop.style.display = isFs ? 'none' : 'block';
    });

    updateSaveStatus();
  }
  function updateSaveStatus() {
    const last = localStorage.getItem(STORAGE_KEY + ':lastSave');
    const msgEl = document.getElementById('sim-save-msg');
    if (!msgEl) return;
    if (last) {
      const d = new Date(+last);
      const ago = Math.round((Date.now() - +last) / 1000);
      let when = ago < 60 ? `hace ${ago}s` : ago < 3600 ? `hace ${Math.round(ago/60)} min` : d.toLocaleString('es-CL');
      msgEl.textContent = `✓ Último guardado: ${when}`;
    } else {
      msgEl.textContent = 'Tus cambios se guardan solos · click 💾 Guardar para confirmar';
    }
  }
  // ─── Guardado en la nube (jsonblob.com · sin auth · cross-device) ───
  // Anonymous gists deprecados desde 2018 · usamos JSONBlob como reemplazo equivalente.
  const BLOB_API = 'https://jsonblob.com/api/jsonBlob';

  async function saveSnapshot() {
    const btn = document.getElementById('sim-save');
    const orig = btn.textContent;
    btn.textContent = '☁️ Guardando...';
    btn.disabled = true;

    const state = getState();
    const blobId = localStorage.getItem(STORAGE_KEY + ':blobId');
    const payload = {
      banco: 'antonella',
      updatedAt: new Date().toISOString(),
      simulator: state
    };

    try {
      let id = blobId;
      if (id) {
        // PUT · actualizar blob existente
        const r = await fetch(BLOB_API + '/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!r.ok) throw new Error('PUT failed ' + r.status);
      } else {
        // POST · crear blob nuevo
        const r = await fetch(BLOB_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!r.ok) throw new Error('POST failed ' + r.status);
        const loc = r.headers.get('Location') || '';
        id = loc.split('/').pop();
        if (!id) throw new Error('Sin ID');
        localStorage.setItem(STORAGE_KEY + ':blobId', id);
      }
      localStorage.setItem(STORAGE_KEY + ':lastSave', String(Date.now()));
      const link = window.location.origin + window.location.pathname.replace('index.html', '') + 'index.html?id=' + id;
      showSaveModal(link);
      updateSaveStatus();
    } catch (e) {
      console.error('Save error', e);
      // Fallback: localStorage funciona aunque no haya internet
      localStorage.setItem(STORAGE_KEY + ':lastSave', String(Date.now()));
      updateSaveStatus();
      showToast('⚠️ Guardado solo en este navegador (sin internet?)');
    }

    btn.textContent = orig;
    btn.disabled = false;
  }

  function showSaveModal(link) {
    const m = document.createElement('div');
    m.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(15,31,56,.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:sim-fade-in .25s ease;';
    m.innerHTML = `
      <div style="max-width:520px;width:90%;background:linear-gradient(180deg,#14253E 0%,#0F1F38 100%);border-radius:18px;padding:30px 32px;box-shadow:0 25px 80px rgba(0,0,0,.5);color:#fff;font-family:-apple-system,sans-serif;">
        <div style="font:700 11px var(--font);letter-spacing:.16em;color:#7AD27C;text-transform:uppercase;margin-bottom:8px;">✓ Guardado en la nube</div>
        <h3 style="font:800 22px var(--font);margin:0 0 8px;color:#fff;">Tus números están seguros</h3>
        <p style="font:400 13px var(--font);color:rgba(255,255,255,.7);margin:0 0 18px;line-height:1.5;">Copia este link y pegalo en tus notas o WhatsApp. Cuando abras el link desde cualquier dispositivo · vas a ver tus números exactamente como los dejaste.</p>
        <div style="display:flex;gap:6px;background:rgba(0,0,0,.35);border:1px solid rgba(196,154,58,.30);border-radius:10px;padding:10px 14px;margin-bottom:16px;align-items:center;">
          <input id="sim-link-input" value="${link}" readonly style="flex:1;background:transparent;border:0;color:#F0CB6E;font:600 12px 'JetBrains Mono',monospace;outline:none;" />
          <button id="sim-link-copy" style="appearance:none;border:1px solid rgba(196,154,58,.45);background:rgba(196,154,58,.20);color:#F0CB6E;padding:6px 12px;border-radius:8px;font:700 10px var(--font);letter-spacing:.06em;text-transform:uppercase;cursor:pointer;">Copiar</button>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="sim-modal-close" style="appearance:none;border:1px solid rgba(255,255,255,.15);background:transparent;color:#fff;padding:9px 18px;border-radius:8px;font:700 11px var(--font);letter-spacing:.06em;text-transform:uppercase;cursor:pointer;">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    m.querySelector('#sim-link-copy').onclick = () => {
      const inp = m.querySelector('#sim-link-input');
      inp.select();
      navigator.clipboard?.writeText(link).then(() => {
        m.querySelector('#sim-link-copy').textContent = '✓ Copiado';
        setTimeout(() => m.remove(), 1000);
      });
    };
    m.querySelector('#sim-modal-close').onclick = () => m.remove();
    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
  }

  // ─── Cargar estado desde URL (si llega con ?id=ABC) ───
  async function loadFromURL() {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (!id) return;
    try {
      const r = await fetch(BLOB_API + '/' + id, { headers: { 'Accept': 'application/json' } });
      if (!r.ok) throw new Error('GET failed ' + r.status);
      const data = await r.json();
      if (data && data.simulator) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.simulator));
        localStorage.setItem(STORAGE_KEY + ':blobId', id);
        localStorage.setItem(STORAGE_KEY + ':lastSave', String(Date.now()));
        showToast('☁️ Cargado desde la nube · ' + (data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('es-CL') : 'tus números'));
      }
    } catch (e) {
      console.warn('Load from URL failed', e);
    }
  }
  loadFromURL();
  function closeDrawer() {
    document.removeEventListener('keydown', escClose);
    if (backdrop) { backdrop.remove(); backdrop = null; }
    if (drawer) { drawer.remove(); drawer = null; }
    // Re-renderizar variables propagadas en la página
    if (window.AntoVars && typeof window.AntoVars.render === 'function') {
      window.AntoVars.render();
    }
  }
  function escClose(e) { if (e.key === 'Escape') closeDrawer(); }
  trigger.addEventListener('click', openDrawer);

  // ─── Acciones toolbar ───
  function getState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
  }

  function resetSim() {
    if (!confirm('¿Volver a los valores iniciales del simulador?\n\nTus cambios actuales se perderán.')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + ':blobId');
    const iframe = document.getElementById('sim-iframe');
    if (iframe) iframe.src = iframe.src;
    showToast('↺ Valores iniciales restaurados');
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
