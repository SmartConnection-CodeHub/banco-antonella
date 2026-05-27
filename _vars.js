/* ============================================================
   Banco Antonella · Sistema de variables propagadas
   · Lee el state del simulador desde localStorage
   · Reemplaza spans <span data-var="key"> con valor actual
   · Re-renderea al cargar y cuando el simulador se cierra
   ============================================================ */
(function () {
  const STORAGE_KEY = 'banco-antonella-sim-v1';

  function getState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
  }

  // Defaults idénticos al simulador (sincronizar si cambian)
  const DEFAULTS = {
    'age-asesoria': 150000, 'age-capacitacion': 150000, 'age-marketing': 200000,
    'inv-fijos': 1400000, 'inv-intangibles': 640000, 'inv-habilitacion': 600000, 'inv-capital': 360000,
    'proj-fact_inicial': 1800000, 'proj-fact_regimen': 5600000, 'proj-pct_var': 28, 'proj-fijos': 1490000, 'proj-capital_inicial': 3500000
  };
  const SERV_DEFAULTS = {
    s1:{p:35000,v:30}, s2:{p:55000,v:12}, s3:{p:12000,v:25}, s4:{p:25000,v:18},
    s5:{p:18000,v:15}, s6:{p:15000,v:30}, s7:{p:30000,v:12}, s8:{p:50000,v:8},
    s9:{p:25000,v:14}, s10:{p:30000,v:16}, s11:{p:35000,v:10}, s12:{p:200000,v:4}, s13:{p:15000,v:80}
  };

  function fmt(n, opts) {
    opts = opts || {};
    if (n == null || isNaN(n)) return '—';
    if (opts.short && n >= 1000000) return '$' + (n/1000000).toFixed(1).replace(/\.0$/,'') + ' M';
    if (opts.short && n >= 1000) return '$' + Math.round(n/1000) + ' K';
    if (opts.pct) return n + ' %';
    return '$' + Math.round(n).toLocaleString('es-CL');
  }

  function compute() {
    const s = getState();
    const v = {};

    // Presupuesto Sercotec
    const presVals = s.presValues || {};
    const age = (+presVals['age-asesoria'] || DEFAULTS['age-asesoria'])
              + (+presVals['age-capacitacion'] || DEFAULTS['age-capacitacion'])
              + (+presVals['age-marketing'] || DEFAULTS['age-marketing']);
    const inv = (+presVals['inv-fijos'] || DEFAULTS['inv-fijos'])
              + (+presVals['inv-intangibles'] || DEFAULTS['inv-intangibles'])
              + (+presVals['inv-habilitacion'] || DEFAULTS['inv-habilitacion'])
              + (+presVals['inv-capital'] || DEFAULTS['inv-capital']);
    v.subsidioAGE = age;
    v.subsidioInv = inv;
    v.subsidioTotal = age + inv;
    v.aportePropio = Math.round((age + inv) * 0.03);
    v.totalProyecto = v.subsidioTotal + v.aportePropio;

    // Servicios
    const serv = s.serv || SERV_DEFAULTS;
    let visitas = 0, facturacion = 0;
    Object.keys(SERV_DEFAULTS).forEach(k => {
      const r = serv[k] || SERV_DEFAULTS[k];
      visitas += (r.v || 0);
      facturacion += (r.p || 0) * (r.v || 0);
    });
    v.visitasMes = visitas;
    v.clientasMes = Math.round(visitas * 0.7);
    v.facturacionMes = facturacion;
    v.ticketPromedio = visitas ? Math.round(facturacion / visitas) : 0;

    // Stack fondos
    const FONDOS = { abeja: 3500000, semilla: 3500000, sence: 500000, corfo: 8000000, prochile: 5000000, fosis: 1100000 };
    const checked = s.stackChecked || { abeja: true, sence: true };
    let stackTotal = 0, stackCount = 0;
    Object.keys(FONDOS).forEach(k => { if (checked[k]) { stackTotal += FONDOS[k]; stackCount++; } });
    v.stackTotal = stackTotal;
    v.stackCount = stackCount;

    // Proyección 12 meses
    const projVals = s.projValues || {};
    const factIni = +projVals.fact_inicial || DEFAULTS['proj-fact_inicial'];
    const factReg = +projVals.fact_regimen || DEFAULTS['proj-fact_regimen'];
    const pctVar  = (+projVals.pct_var || DEFAULTS['proj-pct_var']) / 100;
    const fijosM  = +projVals.fijos || DEFAULTS['proj-fijos'];
    const cap     = +projVals.capital_inicial || DEFAULTS['proj-capital_inicial'];
    let factTotal = 0, utilTotal = 0, cajaAcum = cap;
    for (let m = 1; m <= 12; m++) {
      let fact;
      if (m === 1) fact = factIni;
      else if (m >= 6) fact = factReg;
      else fact = factIni + ((factReg - factIni) * (m - 1) / 5);
      const util = fact - fact * pctVar - fijosM;
      cajaAcum += util;
      factTotal += fact;
      utilTotal += util;
    }
    v.factAnual = factTotal;
    v.utilidadAnual = utilTotal;
    v.cajaFinal = cajaAcum;
    v.factRegimen = factReg;

    return v;
  }

  function render() {
    const v = compute();
    document.querySelectorAll('[data-var]').forEach(el => {
      const key = el.getAttribute('data-var');
      const format = el.getAttribute('data-format') || '';
      if (v[key] === undefined) return;
      let val = v[key];
      if (format === 'short') val = fmt(val, { short: true });
      else if (format === 'pct') val = fmt(val, { pct: true });
      else if (format === 'num') val = Math.round(val).toLocaleString('es-CL');
      else if (format === 'raw') val = val;
      else val = fmt(val);
      el.textContent = val;
    });
  }

  window.AntoVars = { compute, render, getState };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
  // También cuando vuelve el foco al tab (por si guardó en otra pestaña)
  window.addEventListener('focus', render);
})();
