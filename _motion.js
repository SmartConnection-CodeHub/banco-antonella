/* ============================================================
   Banco Antonella · Motion Boot Script
   · Inyecta pétalos + sparkles
   · Tracking mouse para spotlight
   · Powder burst en clicks
   ============================================================ */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ─── Inyectar pétalos (motion #3) ───
  const petals = document.createElement('div');
  petals.className = 'anto-petals';
  petals.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 10; i++) petals.appendChild(document.createElement('i'));
  document.body.appendChild(petals);

  // ─── Inyectar sparkles (motion #13) ───
  const sparkles = document.createElement('div');
  sparkles.className = 'anto-sparkles';
  sparkles.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 10; i++) sparkles.appendChild(document.createElement('span'));
  document.body.appendChild(sparkles);

  // ─── Mouse tracking para spotlight (motion #8) ───
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      document.body.style.setProperty('--mouse-x', e.clientX + 'px');
      document.body.style.setProperty('--mouse-y', e.clientY + 'px');
    });
  }

  // ─── Powder burst en clicks (motion #9) ───
  document.addEventListener('click', (e) => {
    const tgt = e.target.closest('a, button, .doc-card, .kpi, .sim-tab');
    if (!tgt) return;
    for (let i = 0; i < 8; i++) {
      const b = document.createElement('div');
      b.className = 'anto-burst';
      const angle = (Math.PI * 2 * i) / 8;
      const dist = 40 + Math.random() * 30;
      b.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      b.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      b.style.left = e.clientX + 'px';
      b.style.top = e.clientY + 'px';
      document.body.appendChild(b);
      setTimeout(() => b.remove(), 800);
    }
  }, { passive: true });
})();
