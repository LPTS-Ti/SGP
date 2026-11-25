/* Charpy · gráfico de transição dúctil-frágil + tabela editável dos CPs
 *
 * Dados: dados/charpy.js (window.DADOS_CHARPY), gerado por
 *   Site/ferramentas/importar_charpy.py a partir de "Controle dos CPs do Charpy.xlsx".
 * Edição: botão "Editar" na página "Tabela dos CPs". As alterações ficam guardadas
 * neste navegador e "Salvar arquivo" baixa um novo charpy.js para substituir
 * Site/dados/charpy.js.
 */
(function () {
  const base = window.DADOS_CHARPY;
  if (!base) return;
  const KEY = 'faseSigma.charpy';
  const MICRO = window.MICRO_CHARPY || {};   // dados/charpy-micro.js (micrografias quantificadas)
  const microDe = (c) => MICRO[`${c.cond}|${c.orient}|${c.temp}|${c.cp}`];
  const NS = 'http://www.w3.org/2000/svg';

  /* cores por condição: paleta categórica validada (modo escuro, superfície #151a1f);
     0% = referência neutra. Orientação: L-C linha cheia + círculo; C-L tracejada + quadrado. */
  const COND = {
    0: { nome: 'Não tratado', curto: '0%', cor: '#9aa3ab' },
    2: { nome: '2% σ', curto: '2%', cor: '#3987e5' },
    4: { nome: '4% σ', curto: '4%', cor: '#d95926' },
    6: { nome: '6% σ', curto: '6%', cor: '#199e70' },
  };
  const ORIENT = { 'L-C': { dash: '', forma: 'circ' }, 'C-L': { dash: '6 4', forma: 'quad' } };
  const TEMPS = [20, -20, -50];
  // gráfico em fundo branco: tons mais escuros da mesma paleta (contraste ≥ 4,5:1 com o branco)
  const COR_CLARO = { 0: '#6b7580', 2: '#2a6fc9', 4: '#c94f1e', 6: '#13835c' };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const store = {
    get() { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };
  let data = store.get() || clone(base);
  const condsPresentes = () => [...new Set(data.cps.map(c => c.cond))].sort((a, b) => a - b);

  const filtro = { conds: new Set(condsPresentes()), orient: 'ambas', pontos: true, dp: true };
  let destaque = null;     // chave de série destacada
  let editing = false;

  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const br = (v, d = 1) => (v === null || v === undefined || isNaN(v)) ? '' :
    Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const brAuto = (v) => (v === null || v === undefined || isNaN(v)) ? '' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const parse = (txt) => {
    txt = String(txt).trim().replace(/\s/g, '').replace(',', '.');
    if (txt === '' || txt === '—' || txt === '-') return null;
    const n = Number(txt); return isNaN(n) ? NaN : n;
  };
  const tempTxt = (t) => (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t) + ' °C';
  const media2 = (a) => { const v = a.filter(x => x !== null && x !== undefined); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const serieKey = (c) => `${c.cond}|${c.orient}`;
  const serieNome = (k) => { const [cd, o] = k.split('|'); return `${COND[cd]?.nome ?? cd + '%'} · ${o}`; };
  const visivel = (c) => filtro.conds.has(c.cond) && (filtro.orient === 'ambas' || c.orient === filtro.orient);

  function stats(vals) {
    const v = vals.filter(x => x !== null && !isNaN(x));
    const n = v.length; if (!n) return null;
    const m = v.reduce((s, x) => s + x, 0) / n;
    const sd = n > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)) : null;
    return { n, m, sd };
  }
  function series() {
    const map = new Map();
    data.cps.filter(visivel).forEach(c => {
      const k = serieKey(c);
      if (!map.has(k)) map.set(k, { key: k, cond: c.cond, orient: c.orient, cps: [] });
      map.get(k).cps.push(c);
    });
    const arr = [...map.values()].sort((a, b) => a.cond - b.cond || a.orient.localeCompare(b.orient) * -1);
    arr.forEach(s => {
      s.pontos = TEMPS.map(t => ({ t, st: stats(s.cps.filter(c => c.temp === t).map(c => c.energia)) })).filter(p => p.st);
    });
    return arr;
  }

  /* ---------- filtros (compartilhados pelo gráfico e pela tabela) ---------- */
  function renderFiltros() {
    const conds = condsPresentes();
    const todos = conds.every(c => filtro.conds.has(c));
    document.querySelectorAll('[data-filtros]').forEach(box => {
      const noGrafico = !!box.closest('[data-id="charpy"]');
      box.innerHTML = `
        <div class="f-grp" role="group" aria-label="Condição">
          <span class="f-lbl">Condição</span>
          <button type="button" class="chip ${todos ? 'on' : ''}" data-f="todos">Todos</button>
          ${conds.map(c => `<button type="button" class="chip ${filtro.conds.has(c) ? 'on' : ''}" data-f="cond" data-v="${c}" aria-pressed="${filtro.conds.has(c)}">
              <i class="sw" style="background:${COND[c]?.cor || '#888'}"></i>${esc(COND[c]?.nome || c + '%')}</button>`).join('')}
        </div>
        <div class="f-grp" role="group" aria-label="Orientação">
          <span class="f-lbl">Orientação</span>
          ${['ambas', 'L-C', 'C-L'].map(o => `<button type="button" class="chip ${filtro.orient === o ? 'on' : ''}" data-f="orient" data-v="${o}">
              ${o === 'ambas' ? 'Ambas' : `<svg class="ls" viewBox="0 0 26 10" aria-hidden="true"><line x1="1" y1="5" x2="25" y2="5" stroke-dasharray="${ORIENT[o].dash}"/>${o === 'L-C' ? '<circle cx="13" cy="5" r="3.5"/>' : '<rect x="9.5" y="1.5" width="7" height="7"/>'}</svg>${o}`}</button>`).join('')}
        </div>
        ${noGrafico ? `<div class="f-grp" role="group" aria-label="Exibir">
          <span class="f-lbl">Exibir</span>
          <label class="chk"><input type="checkbox" data-f="pontos" ${filtro.pontos ? 'checked' : ''}> CPs individuais</label>
          <label class="chk"><input type="checkbox" data-f="dp" ${filtro.dp ? 'checked' : ''}> Desvio padrão</label>
        </div>` : ''}`;
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-filtros] button[data-f]');
    if (!b) return;
    const f = b.dataset.f;
    if (f === 'todos') filtro.conds = new Set(condsPresentes());
    if (f === 'cond') {
      const v = +b.dataset.v;
      // clique simples isola a condição se todas estão ligadas; senão alterna
      const todos = condsPresentes().every(c => filtro.conds.has(c));
      if (todos) filtro.conds = new Set([v]);
      else if (filtro.conds.has(v)) { filtro.conds.delete(v); if (!filtro.conds.size) filtro.conds = new Set(condsPresentes()); }
      else filtro.conds.add(v);
    }
    if (f === 'orient') filtro.orient = b.dataset.v;
    destaque = null;
    tudo();
  });
  document.addEventListener('change', (e) => {
    const i = e.target.closest('[data-filtros] input[data-f]');
    if (!i) return;
    filtro[i.dataset.f] = i.checked;
    renderGrafico();
  });

  /* ---------- gráfico ---------- */
  const svgEl = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  function marcador(g, forma, x, y, r, attrs) {
    return forma === 'quad'
      ? svgEl('rect', { x: x - r * .9, y: y - r * .9, width: r * 1.8, height: r * 1.8, rx: 1.5, ...attrs }, g)
      : svgEl('circle', { cx: x, cy: y, r, ...attrs }, g);
  }

  /* ---------- zoom do gráfico ----------
   * roda do mouse: zoom em torno do cursor · arrastar: zoom na área · Shift+arrastar: mover
   * duplo clique ou "Ajustar": volta à vista inteira · botões + / − no canto */
  let zoom = null;        // {x0, x1, y0, y1}: °C e J; null = vista inteira
  let escala = null;
  let arrastou = false;
  const paraDados = (px, py) => ({
    x: escala.X0 + (px - escala.M.l) / escala.iw * (escala.X1 - escala.X0),
    y: escala.Y0 + (escala.M.t + escala.ih - py) / escala.ih * (escala.Y1 - escala.Y0),
  });
  function aplicarZoom(z) {
    const b = escala.base, W = b.X1 - b.X0, H = b.Y1 - b.Y0;
    if (z.x1 - z.x0 >= W * .999 && z.y1 - z.y0 >= H * .999) { zoom = null; renderGrafico(); return; }
    const w = Math.min(z.x1 - z.x0, W), h = Math.min(z.y1 - z.y0, H);
    const x0 = Math.min(Math.max(z.x0, b.X0), b.X1 - w), y0 = Math.min(Math.max(z.y0, b.Y0), b.Y1 - h);
    zoom = { x0, x1: x0 + w, y0, y1: y0 + h };
    renderGrafico();
  }
  function zoomEm(cx, cy, f) {
    const { X0, X1, Y0, Y1 } = escala;
    aplicarZoom({ x0: cx - (cx - X0) * f, x1: cx + (X1 - cx) * f, y0: cy - (cy - Y0) * f, y1: cy + (Y1 - cy) * f });
  }
  const dentroDoPlot = (mx, my) => escala && mx >= escala.M.l && mx <= escala.M.l + escala.iw && my >= escala.M.t && my <= escala.M.t + escala.ih;

  (function ligarZoom() {
    const box = document.getElementById('ch-chart');
    if (!box) return;
    const ctl = document.createElement('div');
    ctl.className = 'ch-zoom';
    ctl.innerHTML = '<button type="button" data-z="in" title="Aproximar" aria-label="Aproximar">+</button>' +
      '<button type="button" data-z="out" title="Afastar" aria-label="Afastar">−</button>' +
      '<button type="button" data-z="reset" title="Ver o gráfico inteiro (ou duplo clique)">Ajustar</button>';
    box.appendChild(ctl);
    const zbox = document.createElement('div');
    zbox.className = 'ch-zbox'; zbox.hidden = true;
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
    box.addEventListener('dblclick', (e) => { if (e.target.closest('.ch-zoom')) return; zoom = null; renderGrafico(); });

    let ini = null;
    box.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType === 'touch' || e.target.closest('.ch-zoom')) return;
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
    box.addEventListener('pointerup', (e) => {
      if (!ini) return;
      const r = box.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      if (arrastou && !ini.pan && Math.abs(mx - ini.mx) > 8 && Math.abs(my - ini.my) > 8) {
        const a = paraDados(ini.mx, ini.my), b = paraDados(mx, my);
        aplicarZoom({ x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) });
      }
      zbox.hidden = true;
      ini = null;
    });
    box.addEventListener('pointercancel', () => { zbox.hidden = true; ini = null; });
  })();

  function renderGrafico() {
    const svg = $('ch-svg'), box = $('ch-chart');
    const W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;                         // slide escondido; redesenha ao aparecer
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    const ss = series();
    const M = { l: 66, r: 104, t: 16, b: 54 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;

    let ymax = 10;
    ss.forEach(s => {
      s.cps.forEach(c => { if (filtro.pontos && c.energia != null) ymax = Math.max(ymax, c.energia); });
      s.pontos.forEach(p => ymax = Math.max(ymax, p.st.m + (filtro.dp && p.st.sd ? p.st.sd : 0)));
    });
    // eixo Y de 20 em 20 J na vista inteira (passo menor só quando o zoom deixa a faixa estreita)
    const PASSO_Y = 20;
    ymax = Math.max(PASSO_Y, Math.ceil(ymax * 1.08 / PASSO_Y) * PASSO_Y);
    const base = { X0: -60, X1: 30, Y0: 0, Y1: ymax };
    let X0 = base.X0, X1 = base.X1, Y0 = base.Y0, Y1 = base.Y1;
    if (zoom) ({ x0: X0, x1: X1, y0: Y0, y1: Y1 } = zoom);
    const span = Y1 - Y0;
    const passo = span >= 3 * PASSO_Y ? PASSO_Y : span >= 30 ? 10 : span >= 12 ? 5 : span >= 5 ? 2 : 1;
    escala = { M, iw, ih, X0, X1, Y0, Y1, base };
    box.classList.toggle('zoomed', !!zoom);
    if (tip()) tip().hidden = true;
    const x = (t) => M.l + (t - X0) / (X1 - X0) * iw;
    const y = (v) => M.t + ih - (v - Y0) / (Y1 - Y0) * ih;

    // eixos (sem linhas de grade): eixo Y com marcas curtas, eixo X na base
    const g0 = svgEl('g', { class: 'ax' }, svg);
    svgEl('line', { x1: M.l, x2: M.l, y1: M.t, y2: M.t + ih, class: 'base' }, g0);
    svgEl('line', { x1: M.l, x2: M.l + iw, y1: M.t + ih, y2: M.t + ih, class: 'base' }, g0);
    for (let k = Math.ceil(Y0 / passo - 1e-9); k * passo <= Y1 + 1e-9; k++) {
      const v = (k * passo) || 0;
      svgEl('line', { x1: M.l - 5, x2: M.l, y1: y(v), y2: y(v), class: 'base' }, g0);
      const t = svgEl('text', { x: M.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, g0); t.textContent = br(v, 0);
    }
    // temperaturas: as do ensaio na vista inteira; com zoom, marcas regulares dentro da faixa
    const spanX = X1 - X0, px = spanX > 60 ? 10 : spanX > 25 ? 5 : spanX > 10 ? 2 : 1;
    const tempsX = zoom
      ? Array.from({ length: Math.floor(X1 / px) - Math.ceil(X0 / px) + 1 }, (_, i) => ((Math.ceil(X0 / px) + i) * px) || 0)
      : [-50, -20, 0, 20];
    tempsX.forEach(t => {
      svgEl('line', { x1: x(t), x2: x(t), y1: M.t + ih, y2: M.t + ih + 5, class: 'base' }, g0);
      const tx = svgEl('text', { x: x(t), y: M.t + ih + 23, 'text-anchor': 'middle' }, g0); tx.textContent = tempTxt(t).replace(' °C', '');
    });
    const clip = svgEl('clipPath', { id: 'ch-clip' }, svgEl('defs', {}, svg));
    svgEl('rect', { x: M.l, y: M.t - 6, width: iw + 6, height: ih + 6 }, clip);
    const lx = svgEl('text', { x: M.l + iw / 2, y: H - 6, 'text-anchor': 'middle', class: 'ttl' }, g0); lx.textContent = 'Temperatura de ensaio (°C)';
    const ly = svgEl('text', { x: 16, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl', transform: `rotate(-90 16 ${M.t + ih / 2})` }, g0); ly.textContent = 'Energia absorvida (J)';

    if (!ss.length) {
      const t = svgEl('text', { x: M.l + iw / 2, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl' }, svg);
      t.textContent = 'Nenhuma série com os filtros atuais';
      renderMedias(ss); return;
    }

    // deslocamento horizontal por série para não sobrepor marcadores
    const off = new Map(ss.map((s, i) => [s.key, (i - (ss.length - 1) / 2) * Math.min(7, 40 / ss.length)]));
    const dim = (k) => destaque && destaque !== k ? ' dim' : '';
    const rotulos = [];

    ss.forEach(s => {
      const cor = COR_CLARO[s.cond] || COND[s.cond]?.cor || '#888', o = ORIENT[s.orient], dx = off.get(s.key);
      const g = svgEl('g', { class: 'serie' + dim(s.key), 'data-k': s.key, 'clip-path': 'url(#ch-clip)' }, svg);
      // linha das médias
      if (s.pontos.length > 1) {
        const pts = s.pontos.slice().sort((a, b) => a.t - b.t).map(p => `${x(p.t) + dx},${y(p.st.m)}`).join(' ');
        svgEl('polyline', { points: pts, fill: 'none', stroke: cor, 'stroke-width': 2, 'stroke-dasharray': o.dash, 'stroke-linejoin': 'round' }, g);
      }
      // desvio padrão
      if (filtro.dp) s.pontos.forEach(p => {
        if (!p.st.sd) return;
        const cx = x(p.t) + dx, a = y(p.st.m - p.st.sd), b = y(p.st.m + p.st.sd);
        svgEl('line', { x1: cx, x2: cx, y1: Math.min(y(0), a), y2: b, stroke: cor, 'stroke-width': 1.5, opacity: .8 }, g);
        [b, Math.min(y(0), a)].forEach(yy => svgEl('line', { x1: cx - 4, x2: cx + 4, y1: yy, y2: yy, stroke: cor, 'stroke-width': 1.5, opacity: .8 }, g));
      });
      // CPs individuais
      if (filtro.pontos) s.cps.forEach(c => {
        if (c.energia == null || c.temp == null) return;
        const cx = x(c.temp) + dx * 2.2, cy = y(c.energia);
        marcador(g, o.forma, cx, cy, 3.2, { fill: cor, 'fill-opacity': .45, stroke: 'none' });
        const hit = svgEl('circle', { cx, cy, r: 9, class: 'hit' }, g);
        hit.dataset.tip = `<b>${esc(c.cp)}</b> · pos. ${esc(c.pos || '—')}<br>${esc(serieNome(s.key))} · ${tempTxt(c.temp)}<br><span class="tv">${br(c.energia, 1)} J</span>` +
          (c.sigma != null ? `<br>σ medida: <span class="tv">${br(c.sigma, 2)} %</span>` : '');
      });
      // médias
      s.pontos.forEach(p => {
        const cx = x(p.t) + dx, cy = y(p.st.m);
        marcador(g, o.forma, cx, cy, 5, { fill: cor, stroke: '#ffffff', 'stroke-width': 2 });
        const hit = svgEl('circle', { cx, cy, r: 11, class: 'hit' }, g);
        hit.dataset.tip = `<b>${esc(serieNome(s.key))}</b> · ${tempTxt(p.t)}<br>Média <span class="tv">${br(p.st.m, 1)} J</span>` +
          (p.st.sd ? ` ± ${br(p.st.sd, 1)}` : '') + `<br>n = ${p.st.n} CPs`;
        hit.dataset.k = s.key;
      });
      // rótulo direto no último ponto (mais quente)
      // com zoom: último ponto (mais quente) que está dentro da vista
      const ult = s.pontos.slice().sort((a, b) => b.t - a.t)
        .find(p => !zoom || (p.t >= X0 && p.t <= X1 && p.st.m >= Y0 && p.st.m <= Y1));
      if (ult) rotulos.push({ k: s.key, y: y(ult.st.m), x: x(ult.t) + dx, solto: ult.t < Math.min(20, X1), cor, txt: `${COND[s.cond]?.curto ?? s.cond + '%'} ${s.orient}` });
    });

    // rótulos diretos sem colisão
    const gl = svgEl('g', { class: 'lbls' }, svg);
    // séries que não chegam a +20 °C: rótulo ao lado do próprio ponto
    rotulos.filter(r => r.solto).forEach(r => {
      const t = svgEl('text', { x: r.x + 12, y: r.y + 4, class: 'lbl' + dim(r.k), 'data-k': r.k }, gl);
      t.textContent = r.txt;
    });
    const fim = rotulos.filter(r => !r.solto).sort((a, b) => a.y - b.y);
    for (let i = 1; i < fim.length; i++) if (fim[i].y - fim[i - 1].y < 17) fim[i].y = fim[i - 1].y + 17;
    fim.forEach(r => {
      const lx0 = Math.max(r.x + 12, M.l + iw + 10);
      svgEl('line', { x1: r.x + 7, x2: lx0 - 3, y1: r.y, y2: r.y, stroke: r.cor, 'stroke-width': 1, opacity: .5, class: dim(r.k).trim() }, gl);
      const t = svgEl('text', { x: lx0, y: r.y + 4, class: 'lbl' + dim(r.k), 'data-k': r.k }, gl);
      t.textContent = r.txt;
    });
    renderMedias(ss);
  }

  // dica ao passar o mouse
  const tip = () => $('ch-tip');
  document.addEventListener('pointerover', (e) => {
    const h = e.target.closest && e.target.closest('#ch-svg .hit');
    if (!h) return;
    const t = tip(), box = $('ch-chart').getBoundingClientRect(), r = h.getBoundingClientRect();
    t.innerHTML = h.dataset.tip; t.hidden = false;
    const cx = r.left + r.width / 2 - box.left, cy = r.top - box.top;
    t.style.left = Math.min(Math.max(cx, 90), box.width - 90) + 'px';
    t.style.top = cy + 'px';
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest && e.target.closest('#ch-svg .hit')) tip().hidden = true;
  });
  document.addEventListener('click', (e) => {
    if (arrastou && e.target.closest('#ch-chart')) { arrastou = false; return; }   // fim de arraste de zoom
    const el = e.target.closest('#ch-svg [data-k], #ch-mean tr[data-k]');
    if (!el) return;
    destaque = destaque === el.dataset.k ? null : el.dataset.k;
    renderGrafico();
  });

  function renderMedias(ss) {
    const t = $('ch-mean');
    t.innerHTML = `<thead><tr><th>Série</th>${TEMPS.map(x => `<th>${tempTxt(x)}</th>`).join('')}</tr></thead>
      <tbody>${ss.map(s => `<tr data-k="${s.key}" class="${destaque && destaque !== s.key ? 'dim' : ''} ${destaque === s.key ? 'sel' : ''}">
        <td><svg class="ls" viewBox="0 0 26 10" aria-hidden="true" style="stroke:${COND[s.cond]?.cor};fill:${COND[s.cond]?.cor}"><line x1="1" y1="5" x2="25" y2="5" stroke-dasharray="${ORIENT[s.orient].dash}"/>${s.orient === 'L-C' ? '<circle cx="13" cy="5" r="3.5"/>' : '<rect x="9.5" y="1.5" width="7" height="7"/>'}</svg>${esc(COND[s.cond]?.curto ?? s.cond + '%')} ${s.orient}</td>
        ${TEMPS.map(tt => { const p = s.pontos.find(q => q.t === tt); return `<td>${p ? `${br(p.st.m, 1)}${p.st.sd ? `<small> ± ${br(p.st.sd, 1)}</small>` : ''}` : '<span class="nd">—</span>'}</td>`; }).join('')}
      </tr>`).join('')}</tbody>`;
  }

  /* ---------- tabela ---------- */
  function grupos() {
    const rows = data.cps.filter(visivel).slice().sort((a, b) =>
      a.cond - b.cond || (a.orient === b.orient ? 0 : a.orient === 'L-C' ? -1 : 1) || (b.temp ?? -999) - (a.temp ?? -999) || a.id - b.id);
    const out = [];
    rows.forEach(c => {
      const k = `${c.cond}|${c.orient}|${c.temp}`;
      if (!out.length || out[out.length - 1].k !== k) out.push({ k, cond: c.cond, orient: c.orient, temp: c.temp, cps: [] });
      out[out.length - 1].cps.push(c);
    });
    return out;
  }
  const inp = (c, campo, val, cls = '') =>
    `<input class="${cls}" data-id="${c.id}" data-campo="${campo}" value="${esc(val === null || val === undefined ? '' : String(val).replace('.', ','))}" ${cls.includes('txt') ? '' : 'inputmode="decimal"'} aria-label="${campo} ${esc(c.cp)}">`;
  const sel = (c, campo, opts) => `<select data-id="${c.id}" data-campo="${campo}">${opts.map(([v, t]) => `<option value="${v}" ${String(c[campo]) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select>`;

  function mediaTxt(g) {
    const st = stats(g.cps.map(c => c.energia));
    const q = g.cps.filter(c => c.sigma != null);
    const quant = q.length
      ? ` <em class="qinfo">· CP quantificado: ${q.map(c => `${esc(c.cp)} — σ <b>${br(c.sigma, 2)} %</b>`).join(', ')}</em>`
      : ' <em class="qinfo nd">· quantificação de σ pendente</em>';
    return (st ? `<b>${br(st.m, 1)} J</b>${st.sd ? ` ± ${br(st.sd, 1)}` : ''} <span>(n = ${st.n})</span>` : '—') + quant;
  }

  // Obs.: micrografia + quantificação do CP (quando importadas) e o texto de observação
  function obsHTML(c) {
    const m = microDe(c);
    const txt = c.obs ? `<span class="obs-txt">${esc(c.obs)}</span>` : '';
    if (!m) return txt;
    const fig = (src, rot) => src
      ? `<button type="button" class="mthumb" data-micro="${esc(`${c.cond}|${c.orient}|${c.temp}|${c.cp}`)}" title="Ampliar ${rot.toLowerCase()} de ${esc(c.cp)}"><img src="${esc(src)}" alt="${rot} ${esc(c.cp)}" loading="lazy"><span>${rot === 'Micrografia' ? 'Original' : 'Quant.'}</span></button>`
      : '';
    return `<div class="micro">
        ${fig(m.original, 'Micrografia')}${fig(m.quant, 'Quantificação')}
        ${m.sigma_campo != null ? `<span class="micro-v">σ no campo <b>${br(m.sigma_campo, 2)} %</b>${m.ic95 != null ? ` ± ${br(m.ic95, 2)}` : ''}</span>` : ''}
      </div>${txt}`;
  }

  // ampliação: micrografia e quantificação lado a lado
  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<div class="lb-pair"></div><p class="lb-cap"></p><button class="lb-close" type="button" aria-label="Fechar">✕</button>';
  document.body.appendChild(lb);
  const fecharLb = () => lb.classList.remove('open');
  lb.addEventListener('click', (e) => { if (!e.target.closest('img')) fecharLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('open')) fecharLb(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#ch-table .mthumb');
    if (!b) return;
    const m = MICRO[b.dataset.micro];
    lb.querySelector('.lb-pair').innerHTML = [[m.original, 'Micrografia'], [m.quant, 'Quantificação']]
      .filter(([src]) => src).map(([src, rot]) => `<figure><img src="${esc(src)}" alt="${rot} ${esc(m.cp)}"><figcaption>${rot}</figcaption></figure>`).join('');
    lb.querySelector('.lb-cap').innerHTML = `<b>${esc(m.cp)}</b> · ${esc(COND[m.cond]?.nome ?? m.cond + '%')} · ${m.orient} · ${tempTxt(m.temp)}` +
      (m.sigma_campo != null ? ` <span class="mg-sig">σ no campo <b>${br(m.sigma_campo, 2)} %</b>${m.ic95 != null ? ` ± ${br(m.ic95, 2)} (ASTM E562, IC 95%)` : ''}</span>` : '') +
      ` <span class="fv-meta">${esc(m.arquivo || '')}${m.modelo ? ' · ' + esc(m.modelo) : ''}</span>`;
    lb.classList.add('open');
  });

  function renderTabela() {
    const gs = grupos();
    const cab = `<thead>
      <tr class="grp">
        ${editing ? '<th rowspan="2">Cond.</th><th rowspan="2">Orient.</th><th rowspan="2">Temp.</th>' : ''}
        <th rowspan="2" class="c-cond">CP</th><th rowspan="2">Pos.</th>
        <th colspan="3">Ferrita pré-tratamento (%)</th>
        <th rowspan="2" class="c-cond">Tratamento térmico</th>
        <th rowspan="2">Energia (J)</th>
        <th rowspan="2" class="c-sig" title="Fase sigma medida no CP selecionado para quantificação">σ medida (%)</th>
        <th colspan="3">Ferrita pós-tratamento (%)</th>
        <th rowspan="2" class="c-sit">Obs.</th>
        ${editing ? '<th rowspan="2"></th>' : ''}
      </tr>
      <tr class="sub"><th>Lado 1</th><th>Lado 2</th><th>Média</th><th>Lado 1</th><th>Lado 2</th><th>Média</th></tr>
    </thead>`;
    const ncol = editing ? 17 : 14;
    const corpo = gs.map(g => {
      const cor = COND[g.cond]?.cor || '#888';
      const linhas = g.cps.map(c => editing ? `
        <tr>
          <td>${sel(c, 'cond', Object.keys(COND).map(k => [k, COND[k].curto]))}</td>
          <td>${sel(c, 'orient', [['L-C', 'L-C'], ['C-L', 'C-L']])}</td>
          <td>${sel(c, 'temp', TEMPS.map(t => [t, tempTxt(t)]))}</td>
          <td class="c-cond">${inp(c, 'cp', c.cp, 'txt short')}</td>
          <td>${inp(c, 'pos', c.pos, 'txt tiny')}</td>
          <td>${inp(c, 'fe_pre.0', c.fe_pre[0])}</td><td>${inp(c, 'fe_pre.1', c.fe_pre[1])}</td>
          <td class="calc" data-calc="pre-${c.id}">${br(media2(c.fe_pre), 2)}</td>
          <td class="c-cond">${inp(c, 'tt', c.tt, 'txt')}</td>
          <td>${inp(c, 'energia', c.energia, 'strong')}</td>
          <td class="c-sig">${inp(c, 'sigma', c.sigma)}</td>
          <td>${inp(c, 'fe_pos.0', c.fe_pos[0])}</td><td>${inp(c, 'fe_pos.1', c.fe_pos[1])}</td>
          <td class="calc" data-calc="pos-${c.id}">${br(media2(c.fe_pos), 2)}</td>
          <td class="c-sit">${inp(c, 'obs', c.obs, 'txt')}</td>
          <td><button type="button" class="del" data-del="${c.id}" title="Remover ${esc(c.cp)}">✕</button></td>
        </tr>` : `
        <tr class="${c.sigma != null ? 'quant' : ''}">
          <td class="c-cond">${esc(c.cp)}</td><td>${esc(c.pos || '')}</td>
          ${[c.fe_pre[0], c.fe_pre[1]].map(v => v == null ? '<td class="nd">—</td>' : `<td>${brAuto(v)}</td>`).join('')}
          <td class="calc">${media2(c.fe_pre) == null ? '<span class="nd">—</span>' : br(media2(c.fe_pre), 2)}</td>
          <td class="c-cond tt">${esc(c.tt || '')}</td>
          ${c.energia == null ? '<td class="nd">—</td>' : `<td class="en">${brAuto(c.energia)}</td>`}
          ${c.sigma == null ? '<td class="c-sig"></td>' : `<td class="c-sig q"><span class="qtag" title="CP selecionado para quantificação de fase σ">${br(c.sigma, 2)}</span></td>`}
          ${[c.fe_pos[0], c.fe_pos[1]].map(v => v == null ? '<td class="nd">—</td>' : `<td>${brAuto(v)}</td>`).join('')}
          <td class="calc">${media2(c.fe_pos) == null ? '<span class="nd">—</span>' : br(media2(c.fe_pos), 2)}</td>
          <td class="c-sit">${obsHTML(c)}</td>
        </tr>`).join('');
      return `<tbody class="g">
        <tr class="g-head"><td colspan="${ncol}"><i class="sw" style="background:${cor}"></i>${esc(COND[g.cond]?.nome ?? g.cond + '%')} · ${g.orient} · ${g.temp == null ? '?' : tempTxt(g.temp)}</td></tr>
        ${linhas}
        <tr class="g-mean"><td colspan="${ncol}">Média dos ensaios Charpy: <span data-mean="${g.k}">${mediaTxt(g)}</span></td></tr>
      </tbody>`;
    }).join('');
    $('ch-table').innerHTML = cab + (corpo || `<tbody><tr><td colspan="${ncol}" class="nd">Nenhum CP com os filtros atuais.</td></tr></tbody>`);
  }

  function setCampo(c, campo, valor) {
    if (campo.includes('.')) { const [a, i] = campo.split('.'); c[a][+i] = valor; }
    else c[campo] = valor;
  }
  const TEXTO = new Set(['cp', 'pos', 'tt', 'obs']);
  document.addEventListener('input', (e) => {
    const el = e.target.closest('#ch-table input[data-campo]');
    if (!el) return;
    const c = data.cps.find(x => x.id === +el.dataset.id);
    const campo = el.dataset.campo;
    if (TEXTO.has(campo)) setCampo(c, campo, el.value);
    else {
      const n = parse(el.value);
      el.classList.toggle('bad', Number.isNaN(n));
      if (Number.isNaN(n)) return;
      setCampo(c, campo, n);
      const pre = document.querySelector(`[data-calc="pre-${c.id}"]`), pos = document.querySelector(`[data-calc="pos-${c.id}"]`);
      if (pre) pre.textContent = br(media2(c.fe_pre), 2);
      if (pos) pos.textContent = br(media2(c.fe_pos), 2);
      grupos().forEach(g => { const m = document.querySelector(`[data-mean="${g.k}"]`); if (m) m.innerHTML = mediaTxt(g); });
    }
    salvoLocal();
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('#ch-table select[data-campo]');
    if (!el) return;
    const c = data.cps.find(x => x.id === +el.dataset.id);
    const campo = el.dataset.campo;
    c[campo] = campo === 'orient' ? el.value : +el.value;
    filtro.conds.add(c.cond);
    salvoLocal(); tudo();
  });
  document.addEventListener('click', (e) => {
    const d = e.target.closest('#ch-table button[data-del]');
    if (!d) return;
    const c = data.cps.find(x => x.id === +d.dataset.del);
    if (!confirm(`Remover ${c.cp} (${COND[c.cond]?.nome} · ${c.orient} · ${tempTxt(c.temp)})?`)) return;
    data.cps = data.cps.filter(x => x !== c);
    salvoLocal(); tudo();
  });

  function salvoLocal() {
    store.set(data);
    $('ch-badge').hidden = JSON.stringify(data) === JSON.stringify(base);
    renderGrafico();
  }

  function setEditing(on) {
    editing = on;
    document.querySelector('[data-id="charpy-cps"]').classList.toggle('editing', on);
    $('ch-edit').textContent = on ? 'Concluir' : 'Editar';
    ['ch-add', 'ch-save', 'ch-reset'].forEach(id => $(id).hidden = !on);
    renderTabela();
  }
  function addCP() {
    const cond = [...filtro.conds].sort((a, b) => a - b).find(c => c > 0) ?? 2;
    const orient = filtro.orient === 'ambas' ? 'L-C' : filtro.orient;
    const id = Math.max(0, ...data.cps.map(c => c.id)) + 1;
    data.cps.push({ id, cond, orient, temp: 20, cp: 'CP-', pos: '', fe_pre: [null, null], tt: '', energia: null, fe_pos: [null, null], obs: '' });
    salvoLocal(); renderTabela();
    const novo = document.querySelector(`#ch-table input[data-id="${id}"][data-campo="cp"]`);
    if (novo) { novo.scrollIntoView({ block: 'center' }); novo.focus(); novo.select(); }
  }
  function saveFile() {
    const txt = `// Ensaios Charpy · controle dos corpos de prova
// Gerado pela página em ${new Date().toLocaleString('pt-BR')}. Substitua Site/dados/charpy.js por este arquivo.
// cond = % de fase sigma (0 = não tratado) · temp em °C · energia em J · null = sem valor.
window.DADOS_CHARPY = ${JSON.stringify(data, null, 1)};
`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' }));
    a.download = 'charpy.js';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function reset() {
    if (!confirm('Descartar as alterações feitas neste navegador e voltar aos valores do arquivo dados/charpy.js?')) return;
    store.clear(); data = clone(base); filtro.conds = new Set(condsPresentes());
    $('ch-badge').hidden = true; tudo();
  }

  function tudo() { renderFiltros(); renderGrafico(); renderTabela(); }

  /* ---------- inicialização ---------- */
  $('ch-edit').addEventListener('click', () => setEditing(!editing));
  $('ch-add').addEventListener('click', addCP);
  $('ch-save').addEventListener('click', saveFile);
  $('ch-reset').addEventListener('click', reset);
  $('ch-badge').hidden = JSON.stringify(data) === JSON.stringify(base);
  // redesenha quando o slide do gráfico aparece ou muda de tamanho
  new ResizeObserver(() => renderGrafico()).observe($('ch-chart'));
  tudo();
})();
