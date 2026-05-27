/* ===========================================================
   Marketplace SMC · Diagram Kit · v1.0
   Zoom + pan + click bloque → side panel + filtros canal + hover ruta
   Reusa el mismo kit en cualquier diagrama del banco
   =========================================================== */
(function () {
  window.SMCDiagram = window.SMCDiagram || {};

  /**
   * Inicializa un diagrama interactivo.
   * @param {object} cfg
   *   id           · id del .diagram-wrapper
   *   blocks       · { blockId: { type, title, sub, code, desc, stack, owner, channels, related } }
   *   connections  · [ { from, to, label?, channels? } ]   ← se usa para hover ruta
   */
  function init(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;

    const svg = root.querySelector('.diagram-svg');
    const canvas = root.querySelector('.diagram-canvas');
    const panel = root.querySelector('.diagram-panel');
    const panelBody = root.querySelector('.diagram-panel-body');
    const panelType = root.querySelector('.diagram-panel-type');
    const panelTitle = root.querySelector('.diagram-panel-title');
    const panelSub = root.querySelector('.diagram-panel-sub');
    const panelClose = root.querySelector('.diagram-panel-close');
    const zoomInd = root.querySelector('.diagram-zoom-indicator');

    let scale = 1, panX = 0, panY = 0;
    let isDragging = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
    const activeFilters = new Set();
    const blocks = cfg.blocks || {};
    const connections = cfg.connections || [];

    // -----------------------------------------------------------
    // ZOOM + PAN
    // -----------------------------------------------------------
    function applyTransform() {
      svg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
      if (zoomInd) zoomInd.textContent = `${Math.round(scale * 100)}%`;
    }

    function setZoom(newScale, cx, cy) {
      const rect = canvas.getBoundingClientRect();
      cx = cx != null ? cx : rect.width / 2;
      cy = cy != null ? cy : rect.height / 2;
      const ratio = newScale / scale;
      panX = cx - ratio * (cx - panX);
      panY = cy - ratio * (cy - panY);
      scale = newScale;
      applyTransform();
    }

    function fitToScreen() {
      scale = 1; panX = 0; panY = 0;
      applyTransform();
    }

    root.querySelectorAll('[data-zoom]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-zoom');
        if (action === 'in')        setZoom(Math.min(scale * 1.2, 3));
        else if (action === 'out')  setZoom(Math.max(scale / 1.2, 0.4));
        else if (action === 'reset')fitToScreen();
        else if (action === 'fullscreen') root.classList.toggle('is-fullscreen');
      });
    });

    // wheel zoom
    canvas.addEventListener('wheel', (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const delta = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setZoom(Math.max(0.4, Math.min(3, scale * delta)), cx, cy);
    }, { passive: false });

    // drag pan
    canvas.addEventListener('mousedown', (e) => {
      // si fue click en un bloque, no inicia drag (lo deja al click handler)
      if (e.target.closest('.block')) return;
      isDragging = true;
      canvas.classList.add('is-panning');
      dragStartX = e.clientX; dragStartY = e.clientY;
      panStartX = panX; panStartY = panY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panX = panStartX + (e.clientX - dragStartX);
      panY = panStartY + (e.clientY - dragStartY);
      applyTransform();
    });
    window.addEventListener('mouseup', () => {
      if (isDragging) { isDragging = false; canvas.classList.remove('is-panning'); }
    });

    // -----------------------------------------------------------
    // SIDE PANEL
    // -----------------------------------------------------------
    function openPanel(blockId) {
      const data = blocks[blockId];
      if (!data) return;

      panelType.textContent = data.type || 'Bloque';
      panelTitle.textContent = data.title || blockId;
      panelSub.textContent = data.sub || '';

      let html = '';

      if (data.desc) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Descripción</div>
          <p>${data.desc}</p>
        </div>`;
      }
      if (data.stack && data.stack.length) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Stack</div>
          <div class="panel-chips">${data.stack.map(s => `<span class="panel-chip">${s}</span>`).join('')}</div>
        </div>`;
      }
      if (data.channels && data.channels.length) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Canales</div>
          <div class="panel-chips">${data.channels.map(c => `<span class="panel-chip is-channel-${c}">${c.toUpperCase()}</span>`).join('')}</div>
        </div>`;
      }
      if (data.owner) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Owner</div>
          <p>${data.owner}</p>
        </div>`;
      }
      if (data.endpoints && data.endpoints.length) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Endpoints</div>
          <ul>${data.endpoints.map(e => `<li><code>${e}</code></li>`).join('')}</ul>
        </div>`;
      }
      if (data.notes) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Notas</div>
          <p>${data.notes}</p>
        </div>`;
      }
      if (data.related && data.related.length) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Docs relacionados</div>
          <div class="panel-related">${data.related.map(r => `<a href="${r.href}">${r.title}<small>${r.sub || ''}</small></a>`).join('')}</div>
        </div>`;
      }
      panelBody.innerHTML = html;
      panel.classList.add('is-open');
      highlightConnections(blockId);
    }

    function closePanel() {
      panel.classList.remove('is-open');
      clearHighlight();
    }
    panelClose.addEventListener('click', closePanel);

    // click bloque + accesibilidad
    svg.querySelectorAll('.block').forEach(el => {
      const id = el.getAttribute('data-id');
      const data = blocks[id] || {};
      // ARIA: tratar como botón
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      const ariaLabel = `${data.title || id}${data.sub ? ' · ' + data.sub : ''}`;
      el.setAttribute('aria-label', ariaLabel);
      el.addEventListener('click', () => openPanel(id));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(id); }
      });
    });
    // ARIA panel
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Detalle del bloque');
    panel.setAttribute('aria-hidden', 'true');
    const openOrig = openPanel;
    openPanel = function(id) { openOrig(id); panel.setAttribute('aria-hidden', 'false'); };
    const closeOrig = closePanel;
    closePanel = function() { closeOrig(); panel.setAttribute('aria-hidden', 'true'); };

    // ESC cierra panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
    });

    // -----------------------------------------------------------
    // HOVER RUTA: cuando hover bloque · highlight conexiones que tocan ese bloque
    // -----------------------------------------------------------
    function highlightConnections(blockId) {
      const touchingConns = connections.filter(c => c.from === blockId || c.to === blockId);
      const touchingBlocks = new Set([blockId]);
      touchingConns.forEach(c => { touchingBlocks.add(c.from); touchingBlocks.add(c.to); });

      svg.querySelectorAll('.block').forEach(el => {
        const id = el.getAttribute('data-id');
        if (touchingBlocks.has(id)) {
          el.classList.add('is-highlight');
          el.classList.remove('is-dimmed');
        } else {
          el.classList.add('is-dimmed');
          el.classList.remove('is-highlight');
        }
      });

      svg.querySelectorAll('.conn').forEach(line => {
        const f = line.getAttribute('data-from');
        const t = line.getAttribute('data-to');
        if ((f === blockId) || (t === blockId)) {
          line.classList.add('is-highlight');
          line.classList.remove('is-dimmed');
        } else {
          line.classList.add('is-dimmed');
          line.classList.remove('is-highlight');
        }
      });
    }

    function clearHighlight() {
      svg.querySelectorAll('.block').forEach(el => {
        el.classList.remove('is-highlight', 'is-dimmed');
      });
      svg.querySelectorAll('.conn').forEach(line => {
        line.classList.remove('is-highlight', 'is-dimmed');
      });
      applyFilters();
    }

    svg.querySelectorAll('.block').forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (panel.classList.contains('is-open')) return;
        const id = el.getAttribute('data-id');
        highlightConnections(id);
      });
      el.addEventListener('mouseleave', () => {
        if (panel.classList.contains('is-open')) return;
        clearHighlight();
      });
    });

    // -----------------------------------------------------------
    // FILTROS CANAL
    // -----------------------------------------------------------
    function applyFilters() {
      if (activeFilters.size === 0) {
        svg.querySelectorAll('.block').forEach(el => el.classList.remove('is-dimmed'));
        svg.querySelectorAll('.conn').forEach(el => el.classList.remove('is-dimmed'));
        return;
      }
      svg.querySelectorAll('.block').forEach(el => {
        const id = el.getAttribute('data-id');
        const data = blocks[id];
        const matches = data && data.channels && data.channels.some(c => activeFilters.has(c));
        const noChannel = !data || !data.channels || data.channels.length === 0;
        if (matches || noChannel) el.classList.remove('is-dimmed');
        else el.classList.add('is-dimmed');
      });
      svg.querySelectorAll('.conn').forEach(line => {
        const ch = (line.getAttribute('data-channels') || '').split(',').filter(Boolean);
        if (ch.length === 0) { line.classList.remove('is-dimmed'); return; }
        if (ch.some(c => activeFilters.has(c))) line.classList.remove('is-dimmed');
        else line.classList.add('is-dimmed');
      });
    }

    root.querySelectorAll('.diagram-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const ch = btn.getAttribute('data-channel');
        if (!ch) return;
        if (activeFilters.has(ch)) {
          activeFilters.delete(ch);
          btn.classList.remove('is-active');
        } else {
          activeFilters.add(ch);
          btn.classList.add('is-active');
        }
        applyFilters();
      });
    });

    // init
    applyTransform();
  }

  window.SMCDiagram.init = init;

  // ===========================================================
  // PIPELINE · selector de escenarios + etapas + INT boxes
  // ===========================================================

  /**
   * @param {object} cfg
   *   id          · id del .process-wrapper (vacío · se renderiza completo desde JS)
   *   scenarios   · { A: {letter, title, sub, tags, callout, stages:[{num,name,boxes:[{code,label,kind,stack,desc,notes,doc}]}]}, B:{...}, ... }
   *   default     · letra del escenario activo inicial
   */
  function initPipeline(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;

    const scenarios = cfg.scenarios || {};
    const letters = Object.keys(scenarios);
    let active = cfg.default || letters[0];

    function esc(s) {
      return (s == null ? '' : String(s))
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderScenarios() {
      return `<div class="scenario-grid">
        ${letters.map(L => {
          const s = scenarios[L];
          return `<div class="scenario-card ${L === active ? 'is-active' : ''}" data-letter="${L}">
            <div class="scenario-letter">${L}</div>
            <div class="scenario-title">${esc(s.title)}</div>
            <div class="scenario-sub">${esc(s.sub || '')}</div>
          </div>`;
        }).join('')}
      </div>`;
    }

    function renderDetail() {
      const s = scenarios[active];
      const total = (s.stages || []).reduce((acc, st) => acc + (st.boxes || []).length, 0);
      return `<div class="scenario-detail">
        <strong>Escenario activo: ${esc(s.title)} (${active})</strong> · ${esc(s.callout || s.sub || '')}
        ${s.tags ? `<br><span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#475569;">${s.tags.join(' · ')} · ${s.stages.length} etapas · ${total} pasos</span>` : ''}
      </div>`;
    }

    function renderPipeline() {
      const s = scenarios[active];
      const stages = s.stages || [];
      const head = stages.map((st, i) => {
        const isLast = i === stages.length - 1;
        return `<div class="pipeline-stage-head ${isLast ? 'is-last' : ''}">
          <div class="pipeline-stage-num">Etapa ${st.num}</div>
          <h4 class="pipeline-stage-name">${esc(st.name)}</h4>
        </div>`;
      }).join('');
      const body = stages.map((st, i) => {
        const isLast = i === stages.length - 1;
        const boxes = (st.boxes || []).map((b, j) => `
          <div class="int-box kind-${b.kind || 'search'}" data-stage="${i}" data-box="${j}">
            <span class="int-code">${esc(b.code || '')}</span>
            <p class="int-label">${esc(b.label || '')}</p>
            ${b.stack ? `<span class="int-stack">${esc(b.stack)}</span>` : ''}
          </div>`).join('');
        return `<div class="pipeline-stage-col ${isLast ? 'is-last' : ''}">
          <div class="pipeline-stage-col-inner">${boxes}</div>
        </div>`;
      }).join('');
      return `<div class="pipeline-shell">
        <div class="pipeline-header">${head}</div>
        <div class="pipeline-body">${body}</div>
        <div class="pipeline-meta">
          <strong>${esc(s.title)}</strong> · ${esc(s.sub || '')}
          ${s.notes ? ' · ' + esc(s.notes) : ''}
        </div>
      </div>`;
    }

    function renderPanel() {
      return `<aside class="diagram-panel">
        <div class="diagram-panel-header">
          <button class="diagram-panel-close" aria-label="Cerrar">×</button>
          <div class="diagram-panel-type">Paso</div>
          <h3 class="diagram-panel-title">Detalle</h3>
          <p class="diagram-panel-sub"></p>
        </div>
        <div class="diagram-panel-body"></div>
      </aside>`;
    }

    function render() {
      root.innerHTML = renderScenarios() + renderDetail() + renderPipeline() + renderPanel();
      bind();
    }

    function openBoxPanel(stageIdx, boxIdx) {
      const s = scenarios[active];
      const st = s.stages[stageIdx];
      const b = st.boxes[boxIdx];
      const panel = root.querySelector('.diagram-panel');
      const panelType = root.querySelector('.diagram-panel-type');
      const panelTitle = root.querySelector('.diagram-panel-title');
      const panelSub = root.querySelector('.diagram-panel-sub');
      const panelBody = root.querySelector('.diagram-panel-body');

      panelType.textContent = `${b.code || ''} · Etapa ${st.num} · ${st.name}`;
      panelTitle.textContent = b.label || b.code || 'Paso';
      panelSub.textContent = `Escenario ${active} · ${s.title}`;

      let html = '';
      if (b.desc) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Descripción</div>
          <p>${esc(b.desc)}</p>
        </div>`;
      }
      if (b.stack) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Stack · tecnología</div>
          <p>${esc(b.stack)}</p>
        </div>`;
      }
      if (b.endpoints && b.endpoints.length) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Endpoints / referencia</div>
          <ul>${b.endpoints.map(e => `<li><code>${esc(e)}</code></li>`).join('')}</ul>
        </div>`;
      }
      if (b.payload) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Sample payload</div>
          <pre class="ascii" style="font-size:11px;background:#0F172A;color:#A7F3D0;padding:12px;border-radius:8px;overflow-x:auto;">${esc(b.payload)}</pre>
        </div>`;
      }
      if (b.errors && b.errors.length) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Errores comunes</div>
          <ul>${b.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
        </div>`;
      }
      if (b.notes) {
        html += `<div class="panel-section">
          <div class="panel-section-label">Notas</div>
          <p>${esc(b.notes)}</p>
        </div>`;
      }
      if (b.doc) {
        const docs = Array.isArray(b.doc) ? b.doc : [b.doc];
        html += `<div class="panel-section">
          <div class="panel-section-label">Docs relacionados</div>
          <div class="panel-related">${docs.map(d => `<a href="${esc(d.href)}">${esc(d.title)}<small>${esc(d.sub || '')}</small></a>`).join('')}</div>
        </div>`;
      }
      panelBody.innerHTML = html;

      root.querySelectorAll('.int-box').forEach(el => el.classList.remove('is-active'));
      root.querySelector(`.int-box[data-stage="${stageIdx}"][data-box="${boxIdx}"]`)?.classList.add('is-active');
      panel.classList.add('is-open');
    }

    function bind() {
      // scenario click
      root.querySelectorAll('.scenario-card').forEach(card => {
        card.addEventListener('click', () => {
          const L = card.getAttribute('data-letter');
          if (L === active) return;
          active = L;
          render();
        });
      });
      // INT box click
      root.querySelectorAll('.int-box').forEach(box => {
        box.addEventListener('click', () => {
          openBoxPanel(parseInt(box.getAttribute('data-stage')), parseInt(box.getAttribute('data-box')));
        });
      });
      // panel close
      root.querySelector('.diagram-panel-close')?.addEventListener('click', () => {
        root.querySelector('.diagram-panel').classList.remove('is-open');
        root.querySelectorAll('.int-box').forEach(el => el.classList.remove('is-active'));
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const panel = root.querySelector('.diagram-panel');
      if (panel && panel.classList.contains('is-open')) {
        panel.classList.remove('is-open');
        root.querySelectorAll('.int-box').forEach(el => el.classList.remove('is-active'));
      }
    });

    render();
  }

  window.SMCDiagram.initPipeline = initPipeline;

  // ===========================================================
  // HELPERS comunes
  // ===========================================================
  function esc(s) {
    return (s == null ? '' : String(s))
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===========================================================
  // SWATCH GRID · paleta visual de colores
  //   JSON: { title, sub, groups: [{ name, tokens: [{name, hex, rgb?, uso?}] }] }
  // ===========================================================
  function initSwatch(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const groups = cfg.groups || [];
    const html = `
      ${cfg.title ? `<div class="swatch-head">
        <div class="swatch-title">${esc(cfg.title)}</div>
        ${cfg.sub ? `<div class="swatch-sub">${esc(cfg.sub)}</div>` : ''}
      </div>` : ''}
      ${groups.map(g => `
        <div class="swatch-group">
          <div class="swatch-group-name">${esc(g.name)}</div>
          <div class="swatch-grid">
            ${(g.tokens || []).map(t => `
              <div class="swatch-card" data-hex="${esc(t.hex)}">
                <div class="swatch-chip" style="background:${esc(t.hex)};"></div>
                <div class="swatch-info">
                  <div class="swatch-token">${esc(t.name)}</div>
                  <div class="swatch-hex">${esc(t.hex)}</div>
                  ${t.rgb ? `<div class="swatch-rgb">${esc(t.rgb)}</div>` : ''}
                  ${t.uso ? `<div class="swatch-uso">${esc(t.uso)}</div>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>`).join('')}
    `;
    root.innerHTML = html;
    // Click → copia hex
    root.querySelectorAll('.swatch-card').forEach(card => {
      card.addEventListener('click', () => {
        const hex = card.getAttribute('data-hex');
        navigator.clipboard?.writeText(hex);
        card.classList.add('is-copied');
        setTimeout(() => card.classList.remove('is-copied'), 900);
      });
    });
  }

  // ===========================================================
  // HEATMAP · matriz N×N (típico 3×3 P×I) con dots
  //   JSON: { axisX:{label, ticks:[]}, axisY:{label, ticks:[]}, cells:[{x,y,sev,label}], items:[{x,y,id,label,score?}] }
  // ===========================================================
  function initHeatmap(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const xTicks = (cfg.axisX && cfg.axisX.ticks) || ['Baja', 'Media', 'Alta'];
    const yTicks = (cfg.axisY && cfg.axisY.ticks) || ['Alto', 'Medio', 'Bajo']; // top to bottom
    const cells = cfg.cells || [];
    const items = cfg.items || [];

    function sevClass(x, y) {
      // x=1..N, y=1..N (Y de abajo a arriba). Score = x * y
      const score = x * y;
      if (score >= 6) return 'is-sev-high';
      if (score >= 3) return 'is-sev-med';
      return 'is-sev-low';
    }

    // grid: yTicks[0] = arriba (sev alta), yTicks[last] = abajo (sev baja)
    let cellsHtml = '';
    for (let yi = 0; yi < yTicks.length; yi++) {
      // y-real = (N - yi)  porque arriba es alto
      const yReal = yTicks.length - yi;
      for (let xi = 0; xi < xTicks.length; xi++) {
        const xReal = xi + 1;
        const inItems = items.filter(it => it.x === xReal && it.y === yReal);
        cellsHtml += `<div class="heatmap-cell ${sevClass(xReal, yReal)}">
          <div class="heatmap-dots">
            ${inItems.map(it => `<span class="heatmap-dot" title="${esc(it.label || it.id)}">${esc(it.id)}</span>`).join('')}
          </div>
        </div>`;
      }
    }

    root.innerHTML = `
      ${cfg.title ? `<div class="heatmap-head">${esc(cfg.title)}</div>` : ''}
      <div class="heatmap-shell">
        <div class="heatmap-axis-y">${yTicks.map(t => `<div>${esc(t)}</div>`).join('')}</div>
        <div class="heatmap-grid" style="grid-template-columns: repeat(${xTicks.length}, 1fr); grid-template-rows: repeat(${yTicks.length}, 1fr);">
          ${cellsHtml}
        </div>
        <div class="heatmap-axis-y-label">${esc((cfg.axisY && cfg.axisY.label) || 'Impacto')}</div>
        <div class="heatmap-axis-x">${xTicks.map(t => `<div>${esc(t)}</div>`).join('')}</div>
        <div class="heatmap-axis-x-label">${esc((cfg.axisX && cfg.axisX.label) || 'Probabilidad')}</div>
      </div>
      ${items.length ? `<div class="heatmap-legend">
        ${items.map(it => `<div class="heatmap-legend-item"><span class="heatmap-legend-id">${esc(it.id)}</span>${esc(it.label || '')} ${it.score ? `· <strong>${it.score}</strong>` : ''}</div>`).join('')}
      </div>` : ''}
    `;
  }

  // ===========================================================
  // FUNNEL · niveles con conversion rate
  //   JSON: { title, levels: [{ label, value, sub?, color? }] }
  // ===========================================================
  function initFunnel(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const levels = cfg.levels || [];
    if (levels.length === 0) { root.innerHTML = ''; return; }
    const max = Math.max(...levels.map(l => l.value || 0));
    root.innerHTML = `
      ${cfg.title ? `<div class="funnel-title">${esc(cfg.title)}</div>` : ''}
      <div class="funnel-shell">
        ${levels.map((l, i) => {
          const w = max ? (l.value / max) * 100 : 100;
          const conv = i > 0 ? Math.round((l.value / levels[i-1].value) * 100) : null;
          return `<div class="funnel-row">
            <div class="funnel-bar" style="width:${w}%; background:${esc(l.color || '#00C1C1')};">
              <span class="funnel-label">${esc(l.label)}</span>
              <span class="funnel-value">${typeof l.value === 'number' ? l.value.toLocaleString('es-CL') : esc(l.value)}</span>
            </div>
            ${l.sub ? `<div class="funnel-sub">${esc(l.sub)}</div>` : ''}
            ${conv !== null ? `<div class="funnel-conv">↓ ${conv}% conv</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    `;
  }

  // ===========================================================
  // GANTT · timeline horizontal con fases + dependencias
  //   JSON: { months: ['2026-Q4', '2027-Q1', ...], tasks:[{id, name, owner, start, dur, color?, deps?:[]}] }
  // ===========================================================
  function initGantt(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const months = cfg.months || [];
    const tasks = cfg.tasks || [];
    const W = months.length || 1;
    root.innerHTML = `
      ${cfg.title ? `<div class="gantt-title">${esc(cfg.title)}</div>` : ''}
      <div class="gantt-shell">
        <div class="gantt-header" style="grid-template-columns: 220px repeat(${W}, 1fr);">
          <div class="gantt-corner"></div>
          ${months.map(m => `<div class="gantt-month">${esc(m)}</div>`).join('')}
        </div>
        <div class="gantt-body">
          ${tasks.map(t => `
            <div class="gantt-row" style="grid-template-columns: 220px repeat(${W}, 1fr);" data-id="${esc(t.id || '')}">
              <div class="gantt-label">
                <div class="gantt-task-name">${esc(t.name)}</div>
                <div class="gantt-task-owner">${esc(t.owner || '')}</div>
              </div>
              ${months.map((_, ci) => `<div class="gantt-cell"></div>`).join('')}
              <div class="gantt-bar" style="grid-column: ${t.start + 2} / span ${t.dur}; background:${esc(t.color || '#00C1C1')};" title="${esc(t.name)}">
                <span class="gantt-bar-label">${esc(t.name)}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
    `;
  }

  // ===========================================================
  // CANVAS 9 (Strategyzer Business Model Canvas)
  //   JSON: { blocks: { keyPartners, keyActivities, keyResources, valueProp, customerRelations, channels, customerSegments, costStructure, revenueStreams } : [items] }
  // ===========================================================
  function initCanvas9(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const b = cfg.blocks || {};
    function cell(slot, title, icon) {
      const items = b[slot] || [];
      return `<div class="canvas9-cell" data-slot="${slot}">
        <div class="canvas9-cell-head">
          <span class="canvas9-cell-icon">${icon}</span>
          <span class="canvas9-cell-title">${title}</span>
        </div>
        <ul class="canvas9-list">
          ${items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>`;
    }
    root.innerHTML = `
      ${cfg.title ? `<div class="canvas9-title">${esc(cfg.title)}</div>` : ''}
      <div class="canvas9-shell">
        <div class="canvas9-grid">
          ${cell('keyPartners', 'Key Partners', '🤝')}
          <div class="canvas9-col">
            ${cell('keyActivities', 'Key Activities', '⚡')}
            ${cell('keyResources', 'Key Resources', '🧰')}
          </div>
          ${cell('valueProp', 'Value Proposition', '💎')}
          <div class="canvas9-col">
            ${cell('customerRelations', 'Customer Relationships', '💬')}
            ${cell('channels', 'Channels', '📡')}
          </div>
          ${cell('customerSegments', 'Customer Segments', '👥')}
        </div>
        <div class="canvas9-bottom">
          ${cell('costStructure', 'Cost Structure', '💸')}
          ${cell('revenueStreams', 'Revenue Streams', '💰')}
        </div>
      </div>
    `;
  }

  // ===========================================================
  // SLIDES DECK · 12 slides estilo Pitch
  //   JSON: { slides: [{ num, kicker, title, body, kpi?, bullets?, color? }] }
  // ===========================================================
  function initSlides(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const slides = cfg.slides || [];
    root.innerHTML = `
      ${cfg.title ? `<div class="slides-title">${esc(cfg.title)}</div>` : ''}
      <div class="slides-shell">
        ${slides.map(s => `
          <div class="slide-card" style="--slide-color:${esc(s.color || '#0F172A')};">
            <div class="slide-num">${esc(s.num || '00')} / ${slides.length}</div>
            ${s.kicker ? `<div class="slide-kicker">${esc(s.kicker)}</div>` : ''}
            <h4 class="slide-title">${esc(s.title || '')}</h4>
            ${s.body ? `<p class="slide-body">${esc(s.body)}</p>` : ''}
            ${s.kpi ? `<div class="slide-kpi">${esc(s.kpi)}</div>` : ''}
            ${s.bullets ? `<ul class="slide-bullets">${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          </div>`).join('')}
      </div>
    `;
  }

  // ===========================================================
  // POWER/INTEREST MATRIX (2×2)
  //   JSON: { items: [{ id, label, power: 'high'|'low', interest: 'high'|'low' }] }
  // ===========================================================
  function initPIMatrix(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const items = cfg.items || [];
    function fill(power, interest) {
      return items.filter(i => i.power === power && i.interest === interest)
        .map(i => `<span class="pim-dot" title="${esc(i.label || '')}">${esc(i.id)}</span>`).join('');
    }
    root.innerHTML = `
      ${cfg.title ? `<div class="pim-title">${esc(cfg.title)}</div>` : ''}
      <div class="pim-shell">
        <div class="pim-axis-y">Poder</div>
        <div class="pim-grid">
          <div class="pim-cell pim-hl">
            <div class="pim-strategy">Keep satisfied</div>
            <div class="pim-dots">${fill('high', 'low')}</div>
          </div>
          <div class="pim-cell pim-hh">
            <div class="pim-strategy">Manage closely</div>
            <div class="pim-dots">${fill('high', 'high')}</div>
          </div>
          <div class="pim-cell pim-ll">
            <div class="pim-strategy">Monitor</div>
            <div class="pim-dots">${fill('low', 'low')}</div>
          </div>
          <div class="pim-cell pim-lh">
            <div class="pim-strategy">Keep informed</div>
            <div class="pim-dots">${fill('low', 'high')}</div>
          </div>
        </div>
        <div class="pim-axis-x">Interés</div>
      </div>
      ${items.length ? `<div class="pim-legend">
        ${items.map(i => `<div><span class="pim-legend-id">${esc(i.id)}</span> ${esc(i.label || '')}</div>`).join('')}
      </div>` : ''}
    `;
  }

  // ===========================================================
  // CHART LINE · sparkline tipo serie temporal
  //   JSON: { series: [{ name, color, points: [n,n,n,n,...] }], labels: ['Y1','Y2',...] }
  // ===========================================================
  function initChartLine(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const series = cfg.series || [];
    const labels = cfg.labels || [];
    const W = 800, H = 320, P = 50;
    const allY = series.flatMap(s => s.points || []);
    if (allY.length === 0) { root.innerHTML = ''; return; }
    const maxY = Math.max(...allY);
    const N = labels.length || (series[0]?.points?.length || 1);
    const xAt = i => P + (W - 2 * P) * (i / Math.max(1, N - 1));
    const yAt = v => H - P - (H - 2 * P) * (v / maxY);

    const paths = series.map(s => {
      const d = (s.points || []).map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p)}`).join(' ');
      return `<path d="${d}" fill="none" stroke="${esc(s.color || '#00C1C1')}" stroke-width="2.5"/>`;
    }).join('');
    const dots = series.map(s => (s.points || []).map((p, i) =>
      `<circle cx="${xAt(i)}" cy="${yAt(p)}" r="4" fill="${esc(s.color || '#00C1C1')}"/>`
    ).join('')).join('');
    const xLabels = labels.map((l, i) => `<text x="${xAt(i)}" y="${H - 20}" text-anchor="middle" font-size="12" fill="#64748B">${esc(l)}</text>`).join('');
    const yGuides = [0, 0.25, 0.5, 0.75, 1].map(r => {
      const v = maxY * r;
      const y = yAt(v);
      return `<line x1="${P}" y1="${y}" x2="${W - P}" y2="${y}" stroke="#E2E8F0" stroke-width="1"/>
              <text x="${P - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#94A3B8">${v.toLocaleString('es-CL')}</text>`;
    }).join('');

    root.innerHTML = `
      ${cfg.title ? `<div class="chart-title">${esc(cfg.title)}</div>` : ''}
      <div class="chart-legend">
        ${series.map(s => `<span class="chart-legend-item"><span class="chart-legend-dot" style="background:${esc(s.color || '#00C1C1')};"></span>${esc(s.name)}</span>`).join('')}
      </div>
      <svg viewBox="0 0 ${W} ${H}" class="chart-svg">
        ${yGuides}
        ${paths}
        ${dots}
        ${xLabels}
      </svg>
    `;
  }

  // ===========================================================
  // CHART BAR · barras agrupadas
  //   JSON: { series: [{ name, color, points: [n,n,n] }], labels: ['mes1', ...] }
  // ===========================================================
  function initChartBar(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const series = cfg.series || [];
    const labels = cfg.labels || [];
    const W = 800, H = 320, P = 50;
    const allY = series.flatMap(s => s.points || []);
    if (allY.length === 0) { root.innerHTML = ''; return; }
    const maxY = Math.max(...allY);
    const N = labels.length || (series[0]?.points?.length || 1);
    const groupW = (W - 2 * P) / N;
    const barW = groupW / (series.length + 1);
    const yAt = v => H - P - (H - 2 * P) * (v / maxY);

    let bars = '';
    for (let i = 0; i < N; i++) {
      series.forEach((s, si) => {
        const v = (s.points || [])[i] || 0;
        const x = P + i * groupW + si * barW + barW * 0.25;
        const y = yAt(v);
        const h = H - P - y;
        bars += `<rect x="${x}" y="${y}" width="${barW * 0.85}" height="${h}" fill="${esc(s.color || '#00C1C1')}" rx="3"/>
                 <text x="${x + barW * 0.42}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="600" fill="#0F172A">${v}</text>`;
      });
    }
    const xLabels = labels.map((l, i) => `<text x="${P + (i + 0.5) * groupW}" y="${H - 20}" text-anchor="middle" font-size="12" fill="#64748B">${esc(l)}</text>`).join('');
    const yGuides = [0, 0.5, 1].map(r => {
      const v = maxY * r;
      const y = yAt(v);
      return `<line x1="${P}" y1="${y}" x2="${W - P}" y2="${y}" stroke="#E2E8F0" stroke-width="1"/>`;
    }).join('');

    root.innerHTML = `
      ${cfg.title ? `<div class="chart-title">${esc(cfg.title)}</div>` : ''}
      <div class="chart-legend">
        ${series.map(s => `<span class="chart-legend-item"><span class="chart-legend-dot" style="background:${esc(s.color || '#00C1C1')};"></span>${esc(s.name)}</span>`).join('')}
      </div>
      <svg viewBox="0 0 ${W} ${H}" class="chart-svg">
        ${yGuides}
        ${bars}
        ${xLabels}
      </svg>
    `;
  }

  // ===========================================================
  // JTBD CANVAS · 3 dimensiones + outcomes
  //   JSON: { title, persona, jobs: { functional:[], emotional:[], social:[] }, outcomes:[] }
  // ===========================================================
  function initJTBD(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const jobs = cfg.jobs || {};
    function dim(slot, name, icon, color) {
      const items = jobs[slot] || [];
      return `<div class="jtbd-cell jtbd-${slot}" style="--jtbd-c:${color};">
        <div class="jtbd-cell-head"><span class="jtbd-cell-icon">${icon}</span><span class="jtbd-cell-title">${name}</span></div>
        <ul class="jtbd-list">${items.map(j => `<li>${esc(j)}</li>`).join('')}</ul>
      </div>`;
    }
    root.innerHTML = `
      ${cfg.title ? `<div class="jtbd-title">${esc(cfg.title)}</div>` : ''}
      ${cfg.persona ? `<div class="jtbd-persona"><strong>Persona:</strong> ${esc(cfg.persona)}</div>` : ''}
      <div class="jtbd-grid">
        ${dim('functional', 'Functional Jobs', '⚙️', '#3B82F6')}
        ${dim('emotional',  'Emotional Jobs',  '💖', '#EC4899')}
        ${dim('social',     'Social Jobs',     '👥', '#7C3AED')}
      </div>
      ${(cfg.outcomes && cfg.outcomes.length) ? `<div class="jtbd-outcomes">
        <div class="jtbd-cell-head"><span class="jtbd-cell-icon">🎯</span><span class="jtbd-cell-title">Outcome Metrics</span></div>
        <ul class="jtbd-list">${cfg.outcomes.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
      </div>` : ''}
    `;
  }

  // ===========================================================
  // VALUE PROP CANVAS · Strategyzer 6 zonas
  //   JSON: { customer: { jobs, pains, gains }, value: { products, painRelievers, gainCreators } }
  // ===========================================================
  function initValueProp(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const cust = cfg.customer || {};
    const val = cfg.value || {};
    function zone(items, label, icon) {
      return `<div class="vp-zone">
        <div class="vp-zone-head"><span class="vp-zone-icon">${icon}</span><span>${label}</span></div>
        <ul>${(items || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>`;
    }
    root.innerHTML = `
      ${cfg.title ? `<div class="vp-title">${esc(cfg.title)}</div>` : ''}
      <div class="vp-shell">
        <div class="vp-side vp-side-value">
          <div class="vp-side-label">Value Map (lo que ofrecemos)</div>
          <div class="vp-side-shape vp-square">
            ${zone(val.products,       'Products & Services', '📦')}
            ${zone(val.painRelievers,  'Pain Relievers',      '🩹')}
            ${zone(val.gainCreators,   'Gain Creators',       '🚀')}
          </div>
        </div>
        <div class="vp-side vp-side-customer">
          <div class="vp-side-label">Customer Profile (lo que necesita)</div>
          <div class="vp-side-shape vp-circle">
            ${zone(cust.jobs,  'Customer Jobs', '⚙️')}
            ${zone(cust.pains, 'Pains',         '😣')}
            ${zone(cust.gains, 'Gains',         '🎁')}
          </div>
        </div>
      </div>
      <div class="vp-fit">
        <strong>Product-Market Fit</strong> = Value Map ↔ Customer Profile · ${cfg.fit || 'cada elemento del Value Map responde a uno o más del Customer Profile.'}
      </div>
    `;
  }

  // ===========================================================
  // BOOT · escanea [data-kind] y bootea cada uno
  // ===========================================================
  function boot() {
    document.querySelectorAll('[data-kind]').forEach(host => {
      const id = host.id;
      const kind = host.getAttribute('data-kind');
      const script = document.querySelector(`script[data-for="${id}"]`);
      let data = {};
      if (script) {
        try { data = JSON.parse(script.textContent || '{}'); }
        catch (ex) { console.warn('SMCDiagram data parse failed for ' + id, ex); }
      }
      data.id = id;
      // JTBD y value-prop también necesitan que el host esté listo (lo está vacío)
      // Para hla/erd · si el host está vacío, auto-genera skeleton
      function hlaFromHost(d) {
        const r = document.getElementById(d.id);
        if (r && r.children.length === 0) {
          r.className = 'diagram-wrapper kind-' + (d._origKind || 'hla');
          r.innerHTML = `
            <div class="diagram-header">
              <div>
                <div class="diagram-title">${esc(d.title || '')}</div>
                ${d.sub ? `<div class="diagram-subtitle">${esc(d.sub)}</div>` : ''}
              </div>
              ${d.filters ? `<div class="diagram-filters">
                ${d.filters.map(f => `<button class="diagram-filter" data-channel="${esc(f.channel || f.id || '')}">${esc(f.label || f.channel || f.id || '')}</button>`).join('')}
              </div>` : ''}
            </div>
            <div class="diagram-canvas">
              <div class="diagram-zoom-indicator">100%</div>
              <div class="diagram-toolbar">
                <button data-zoom="in">+</button>
                <button data-zoom="out">−</button>
                <div class="divider"></div>
                <button data-zoom="reset">⊡</button>
                <button data-zoom="fullscreen">⤢</button>
              </div>
              ${d.svg || ''}
            </div>
            <aside class="diagram-panel">
              <div class="diagram-panel-header">
                <button class="diagram-panel-close">×</button>
                <div class="diagram-panel-type">Bloque</div>
                <h3 class="diagram-panel-title">Detalle</h3>
                <p class="diagram-panel-sub"></p>
              </div>
              <div class="diagram-panel-body"></div>
            </aside>
          `;
        }
        init(d);
      }
      const dispatcher = {
        'hla': hlaFromHost,
        'erd': hlaFromHost,
        'pipeline': initPipeline,
        'swatch': initSwatch,
        'heatmap': initHeatmap,
        'funnel': initFunnel,
        'gantt': initGantt,
        'canvas9': initCanvas9,
        'slides': initSlides,
        'pi-matrix': initPIMatrix,
        'chart-line': initChartLine,
        'chart-bar': initChartBar,
        'jtbd': initJTBD,
        'value-prop': initValueProp,
      };
      const fn = dispatcher[kind];
      if (fn) {
        // hla/erd/pipeline esperan un wrapper interno · si la data tiene esa estructura asumimos que el JSON la trae completa
        try { fn(data); }
        catch (ex) { console.warn('SMCDiagram init failed ' + kind + '/' + id, ex); }
      } else {
        console.warn('SMCDiagram: kind desconocido', kind);
      }
    });
  }

  window.SMCDiagram.initSwatch = initSwatch;
  window.SMCDiagram.initHeatmap = initHeatmap;
  window.SMCDiagram.initFunnel = initFunnel;
  window.SMCDiagram.initGantt = initGantt;
  window.SMCDiagram.initCanvas9 = initCanvas9;
  window.SMCDiagram.initSlides = initSlides;
  window.SMCDiagram.initPIMatrix = initPIMatrix;
  window.SMCDiagram.initChartLine = initChartLine;
  window.SMCDiagram.initChartBar = initChartBar;
  window.SMCDiagram.initJTBD = initJTBD;
  window.SMCDiagram.initValueProp = initValueProp;
  window.SMCDiagram.boot = boot;
})();
