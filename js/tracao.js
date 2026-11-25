/* Ensaio de tração · curvas interativas + tabela editável dos CPs
 *
 * Dados: dados/tracao.js (window.DADOS_TRACAO) e dados/tracao-curvas.js (window.CURVAS_TRACAO),
 *   gerados por Site/ferramentas/importar_tracao.py a partir dos arquivos MTS.
 * Edição (página "Tabela dos CPs"): largura, espessura, comprimento útil Lc, alongamento A e obs.
 * As alterações ficam neste navegador; "Salvar arquivo" baixa um novo tracao.js.
 *
 * Deformação após a retirada do extensômetro (só com Lc informado):
 *   ε = ε_ref + [(δ − δ_ref) − C·(F − F_ref)] / Lc     (C = 0 sem correção de complacência)
 */
(function () {
  const base = window.DADOS_TRACAO, CURVAS = window.CURVAS_TRACAO;
  if (!base || !CURVAS || !document.getElementById('tr-chart')) return;
  const KEY = 'faseSigma.tracao';
  const NS = 'http://www.w3.org/2000/svg';

  /* mesmas cores do Charpy (paleta validada para o fundo escuro); L contínua, C tracejada */
  const COND = {
    0: { nome: 'Sem tratamento', curto: '0%', cor: '#9aa3ab' },
    2: { nome: '2% σ', curto: '2%', cor: '#3987e5' },
    4: { nome: '4% σ', curto: '4%', cor: '#d95926' },
    6: { nome: '6% σ', curto: '6%', cor: '#199e70' },
  };
  const DIR = { L: { nome: 'Longitudinal', dash: '' }, C: { nome: 'Circunferencial', dash: '6 4' } };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const store = {
    get() { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };
  const EDIT = ['largura', 'espessura', 'Lc', 'A', 'obs'];
  // só os campos editáveis ficam no navegador; o resto vem sempre do arquivo
  function carregar() {
    const d = clone(base), loc = store.get();
    if (loc && loc.cps) loc.cps.forEach(l => { const c = d.cps.find(x => x.cp === l.cp); if (c) EDIT.forEach(k => { if (k in l) c[k] = l[k]; }); });
    return d;
  }
  let data = carregar();
  const alvos = () => [...new Set(data.cps.map(c => c.alvo))].sort((a, b) => a - b);

  const filtro = { alvos: new Set(alvos()), dir: 'ambas', complac: false };
  let vista = 'ss';            // ss: tensão × deformação · el: região elástica · fd: força × deslocamento
  let destaque = null;         // CP destacado
  let editing = false;

  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const br = (v, d = 1) => (v === null || v === undefined || isNaN(v)) ? '' :
    Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const parse = (txt) => {
    txt = String(txt).trim().replace(/\s/g, '').replace(',', '.');
    if (txt === '' || txt === '—' || txt === '-') return null;
    const n = Number(txt); return isNaN(n) ? NaN : n;
  };
  // data da MTS (m/d/aaaa h:mm:ss AM) → dd/mm/aaaa
  const dataBR = (t) => { const m = /^(\d+)\/(\d+)\/(\d+)/.exec(t || ''); return m ? `${m[2].padStart(2, '0')}/${m[1].padStart(2, '0')}/${m[3]}` : (t || ''); };
  const grupo = (c) => `${c.alvo}${c.dir}`;
  const grupoNome = (g) => `${COND[g[0]]?.curto ?? g[0] + '%'} ${g[1]}`;
  const visivel = (c) => filtro.alvos.has(c.alvo) && (filtro.dir === 'ambas' || c.dir === filtro.dir);
  // gráficos em fundo branco: tons mais escuros da mesma paleta (contraste ≥ 4,5:1 com o branco)
  const COR_CLARO = { 0: '#6b7580', 2: '#2a6fc9', 4: '#c94f1e', 6: '#13835c' };
  const corDe = (c) => COR_CLARO[c.alvo] || COND[c.alvo]?.cor || '#888';
  const FUNDO = '#ffffff';

  /* ---------- cálculos que dependem dos campos editáveis ---------- */
  const area = (c) => (c.largura && c.espessura) ? c.largura * c.espessura : c.area;
  // σ, E e Rp0,2 escalam com 1/S0 (a deformação do extensômetro não depende da área)
  function props(c) {
    const S0 = area(c), k = c.calc.S0 && S0 ? c.calc.S0 / S0 : 1;
    const p = {
      S0, E: c.calc.E_GPa != null ? c.calc.E_GPa * k : null,
      Rp02: c.calc.Fp02_kN != null && S0 ? c.calc.Fp02_kN * 1000 / S0 : null,
      Rm: S0 ? c.calc.Fmax_kN * 1000 / S0 : null, Fmax: c.calc.Fmax_kN, A: c.A,
      Ag: null, eFmax: null, C: null,
    };
    const u = unificada(c);
    if (u) {
      p.C = u.C;
      const im = u.iFmax;
      p.eFmax = u.e[im];
      if (p.E && p.Rm) p.Ag = u.e[im] - p.Rm / (p.E * 1000) * 100;   // alongamento plástico na força máxima
    }
    return p;
  }

  // curva unificada (extensômetro + atuador); null sem Lc
  const cacheU = new Map();
  function unificada(c) {
    if (!c.Lc || c.Lc <= 0) return null;
    const k = `${c.cp}|${c.Lc}|${filtro.complac}`;
    if (cacheU.has(k)) return cacheU.get(k);
    const cv = CURVAS[c.cp], n = cv.n_ext, r = n - 1;
    let C = 0;
    if (filtro.complac) {
      // δ − Lc·ε = C·F + b no trecho com extensômetro (F acima de 20 % da força de referência)
      const xs = [], ys = [];
      for (let i = 0; i < n; i++) if (cv.F[i] > .2 * cv.F[r]) { xs.push(cv.F[i]); ys.push(cv.d[i] - c.Lc * cv.e[i] / 100); }
      const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
      let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
      C = sxx ? sxy / sxx : 0;
    }
    const e = cv.e.map((v, i) => i < n ? v : cv.e[r] + ((cv.d[i] - cv.d[r]) - C * (cv.F[i] - cv.F[r])) / c.Lc * 100);
    let iFmax = 0; cv.F.forEach((f, i) => { if (f > cv.F[iFmax]) iFmax = i; });
    const out = { e, C, iFmax };
    cacheU.set(k, out);
    return out;
  }

  function stats(vals) {
    const v = vals.filter(x => x !== null && x !== undefined && !isNaN(x));
    const n = v.length; if (!n) return null;
    const m = v.reduce((s, x) => s + x, 0) / n;
    const sd = n > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)) : null;
    return { n, m, sd };
  }

  /* ---------- filtros ---------- */
  function renderFiltros() {
    const as = alvos(), todos = as.every(a => filtro.alvos.has(a));
    const temLc = data.cps.some(c => c.Lc);
    document.querySelectorAll('[data-tr-filtros]').forEach(box => {
      const noGrafico = !!box.closest('[data-id="tracao"]');
      box.innerHTML = `
        <div class="f-grp" role="group" aria-label="Fase sigma alvo">
          <span class="f-lbl">Alvo σ</span>
          <button type="button" class="chip ${todos ? 'on' : ''}" data-f="todos">Todos</button>
          ${as.map(a => `<button type="button" class="chip ${filtro.alvos.has(a) ? 'on' : ''}" data-f="alvo" data-v="${a}" aria-pressed="${filtro.alvos.has(a)}">
              <i class="sw" style="background:${COND[a]?.cor || '#888'}"></i>${esc(COND[a]?.nome || a + '%')}</button>`).join('')}
        </div>
        <div class="f-grp" role="group" aria-label="Direção do eixo">
          <span class="f-lbl">Direção</span>
          ${['ambas', 'L', 'C'].map(o => `<button type="button" class="chip ${filtro.dir === o ? 'on' : ''}" data-f="dir" data-v="${o}">
              ${o === 'ambas' ? 'Ambas' : `<svg class="ls" viewBox="0 0 26 10" aria-hidden="true"><line x1="1" y1="5" x2="25" y2="5" stroke-dasharray="${DIR[o].dash}"/></svg>${DIR[o].nome}`}</button>`).join('')}
        </div>
        ${noGrafico && temLc ? `<div class="f-grp"><label class="chk"><input type="checkbox" data-f="complac" ${filtro.complac ? 'checked' : ''}> Corrigir complacência da máquina</label></div>` : ''}`;
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tr-filtros] button[data-f]');
    if (!b) return;
    const f = b.dataset.f;
    if (f === 'todos') filtro.alvos = new Set(alvos());
    if (f === 'alvo') {
      const v = +b.dataset.v, todos = alvos().every(a => filtro.alvos.has(a));
      if (todos) filtro.alvos = new Set([v]);
      else if (filtro.alvos.has(v)) { filtro.alvos.delete(v); if (!filtro.alvos.size) filtro.alvos = new Set(alvos()); }
      else filtro.alvos.add(v);
    }
    if (f === 'dir') filtro.dir = b.dataset.v;
    destaque = null;
    tudo();
  });
  document.addEventListener('change', (e) => {
    const i = e.target.closest('[data-tr-filtros] input[data-f="complac"]');
    if (!i) return;
    filtro.complac = i.checked;
    tudo();
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#tr-vistas button[data-v]');
    if (!b) return;
    vista = b.dataset.v;
    zoom = null;
    document.querySelectorAll('#tr-vistas button').forEach(x => x.classList.toggle('on', x === b));
    renderGrafico();
  });

  /* ---------- zoom do gráfico ----------
   * roda do mouse: zoom em torno do cursor · arrastar: zoom na área · Shift+arrastar: mover
   * duplo clique ou "Ajustar": volta à vista inteira · botões + / − no canto */
  let zoom = null;        // {x0, x1, y0, y1} em unidades dos dados; null = vista inteira
  let escala = null;      // última escala desenhada (para converter pixels ↔ dados)
  let arrastou = false;   // evita que o fim de um arraste conte como clique (destaque)
  const paraDados = (px, py) => ({
    x: escala.X0 + (px - escala.M.l) / escala.iw * (escala.X1 - escala.X0),
    y: escala.Y0 + (escala.M.t + escala.ih - py) / escala.ih * (escala.Y1 - escala.Y0),
  });
  function aplicarZoom(z) {
    const b = escala.base;
    // além da vista inteira não faz sentido: volta a ela
    if (z.x1 - z.x0 >= b.X1 * .999 && z.y1 - z.y0 >= b.Y1 * .999) { zoom = null; renderGrafico(); return; }
    const w = Math.min(z.x1 - z.x0, b.X1), h = Math.min(z.y1 - z.y0, b.Y1);
    let x0 = Math.min(Math.max(z.x0, 0), b.X1 - w), y0 = Math.min(Math.max(z.y0, 0), b.Y1 - h);
    zoom = { x0, x1: x0 + w, y0, y1: y0 + h };
    renderGrafico();
  }
  function zoomEm(cx, cy, f) {      // f < 1 aproxima, f > 1 afasta; (cx, cy) em dados
    const { X0, X1, Y0, Y1 } = escala;
    aplicarZoom({ x0: cx - (cx - X0) * f, x1: cx + (X1 - cx) * f, y0: cy - (cy - Y0) * f, y1: cy + (Y1 - cy) * f });
  }
  const dentroDoPlot = (mx, my) => escala && mx >= escala.M.l && mx <= escala.M.l + escala.iw && my >= escala.M.t && my <= escala.M.t + escala.ih;

  (function ligarZoom() {
    const box = document.getElementById('tr-chart');
    const ctl = document.createElement('div');
    ctl.className = 'tr-zoom';
    ctl.innerHTML = '<button type="button" data-z="in" title="Aproximar" aria-label="Aproximar">+</button>' +
      '<button type="button" data-z="out" title="Afastar" aria-label="Afastar">−</button>' +
      '<button type="button" data-z="reset" title="Ver o gráfico inteiro (ou duplo clique)">Ajustar</button>';
    box.appendChild(ctl);
    const zbox = document.createElement('div');
    zbox.className = 'tr-zbox'; zbox.hidden = true;
    box.appendChild(zbox);

    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-z]');
      if (!b || !escala) return;
      e.stopPropagation();
      if (b.dataset.z === 'reset') { zoom = null; renderGrafico(); return; }
      zoomEm((escala.X0 + escala.X1) / 2, (escala.Y0 + escala.Y1) / 2, b.dataset.z === 'in' ? .6 : 1 / .6);
    });
    box.addEventListener('wheel', (e) => {
      const r = box.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      if (!dentroDoPlot(mx, my)) return;
      e.preventDefault();
      const p = paraDados(mx, my);
      zoomEm(p.x, p.y, e.deltaY < 0 ? .8 : 1.25);
    }, { passive: false });
    box.addEventListener('dblclick', (e) => { if (e.target.closest('.tr-zoom')) return; zoom = null; renderGrafico(); });

    let ini = null;   // {mx, my, pan, z}
    box.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType === 'touch' || e.target.closest('.tr-zoom')) return;
      const r = box.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      if (!dentroDoPlot(mx, my)) return;
      ini = { mx, my, pan: e.shiftKey && !!zoom, z: { X0: escala.X0, X1: escala.X1, Y0: escala.Y0, Y1: escala.Y1 } };
      arrastou = false;
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener('pointermove', (e) => {
      if (!ini) return;
      const r = box.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      if (Math.abs(mx - ini.mx) + Math.abs(my - ini.my) > 6) arrastou = true;
      if (!arrastou) return;
      tipEl().hidden = true;
      if (ini.pan) {
        const z = ini.z, dx = (mx - ini.mx) / escala.iw * (z.X1 - z.X0), dy = (my - ini.my) / escala.ih * (z.Y1 - z.Y0);
        aplicarZoom({ x0: z.X0 - dx, x1: z.X1 - dx, y0: z.Y0 + dy, y1: z.Y1 + dy });
        return;
      }
      const { M, iw, ih } = escala;
      const cx = Math.min(Math.max(mx, M.l), M.l + iw), cy = Math.min(Math.max(my, M.t), M.t + ih);
      Object.assign(zbox.style, { left: Math.min(ini.mx, cx) + 'px', top: Math.min(ini.my, cy) + 'px',
        width: Math.abs(cx - ini.mx) + 'px', height: Math.abs(cy - ini.my) + 'px' });
      zbox.hidden = false;
    });
    const fim = (e) => {
      if (!ini) return;
      const r = box.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      if (arrastou && !ini.pan && Math.abs(mx - ini.mx) > 8 && Math.abs(my - ini.my) > 8) {
        const a = paraDados(ini.mx, ini.my), b = paraDados(mx, my);
        aplicarZoom({ x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) });
      }
      zbox.hidden = true;
      ini = null;
    };
    box.addEventListener('pointerup', fim);
    box.addEventListener('pointercancel', () => { zbox.hidden = true; ini = null; });
  })();

  /* ---------- gráfico ---------- */
  const svgEl = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const passoBom = (span, alvo = 6) => {
    const raw = span / alvo, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p;
    return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p;
  };

  let pontosHover = [];   // [{x, y, c, i}] em coordenadas de tela, para a dica

  function renderGrafico() {
    const svg = $('tr-svg'), box = $('tr-chart');
    const W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    pontosHover = [];
    const cps = data.cps.filter(visivel);
    const M = { l: 72, r: 76, t: 16, b: 54 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;

    // séries no sistema da vista
    const series = cps.map(c => {
      const cv = CURVAS[c.cp], S0 = area(c), u = unificada(c), n = cv.n_ext;
      let xs, ys, nMed;
      if (vista === 'fd') { xs = cv.d; ys = cv.F; nMed = cv.d.length; }
      else {
        const s = cv.F.map(f => f * 1000 / S0);
        if (u) { xs = u.e; ys = s; nMed = n; }
        else { xs = cv.e.slice(0, n); ys = s.slice(0, n); nMed = n; }
      }
      return { c, xs, ys, nMed, u, p: props(c) };
    });

    let X1, Y1;
    if (vista === 'el') {
      X1 = 1.0;
      Y1 = Math.max(100, ...series.map(s => (s.p.Rp02 || 0) * 1.25));
    } else {
      X1 = Math.max(0.1, ...series.map(s => Math.max(...s.xs)));
      Y1 = Math.max(1, ...series.map(s => Math.max(...s.ys)));
      X1 *= 1.03; Y1 *= 1.08;
    }
    // vista inteira (base do zoom)
    let px = passoBom(X1, Math.max(3, Math.min(8, iw / 75))), py = passoBom(Y1, Math.max(4, Math.min(8, ih / 50)));
    X1 = Math.ceil(X1 / px) * px; Y1 = Math.ceil(Y1 / py) * py;
    const base = { X1, Y1 };
    let X0 = 0, Y0 = 0;
    if (zoom) {
      ({ x0: X0, x1: X1, y0: Y0, y1: Y1 } = zoom);
      px = passoBom(X1 - X0, Math.max(3, Math.min(8, iw / 75)));
      py = passoBom(Y1 - Y0, Math.max(4, Math.min(8, ih / 50)));
    }
    escala = { M, iw, ih, X0, X1, Y0, Y1, base };
    if ($('tr-tip')) $('tr-tip').hidden = true;
    $('tr-chart').classList.toggle('zoomed', !!zoom);
    const x = (v) => M.l + (v - X0) / (X1 - X0) * iw, y = (v) => M.t + ih - (v - Y0) / (Y1 - Y0) * ih;

    const g0 = svgEl('g', { class: 'ax' }, svg);
    const casas = (p) => p >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(p) - 1e-9));
    const dx = casas(px), dy = casas(py);
    for (let k = Math.ceil(Y0 / py - 1e-9); k * py <= Y1 + 1e-9; k++) {
      const v = (k * py) || 0;
      svgEl('line', { x1: M.l, x2: M.l + iw, y1: y(v), y2: y(v), class: Math.abs(v) < 1e-9 ? 'base' : 'grid' }, g0);
      svgEl('text', { x: M.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, g0).textContent = br(v, dy);
    }
    if (Y0 > 0) svgEl('line', { x1: M.l, x2: M.l + iw, y1: M.t + ih, y2: M.t + ih, class: 'base' }, g0);
    for (let k = Math.ceil(X0 / px - 1e-9); k * px <= X1 + 1e-9; k++) {
      const v = (k * px) || 0;
      svgEl('line', { x1: x(v), x2: x(v), y1: M.t + ih, y2: M.t + ih + 5, class: 'base' }, g0);
      svgEl('text', { x: x(v), y: M.t + ih + 23, 'text-anchor': 'middle' }, g0).textContent = br(v, dx);
    }
    const tx = { ss: 'Deformação de engenharia (%)', el: 'Deformação de engenharia (%) · extensômetro', fd: 'Deslocamento do atuador (mm)' }[vista];
    const ty = vista === 'fd' ? 'Força (kN)' : 'Tensão de engenharia (MPa)';
    svgEl('text', { x: M.l + iw / 2, y: H - 6, 'text-anchor': 'middle', class: 'ttl' }, g0).textContent = tx;
    svgEl('text', { x: 16, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl', transform: `rotate(-90 16 ${M.t + ih / 2})` }, g0).textContent = ty;

    if (!series.length) {
      svgEl('text', { x: M.l + iw / 2, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl' }, svg).textContent = 'Nenhum CP com os filtros atuais';
      renderMedias(); return;
    }

    const clip = svgEl('clipPath', { id: 'tr-clip' }, svgEl('defs', {}, svg));
    svgEl('rect', { x: M.l, y: M.t - 4, width: iw + 4, height: ih + 4 }, clip);
    const dim = (c) => destaque && destaque !== c.cp ? ' dim' : '';
    const path = (xs, ys, i0, i1) => {
      let d = '';
      for (let i = i0; i < i1; i++) d += (i === i0 ? 'M' : 'L') + x(xs[i]).toFixed(1) + ',' + y(ys[i]).toFixed(1);
      return d;
    };
    const rot = [];
    // o destacado é desenhado por último (por cima)
    series.slice().sort((a, b) => (a.c.cp === destaque) - (b.c.cp === destaque)).forEach(s => {
      const { c, xs, ys, nMed } = s, cor = corDe(c), dash = DIR[c.dir]?.dash || '';
      const g = svgEl('g', { class: 'serie' + dim(c), 'data-cp': c.cp, 'clip-path': 'url(#tr-clip)' }, svg);
      const larg = destaque === c.cp ? 2.6 : 1.8;
      // trecho medido (extensômetro, ou força × deslocamento inteiro)
      svgEl('path', { d: path(xs, ys, 0, Math.min(nMed, xs.length)), fill: 'none', stroke: cor, 'stroke-width': larg, 'stroke-dasharray': dash, 'stroke-linejoin': 'round' }, g);
      // trecho estimado pelo atuador
      if (vista === 'ss' && s.u) {
        svgEl('path', { d: path(xs, ys, nMed - 1, xs.length), fill: 'none', stroke: cor, 'stroke-width': larg - .4, 'stroke-dasharray': dash, opacity: .45, 'stroke-linejoin': 'round' }, g);
      }
      // referência: último ponto confiável do extensômetro (antes da pausa)
      const cv = CURVAS[c.cp], r = cv.n_ext - 1;
      if (vista === 'fd' || (vista === 'ss' && s.u)) {
        const rx = vista === 'fd' ? cv.d[r] : s.u.e[r], ry = vista === 'fd' ? cv.F[r] : cv.F[r] * 1000 / s.p.S0;
        svgEl('circle', { cx: x(rx), cy: y(ry), r: 3.5, fill: FUNDO, stroke: cor, 'stroke-width': 1.5 }, g);
      }
      // Rp0,2 e Fmax
      if (vista !== 'fd' && s.p.Rp02 && c.calc.Rp02_def != null) {
        svgEl('path', { d: `M${x(c.calc.Rp02_def)},${y(s.p.Rp02) - 5}l5,5l-5,5l-5,-5z`, fill: cor, stroke: FUNDO, 'stroke-width': 1 }, g);
      }
      if (vista === 'fd' || (vista === 'ss' && s.u)) {
        const im = cv.F.indexOf(Math.max(...cv.F));
        const mx = vista === 'fd' ? cv.d[im] : s.u.e[im], my = vista === 'fd' ? cv.F[im] : s.p.Rm;
        svgEl('rect', { x: x(mx) - 3.5, y: y(my) - 3.5, width: 7, height: 7, fill: cor, stroke: FUNDO, 'stroke-width': 1 }, g);
      }
      // linha de proporcionalidade (σ = E·ε + b, ajuste do módulo E) sempre traçada na curva tensão × deformação
      if (vista === 'ss' && s.p.E && s.p.Rp02) {
        const E = s.p.E * 1000 / 100, b = (c.calc.E_b || 0) * (c.calc.S0 / s.p.S0);   // MPa por %
        const sTop = s.p.Rp02 * 1.15;
        svgEl('line', { x1: x(Math.max(0, -b / E)), y1: y(Math.max(0, b)), x2: x((sTop - b) / E), y2: y(sTop),
          stroke: cor, 'stroke-width': destaque === c.cp ? 1.6 : 1.1, 'stroke-dasharray': '5 4', opacity: .8, class: 'prop' }, g);
      }
      // retas do módulo e de 0,2 % (região elástica, CP destacado ou único)
      if (vista === 'el' && (destaque === c.cp || series.length === 1) && s.p.E && s.p.Rp02) {
        const E = s.p.E * 1000 / 100, b = (c.calc.E_b || 0) * (c.calc.S0 / s.p.S0);   // MPa por %
        const sTop = s.p.Rp02 * 1.15;
        const ge = svgEl('g', { 'clip-path': 'url(#tr-clip)' }, svg);
        svgEl('line', { x1: x(-b / E), y1: y(0), x2: x((sTop - b) / E), y2: y(sTop), stroke: '#3a444d', 'stroke-width': 1.2 }, ge);
        svgEl('line', { x1: x(0.2 - b / E), y1: y(0), x2: x(0.2 + (sTop - b) / E), y2: y(sTop), stroke: '#3a444d', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, ge);
        const jx = c.calc.E_janela_MPa;
        [jx[0] * c.calc.S0 / s.p.S0, jx[1] * c.calc.S0 / s.p.S0].forEach(v => svgEl('line', { x1: M.l, x2: M.l + iw, y1: y(v), y2: y(v), stroke: '#8a949d', 'stroke-width': 1, 'stroke-dasharray': '2 3' }, ge));
        svgEl('text', { x: M.l + iw - 4, y: y(jx[1] * c.calc.S0 / s.p.S0) - 5, 'text-anchor': 'end', class: 'note' }, ge).textContent = `janela do ajuste de E: ${jx[0]}–${jx[1]} MPa`;
        svgEl('text', { x: x(0.2 + (sTop * .55 - b) / E) + 8, y: y(sTop * .55), class: 'note' }, ge).textContent = 'reta deslocada 0,2 %';
      }
      // pontos para a dica
      const step = Math.max(1, Math.floor(xs.length / 400));
      for (let i = 0; i < xs.length; i += step) {
        const X = x(xs[i]), Y = y(ys[i]);
        if (X >= M.l && X <= M.l + iw && Y >= M.t && Y <= M.t + ih) pontosHover.push({ X, Y, s, i });
      }
      // rótulo direto no fim visível da curva
      // fim da curva antes da queda final de força (a ruptura levaria o rótulo para o eixo)
      const ymx = Math.max(...ys);
      let iu = xs.length - 1;
      const naVista = (i) => xs[i] >= X0 && xs[i] <= X1 && ys[i] >= Y0 && ys[i] <= Y1;
      if (zoom) {
        // ampliado: rótulo onde a curva sai da área visível pela primeira vez
        // (assim não vai parar no trecho vertical da ruptura)
        let i0 = 0;
        while (i0 < xs.length && !naVista(i0)) i0++;
        if (i0 < xs.length) {
          iu = i0;
          while (iu + 1 < xs.length && naVista(iu + 1)) iu++;
          rot.push({ cp: c.cp, x: x(xs[iu]), y: y(ys[iu]), cor });
        }
        return;
      }
      while (iu > 0 && (xs[iu] > X1 || ys[iu] > Y1 || ys[iu] < .85 * ymx)) iu--;
      if (vista === 'el') { let k = 0; while (k < xs.length - 1 && xs[k + 1] <= X1 * .97) k++; iu = k; }
      rot.push({ cp: c.cp, x: x(xs[iu]), y: y(ys[iu]), cor });
    });

    // rótulos diretos sem colisão (à direita da área do gráfico)
    const gl = svgEl('g', { class: 'lbls' }, svg);
    rot.sort((a, b) => a.y - b.y);
    if (zoom) {
      // ampliado: rótulo junto da curva, em x e y; só afasta os que se sobrepõem de fato
      const postos = [];
      rot.forEach(r => {
        r.x = Math.min(Math.max(r.x + 6, M.l + 4), M.l + iw - 44);
        r.y = Math.min(Math.max(r.y + 12, M.t + 12), M.t + ih - 6);
        let ok = false;
        while (!ok) { ok = !postos.some(p => Math.abs(p.x - r.x) < 44 && Math.abs(p.y - r.y) < 14); if (!ok) r.y += 14; }
        postos.push(r);
      });
    } else {
      for (let i = 1; i < rot.length; i++) if (rot[i].y - rot[i - 1].y < 16) rot[i].y = rot[i - 1].y + 16;
    }
    rot.forEach(r => {
      const lx = zoom ? r.x : Math.min(r.x + 8, W - 54);
      svgEl('text', { x: lx, y: r.y + 4, class: 'lbl' + (destaque && destaque !== r.cp ? ' dim' : ''), 'data-cp': r.cp }, gl).textContent = r.cp;
    });

    const nota = $('tr-nota');
    const semLc = data.cps.filter(visivel).filter(c => !c.Lc).length;
    nota.innerHTML = vista === 'fd'
      ? '○ fim do trecho com extensômetro (pausa) · ■ força máxima · curvas completas até a ruptura'
      : vista === 'el'
        ? '◆ Rp0,2 · clique numa curva para ver a reta do módulo E e a reta deslocada de 0,2 %'
        : '<span class="prop-leg">╌ linha de proporcionalidade (módulo E)</span> · ' + (semLc
          ? `Mostrando só o trecho medido pelo extensômetro (até ~1,1 %). ${semLc === data.cps.filter(visivel).length ? 'Para' : `Em ${semLc} CP(s), para`} estender a curva até a ruptura, informe o comprimento útil Lc na tabela dos CPs.`
          : `◆ Rp0,2 · ■ força máxima · traço claro = deformação <b>estimada pelo atuador</b> após a retirada do extensômetro (${filtro.complac ? 'com' : 'sem'} correção de complacência)`);
    nota.innerHTML += ` <span class="tr-zoom-dica">· Zoom: roda do mouse ou arraste uma área${zoom ? ' · Shift+arrastar move' : ''} · duplo clique volta</span>`;
    renderMedias();
  }

  // dica: ponto mais próximo do cursor
  const tipEl = () => $('tr-tip');
  document.addEventListener('pointermove', (e) => {
    const box = $('tr-chart');
    if (!box || !box.contains(e.target)) return;
    const r = box.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = null, bd = 18 * 18;
    pontosHover.forEach(p => { if (destaque && destaque !== p.s.c.cp) return; const d = (p.X - mx) ** 2 + (p.Y - my) ** 2; if (d < bd) { bd = d; best = p; } });
    const t = tipEl();
    if (!best) { t.hidden = true; return; }
    const { s, i } = best, c = s.c, cv = CURVAS[c.cp];
    const est = vista === 'ss' && s.u && i >= cv.n_ext;
    t.innerHTML = `<b>${esc(c.cp)}</b> · ${esc(grupoNome(grupo(c)))}<br>` + (vista === 'fd'
      ? `δ <span class="tv">${br(cv.d[i], 3)} mm</span> · F <span class="tv">${br(cv.F[i], 2)} kN</span><br>t = ${br(cv.t[i], 1)} s${i >= cv.n_ext ? ' · sem extensômetro' : ''}`
      : `ε <span class="tv">${br(s.xs[i], 3)} %</span>${est ? ' <i>(estimada)</i>' : ''} · σ <span class="tv">${br(s.ys[i], 0)} MPa</span><br>Rp0,2 ${br(s.p.Rp02, 0)} MPa · Rm ${br(s.p.Rm, 0)} MPa`);
    t.hidden = false;
    t.style.left = Math.min(Math.max(best.X, 100), r.width - 100) + 'px';
    t.style.top = best.Y + 'px';
  });
  $('tr-chart').addEventListener('pointerleave', () => { tipEl().hidden = true; });
  document.addEventListener('click', (e) => {
    const box = $('tr-chart');
    const linha = e.target.closest('#tr-mean tr[data-g]');
    if (linha) {
      const cps = data.cps.filter(c => visivel(c) && grupo(c) === linha.dataset.g);
      destaque = cps.length === 1 ? (destaque === cps[0].cp ? null : cps[0].cp) : null;
      if (cps.length > 1) { filtro.alvos = new Set([cps[0].alvo]); filtro.dir = cps[0].dir; }
      tudo(); return;
    }
    if (!box || !box.contains(e.target)) return;
    if (arrastou) { arrastou = false; return; }   // fim de arraste de zoom, não é clique
    if (e.target.closest('.tr-zoom')) return;
    const lbl = e.target.closest('[data-cp]');
    if (lbl && lbl.tagName === 'text') { destaque = destaque === lbl.dataset.cp ? null : lbl.dataset.cp; renderGrafico(); return; }
    const r = box.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = null, bd = 18 * 18;
    pontosHover.forEach(p => { const d = (p.X - mx) ** 2 + (p.Y - my) ** 2; if (d < bd) { bd = d; best = p; } });
    destaque = best && destaque !== best.s.c.cp ? best.s.c.cp : null;
    renderGrafico();
  });

  /* ---------- painel lateral: médias por grupo ---------- */
  function renderMedias() {
    const gs = [...new Set(data.cps.filter(visivel).map(grupo))].sort();
    const cols = [['E', 'E (GPa)', 1], ['Rp02', 'Rp0,2 (MPa)', 0], ['Rm', 'Rm (MPa)', 0], ['A', 'A (%)', 1]];
    $('tr-mean').innerHTML = `<thead><tr><th>Grupo</th><th>n</th>${cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead>
      <tbody>${gs.map(g => {
        const cps = data.cps.filter(c => visivel(c) && grupo(c) === g), ps = cps.map(props);
        const cor = COND[g[0]]?.cor || '#888';
        return `<tr data-g="${g}">
          <td><svg class="ls" viewBox="0 0 26 10" aria-hidden="true" style="stroke:${cor}"><line x1="1" y1="5" x2="25" y2="5" stroke-dasharray="${DIR[g[1]]?.dash || ''}" stroke-width="2"/></svg>${esc(grupoNome(g))}</td>
          <td>${cps.length}</td>
          ${cols.map(([k, , d]) => { const st = stats(ps.map(p => p[k])); return `<td>${st ? `${br(st.m, d)}${st.sd ? `<small> ± ${br(st.sd, d)}</small>` : ''}${st.n < cps.length ? `<small class="nd"> (n=${st.n})</small>` : ''}` : '<span class="nd">—</span>'}</td>`; }).join('')}
        </tr>`;
      }).join('')}</tbody>`;
  }

  /* ---------- tabela dos CPs ---------- */
  const inp = (c, campo, val, cls = '') =>
    `<input class="${cls}" data-cp="${esc(c.cp)}" data-campo="${campo}" value="${esc(val === null || val === undefined ? '' : String(val).replace('.', ','))}" ${campo === 'obs' ? '' : 'inputmode="decimal"'} aria-label="${campo} ${esc(c.cp)}">`;
  // valor calculado + valor do relatório MTS (destacado se a diferença passar de 3 %)
  const comMts = (v, mts, d) => {
    if (v == null) return '<span class="nd">—</span>';
    const dif = mts != null && v ? Math.abs(v - mts) / v : 0;
    return `${br(v, d)}${mts != null ? `<small class="mts ${dif > .03 ? 'diff' : ''}" title="Relatório MTS">MTS ${br(mts, d)}</small>` : ''}`;
  };

  function renderTabela() {
    const cps = data.cps.filter(visivel).slice().sort((a, b) => a.alvo - b.alvo || a.dir.localeCompare(b.dir) || a.cp.localeCompare(b.cp, 'pt', { numeric: true }));
    const cab = `<thead><tr class="grp">
        <th class="c-cond">CP</th><th>Ensaio</th>
        <th>Largura (mm)</th><th>Espessura (mm)</th><th>S0 (mm²)</th><th title="Comprimento útil (paralelo) do CP">Lc (mm)</th>
        <th>E (GPa)</th><th>Rp0,2 (MPa)</th><th>Rm (MPa)</th><th>Fmax (kN)</th>
        <th title="Alongamento plástico na força máxima, estimado pelo atuador (requer Lc)">Ag (%)</th>
        <th title="Alongamento após fratura medido no CP (ISO 6892-1, anexo H)">A (%)</th>
        <th class="c-sit">Obs.</th></tr></thead>`;
    const gs = [];
    cps.forEach(c => { const g = grupo(c); if (!gs.length || gs[gs.length - 1].g !== g) gs.push({ g, cps: [] }); gs[gs.length - 1].cps.push(c); });
    const corpo = gs.map(({ g, cps }) => {
      const cor = COND[g[0]]?.cor || '#888';
      const linhas = cps.map(c => {
        const p = props(c);
        return `<tr data-row="${esc(c.cp)}">
          <td class="c-cond"><b>${esc(c.cp)}</b></td>
          <td class="tt">${esc(c.test_run || '')}<br><small>${esc(dataBR(c.data))}</small></td>
          <td>${editing ? inp(c, 'largura', c.largura) : br(c.largura, 2)}</td>
          <td>${editing ? inp(c, 'espessura', c.espessura) : br(c.espessura, 2)}</td>
          <td class="calc" data-calc="S0">${br(p.S0, 2)}</td>
          <td>${editing ? inp(c, 'Lc', c.Lc) : c.Lc ? br(c.Lc, 1) : '<span class="nd" title="a informar">pendente</span>'}</td>
          <td data-calc="E">${comMts(p.E, c.mts.E_GPa, 1)}</td>
          <td data-calc="Rp02" class="en">${comMts(p.Rp02, c.mts.Rp02, 0)}</td>
          <td data-calc="Rm" class="en">${comMts(p.Rm, c.mts.Rm, 0)}</td>
          <td>${br(p.Fmax, 2)}</td>
          <td data-calc="Ag">${p.Ag != null ? `${br(p.Ag, 1)}<small class="mts">estimado</small>` : '<span class="nd">—</span>'}</td>
          <td>${editing ? inp(c, 'A', c.A) : comMts(c.A, null, 1)}${!editing && c.mts.A != null && c.A !== c.mts.A ? `<small class="mts diff" title="Relatório MTS">MTS ${br(c.mts.A, 2)}</small>` : ''}</td>
          <td class="c-sit">${editing ? inp(c, 'obs', c.obs, 'txt') : esc(c.obs || '')}</td>
        </tr>`;
      }).join('');
      const ps = cps.map(props), st = (k) => stats(ps.map(p => p[k]));
      const m = (k, d, u) => { const s = st(k); return s ? `${k === 'Rp02' ? 'Rp0,2' : k} <b>${br(s.m, d)}${u}</b>${s.sd ? ` ± ${br(s.sd, d)}` : ''}` : ''; };
      return `<tbody class="g">
        <tr class="g-head"><td colspan="13"><i class="sw" style="background:${cor}"></i>${esc(COND[g[0]]?.nome ?? g[0] + '%')} · ${esc(DIR[g[1]]?.nome || g[1])}</td></tr>
        ${linhas}
        <tr class="g-mean"><td colspan="13">Média (n = ${cps.length}): <span>${[m('E', 1, ' GPa'), m('Rp02', 0, ' MPa'), m('Rm', 0, ' MPa'), m('A', 1, ' %')].filter(Boolean).join(' · ')}</span></td></tr>
      </tbody>`;
    }).join('');
    $('tr-table').innerHTML = cab + (corpo || '<tbody><tr><td colspan="13" class="nd">Nenhum CP com os filtros atuais.</td></tr></tbody>');
  }

  document.addEventListener('change', (e) => {
    const el = e.target.closest('#tr-table input[data-campo]');
    if (!el) return;
    const c = data.cps.find(x => x.cp === el.dataset.cp), campo = el.dataset.campo;
    if (campo === 'obs') c.obs = el.value;
    else {
      const n = parse(el.value);
      el.classList.toggle('bad', Number.isNaN(n) || (n != null && n <= 0));
      if (Number.isNaN(n) || (n != null && n <= 0)) return;
      c[campo] = n;
    }
    cacheU.clear();
    salvoLocal(); renderFiltros();
    // atualiza só as células calculadas da linha (não perde o foco do próximo campo)
    const tr = el.closest('tr'), p = props(c);
    tr.querySelector('[data-calc="S0"]').textContent = br(p.S0, 2);
    tr.querySelector('[data-calc="E"]').innerHTML = comMts(p.E, c.mts.E_GPa, 1);
    tr.querySelector('[data-calc="Rp02"]').innerHTML = comMts(p.Rp02, c.mts.Rp02, 0);
    tr.querySelector('[data-calc="Rm"]').innerHTML = comMts(p.Rm, c.mts.Rm, 0);
    tr.querySelector('[data-calc="Ag"]').innerHTML = p.Ag != null ? `${br(p.Ag, 1)}<small class="mts">estimado</small>` : '<span class="nd">—</span>';
  });

  const editaveis = (d) => d.cps.map(c => { const o = { cp: c.cp }; EDIT.forEach(k => o[k] = c[k]); return o; });
  function salvoLocal() {
    store.set({ cps: editaveis(data) });
    renderComp();
    $('tr-badge').hidden = JSON.stringify(editaveis(data)) === JSON.stringify(editaveis(base));
    renderGrafico();
  }
  function setEditing(on) {
    editing = on;
    document.querySelector('[data-id="tracao-cps"]').classList.toggle('editing', on);
    $('tr-edit').textContent = on ? 'Concluir' : 'Editar';
    ['tr-save', 'tr-reset'].forEach(id => $(id).hidden = !on);
    renderTabela();
  }
  function saveFile() {
    const txt = `// Ensaios de tração · dados dos CPs e propriedades calculadas.
// Gerado pela página em ${new Date().toLocaleString('pt-BR')}. Substitua Site/dados/tracao.js por este arquivo.
// Campos editáveis: largura, espessura (mm), Lc (comprimento útil, mm), A (alongamento após fratura, %), obs.
window.DADOS_TRACAO = ${JSON.stringify(data, null, 1)};
`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' }));
    a.download = 'tracao.js';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function reset() {
    if (!confirm('Descartar as alterações feitas neste navegador e voltar aos valores do arquivo dados/tracao.js?')) return;
    store.clear(); data = clone(base); cacheU.clear();
    $('tr-badge').hidden = true; tudo();
  }

  /* ---------- comparação de propriedades ---------- */
  const PROP = {
    Rm:   { nome: 'Limite de resistência (LRT)', curto: 'Rm', un: 'MPa', d: 0 },
    Rp02: { nome: 'Limite de escoamento Rp0,2', curto: 'Rp0,2', un: 'MPa', d: 0 },
    E:    { nome: 'Módulo de elasticidade', curto: 'E', un: 'GPa', d: 1 },
    A:    { nome: 'Alongamento após fratura', curto: 'A', un: '%', d: 1 },
    Ag:   { nome: 'Alongamento uniforme (estimado)', curto: 'Ag', un: '%', d: 1 },
    Fmax: { nome: 'Força máxima', curto: 'Fmax', un: 'kN', d: 2 },
  };
  const AGRUP = {
    cond: { nome: 'Condição (alvo + direção)', chave: c => grupo(c), rot: g => grupoNome(g) },
    alvo: { nome: 'Alvo σ', chave: c => String(c.alvo), rot: g => COND[g]?.nome ?? g + '%' },
    dir:  { nome: 'Direção', chave: c => c.dir, rot: g => DIR[g]?.nome ?? g },
    cp:   { nome: 'CP', chave: c => c.cp, rot: g => g },
  };
  const comp = { modo: 'grupo', y: 'Rm', x: 'A', por: 'cond' };

  function renderCtrl() {
    const box = $('tr-ctrl'); if (!box) return;
    const chips = (f, sel, opts) => opts.map(([v, t]) => `<button type="button" class="chip ${sel === v ? 'on' : ''}" data-c="${f}" data-v="${v}">${t}</button>`).join('');
    const props = Object.entries(PROP).map(([k, p]) => [k, `${p.curto} <small>(${p.un})</small>`]);
    box.innerHTML = `
      <div class="f-grp"><span class="f-lbl">Gráfico</span>${chips('modo', comp.modo, [['grupo', 'Propriedade por grupo'], ['xy', 'Propriedade × propriedade']])}</div>
      <div class="f-grp"><span class="f-lbl">${comp.modo === 'xy' ? 'Eixo Y' : 'Propriedade'}</span>${chips('y', comp.y, props)}</div>
      ${comp.modo === 'xy'
        ? `<div class="f-grp"><span class="f-lbl">Eixo X</span>${chips('x', comp.x, props)}</div>`
        : `<div class="f-grp"><span class="f-lbl">Agrupar por</span>${chips('por', comp.por, Object.entries(AGRUP).map(([k, a]) => [k, a.nome]))}</div>`}`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#tr-ctrl button[data-c]');
    if (!b) return;
    comp[b.dataset.c] = b.dataset.v;
    if (comp.modo === 'xy' && comp.x === comp.y) comp.x = comp.y === 'A' ? 'Rm' : 'A';
    renderCtrl(); renderComp();
  });

  let hoverComp = [];
  function marca(g, dir, X, Y, r, attrs) {
    return dir === 'C'
      ? svgEl('rect', { x: X - r * .9, y: Y - r * .9, width: r * 1.8, height: r * 1.8, rx: 1.5, ...attrs }, g)
      : svgEl('circle', { cx: X, cy: Y, r, ...attrs }, g);
  }
  function faixa(vals, d) {
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = Math.max((hi - lo) * .15, Math.abs(hi) * .03, 10 ** -d);
    lo -= pad; hi += pad;
    const st = passoBom(hi - lo, 5);
    return { lo: Math.floor(lo / st) * st, hi: Math.ceil(hi / st) * st, st };
  }

  function renderComp() {
    const svg = $('tr-comp-svg'), box = $('tr-comp-chart');
    if (!svg) return;
    const W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    hoverComp = [];
    const py = PROP[comp.y], cps = data.cps.filter(visivel);
    const linhas = cps.map(c => ({ c, p: props(c) }));
    const comY = linhas.filter(l => l.p[comp.y] != null);
    const semY = linhas.length - comY.length;
    const M = { l: 76, r: 28, t: 18, b: comp.modo === 'xy' ? 54 : 70 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;
    const g0 = svgEl('g', { class: 'ax' }, svg);
    const nota = $('tr-comp-nota');

    const eixoY = (fx) => {
      for (let v = fx.lo; v <= fx.hi + 1e-9; v += fx.st) {
        const Y = M.t + ih - (v - fx.lo) / (fx.hi - fx.lo) * ih;
        svgEl('line', { x1: M.l, x2: M.l + iw, y1: Y, y2: Y, class: 'grid' }, g0);
        svgEl('text', { x: M.l - 8, y: Y + 4, 'text-anchor': 'end' }, g0).textContent = br(v, fx.st < 1 ? 1 : 0);
      }
      svgEl('text', { x: 16, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl', transform: `rotate(-90 16 ${M.t + ih / 2})` }, g0).textContent = `${py.nome} (${py.un})`;
    };
    const vazio = (msg) => { svgEl('text', { x: M.l + iw / 2, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl' }, svg).textContent = msg; };

    if (comp.modo === 'grupo') {
      const ag = AGRUP[comp.por];
      const chaves = [...new Set(cps.map(ag.chave))].sort((a, b) => comp.por === 'cp' ? a.localeCompare(b, 'pt', { numeric: true }) : a.localeCompare(b));
      $('tr-comp-h').textContent = `${py.curto} (${py.un}) por ${ag.nome.toLowerCase()}`;
      renderCompStats(chaves.map(k => ({ k, nome: ag.rot(k), ls: linhas.filter(l => ag.chave(l.c) === k) })), py);
      if (!comY.length) { vazio(comp.y === 'Ag' ? 'Ag requer o comprimento útil Lc (tabela dos CPs)' : 'Sem valores para os filtros atuais'); nota.textContent = ''; return; }
      const fx = faixa(comY.map(l => l.p[comp.y]), py.d);
      const Y = (v) => M.t + ih - (v - fx.lo) / (fx.hi - fx.lo) * ih;
      eixoY(fx);
      const bw = iw / chaves.length;
      chaves.forEach((k, gi) => {
        const cx = M.l + bw * (gi + .5), ls = comY.filter(l => ag.chave(l.c) === k);
        const nTot = linhas.filter(l => ag.chave(l.c) === k).length;
        svgEl('text', { x: cx, y: M.t + ih + 22, 'text-anchor': 'middle', class: 'cat' }, g0).textContent = ag.rot(k);
        svgEl('text', { x: cx, y: M.t + ih + 40, 'text-anchor': 'middle', class: 'cat-n' }, g0).textContent = `n = ${ls.length}${ls.length < nTot ? ` de ${nTot}` : ''}`;
        const st = stats(ls.map(l => l.p[comp.y]));
        const cores = [...new Set(ls.map(l => corDe(l.c)))];
        const corG = cores.length === 1 ? cores[0] : '#3a444d';
        const g = svgEl('g', {}, svg);
        if (st && ls.length > 1) {
          const half = Math.min(bw * .32, 46);
          if (st.sd) {
            svgEl('line', { x1: cx, x2: cx, y1: Y(st.m - st.sd), y2: Y(st.m + st.sd), stroke: corG, 'stroke-width': 1.5, opacity: .8 }, g);
            [st.m - st.sd, st.m + st.sd].forEach(v => svgEl('line', { x1: cx - 5, x2: cx + 5, y1: Y(v), y2: Y(v), stroke: corG, 'stroke-width': 1.5, opacity: .8 }, g));
          }
          svgEl('line', { x1: cx - half, x2: cx + half, y1: Y(st.m), y2: Y(st.m), stroke: corG, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
          const hit = svgEl('rect', { x: cx - half, y: Y(st.m) - 6, width: half * 2, height: 12, class: 'hit' }, g);
          hit.dataset.tip = `<b>${esc(ag.rot(k))}</b><br>Média <span class="tv">${br(st.m, py.d)} ${py.un}</span>${st.sd ? ` ± ${br(st.sd, py.d)}` : ''}<br>n = ${st.n}`;
        }
        // CPs individuais, deslocados lateralmente para não se sobreporem
        const sp = Math.min(14, bw * .5 / Math.max(1, ls.length));
        ls.sort((a, b) => a.c.cp.localeCompare(b.c.cp, 'pt', { numeric: true })).forEach((l, i) => {
          const X = cx + (i - (ls.length - 1) / 2) * sp + (ls.length > 1 ? bw * .18 : 0), Yv = Y(l.p[comp.y]);
          marca(g, l.c.dir, X, Yv, 5, { fill: corDe(l.c), stroke: FUNDO, 'stroke-width': 1.5 });
          const hit = svgEl('circle', { cx: X, cy: Yv, r: 10, class: 'hit' }, g);
          hit.dataset.tip = `<b>${esc(l.c.cp)}</b> · ${esc(grupoNome(grupo(l.c)))}<br>${esc(py.curto)} <span class="tv">${br(l.p[comp.y], py.d)} ${py.un}</span>`;
        });
      });
      nota.innerHTML = `Eixo vertical ajustado à faixa dos dados (não começa em zero).${semY ? ` ${semY} CP(s) sem valor de ${py.curto} não aparecem${comp.y === 'A' ? ' (alongamento pendente)' : comp.y === 'Ag' ? ' (requer Lc)' : ''}.` : ''}`;
    } else {
      const px = PROP[comp.x];
      const ok = linhas.filter(l => l.p[comp.y] != null && l.p[comp.x] != null);
      $('tr-comp-h').textContent = `${py.curto} × ${px.curto} por grupo`;
      const gs = [...new Set(cps.map(grupo))].sort();
      renderCompStats(gs.map(k => ({ k, nome: grupoNome(k), ls: linhas.filter(l => grupo(l.c) === k) })), py, px);
      if (!ok.length) { vazio('Sem CPs com as duas propriedades'); nota.textContent = ''; return; }
      const fy = faixa(ok.map(l => l.p[comp.y]), py.d), fxx = faixa(ok.map(l => l.p[comp.x]), px.d);
      const Y = (v) => M.t + ih - (v - fy.lo) / (fy.hi - fy.lo) * ih;
      const X = (v) => M.l + (v - fxx.lo) / (fxx.hi - fxx.lo) * iw;
      eixoY(fy);
      for (let v = fxx.lo; v <= fxx.hi + 1e-9; v += fxx.st) {
        svgEl('line', { x1: X(v), x2: X(v), y1: M.t, y2: M.t + ih, class: 'grid' }, g0);
        svgEl('text', { x: X(v), y: M.t + ih + 22, 'text-anchor': 'middle' }, g0).textContent = br(v, fxx.st < 1 ? 1 : 0);
      }
      svgEl('text', { x: M.l + iw / 2, y: H - 6, 'text-anchor': 'middle', class: 'ttl' }, g0).textContent = `${px.nome} (${px.un})`;
      const g = svgEl('g', {}, svg);
      ok.forEach(l => {
        const cx = X(l.p[comp.x]), cy = Y(l.p[comp.y]);
        marca(g, l.c.dir, cx, cy, 6, { fill: corDe(l.c), stroke: FUNDO, 'stroke-width': 1.5 });
        svgEl('text', { x: cx + 9, y: cy + 4, class: 'lbl' }, g).textContent = l.c.cp;
        const hit = svgEl('circle', { cx, cy, r: 11, class: 'hit' }, g);
        hit.dataset.tip = `<b>${esc(l.c.cp)}</b> · ${esc(grupoNome(grupo(l.c)))}<br>${esc(py.curto)} <span class="tv">${br(l.p[comp.y], py.d)} ${py.un}</span><br>${esc(px.curto)} <span class="tv">${br(l.p[comp.x], px.d)} ${px.un}</span>`;
      });
      const falta = linhas.length - ok.length;
      nota.innerHTML = `Cor = alvo σ · ● longitudinal · ■ circunferencial.${falta ? ` ${falta} CP(s) sem uma das propriedades não aparecem.` : ''}`;
    }
  }

  function renderCompStats(grs, py, px) {
    const t = $('tr-comp-stats');
    const linha = (gr, pp, k) => {
      const v = gr.ls.map(l => l.p[k]).filter(x => x != null), st = stats(v);
      if (!st) return '<td class="nd">—</td><td></td><td></td><td></td>';
      const cv = st.sd ? st.sd / st.m * 100 : null;
      return `<td>${br(st.m, pp.d)}${st.sd ? `<small> ± ${br(st.sd, pp.d)}</small>` : ''}</td><td>${cv != null ? br(cv, 1) : '<span class="nd">—</span>'}</td><td>${br(Math.min(...v), pp.d)}</td><td>${br(Math.max(...v), pp.d)}</td>`;
    };
    const um = (pp, k, rot) => `<thead><tr><th>${rot}</th><th>n</th><th>Média</th><th>CV %</th><th>Mín.</th><th>Máx.</th></tr></thead>
      <tbody>${grs.map(gr => `<tr><td>${esc(gr.nome)}</td><td>${gr.ls.filter(l => l.p[k] != null).length}</td>${linha(gr, pp, k)}</tr>`).join('')}</tbody>`;
    t.innerHTML = px ? um(py, comp.y, `${py.curto} (${py.un})`) + um(px, comp.x, `${px.curto} (${px.un})`) : um(py, comp.y, 'Grupo');
  }

  document.addEventListener('pointerover', (e) => {
    const h = e.target.closest && e.target.closest('#tr-comp-svg .hit');
    if (!h) return;
    const t = $('tr-comp-tip'), box = $('tr-comp-chart').getBoundingClientRect(), r = h.getBoundingClientRect();
    t.innerHTML = h.dataset.tip; t.hidden = false;
    t.style.left = Math.min(Math.max(r.left + r.width / 2 - box.left, 90), box.width - 90) + 'px';
    t.style.top = (r.top - box.top) + 'px';
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest && e.target.closest('#tr-comp-svg .hit')) $('tr-comp-tip').hidden = true;
  });

  function tudo() { renderFiltros(); renderCtrl(); renderGrafico(); renderComp(); renderTabela(); }

  $('tr-edit').addEventListener('click', () => setEditing(!editing));
  $('tr-save').addEventListener('click', saveFile);
  $('tr-reset').addEventListener('click', reset);
  $('tr-badge').hidden = JSON.stringify(editaveis(data)) === JSON.stringify(editaveis(base));
  new ResizeObserver(() => renderGrafico()).observe($('tr-chart'));
  new ResizeObserver(() => renderComp()).observe($('tr-comp-chart'));
  tudo();
})();
