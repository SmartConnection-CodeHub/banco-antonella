/* ============================================================
   Banco Antonella · Motion Boot Script
   · Inyecta pétalos + sparkles
   · Tracking mouse para spotlight
   · Powder burst en clicks
   ============================================================ */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ─── Pétalos desactivados (feedback: se confunden con UI) ───
  // (motion #3 removido)

  // ─── Sparkles desactivados (feedback: confunde con polvo) ───

  // ─── Spotlight cursor desactivado (distrae lectura) ───

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
