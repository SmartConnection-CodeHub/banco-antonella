/* ============================================================
   Banco Antonella · Table Motion JS
   · Marca emojis 🔥 🟢 🟡 🔴 con clases para animarlos
   · Intersection Observer para entrada de filas al scroll
   ============================================================ */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function wrapEmojis() {
    document.querySelectorAll('tbody td').forEach(td => {
      // Si ya procesamos, skip
      if (td.dataset.tblWrapped) return;
      td.dataset.tblWrapped = '1';

      const html = td.innerHTML;
      const wrapped = html
        .replace(/🔥/g, '<span class="tbl-pulse-fire">🔥</span>')
        .replace(/🟢/g, '<span class="tbl-pulse-green">🟢</span>')
        .replace(/🟡/g, '<span class="tbl-pulse-warn">🟡</span>')
        .replace(/⚠️/g, '<span class="tbl-pulse-warn">⚠️</span>');
      if (wrapped !== html) td.innerHTML = wrapped;
    });
  }

  // Re-trigger animation cuando la tabla entra en viewport
  function observeTables() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          // Forzar re-run de la animación
          e.target.querySelectorAll('tbody tr').forEach(tr => {
            tr.style.animation = 'none';
            void tr.offsetHeight; // reflow
            tr.style.animation = '';
          });
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('table').forEach(t => io.observe(t));
  }

  function init() {
    wrapEmojis();
    observeTables();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
