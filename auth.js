/* ===========================================================
   Banco Antonella · Auth Gate (light barrier)
   ⚠️ Barrera UI · cualquiera con devtools puede bypass.
   =========================================================== */
(function(){
  // SHA-256 del PIN "anto" (4 caracteres · banco Antonella)
  const PIN_HASH = '0348beb745f863940c77cc68dc7b724fd5998186f5c2ad4e72febbb6c0be0578';
  const PIN_LEN  = 4;

  async function sha256(text){
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function setAuthed(){ sessionStorage.setItem('smc_banco_auth', 'ok'); }
  function isAuthed(){ return sessionStorage.getItem('smc_banco_auth') === 'ok'; }

  if (isAuthed()) return;

  document.documentElement.style.visibility = 'hidden';

  function init(){
    const style = document.createElement('style');
    style.textContent = `
      @keyframes smc-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes smc-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
      #smc-gate * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      #smc-gate {
        position: fixed; inset: 0; z-index: 99999;
        background: #0A0E1A;
        background-image: radial-gradient(ellipse at top left, rgba(0,193,193,0.08) 0%, transparent 50%),
                          radial-gradient(ellipse at bottom right, rgba(124,58,237,0.05) 0%, transparent 50%);
        display: flex; align-items: center; justify-content: center;
        animation: smc-fadein .5s ease;
      }
      .smc-card {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(0, 193, 193, 0.2);
        border-radius: 24px;
        padding: 64px 80px;
        max-width: 560px; width: 90%;
        text-align: center;
        backdrop-filter: blur(20px);
      }
      .smc-logo {
        display: flex; align-items: center; justify-content: center;
        gap: 16px; margin-bottom: 56px;
      }
      .smc-logo svg { filter: drop-shadow(0 0 16px rgba(0,193,193,0.4)); }
      .smc-brand {
        font-size: 32px; font-weight: 800; letter-spacing: 4px;
        color: white;
      }
      .smc-brand span { color: #00C1C1; }
      .smc-title {
        font-size: 28px; font-weight: 800; color: white;
        margin: 0 0 8px;
      }
      .smc-sub {
        font-size: 14px; color: rgba(255,255,255,0.45);
        margin: 0 0 40px; font-weight: 400;
      }
      .smc-boxes {
        display: flex; justify-content: center; gap: 14px;
        margin-bottom: 24px;
      }
      .smc-box {
        width: 72px; height: 80px;
        background: rgba(15, 23, 42, 0.5);
        border: 2px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        font-size: 32px; font-weight: 700;
        color: white; text-align: center;
        outline: none; transition: all .15s ease;
        font-family: 'JetBrains Mono', 'SF Mono', monospace;
      }
      .smc-box:focus, .smc-box.active {
        border-color: #00C1C1;
        background: rgba(0, 193, 193, 0.05);
        box-shadow: 0 0 24px rgba(0, 193, 193, 0.3), inset 0 0 16px rgba(0, 193, 193, 0.05);
      }
      .smc-box.filled { border-color: rgba(0, 193, 193, 0.4); }
      .smc-err {
        height: 20px; color: #F87171; font-size: 12px;
        font-weight: 500; letter-spacing: 0.5px;
      }
      .smc-boxes.error { animation: smc-shake .4s ease; }
      .smc-boxes.error .smc-box { border-color: rgba(239, 68, 68, 0.5); }
      .smc-hint {
        margin-top: 32px; font-size: 11px;
        color: rgba(255,255,255,0.25);
        letter-spacing: 2px; text-transform: uppercase;
      }
    `;
    document.head.appendChild(style);

    document.body.innerHTML = `
      <div id="smc-gate">
        <div class="smc-card">
          <div class="smc-logo">
            <svg width="42" height="42" viewBox="0 0 64 64" fill="none">
              <path d="M48 36c0-7.732-6.268-14-14-14-6.83 0-12.515 4.886-13.764 11.353C16.18 34.078 13 37.668 13 42c0 4.97 4.03 9 9 9h24c4.418 0 8-3.582 8-8 0-3.473-2.213-6.43-5.305-7.534" stroke="#00C1C1" stroke-width="3" stroke-linecap="round"/>
              <path d="M26 42l5 5 9-11" stroke="#00C1C1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="smc-brand">SMART<span>CONNECTION</span></div>
          </div>
          <h1 class="smc-title">Banco · Antonella</h1>
          <p class="smc-sub">Ingresa tu PIN de acceso</p>
          <div class="smc-boxes" id="smc-boxes">
            ${Array.from({length: PIN_LEN}).map((_, i) =>
              `<input class="smc-box" maxlength="1" data-idx="${i}" autocapitalize="off" autocomplete="off" spellcheck="false"/>`
            ).join('')}
          </div>
          <div class="smc-err" id="smc-err"></div>
          <div class="smc-hint">Confidencial · uso interno SMC</div>
        </div>
      </div>
    `;
    document.documentElement.style.visibility = 'visible';

    const boxes  = Array.from(document.querySelectorAll('.smc-box'));
    const wrap   = document.getElementById('smc-boxes');
    const errEl  = document.getElementById('smc-err');

    setTimeout(() => boxes[0].focus(), 200);

    async function tryAuth(){
      const pin = boxes.map(b => b.value).join('').toLowerCase();
      if (pin.length !== PIN_LEN) return;
      const h = await sha256(pin);
      if (h === PIN_HASH){
        setAuthed();
        // Pequeña pausa visual antes de cargar
        wrap.style.transition = 'opacity .3s'; wrap.style.opacity = '0.4';
        errEl.textContent = '';
        boxes.forEach(b => b.style.borderColor = '#22C55E');
        setTimeout(() => location.reload(), 350);
      } else {
        wrap.classList.add('error');
        errEl.textContent = 'PIN incorrecto · intenta de nuevo';
        setTimeout(() => {
          wrap.classList.remove('error');
          boxes.forEach(b => b.value = '');
          boxes[0].focus();
          errEl.textContent = '';
        }, 800);
      }
    }

    boxes.forEach((box, idx) => {
      box.addEventListener('input', e => {
        const v = e.target.value;
        if (v.length > 0){
          box.classList.add('filled');
          if (idx < PIN_LEN - 1) boxes[idx + 1].focus();
          else tryAuth();
        } else {
          box.classList.remove('filled');
        }
      });
      box.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !box.value && idx > 0){
          boxes[idx - 1].focus();
          boxes[idx - 1].value = '';
          boxes[idx - 1].classList.remove('filled');
        }
        if (e.key === 'ArrowLeft' && idx > 0) boxes[idx - 1].focus();
        if (e.key === 'ArrowRight' && idx < PIN_LEN - 1) boxes[idx + 1].focus();
      });
      box.addEventListener('paste', e => {
        e.preventDefault();
        const data = (e.clipboardData.getData('text') || '').toLowerCase().slice(0, PIN_LEN);
        data.split('').forEach((ch, i) => {
          if (boxes[i]){ boxes[i].value = ch; boxes[i].classList.add('filled'); }
        });
        if (data.length === PIN_LEN) tryAuth();
        else boxes[Math.min(data.length, PIN_LEN - 1)].focus();
      });
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
