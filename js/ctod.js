/* CTOD · tenacidade à fratura (ISO 12135:2016, SE(B))
 *
 * Dados: dados/ctod.js (window.DADOS_CTOD) e dados/ctod-curvas.js (window.CURVAS_CTOD),
 *   gerados por Site/ferramentas/importar_ctod.py a partir das planilhas ISO 12135 e dos arquivos da MTS.
 * O CTOD não é recalculado aqui: o valor e a classe vêm da planilha.
 * Integração: lê window.DADOS_KIT1 (σ, ferrita), window.DADOS_CHARPY e window.DADOS_TRACAO
 *   (mesma condição) diretamente dos arquivos de dados — nada é copiado à mão.
 *
 * Recursos que dependem da quantidade de dados aparecem sozinhos quando ela existir:
 *   média e desvio-padrão (≥ 2 CPs na condição), boxplot (≥ 5), redução % (condição 0 %),
 *   linha de tendência / r / R² nas correlações (≥ 3 condições com os dois dados).
 */
(function () {
  const D = window.DADOS_CTOD, CV = window.CURVAS_CTOD;
  if (!D || !CV || !document.querySelector('.slide[data-id="ctod"]')) return;
  const NS = 'http://www.w3.org/2000/svg';
  const CPS = D.cps;

  /* mesmas cores das outras seções (gráficos em fundo branco: tons escuros da paleta) */
  const COND = {
    0: { nome: 'Sem tratamento', curto: '0%', cor: '#9aa3ab', escuro: '#6b7580' },
    2: { nome: '2% σ', curto: '2%', cor: '#3987e5', escuro: '#2a6fc9' },
    4: { nome: '4% σ', curto: '4%', cor: '#d95926', escuro: '#c94f1e' },
    6: { nome: '6% σ', curto: '6%', cor: '#199e70', escuro: '#13835c' },
  };
  const corDe = (alvo) => COND[alvo]?.escuro || '#555';
  const corClara = (alvo) => COND[alvo]?.cor || '#888';
  const nomeCond = (alvo) => COND[alvo]?.nome || `${alvo}% σ`;
  // CPs da mesma condição: traço contínuo, tracejado, pontilhado…
  const DASH = ['', '7 4', '2 3', '10 3 2 3'];
  const dashDe = (c) => DASH[CPS.filter(x => x.alvo === c.alvo).indexOf(c) % DASH.length];

  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const br = (v, d = 2) => (v === null || v === undefined || v === '' || isNaN(v)) ? '—' :
    Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const dataBR = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso || '—'); };
  const limitar = (v, a, b) => Math.min(Math.max(v, a), b);
  function stats(vals) {
    const v = vals.filter(x => x !== null && x !== undefined && !isNaN(x));
    const n = v.length; if (!n) return null;
    const m = v.reduce((s, x) => s + x, 0) / n;
    const sd = n > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)) : null;
    return { n, m, sd, min: Math.min(...v), max: Math.max(...v) };
  }
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
  // menor passo "redondo" (1, 2, 5 × 10^k) que deixa no máximo n marcas no intervalo
  const passoAte = (span, n) => {
    let p = 10 ** Math.floor(Math.log10(span / Math.max(1, n)));
    for (;;) { for (const m of [1, 2, 5]) if (span / (m * p) <= n) return m * p; p *= 10; }
  };
  const casas = (p) => p >= 1 ? 0 : Math.min(5, Math.ceil(-Math.log10(p) - 1e-9));
  function baixar(nome, conteudo, tipo) {
    const a = document.createElement('a');
    a.href = typeof conteudo === 'string' ? URL.createObjectURL(new Blob([conteudo], { type: tipo })) : conteudo;
    a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { if (a.href.startsWith('blob:')) URL.revokeObjectURL(a.href); }, 1500);
  }
  const csv = (linhas) => '﻿' + linhas.map(l => l.map(v => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(';')).join('\n');

  // resultado do CP (valor da planilha)
  const delta = (c) => c.resultado?.valor ?? null;
  const VFmax = (c) => CV[c.cp].V[(c.registro.nFmax || 1) - 1];

  /* ---------- filtros (compartilhados pelas 5 páginas) ---------- */
  const condicoes = [...new Set(CPS.map(c => c.alvo))].sort((a, b) => a - b);
  const filtro = { conds: new Set(condicoes), cps: new Set(CPS.map(c => c.cp)) };
  const visivel = (c) => filtro.conds.has(c.alvo) && filtro.cps.has(c.cp);
  const visiveis = () => CPS.filter(visivel);

  function renderFiltros() {
    const todasC = condicoes.every(a => filtro.conds.has(a));
    document.querySelectorAll('[data-ct-filtros]').forEach(box => {
      box.innerHTML = `
        <div class="f-grp" role="group" aria-label="Condição">
          <span class="f-lbl">Condição</span>
          <button type="button" class="chip ${todasC ? 'on' : ''}" data-ctf="todas">Todas</button>
          ${condicoes.map(a => `<button type="button" class="chip ${filtro.conds.has(a) ? 'on' : ''}" data-ctf="cond" data-v="${a}" aria-pressed="${filtro.conds.has(a)}">
            <i class="sw" style="background:${corClara(a)}"></i>${esc(nomeCond(a))}</button>`).join('')}
        </div>
        <div class="f-grp" role="group" aria-label="Corpo de prova">
          <span class="f-lbl">Corpo de prova</span>
          ${CPS.map(c => `<button type="button" class="chip ${filtro.cps.has(c.cp) ? 'on' : ''}" data-ctf="cp" data-v="${esc(c.cp)}" aria-pressed="${filtro.cps.has(c.cp)}"
              title="${esc(c.nome)} · ${esc(nomeCond(c.alvo))} · ${esc(c.orient)}">
            <svg class="ls" viewBox="0 0 26 10" aria-hidden="true" style="stroke:${corClara(c.alvo)}"><line x1="1" y1="5" x2="25" y2="5" stroke-dasharray="${dashDe(c)}" stroke-width="2"/></svg>${esc(c.nome)}</button>`).join('')}
        </div>
        <div class="f-grp ct-norma"><span class="f-lbl">Norma</span><span>${esc(D.norma)} · SE(B) · δ pontual</span></div>`;
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ct-filtros] button[data-ctf]');
    if (!b) return;
    const f = b.dataset.ctf;
    if (f === 'todas') { filtro.conds = new Set(condicoes); filtro.cps = new Set(CPS.map(c => c.cp)); }
    if (f === 'cond') {
      const v = +b.dataset.v, todas = condicoes.every(a => filtro.conds.has(a));
      if (todas) filtro.conds = new Set([v]);
      else if (filtro.conds.has(v)) { filtro.conds.delete(v); if (!filtro.conds.size) filtro.conds = new Set(condicoes); }
      else filtro.conds.add(v);
      // ao filtrar condição, mostra todos os CPs dela
      CPS.forEach(c => { if (filtro.conds.has(c.alvo)) filtro.cps.add(c.cp); });
    }
    if (f === 'cp') {
      const v = b.dataset.v;
      if (filtro.cps.has(v) && filtro.cps.size > 1) filtro.cps.delete(v); else filtro.cps.add(v);
      const c = CPS.find(x => x.cp === v); if (c) filtro.conds.add(c.alvo);
    }
    tudo();
  });

  /* ---------- dados das outras seções para a mesma condição ---------- */
  function mesmaCondicao(alvo) {
    const out = {};
    const k1 = window.DADOS_KIT1?.condicoes?.find(x => +x.id === alvo);
    if (k1) {
      out.sigma_mev = k1.mev?.media ?? null; out.sigma_mev_dp = k1.mev?.dp ?? null;
      out.sigma_mo = k1.mo?.media ?? null; out.sigma_mo_dp = k1.mo?.dp ?? null;
      out.ferrita = k1.ferrito?.media ?? null;
    }
    const ch = (window.DADOS_CHARPY?.cps || []).filter(c => c.cond === alvo && c.orient === 'C-L' && c.temp === -50 && c.energia != null);
    const sc = stats(ch.map(c => c.energia));
    if (sc) { out.charpy = sc.m; out.charpy_dp = sc.sd; out.charpy_n = sc.n; }
    const tr = (window.DADOS_TRACAO?.cps || []).filter(c => c.alvo === alvo && c.dir === 'C');
    const sr = stats(tr.map(c => c.calc?.Rp02)), sm = stats(tr.map(c => c.calc?.Rm)), sa = stats(tr.map(c => c.A));
    if (sr) { out.Rp02 = sr.m; out.Rp02_dp = sr.sd; out.tr_n = sr.n; }
    if (sm) { out.Rm = sm.m; out.Rm_dp = sm.sd; }
    if (sa) { out.A = sa.m; out.A_dp = sa.sd; }
    const ct = CPS.filter(c => c.alvo === alvo);
    const sd = stats(ct.map(delta)), sf = stats(ct.map(c => c.registro.Fmax));
    if (sd) { out.ctod = sd.m; out.ctod_dp = sd.sd; out.ctod_n = sd.n; }
    if (sf) { out.Fmax = sf.m; out.Fmax_dp = sf.sd; }
    out.dureza = null; out.drx = null;
    return out;
  }
  // propriedades disponíveis para o comparador e para as correlações
  const PROPS = [
    { k: 'sigma_mev', nome: 'Fase σ — MEV-BSE', un: '%', d: 2, fonte: 'Kit 1 · quantificação' },
    { k: 'sigma_mo', nome: 'Fase σ — microscopia óptica', un: '%', d: 2, fonte: 'Kit 1 · quantificação' },
    { k: 'ferrita', nome: 'Ferrita — ferritoscópio', un: '%', d: 2, fonte: 'Kit 1 · ferritoscópio' },
    { k: 'dureza', nome: 'Dureza', un: 'HV', d: 0, fonte: 'em andamento' },
    { k: 'drx', nome: 'Fases por DRX', un: '%', d: 1, fonte: 'em andamento' },
    { k: 'Rp02', nome: 'Limite de escoamento Rp0,2 (C)', un: 'MPa', d: 0, fonte: 'Tração · direção C' },
    { k: 'Rm', nome: 'Resistência à tração Rm (C)', un: 'MPa', d: 0, fonte: 'Tração · direção C' },
    { k: 'A', nome: 'Alongamento A (C)', un: '%', d: 1, fonte: 'Tração · direção C' },
    { k: 'charpy', nome: 'Energia Charpy C-L a −50 °C', un: 'J', d: 1, fonte: 'Charpy · C-L, −50 °C' },
    { k: 'ctod', nome: 'CTOD δ', un: 'mm', d: 4, fonte: 'CTOD · ISO 12135' },
    { k: 'Fmax', nome: 'Força máxima no CTOD', un: 'kN', d: 3, fonte: 'CTOD · registro' },
  ];
  const condTodas = [...new Set([0, 2, 4, 6, ...condicoes])].sort((a, b) => a - b);

  /* ---------- 1. Visão geral ---------- */
  function renderGeral() {
    const box = $('ct-geral'); if (!box) return;
    const vs = visiveis();
    const porCond = [...new Set(vs.map(c => c.alvo))].sort((a, b) => a - b).map(a => ({ a, cps: vs.filter(c => c.alvo === a) }));
    const ref = porCond.find(g => g.a === 0);
    const dAll = stats(vs.map(delta));
    const kpi = (rot, val, sub, cls = '') => `<div class="ct-kpi ${cls}"><span class="ct-kpi-l">${rot}</span><b>${val}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;

    box.innerHTML = `
      <div class="ct-grid2">
        <div>
          <div class="ct-kpis">
            ${kpi('Corpos de prova ensaiados', vs.length, vs.map(c => esc(c.nome)).join(' · '))}
            ${kpi('Condições experimentais', porCond.length, porCond.map(g => esc(nomeCond(g.a))).join(' · '))}
            ${kpi('Faixa de δ', dAll ? (dAll.n > 1 ? `${br(dAll.min, 4)} – ${br(dAll.max, 4)}` : br(dAll.m, 4)) : '—', 'mm')}
          </div>
          <div class="k1-table-wrap"><table class="k1-table ct-tab ct-kpi-tab">
            <thead><tr><th class="c-cond">Condição</th><th>n</th><th>δ (mm)</th><th>Desvio-padrão (mm)</th><th>Fmax (kN)</th><th>Redução de δ<br>vs. 0 %</th></tr></thead>
            <tbody>${porCond.map(g => {
              const s = stats(g.cps.map(delta)), f = stats(g.cps.map(c => c.registro.Fmax));
              const red = ref && g.a !== 0 ? (s.m / stats(ref.cps.map(delta)).m - 1) * 100 : null;
              return `<tr>
                <td class="c-cond"><i class="sw" style="background:${corClara(g.a)}"></i> ${esc(nomeCond(g.a))}</td>
                <td>${s.n}</td>
                <td>${br(s.m, 4)}</td>
                <td>${s.n > 1 ? br(s.sd, 4) : '<span class="nd" title="desvio-padrão requer ≥ 2 CPs">— (n = 1)</span>'}</td>
                <td>${br(f.m, 3)}${f.n > 1 ? ` <small>± ${br(f.sd, 3)}</small>` : ''}</td>
                <td>${g.a === 0 ? '<span class="nd">referência</span>' : red !== null ? `${red > 0 ? '+' : ''}${br(red, 1)} %` : '<span class="nd">aguarda a condição 0 %</span>'}</td>
              </tr>`;
            }).join('')}</tbody>
          </table></div>
          <p class="ct-note">δ = valor da planilha ISO 12135 (aba Resumo). Média e desvio-padrão aparecem com ≥ 2 CPs por condição; a redução percentual, quando houver CTOD da condição de referência (0 %).</p>

          <h3 class="ct-h3">Objetivo</h3>
          <p class="ct-txt">Avaliar como a precipitação de fase σ, produzida por tratamento térmico do aço inoxidável superduplex UNS S32750 (SAF 2507), altera a tenacidade à fratura medida pelo CTOD (abertura da ponta da trinca). A fase σ é um intermetálico duro e frágil que se forma principalmente nos contornos ferrita/austenita, consumindo ferrita (o ferritoscópio indica queda de ferrita com o aumento de σ — seção Kit 1). A hipótese de trabalho — ainda não confirmada por estes ensaios — é que a σ reduza a tenacidade por facilitar a nucleação e a propagação de trincas; os resultados aqui são preliminares (poucos CPs).</p>
        </div>
        <div>
          <h3 class="ct-h3">Metodologia experimental</h3>
          ${tabelaMetodo(vs)}
        </div>
      </div>
      <h3 class="ct-h3">Rastreabilidade e inconsistências encontradas nos arquivos</h3>
      <ul class="ct-avisos">${D.avisos.length ? D.avisos.map(a => `<li>${esc(a)}</li>`).join('') : '<li>Nenhuma.</li>'}</ul>
      <p class="ct-note">Dados importados em ${esc(D.gerado)} de <code>${esc(D.fonte)}</code> por <code>Site/ferramentas/importar_ctod.py</code>. Para atualizar: coloque a pasta do novo CP em <code>CTOD/</code> (ex.: <code>CT30 2CL</code>) com a planilha ISO 12135 e as imagens, e rode o importador.</p>`;
  }

  function tabelaMetodo(vs) {
    const linha = (rot, f, un = '') => `<tr><th>${rot}</th>${vs.map(c => `<td>${f(c)}${un && f(c) !== '—' ? ` <small>${un}</small>` : ''}</td>`).join('')}</tr>`;
    const unico = (f) => { const v = [...new Set(vs.map(f))]; return v.length === 1 ? v[0] : v.join(' / '); };
    return `<table class="ct-meth">
      <thead><tr><th></th>${vs.map(c => `<th><i class="sw" style="background:${corClara(c.alvo)}"></i> ${esc(c.nome)}</th>`).join('')}</tr></thead>
      <tbody>
        <tr class="sec"><th colspan="${vs.length + 1}">Ensaio</th></tr>
        ${linha('Norma', () => esc(D.norma))}
        ${linha('Geometria', c => esc(c.ensaio.geometria || '—'))}
        ${linha('Parâmetro', c => esc(c.ensaio.parametro || '—'))}
        ${linha('Material / produto', c => `${esc(c.ensaio.material || '—')} · ${esc(c.ensaio.produto || '—')}`)}
        ${linha('Orientação', c => `${esc(c.orient)}${c.ensaio.orient_planilha && c.ensaio.orient_planilha !== c.orient ? ` <span class="ct-flag" title="orientação registrada na planilha">planilha: ${esc(c.ensaio.orient_planilha)}</span>` : ''}`)}
        ${linha('Temperatura de ensaio', c => br(c.ensaio.temp, 0), '°C')}
        ${linha('Desvio de temperatura |ΔT|', c => br(c.ensaio.dT, 0), '°C')}
        ${linha('Condicionamento / encharque', c => `${esc(c.ensaio.meio || '—')} · ${br(c.ensaio.encharque, 0)} min`)}
        ${linha('Controle', c => esc(c.ensaio.controle || '—'))}
        ${linha('Data (planilha / MTS)', c => `${dataBR(c.ensaio.data)} / ${(c.ensaio.datas_mts || []).map(dataBR).join(', ') || '—'}`)}
        <tr class="sec"><th colspan="${vs.length + 1}">Corpo de prova</th></tr>
        ${linha('B × W × S', c => `${br(c.geom.B, 1)} × ${br(c.geom.W, 1)} × ${br(c.geom.S, 1)}`, 'mm')}
        ${linha('Faces', c => esc(c.ensaio.faces || '—'))}
        ${linha('Entalhe usinado a<sub>m</sub>', c => br(c.geom.am, 2), 'mm')}
        ${linha('Comprimento inicial da trinca a<sub>o</sub>', c => br(c.geom.a_o, 3), 'mm')}
        ${linha('a<sub>o</sub>/W <small>(0,45–0,70)</small>', c => br(c.geom.a_oW, 3))}
        ${linha('Pré-trinca por fadiga a<sub>o</sub> − a<sub>m</sub>', c => br(c.geom.pretrinca, 3), 'mm')}
        ${linha('Pré-trincamento: temperatura', c => br(c.ensaio.temp_pre, 0), '°C')}
        <tr class="sec"><th colspan="${vs.length + 1}">Propriedades usadas no cálculo <small>(entradas da planilha)</small></th></tr>
        ${linha('R<sub>p0,2</sub> / R<sub>m</sub>', c => `${br(c.props.Rp02, 0)} / ${br(c.props.Rm, 0)}`, 'MPa')}
        ${linha('E / ν', c => `${br(c.props.E, 0)} GPa / ${br(c.props.nu, 2)}`)}
        <tr class="sec"><th colspan="${vs.length + 1}">Cálculo de δ (6.3, fórmula do ponto de rotação)</th></tr>
        <tr><td colspan="${vs.length + 1}" class="ct-formula">δ<sub>o</sub> = K²(1 − ν²) / (2 R<sub>p0,2</sub> E) + r<sub>p</sub> · V<sub>p</sub>, com r<sub>p</sub> = 0,4 (W − a<sub>o</sub>) / (0,6 a<sub>o</sub> + 0,4 W + z) e V<sub>p</sub> = V − F / k<sub>V</sub> (Figura 17)</td></tr>
        ${linha('Ponto característico', c => esc((c.registro.ponto_tipo || '—').replace(/ sem pop-in.*$/, '')))}
        ${linha('Classe do valor', c => `<b>${esc(c.calc.classe || '—')}</b> · ${esc(c.calc.simbolo || '')}`)}
      </tbody></table>
      <p class="ct-note">As propriedades R<sub>p0,2</sub>, R<sub>m</sub> e E acima são as <b>entradas</b> da planilha — confira se correspondem ao material a ${esc(unico(c => br(c.ensaio.temp, 0)))} °C (a tração do site foi feita à temperatura ambiente).</p>`;
  }

  /* ---------- 2. Curvas experimentais ---------- */
  // vistas: x e y de cada gráfico (todos os pontos do registro, sem suavização)
  const VISTAS = {
    FV: { x: 'V', y: 'F', tx: 'CMOD — abertura do entalhe V (mm)', ty: 'Força F (kN)' },
    Fd: { x: 'd', y: 'F', tx: 'Deslocamento do atuador (mm)', ty: 'Força F (kN)' },
    Ft: { x: 't', y: 'F', tx: 'Tempo (s)', ty: 'Força F (kN)' },
    Vt: { x: 't', y: 'V', tx: 'Tempo (s)', ty: 'CMOD — abertura do entalhe V (mm)' },
  };
  let vista = 'FV', destaque = null;
  const ZOOM_MAX = 50;
  const G = { zoom: null, escala: null, pontos: [], fixo: null };   // fixo: limites digitados pelo usuário
  let arrastou = false;

  function aplicarZoom(z) {
    const b = G.escala.base, W = b.X1 - b.X0, H = b.Y1 - b.Y0;
    const w = limitar(z.x1 - z.x0, W / ZOOM_MAX, W), h = limitar(z.y1 - z.y0, H / ZOOM_MAX, H);
    if (w >= W * .999 && h >= H * .999) { G.zoom = null; desenharCurvas(); return; }
    const x0 = limitar(z.x0, b.X0, b.X1 - w), y0 = limitar(z.y0, b.Y0, b.Y1 - h);
    G.zoom = { x0, x1: x0 + w, y0, y1: y0 + h };
    desenharCurvas();
  }
  function zoomEm(cx, cy, f) {
    const s = G.escala, b = s.base, W = b.X1 - b.X0, H = b.Y1 - b.Y0;
    const w0 = s.X1 - s.X0, h0 = s.Y1 - s.Y0;
    const fx = limitar(w0 * f, W / ZOOM_MAX, W) / w0, fy = limitar(h0 * f, H / ZOOM_MAX, H) / h0;
    aplicarZoom({ x0: cx - (cx - s.X0) * fx, x1: cx + (s.X1 - cx) * fx, y0: cy - (cy - s.Y0) * fy, y1: cy + (s.Y1 - cy) * fy });
  }
  const zerarZoom = () => { G.zoom = null; G.fixo = null; desenharCurvas(); };

  (function ligarCurvas() {
    const box = $('ct-chart'), svg = $('ct-svg');
    if (!box) return;
    const ctl = document.createElement('div');
    ctl.className = 'tr-zoom ct-tools';
    ctl.innerHTML = '<span class="tr-zpct" title="Ampliação atual">100%</span>' +
      '<button type="button" data-z="in" title="Aproximar" aria-label="Aproximar">+</button>' +
      '<button type="button" data-z="out" title="Afastar" aria-label="Afastar">−</button>' +
      '<button type="button" data-z="reset" title="Voltar à escala original (ou duplo clique)">Ajustar</button>' +
      '<button type="button" data-z="lim" title="Definir os limites dos eixos">Eixos</button>' +
      '<button type="button" data-z="full" title="Tela cheia">⛶</button>' +
      '<button type="button" data-z="png" title="Exportar o gráfico em PNG">PNG</button>' +
      '<button type="button" data-z="svg" title="Exportar o gráfico em SVG">SVG</button>' +
      '<button type="button" data-z="csv" title="Exportar os dados dos CPs visíveis em CSV">CSV</button>';
    box.appendChild(ctl);
    const lim = document.createElement('form');
    lim.className = 'ct-lim'; lim.hidden = true;
    lim.innerHTML = `<b>Limites dos eixos</b>
      <label>X mín <input name="x0" inputmode="decimal"></label><label>X máx <input name="x1" inputmode="decimal"></label>
      <label>Y mín <input name="y0" inputmode="decimal"></label><label>Y máx <input name="y1" inputmode="decimal"></label>
      <span><button type="submit">Aplicar</button><button type="button" data-lim="fechar">Fechar</button></span>`;
    box.appendChild(lim);
    const zbox = document.createElement('div');
    zbox.className = 'tr-zbox'; zbox.hidden = true;
    box.appendChild(zbox);
    const tip = box.querySelector('.ch-tip');
    const pos = (e) => {
      const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      const sx = vb && vb.width && r.width ? vb.width / r.width : 1, sy = vb && vb.height && r.height ? vb.height / r.height : 1;
      return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
    };
    const dentro = (mx, my) => { const s = G.escala; return s && mx >= s.M.l && mx <= s.M.l + s.iw && my >= s.M.t && my <= s.M.t + s.ih; };
    const paraDados = (px, py) => { const s = G.escala; return { x: s.X0 + (px - s.M.l) / s.iw * (s.X1 - s.X0), y: s.Y0 + (s.M.t + s.ih - py) / s.ih * (s.Y1 - s.Y0) }; };
    const num = (v) => { const n = Number(String(v).trim().replace(',', '.')); return String(v).trim() === '' || isNaN(n) ? null : n; };

    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-z]');
      if (!b || !G.escala) return;
      e.stopPropagation();
      const z = b.dataset.z, s = G.escala;
      if (z === 'reset') zerarZoom();
      else if (z === 'in' || z === 'out') zoomEm((s.X0 + s.X1) / 2, (s.Y0 + s.Y1) / 2, z === 'in' ? .6 : 1 / .6);
      else if (z === 'lim') {
        lim.hidden = !lim.hidden;
        if (!lim.hidden) { lim.x0.value = +s.X0.toPrecision(5); lim.x1.value = +s.X1.toPrecision(5); lim.y0.value = +s.Y0.toPrecision(5); lim.y1.value = +s.Y1.toPrecision(5); lim.x0.focus(); }
      }
      else if (z === 'full') { document.fullscreenElement ? document.exitFullscreen() : box.requestFullscreen?.(); }
      else if (z === 'svg') baixar(`CTOD_${vista}.svg`, svgExport(svg), 'image/svg+xml');
      else if (z === 'png') pngExport(svg, `CTOD_${vista}.png`);
      else if (z === 'csv') exportarCurvasCSV();
    });
    lim.addEventListener('click', (e) => { if (e.target.closest('[data-lim="fechar"]')) lim.hidden = true; });
    lim.addEventListener('submit', (e) => {
      e.preventDefault();
      const z = { x0: num(lim.x0.value), x1: num(lim.x1.value), y0: num(lim.y0.value), y1: num(lim.y1.value) };
      if (Object.values(z).some(v => v === null) || z.x1 <= z.x0 || z.y1 <= z.y0) { lim.classList.add('erro'); return; }
      lim.classList.remove('erro');
      G.fixo = z; G.zoom = null; desenharCurvas();
    });
    box.addEventListener('wheel', (e) => {
      const [mx, my] = pos(e);
      if (!dentro(mx, my)) return;
      e.preventDefault();
      const p = paraDados(mx, my);
      zoomEm(p.x, p.y, e.deltaY < 0 ? .85 : 1 / .85);
    }, { passive: false });
    box.addEventListener('dblclick', (e) => { if (!e.target.closest('.ct-tools, .ct-lim')) zerarZoom(); });

    let ini = null;
    box.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType === 'touch' || e.target.closest('.ct-tools, .ct-lim')) return;
      const [mx, my] = pos(e);
      if (!dentro(mx, my)) return;
      const s = G.escala;
      ini = { mx, my, modo: e.shiftKey ? 'area' : (G.zoom ? 'pan' : 'clique'), z: { X0: s.X0, X1: s.X1, Y0: s.Y0, Y1: s.Y1 } };
      arrastou = false;
      if (ini.modo !== 'clique') box.setPointerCapture(e.pointerId);
    });
    box.addEventListener('pointermove', (e) => {
      const [mx, my] = pos(e);
      if (ini && ini.modo !== 'clique') {
        if (Math.abs(mx - ini.mx) + Math.abs(my - ini.my) > 4) arrastou = true;
        if (!arrastou) return;
        tip.hidden = true;
        if (ini.modo === 'pan') {
          box.classList.add('panning');
          const z = ini.z, s = G.escala, dx = (mx - ini.mx) / s.iw * (z.X1 - z.X0), dy = (my - ini.my) / s.ih * (z.Y1 - z.Y0);
          aplicarZoom({ x0: z.X0 - dx, x1: z.X1 - dx, y0: z.Y0 + dy, y1: z.Y1 + dy });
          return;
        }
        const { M, iw, ih } = G.escala, cx = limitar(mx, M.l, M.l + iw), cy = limitar(my, M.t, M.t + ih);
        Object.assign(zbox.style, { left: Math.min(ini.mx, cx) + 'px', top: Math.min(ini.my, cy) + 'px', width: Math.abs(cx - ini.mx) + 'px', height: Math.abs(cy - ini.my) + 'px' });
        zbox.hidden = false;
        return;
      }
      // dica: ponto medido mais próximo do cursor
      let best = null, bd = 16 * 16;
      G.pontos.forEach(p => { if (destaque && destaque !== p.c.cp) return; const d = (p.X - mx) ** 2 + (p.Y - my) ** 2; if (d < bd) { bd = d; best = p; } });
      if (!best) { tip.hidden = true; return; }
      const c = best.c, k = best.i, cv = CV[c.cp];
      tip.innerHTML = `<b>${esc(c.nome)}</b> · ${esc(nomeCond(c.alvo))} · ponto ${k + 1}<br>F <span class="tv">${br(cv.F[k], 4)} kN</span> · V <span class="tv">${br(cv.V[k], 4)} mm</span><br>d ${br(cv.d[k], 4)} mm · t ${br(cv.t[k], 2)} s`;
      tip.hidden = false;
      tip.style.left = limitar(best.X, 110, box.clientWidth - 110) + 'px';
      tip.style.top = best.Y + 'px';
    });
    const fim = (e) => {
      if (!ini) return;
      const [mx, my] = pos(e);
      if (ini.modo === 'area' && arrastou && Math.abs(mx - ini.mx) > 8 && Math.abs(my - ini.my) > 8) {
        const a = paraDados(ini.mx, ini.my), b = paraDados(mx, my);
        aplicarZoom({ x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) });
      }
      zbox.hidden = true; box.classList.remove('panning'); ini = null;
    };
    box.addEventListener('pointerup', fim);
    box.addEventListener('pointercancel', () => { zbox.hidden = true; box.classList.remove('panning'); ini = null; });
    box.addEventListener('pointerleave', () => { tip.hidden = true; });
    box.addEventListener('click', (e) => {
      if (arrastou) { arrastou = false; return; }
      if (e.target.closest('.ct-tools, .ct-lim')) return;
      const lbl = e.target.closest('text[data-cp]');
      if (lbl) { destaque = destaque === lbl.dataset.cp ? null : lbl.dataset.cp; desenharCurvas(); renderLado(); return; }
      const [mx, my] = pos(e);
      let best = null, bd = 16 * 16;
      G.pontos.forEach(p => { const d = (p.X - mx) ** 2 + (p.Y - my) ** 2; if (d < bd) { bd = d; best = p; } });
      destaque = best && destaque !== best.c.cp ? best.c.cp : null;
      desenharCurvas(); renderLado();
    });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('#ct-vistas button[data-v]');
      if (!b) return;
      vista = b.dataset.v; G.zoom = null; G.fixo = null;
      document.querySelectorAll('#ct-vistas button[data-v]').forEach(x => x.classList.toggle('on', x === b));
      desenharCurvas();
    });
    ['ct-constr', 'ct-popins'].forEach(id => $(id)?.addEventListener('change', desenharCurvas));
    let raf = 0;
    new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(desenharCurvas); }).observe(box);
  })();

  function desenharCurvas() {
    const box = $('ct-chart'), svg = $('ct-svg');
    if (!box) return;
    const W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    G.pontos = [];
    const vs = visiveis(), V = VISTAS[vista];
    const M = { l: 98, r: 110, t: 26, b: 76 };   // margens para fontes grandes
    const iw = W - M.l - M.r, ih = H - M.t - M.b;
    const constr = $('ct-constr')?.checked, popins = $('ct-popins')?.checked;

    let X1 = Math.max(1e-3, ...vs.map(c => Math.max(...CV[c.cp][V.x]))) * 1.04;
    let Y1 = Math.max(1e-3, ...vs.map(c => Math.max(...CV[c.cp][V.y]))) * 1.08;
    let X0 = Math.min(0, ...vs.map(c => Math.min(...CV[c.cp][V.x])));
    let Y0 = Math.min(0, ...vs.map(c => Math.min(...CV[c.cp][V.y])));
    let px = passoAte(X1 - X0, Math.max(3, Math.floor(iw / 80))), py = passoBom(Y1 - Y0, Math.max(4, Math.min(8, ih / 55)));
    X1 = Math.ceil(X1 / px) * px; Y1 = Math.ceil(Y1 / py) * py; X0 = Math.floor(X0 / px) * px; Y0 = Math.floor(Y0 / py) * py;
    const base = { X0, X1, Y0, Y1 };
    if (G.fixo) ({ x0: X0, x1: X1, y0: Y0, y1: Y1 } = G.fixo);
    else if (G.zoom) ({ x0: X0, x1: X1, y0: Y0, y1: Y1 } = G.zoom);
    if (G.fixo || G.zoom) { px = passoAte(X1 - X0, Math.max(3, Math.floor(iw / 80))); py = passoBom(Y1 - Y0, Math.max(4, Math.min(8, ih / 55))); }
    G.escala = { M, iw, ih, X0, X1, Y0, Y1, base };
    box.classList.toggle('zoomed', !!(G.zoom));
    const pct = Math.round(Math.max((base.X1 - base.X0) / (X1 - X0), (base.Y1 - base.Y0) / (Y1 - Y0)) * 100);
    const zp = box.querySelector('.tr-zpct'); if (zp) zp.textContent = G.fixo ? 'eixos fixos' : pct + '%';
    box.querySelector('.ch-tip').hidden = true;
    const x = (v) => M.l + (v - X0) / (X1 - X0) * iw, y = (v) => M.t + ih - (v - Y0) / (Y1 - Y0) * ih;

    const g0 = svgEl('g', { class: 'ax' }, svg);
    const dx = casas(px), dy = casas(py);
    for (let j = Math.ceil(Y0 / py - 1e-9); j * py <= Y1 + 1e-9; j++) {
      const v = (j * py) || 0;
      svgEl('line', { x1: M.l, x2: M.l + iw, y1: y(v), y2: y(v), class: Math.abs(v) < 1e-12 ? 'base' : 'grid' }, g0);
      svgEl('text', { x: M.l - 10, y: y(v) + 6, 'text-anchor': 'end' }, g0).textContent = br(v, dy);
    }
    svgEl('line', { x1: M.l, x2: M.l + iw, y1: M.t + ih, y2: M.t + ih, class: 'base' }, g0);
    for (let j = Math.ceil(X0 / px - 1e-9); j * px <= X1 + 1e-9; j++) {
      const v = (j * px) || 0;
      svgEl('line', { x1: x(v), x2: x(v), y1: M.t + ih, y2: M.t + ih + 5, class: 'base' }, g0);
      svgEl('text', { x: x(v), y: M.t + ih + 30, 'text-anchor': 'middle' }, g0).textContent = br(v, dx);
    }
    svgEl('text', { x: M.l + iw / 2, y: H - 12, 'text-anchor': 'middle', class: 'ttl' }, g0).textContent = V.tx;
    svgEl('text', { x: 24, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl', transform: `rotate(-90 24 ${M.t + ih / 2})` }, g0).textContent = V.ty;
    if (!vs.length) { svgEl('text', { x: M.l + iw / 2, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl' }, svg).textContent = 'Nenhum CP com os filtros atuais'; renderLado(); return; }

    const clip = svgEl('clipPath', { id: 'ct-clip' }, svgEl('defs', {}, svg));
    svgEl('rect', { x: M.l, y: M.t - 4, width: iw + 4, height: ih + 4 }, clip);
    const rot = [];
    vs.slice().sort((a, b) => (a.cp === destaque) - (b.cp === destaque)).forEach(c => {
      const cv = CV[c.cp], xs = cv[V.x], ys = cv[V.y], cor = corDe(c.alvo), r = c.registro;
      const g = svgEl('g', { class: 'serie' + (destaque && destaque !== c.cp ? ' dim' : ''), 'data-cp': c.cp, 'clip-path': 'url(#ct-clip)' }, svg);
      let d = '';
      for (let i = 0; i < xs.length; i++) d += (i ? 'L' : 'M') + x(xs[i]).toFixed(1) + ',' + y(ys[i]).toFixed(1);
      svgEl('path', { d, fill: 'none', stroke: cor, 'stroke-width': destaque === c.cp ? 2.2 : 1.5, 'stroke-dasharray': dashDe(c), 'stroke-linejoin': 'round' }, g);
      const iF = (r.nFmax || 1) - 1;
      // construções da norma (Figuras 16 e 17), só em F × CMOD
      if (vista === 'FV' && constr && r.kV) {
        const Ftop = r.Fmax * 1.06, V0 = r.V0 || 0;
        svgEl('line', { x1: x(V0), y1: y(0), x2: x(V0 + Ftop / r.kV), y2: y(Ftop), stroke: cor, 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: .85 }, g);
        if (r.ks) svgEl('line', { x1: x(V0), y1: y(0), x2: x(V0 + Ftop / r.ks), y2: y(Ftop), stroke: cor, 'stroke-width': 1, 'stroke-dasharray': '1 3', opacity: .85 }, g);
        const Vg = cv.V[iF], Vp = Vg - r.Fmax / r.kV;      // paralela à reta elástica pelo ponto (Figura 17)
        svgEl('line', { x1: x(Vg), y1: y(r.Fmax), x2: x(Vp), y2: y(0), stroke: cor, 'stroke-width': 1, opacity: .85 }, g);
        svgEl('line', { x1: x(0), y1: y(0) - 6, x2: x(Vp), y2: y(0) - 6, stroke: cor, 'stroke-width': 2.4, opacity: .55 }, g);
        if (r.FQ) svgEl('line', { x1: x(Math.max(X0, 0)), y1: y(r.FQ), x2: x(cv.V[r.nd - 1] ?? Vg), y2: y(r.FQ), stroke: cor, 'stroke-width': .8, 'stroke-dasharray': '2 2', opacity: .6 }, g);
      }
      // candidatos a pop-in (lista da planilha)
      if (popins) (r.popins || []).forEach(p => {
        const k = p.n - 1; if (k < 0 || k >= xs.length) return;
        svgEl('path', { d: `M${x(xs[k])},${y(ys[k]) - 9}l5,-8h-10z`, fill: '#fff', stroke: cor, 'stroke-width': 1.4 }, g);
      });
      // ponto característico (Fmax, classe m)
      svgEl('rect', { x: x(xs[iF]) - 4, y: y(ys[iF]) - 4, width: 8, height: 8, fill: cor, stroke: '#fff', 'stroke-width': 1.2 }, g);
      // pontos para a dica
      const step = Math.max(1, Math.floor(xs.length / 900));
      for (let i = 0; i < xs.length; i += step) {
        const X = x(xs[i]), Y = y(ys[i]);
        if (X >= M.l && X <= M.l + iw && Y >= M.t && Y <= M.t + ih) G.pontos.push({ X, Y, c, i });
      }
      // rótulo no fim visível da curva
      let iu = xs.length - 1;
      while (iu > 0 && !(xs[iu] >= X0 && xs[iu] <= X1 && ys[iu] >= Y0 && ys[iu] <= Y1)) iu--;
      rot.push({ cp: c.cp, nome: c.nome, x: x(xs[iu]), y: y(ys[iu]) });
    });
    const gl = svgEl('g', { class: 'lbls' }, svg);
    rot.sort((a, b) => a.y - b.y);
    for (let i = 1; i < rot.length; i++) if (rot[i].y - rot[i - 1].y < 19) rot[i].y = rot[i - 1].y + 19;
    rot.forEach(r => svgEl('text', { x: Math.min(r.x + 8, W - M.r + 6), y: r.y + 4, class: 'lbl' + (destaque && destaque !== r.cp ? ' dim' : ''), 'data-cp': r.cp }, gl).textContent = r.nome);

    $('ct-nota').innerHTML = (vista === 'FV'
      ? `■ ponto característico (F<sub>max</sub>, classe m) · △ candidato a pop-in (queda ≥ 1 % listada pela planilha)${constr ? ' · ╌ reta elástica k<sub>V</sub> · ┈ secante de 5 % · — paralela pelo ponto até V<sub>p</sub> (barra sobre o eixo)' : ''}`
      : '■ ponto característico (F<sub>max</sub>) · △ candidato a pop-in') +
      ` · ${vs.reduce((s, c) => s + CV[c.cp].F.length, 0).toLocaleString('pt-BR')} pontos medidos, sem suavização` +
      '<br><span class="tr-zoom-dica">Zoom: roda do mouse sobre o ponto · arrastar move · Shift+arrastar amplia uma área · duplo clique ou "Ajustar" volta · "Eixos" define limites</span>';
    renderLado();
  }

  function renderLado() {
    const box = $('ct-side'); if (!box) return;
    const vs = visiveis().filter(c => !destaque || c.cp === destaque);
    box.innerHTML = `<h3>${destaque ? 'Corpo de prova destacado' : 'Corpos de prova'}</h3>` + vs.map(c => {
      const r = c.registro, k = c.calc;
      return `<div class="ct-card" style="border-left-color:${corClara(c.alvo)}">
        <div class="ct-card-h"><b>${esc(c.nome)}</b><span>${esc(nomeCond(c.alvo))} · ${esc(c.orient)} · ${br(c.ensaio.temp, 0)} °C</span></div>
        <div class="ct-delta"><span>${esc(k.simbolo || 'δ')}</span><b>${br(delta(c), 4)}</b><small>mm</small></div>
        <dl>
          <dt>F<sub>max</sub></dt><dd>${br(r.Fmax, 3)} kN</dd>
          <dt>V em F<sub>max</sub></dt><dd>${br(VFmax(c), 4)} mm</dd>
          <dt>V<sub>p</sub></dt><dd>${br(k.Vp, 4)} mm</dd>
          <dt>δ<sub>el</sub> + δ<sub>pl</sub></dt><dd>${br(k.d_el, 4)} + ${br(k.d_pl, 4)} mm</dd>
          <dt>F<sub>Q</sub> · F<sub>max</sub>/F<sub>Q</sub></dt><dd>${br(r.FQ, 3)} kN · ${br(k.FmaxFQ, 2)}</dd>
          <dt>k<sub>V</sub> (R²)</dt><dd>${br(r.kV, 2)} kN/mm (${br(r.R2, 4)})</dd>
          <dt>Janela elástica</dt><dd>pontos ${br(r.i1, 0)}–${br(r.i2, 0)} (${br(r.janela?.[0] * 100, 0)}–${br(r.janela?.[1] * 100, 0)} % F<sub>max</sub>)</dd>
          <dt>Pop-in</dt><dd>${(r.popins || []).length ? r.popins.map(p => `pt. ${p.n}: −${br(p.queda_pct * 100, 2)} % (${esc(p.quando || '')})`).join('<br>') : 'nenhum candidato'}</dd>
        </dl>
        <button type="button" class="btn ghost ct-mini" data-csv="${esc(c.cp)}">Registro completo (CSV)</button>
      </div>`;
    }).join('') + `<p class="ct-note">Valores da planilha ISO 12135 (abas Pontos do registro e Cálculos). Pop-in: só são listados os candidatos detectados pela planilha (queda de força ≥ 1 % entre pontos consecutivos); a confirmação segue o 6.1 da norma.</p>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-csv]');
    if (!b) return;
    const c = CPS.find(x => x.cp === b.dataset.csv), cv = CV[c.cp];
    baixar(`${c.nome.replace(/\s+/g, '_')}_registro.csv`, csv([
      [`# ${c.nome} · ${nomeCond(c.alvo)} · ${c.orient} · ${D.norma}`], [`# origem: ${c.planilha} › Dados do ensaio (F e V corrigidos); d = atuador com sinal invertido e zero no 1º ponto`],
      ['ponto', 't (s)', 'F (kN)', 'V = CMOD (mm)', 'deslocamento do atuador (mm)'],
      ...cv.F.map((f, i) => [i + 1, cv.t[i], f, cv.V[i], cv.d[i]].map(v => String(v).replace('.', ','))),
    ]), 'text/csv');
  });
  function exportarCurvasCSV() {
    const vs = visiveis(), V = VISTAS[vista];
    const n = Math.max(...vs.map(c => CV[c.cp].F.length));
    const cab = vs.flatMap(c => [`${c.nome} · ${V.tx}`, `${c.nome} · ${V.ty}`]);
    const linhas = [];
    for (let i = 0; i < n; i++) linhas.push(vs.flatMap(c => { const cv = CV[c.cp]; return i < cv.F.length ? [cv[V.x][i], cv[V.y][i]].map(v => String(v).replace('.', ',')) : ['', '']; }));
    baixar(`CTOD_${vista}.csv`, csv([cab, ...linhas]), 'text/csv');
  }
  // SVG/PNG autocontidos: copia os estilos calculados para os elementos
  function svgExport(svg) {
    const cl = svg.cloneNode(true), orig = svg.querySelectorAll('*'), copia = cl.querySelectorAll('*');
    const PROPS_CSS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font-size', 'font-family', 'font-weight'];
    orig.forEach((el, i) => { const cs = getComputedStyle(el); copia[i].setAttribute('style', PROPS_CSS.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';')); });
    const vb = svg.viewBox.baseVal;
    cl.setAttribute('xmlns', NS); cl.setAttribute('width', vb.width); cl.setAttribute('height', vb.height);
    const fundo = document.createElementNS(NS, 'rect');
    fundo.setAttribute('width', '100%'); fundo.setAttribute('height', '100%'); fundo.setAttribute('fill', '#ffffff');
    cl.insertBefore(fundo, cl.firstChild);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(cl);
  }
  function pngExport(svg, nome) {
    const vb = svg.viewBox.baseVal, k = 2;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = vb.width * k; cv.height = vb.height * k;
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      baixar(nome, cv.toDataURL('image/png'));
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgExport(svg));
  }

  /* ---------- 3. Resultados individuais ---------- */
  const COLS = [
    { k: 'cond', nome: 'Condição', v: c => c.alvo, f: c => `<i class="sw" style="background:${corClara(c.alvo)}"></i> ${esc(nomeCond(c.alvo))}`, cls: 'c-cond' },
    { k: 'cp', nome: 'Corpo de prova', v: c => c.nome, f: c => `<b>${esc(c.nome)}</b>`, cls: 'c-cond' },
    { k: 'orient', nome: 'Orient.', v: c => c.orient, f: c => esc(c.orient) },
    { k: 'T', nome: 'T (°C)', v: c => c.ensaio.temp, f: c => br(c.ensaio.temp, 0) },
    { k: 'delta', nome: 'δ (mm)', v: delta, f: c => `<b>${br(delta(c), 4)}</b>` },
    { k: 'classe', nome: 'Classe', v: c => c.calc.classe, f: c => `${esc(c.calc.simbolo || '')}` },
    { k: 'Fmax', nome: 'F<sub>max</sub> (kN)', v: c => c.registro.Fmax, f: c => br(c.registro.Fmax, 3) },
    { k: 'V', nome: 'CMOD em F<sub>max</sub> (mm)', v: VFmax, f: c => br(VFmax(c), 4) },
    { k: 'Vp', nome: 'V<sub>p</sub> (mm)', v: c => c.calc.Vp, f: c => br(c.calc.Vp, 4) },
    { k: 'aoW', nome: 'a<sub>o</sub>/W', v: c => c.geom.a_oW, f: c => br(c.geom.a_oW, 3) },
  ];
  const ordem = { k: 'cond', asc: true };
  let aberto = null;
  function renderResultados() {
    const box = $('ct-res'); if (!box) return;
    const col = COLS.find(x => x.k === ordem.k);
    const vs = visiveis().slice().sort((a, b) => {
      const va = col.v(a), vb = col.v(b);
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
      return ordem.asc ? r : -r;
    });
    box.innerHTML = `
      <div class="ct-tbar"><span class="ct-note">Clique num cabeçalho para ordenar e numa linha para ver os detalhes, a curva e as imagens do CP.</span>
        <button type="button" class="btn ghost ct-mini" id="ct-res-csv">Exportar tabela (CSV)</button></div>
      <div class="k1-table-wrap"><table class="k1-table ct-tab" id="ct-res-tab">
        <thead><tr>${COLS.map(cl => `<th class="${cl.cls || ''} sort ${ordem.k === cl.k ? (ordem.asc ? 'asc' : 'desc') : ''}" data-sort="${cl.k}">${cl.nome}</th>`).join('')}</tr></thead>
        <tbody>${vs.map(c => `<tr class="ct-row ${aberto === c.cp ? 'open' : ''}" data-cp="${esc(c.cp)}">${COLS.map(cl => `<td class="${cl.cls || ''}">${cl.f(c)}</td>`).join('')}</tr>
          ${aberto === c.cp ? `<tr class="ct-det"><td colspan="${COLS.length}">${detalhe(c)}</td></tr>` : ''}`).join('')}</tbody>
      </table></div>
      <p class="ct-note">δ = δ<sub>o</sub> da planilha (sem correção para Δa; classe m: ponto de força máxima).</p>`;
  }
  function detalhe(c) {
    return `<div class="ct-det-grid">
      <div>
        <h4>Cálculo de δ (planilha › Cálculos)</h4>
        <table class="ct-mini-tab">
          <tr><th>K no ponto</th><td>${br(c.calc.K, 2)} MPa·m<sup>0,5</sup></td></tr>
          <tr><th>δ<sub>el</sub> = K²(1−ν²)/(2R<sub>p0,2</sub>E)</th><td>${br(c.calc.d_el, 5)} mm</td></tr>
          <tr><th>r<sub>p</sub></th><td>${br(c.calc.rp, 4)}</td></tr>
          <tr><th>V<sub>p</sub></th><td>${br(c.calc.Vp, 5)} mm</td></tr>
          <tr><th>δ<sub>pl</sub> = r<sub>p</sub>·V<sub>p</sub></th><td>${br(c.calc.d_pl, 5)} mm</td></tr>
          <tr class="tot"><th>δ<sub>o</sub></th><td>${br(c.calc.delta, 5)} mm · classe ${esc(c.calc.classe)}</td></tr>
          <tr><th>Limite c/u (6.3.1)</th><td>${br(c.calc.lim_classe, 4)} mm</td></tr>
          <tr><th>K<sub>Q</sub> · F<sub>max</sub>/F<sub>Q</sub></th><td>${br(c.calc.KQ, 2)} MPa·m<sup>0,5</sup> · ${br(c.calc.FmaxFQ, 3)}</td></tr>
          <tr><th>Nove medidas a<sub>j</sub> (mm)</th><td>${c.geom.a_j.map(v => br(v, 3)).join(' · ')}</td></tr>
        </table>
        <p class="ct-acts"><button type="button" class="btn ghost ct-mini" data-ver-curva="${esc(c.cp)}">Ver curva força × CMOD →</button>
          <button type="button" class="btn ghost ct-mini" data-ver-frat="${esc(c.cp)}">Ver fractografia →</button></p>
      </div>
      <div>
        <h4>Rastreabilidade</h4>
        <ul class="ct-rast">
          <li>Planilha: <code>CTOD/${esc(c.planilha)}</code> (abas Resumo, Cálculos, Pontos do registro, Medições da trinca)</li>
          ${c.mts.map(m => `<li>MTS: <code>${esc(m.arquivo)}</code> · Test Run <b>${esc(m.run)}</b> · ${esc(m.data)}<br><small>SHA-256 ${esc(m.sha256.slice(0, 16))}…</small></li>`).join('')}
          <li>Identificação na planilha: ${esc(c.ensaio.id_planilha || '—')} · cabeçalho: ${esc(c.ensaio.cabecalho_planilha || '—')}</li>
        </ul>
      </div>
    </div>`;
  }
  document.addEventListener('click', (e) => {
    const th = e.target.closest('#ct-res-tab th[data-sort]');
    if (th) { ordem.asc = ordem.k === th.dataset.sort ? !ordem.asc : true; ordem.k = th.dataset.sort; renderResultados(); return; }
    const tr = e.target.closest('#ct-res-tab tr.ct-row');
    if (tr) { aberto = aberto === tr.dataset.cp ? null : tr.dataset.cp; renderResultados(); return; }
    if (e.target.closest('#ct-res-csv')) {
      const vs = visiveis();
      baixar('CTOD_resultados.csv', csv([
        ['Condição', 'Corpo de prova', 'Orientação', 'T (°C)', 'δ (mm)', 'Símbolo', 'Classe', 'Fmax (kN)', 'CMOD em Fmax (mm)', 'Vp (mm)', 'a_o (mm)', 'a_o/W', 'Planilha de origem'],
        ...vs.map(c => [nomeCond(c.alvo), c.nome, c.orient, c.ensaio.temp, delta(c), c.calc.simbolo, c.calc.classe, c.registro.Fmax, VFmax(c), c.calc.Vp, c.geom.a_o, c.geom.a_oW, `CTOD/${c.planilha}`].map(v => typeof v === 'number' ? String(v).replace('.', ',') : v)),
      ]), 'text/csv');
      return;
    }
    const vc = e.target.closest('[data-ver-curva]');
    if (vc) { destaque = vc.dataset.verCurva; filtro.cps.add(destaque); irPara('ctod-curvas'); tudo(); return; }
    const vf = e.target.closest('[data-ver-frat]');
    if (vf) { filtro.cps = new Set([vf.dataset.verFrat]); irPara('ctod-fratura'); tudo(); }
  });
  function irPara(id) { location.hash = '#' + id; }

  /* ---------- 4. Comparação, comparador e correlações ---------- */
  const cmp = { a: null, b: null, x: 'sigma_mev', y: 'ctod' };
  function renderComp() {
    const box = $('ct-comp'); if (!box) return;
    const vs = visiveis();
    const condComCtod = [...new Set(vs.map(c => c.alvo))].sort((a, b) => a - b);
    const disponiveis = condTodas.filter(a => { const p = mesmaCondicao(a); return PROPS.some(pr => p[pr.k] != null); });
    if (cmp.a === null || !disponiveis.includes(cmp.a)) cmp.a = condComCtod[0] ?? disponiveis[0];
    if (cmp.b === null || !disponiveis.includes(cmp.b)) cmp.b = condComCtod[1] ?? disponiveis.find(a => a !== cmp.a);
    box.innerHTML = `
      <div class="ct-grid2">
        <div>
          <h3 class="ct-h3">CTOD por condição</h3>
          <figure class="ch-chart tr-chart ct-mini-chart" id="ct-dots"><svg></svg></figure>
          <p class="ct-note">Cada ponto é um CP. Média (traço) e ± desvio-padrão amostral (barra) aparecem com n ≥ 2; boxplot com n ≥ 5. Redução em relação à referência: requer CTOD da condição 0 % (ainda não ensaiada).</p>
          <h3 class="ct-h3">Força máxima por condição</h3>
          <figure class="ch-chart tr-chart ct-mini-chart" id="ct-dots-f"><svg></svg></figure>
        </div>
        <div>
          <h3 class="ct-h3">Comparador de condições</h3>
          <div class="ct-sel">
            <label>Condição A <select id="ct-ca">${disponiveis.map(a => `<option value="${a}" ${a === cmp.a ? 'selected' : ''}>${esc(nomeCond(a))}</option>`).join('')}</select></label>
            <label>Condição B <select id="ct-cb">${disponiveis.map(a => `<option value="${a}" ${a === cmp.b ? 'selected' : ''}>${esc(nomeCond(a))}</option>`).join('')}</select></label>
          </div>
          ${tabelaComparador()}
          <h3 class="ct-h3">Correlações entre propriedades</h3>
          <div class="ct-sel">
            <label>Eixo X <select id="ct-px">${PROPS.map(p => `<option value="${p.k}" ${p.k === cmp.x ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label>
            <label>Eixo Y <select id="ct-py">${PROPS.map(p => `<option value="${p.k}" ${p.k === cmp.y ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label>
          </div>
          <figure class="ch-chart tr-chart ct-mini-chart" id="ct-corr"><svg></svg></figure>
          <p class="ct-note" id="ct-corr-nota"></p>
        </div>
      </div>`;
    desenharPontos('ct-dots', c => delta(c), 'δ (mm)', 4);
    desenharPontos('ct-dots-f', c => c.registro.Fmax, 'Fmax (kN)', 2);
    desenharCorr();
  }
  function tabelaComparador() {
    const A = mesmaCondicao(cmp.a), B = mesmaCondicao(cmp.b);
    const fmt = (P, p) => P[p.k] == null ? `<span class="nd">${p.fonte === 'em andamento' ? 'em andamento' : 'não disponível'}</span>`
      : `${br(P[p.k], p.d)}${P[p.k + '_dp'] != null ? ` <small>± ${br(P[p.k + '_dp'], p.d)}</small>` : ''}${P[p.k.replace(/_.*$/, '') + '_n'] ? ` <small>(n = ${P[p.k.replace(/_.*$/, '') + '_n']})</small>` : ''}`;
    const nKey = { charpy: 'charpy_n', Rp02: 'tr_n', Rm: 'tr_n', A: 'tr_n', ctod: 'ctod_n', Fmax: 'ctod_n' };
    return `<div class="k1-table-wrap"><table class="k1-table ct-tab ct-cmp">
      <thead><tr><th class="c-cond">Propriedade</th><th><i class="sw" style="background:${corClara(cmp.a)}"></i> ${esc(nomeCond(cmp.a))}</th><th><i class="sw" style="background:${corClara(cmp.b)}"></i> ${esc(nomeCond(cmp.b))}</th><th>Variação B vs A</th></tr></thead>
      <tbody>
        <tr><td class="c-cond">Tratamento térmico</td><td colspan="3" class="nd">não informado nos arquivos (σ alvo: ${esc(nomeCond(cmp.a))} / ${esc(nomeCond(cmp.b))})</td></tr>
        ${PROPS.map(p => {
          const a = A[p.k], b = B[p.k], nk = nKey[p.k];
          const na = nk && A[nk] ? ` <small>(n = ${A[nk]})</small>` : '', nb = nk && B[nk] ? ` <small>(n = ${B[nk]})</small>` : '';
          const cel = (P, v, n) => v == null ? `<span class="nd">${p.fonte === 'em andamento' ? 'em andamento' : 'não disponível'}</span>` : `${br(v, p.d)}${P[p.k + '_dp'] != null ? ` <small>± ${br(P[p.k + '_dp'], p.d)}</small>` : ''}${n}`;
          const vr = a != null && b != null && a !== 0 ? (b / a - 1) * 100 : null;
          return `<tr><td class="c-cond">${esc(p.nome)} <small>(${p.un})</small><br><small class="nd">${esc(p.fonte)}</small></td><td>${cel(A, a, na)}</td><td>${cel(B, b, nb)}</td><td>${vr === null ? '—' : `${vr > 0 ? '+' : ''}${br(vr, 1)} %`}</td></tr>`;
        }).join('')}
        <tr><td class="c-cond">Mecanismo de fratura</td><td colspan="3" class="nd">não atribuído — requer análise fractográfica por MEV (ver Fractografia)</td></tr>
      </tbody></table></div>
      <p class="ct-note">Valores lidos dos arquivos de dados das outras seções para a mesma condição: Kit 1 (σ e ferrita), Charpy C-L a −50 °C (mesma temperatura do CTOD) e tração na direção C (perpendicular ao plano da trinca C-L). Médias ± desvio-padrão amostral; n entre parênteses. A tração foi feita à temperatura ambiente.</p>`;
  }
  document.addEventListener('change', (e) => {
    const s = e.target.closest('#ct-ca, #ct-cb, #ct-px, #ct-py');
    if (!s) return;
    ({ 'ct-ca': () => cmp.a = +s.value, 'ct-cb': () => cmp.b = +s.value, 'ct-px': () => cmp.x = s.value, 'ct-py': () => cmp.y = s.value })[s.id]();
    renderComp();
  });

  // gráfico de pontos por condição (valores individuais; média/DP só com n ≥ 2; boxplot com n ≥ 5)
  function desenharPontos(id, fv, ty, d) {
    const box = $(id); if (!box) return;
    const svg = box.querySelector('svg'), W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
    const vs = visiveis(), cs = [...new Set(vs.map(c => c.alvo))].sort((a, b) => a - b);
    const M = { l: 92, r: 20, t: 18, b: 58 }, iw = W - M.l - M.r, ih = H - M.t - M.b;
    let Y1 = Math.max(1e-6, ...vs.map(fv)) * 1.18;
    const py = passoBom(Y1, Math.max(3, Math.min(6, ih / 40))); Y1 = Math.ceil(Y1 / py) * py;
    const y = (v) => M.t + ih - v / Y1 * ih, xc = (i) => M.l + (i + .5) / cs.length * iw;
    const g0 = svgEl('g', { class: 'ax' }, svg);
    for (let v = 0; v <= Y1 + 1e-12; v += py) {
      svgEl('line', { x1: M.l, x2: M.l + iw, y1: y(v), y2: y(v), class: v === 0 ? 'base' : 'grid' }, g0);
      svgEl('text', { x: M.l - 10, y: y(v) + 6, 'text-anchor': 'end' }, g0).textContent = br(v, casas(py));
    }
    svgEl('text', { x: 24, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl', transform: `rotate(-90 24 ${M.t + ih / 2})` }, g0).textContent = ty;
    cs.forEach((a, i) => {
      const cps = vs.filter(c => c.alvo === a), s = stats(cps.map(fv)), cor = corDe(a), X = xc(i);
      svgEl('text', { x: X, y: M.t + ih + 24, 'text-anchor': 'middle', class: 'cat' }, g0).textContent = nomeCond(a);
      svgEl('text', { x: X, y: M.t + ih + 44, 'text-anchor': 'middle', class: 'cat-n' }, g0).textContent = `n = ${s.n}`;
      if (s.n >= 5) {
        const v = cps.map(fv).sort((p, q) => p - q), q = (f) => { const k = (v.length - 1) * f, lo = Math.floor(k); return v[lo] + (v[Math.ceil(k)] - v[lo]) * (k - lo); };
        svgEl('rect', { x: X - 18, y: y(q(.75)), width: 36, height: y(q(.25)) - y(q(.75)), fill: 'none', stroke: cor, 'stroke-width': 1.2 }, svg);
        svgEl('line', { x1: X - 18, x2: X + 18, y1: y(q(.5)), y2: y(q(.5)), stroke: cor, 'stroke-width': 2 }, svg);
      }
      if (s.n >= 2) {
        svgEl('line', { x1: X, x2: X, y1: y(s.m - s.sd), y2: y(s.m + s.sd), stroke: cor, 'stroke-width': 1.4 }, svg);
        svgEl('line', { x1: X - 14, x2: X + 14, y1: y(s.m), y2: y(s.m), stroke: cor, 'stroke-width': 2.4 }, svg);
      }
      cps.forEach((c, j) => {
        const off = (j - (cps.length - 1) / 2) * 10;
        svgEl('circle', { cx: X + off, cy: y(fv(c)), r: 5.5, fill: cor, stroke: '#fff', 'stroke-width': 1.5 }, svg);
        // última condição: rótulo à esquerda do ponto, para não sair do gráfico
        const esq = i === cs.length - 1 && cs.length > 1;
        svgEl('text', { x: X + off + (esq ? -11 : 11), y: y(fv(c)) + 5, class: 'lbl', 'text-anchor': esq ? 'end' : 'start' }, svg).textContent = `${c.nome}: ${br(fv(c), d)}`;
      });
    });
  }
  function desenharCorr() {
    const box = $('ct-corr'); if (!box) return;
    const svg = box.querySelector('svg'), W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
    const PX = PROPS.find(p => p.k === cmp.x), PY = PROPS.find(p => p.k === cmp.y);
    const pts = condTodas.map(a => ({ a, ...mesmaCondicao(a) })).filter(p => p[PX.k] != null && p[PY.k] != null);
    const nota = $('ct-corr-nota');
    const M = { l: 92, r: 24, t: 18, b: 70 }, iw = W - M.l - M.r, ih = H - M.t - M.b;
    const g0 = svgEl('g', { class: 'ax' }, svg);
    svgEl('text', { x: M.l + iw / 2, y: H - 12, 'text-anchor': 'middle', class: 'ttl' }, g0).textContent = `${PX.nome} (${PX.un})`;
    svgEl('text', { x: 24, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl', transform: `rotate(-90 24 ${M.t + ih / 2})` }, g0).textContent = `${PY.nome} (${PY.un})`;
    if (!pts.length) {
      svgEl('text', { x: M.l + iw / 2, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'ttl' }, svg).textContent = 'Sem condições com os dois dados';
      nota.innerHTML = `${esc(PX.nome)}: ${esc(PX.fonte)} · ${esc(PY.nome)}: ${esc(PY.fonte)}.`; return;
    }
    const ext = (k) => { const v = pts.map(p => p[k]); const lo = Math.min(...v), hi = Math.max(...v), pad = (hi - lo || Math.abs(hi) || 1) * .25; return [lo - pad, hi + pad]; };
    let [X0, X1] = ext(PX.k), [Y0, Y1] = ext(PY.k);
    const px = passoBom(X1 - X0, 5), py = passoBom(Y1 - Y0, 4);
    X0 = Math.floor(X0 / px) * px; X1 = Math.ceil(X1 / px) * px; Y0 = Math.floor(Y0 / py) * py; Y1 = Math.ceil(Y1 / py) * py;
    const x = (v) => M.l + (v - X0) / (X1 - X0) * iw, y = (v) => M.t + ih - (v - Y0) / (Y1 - Y0) * ih;
    for (let v = Y0; v <= Y1 + 1e-12; v += py) { svgEl('line', { x1: M.l, x2: M.l + iw, y1: y(v), y2: y(v), class: 'grid' }, g0); svgEl('text', { x: M.l - 10, y: y(v) + 6, 'text-anchor': 'end' }, g0).textContent = br(v, casas(py)); }
    for (let v = X0; v <= X1 + 1e-12; v += px) svgEl('text', { x: x(v), y: M.t + ih + 26, 'text-anchor': 'middle' }, g0).textContent = br(v, casas(px));
    svgEl('line', { x1: M.l, x2: M.l + iw, y1: M.t + ih, y2: M.t + ih, class: 'base' }, g0);
    let txt = `n = ${pts.length} condiç${pts.length > 1 ? 'ões' : 'ão'} com os dois dados (médias por condição).`;
    if (pts.length >= 3) {
      const mx = pts.reduce((s, p) => s + p[PX.k], 0) / pts.length, my = pts.reduce((s, p) => s + p[PY.k], 0) / pts.length;
      let sxy = 0, sxx = 0, syy = 0; pts.forEach(p => { sxy += (p[PX.k] - mx) * (p[PY.k] - my); sxx += (p[PX.k] - mx) ** 2; syy += (p[PY.k] - my) ** 2; });
      const b = sxy / sxx, a0 = my - b * mx, r = sxy / Math.sqrt(sxx * syy);
      svgEl('line', { x1: x(X0), y1: y(a0 + b * X0), x2: x(X1), y2: y(a0 + b * X1), stroke: '#5f6b76', 'stroke-width': 1.2, 'stroke-dasharray': '6 4', 'clip-path': 'none' }, svg);
      txt += ` Reta de mínimos quadrados: r = ${br(r, 3)} · R² = ${br(r * r, 3)}. Correlação não implica causalidade; com poucas condições, r é muito sensível a cada ponto.`;
    } else {
      txt += ' Linha de tendência, r e R² aparecem a partir de 3 condições (com 2 pontos, qualquer reta tem R² = 1 e não informa nada).';
    }
    pts.forEach(p => {
      svgEl('circle', { cx: x(p[PX.k]), cy: y(p[PY.k]), r: 6, fill: corDe(p.a), stroke: '#fff', 'stroke-width': 1.5 }, svg);
      svgEl('text', { x: x(p[PX.k]) + 11, y: y(p[PY.k]) + 5, class: 'lbl' }, svg).textContent = nomeCond(p.a);
    });
    nota.innerHTML = `${txt}<br>X: ${esc(PX.fonte)} · Y: ${esc(PY.fonte)}. Só entram condições com os dois dados medidos.`;
  }

  /* ---------- 5. Fractografia ---------- */
  const selComp = new Set();
  function renderFratura() {
    const box = $('ct-frat'); if (!box) return;
    const vs = visiveis();
    box.innerHTML = `
      <div class="ct-tbar"><span class="ct-note">Estereomicroscópio (Zeiss SteREO Discovery V20); escala e dados de aquisição gravados na própria imagem. Clique para ampliar (roda do mouse = zoom, arrastar = mover, ← → navegam). Marque duas imagens para compará-las lado a lado.</span>
        <button type="button" class="btn ct-mini" id="ct-cmp-btn" ${selComp.size === 2 ? '' : 'disabled'}>Comparar lado a lado (${selComp.size}/2)</button></div>
      ${vs.map(c => `<section class="ct-gal-cp">
        <h3 class="ct-h3"><i class="sw" style="background:${corClara(c.alvo)}"></i> ${esc(c.nome)} <small>${esc(nomeCond(c.alvo))} · ${esc(c.orient)} · δ = ${br(delta(c), 4)} mm · a<sub>o</sub> = ${br(c.geom.a_o, 3)} mm</small></h3>
        <div class="ct-gal">${c.imagens.map((im, i) => `<figure class="ct-fig">
          <button type="button" class="ct-img" data-img="${esc(c.cp)}|${i}" aria-label="Ampliar ${esc(im.titulo)}"><img src="${esc(im.src)}" alt="${esc(c.nome)} · ${esc(im.titulo)}" loading="lazy"></button>
          <figcaption><b>${esc(im.titulo)}</b><small>${esc(im.arquivo)}${im.czi ? ` · original ${esc(im.czi)}` : ''}</small>
            <label class="chk"><input type="checkbox" data-sel="${esc(c.cp)}|${i}" ${selComp.has(`${c.cp}|${i}`) ? 'checked' : ''}> comparar</label></figcaption>
        </figure>`).join('')}</div>
      </section>`).join('')}
      <p class="ct-note">Identificação de mecanismos de fratura (clivagem, dimples, fratura intergranular etc.) não é feita automaticamente: requer análise por MEV e interpretação. As imagens mostram a superfície de fratura, a frente da pré-trinca e as medições usadas no cálculo de a<sub>o</sub>.</p>`;
  }
  const lb = document.createElement('div');
  lb.className = 'lb ct-lb';
  lb.innerHTML = '<div class="ct-lb-imgs"></div><p class="lb-cap"></p><button class="lb-nav lb-prev" type="button" aria-label="Anterior">‹</button><button class="lb-nav lb-next" type="button" aria-label="Próxima">›</button><button class="lb-close" type="button" aria-label="Fechar">✕</button>';
  document.body.appendChild(lb);
  let lbLista = [], lbAt = 0;
  const imgDe = (key) => { const [cp, i] = key.split('|'); const c = CPS.find(x => x.cp === cp); return { c, im: c.imagens[+i] }; };
  function abrirLb(keys, at = 0) {
    lbLista = keys; lbAt = at;
    mostrarLb();
    lb.classList.add('open');
  }
  function mostrarLb() {
    const dupla = lbLista.length === 2 && lb.dataset.modo === 'comparar';
    const ks = dupla ? lbLista : [lbLista[lbAt]];
    lb.querySelector('.ct-lb-imgs').innerHTML = ks.map(k => { const { c, im } = imgDe(k); return `<div class="ct-zw"><img src="${esc(im.src)}" alt="${esc(im.titulo)}" draggable="false"><span>${esc(c.nome)} · ${esc(im.titulo)}</span></div>`; }).join('');
    lb.querySelector('.ct-lb-imgs').classList.toggle('dupla', dupla);
    const { c, im } = imgDe(lbLista[lbAt]);
    lb.querySelector('.lb-cap').innerHTML = dupla ? 'Comparação lado a lado · roda do mouse = zoom em cada imagem · duplo clique volta'
      : `<b>${esc(c.nome)}</b> · ${esc(nomeCond(c.alvo))} · ${esc(im.titulo)} <small>(${esc(im.arquivo)}, ${im.px[0]} × ${im.px[1]} px)</small> <span class="lb-pos">${lbAt + 1} / ${lbLista.length} · ← → · roda = zoom · duplo clique volta</span>`;
    lb.querySelectorAll('.lb-nav').forEach(b => { b.hidden = dupla || lbLista.length < 2; });
    lb.querySelectorAll('.ct-zw').forEach(ligarZoomImg);
  }
  function ligarZoomImg(w) {
    const img = w.querySelector('img'); let s = 1, tx = 0, ty = 0, ini = null;
    const aplicar = () => { img.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`; w.classList.toggle('zoomed', s > 1); };
    w.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = w.getBoundingClientRect(), mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
      const ns = limitar(s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), 1, 12), k = ns / s;
      tx = mx - (mx - tx) * k; ty = my - (my - ty) * k; s = ns;
      if (s === 1) { tx = 0; ty = 0; }
      aplicar();
    }, { passive: false });
    w.addEventListener('pointerdown', (e) => { if (s > 1) { ini = { x: e.clientX - tx, y: e.clientY - ty }; w.setPointerCapture(e.pointerId); } });
    w.addEventListener('pointermove', (e) => { if (ini) { tx = e.clientX - ini.x; ty = e.clientY - ini.y; aplicar(); } });
    w.addEventListener('pointerup', () => { ini = null; });
    w.addEventListener('dblclick', () => { s = 1; tx = 0; ty = 0; aplicar(); });
  }
  lb.addEventListener('click', (e) => {
    if (e.target.closest('.lb-prev')) { lbAt = (lbAt - 1 + lbLista.length) % lbLista.length; mostrarLb(); return; }
    if (e.target.closest('.lb-next')) { lbAt = (lbAt + 1) % lbLista.length; mostrarLb(); return; }
    if (e.target.closest('.lb-close') || !e.target.closest('.ct-zw')) lb.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lb.classList.remove('open');
    else if (lb.dataset.modo !== 'comparar' && lbLista.length > 1 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault(); e.stopPropagation();
      lbAt = (lbAt + (e.key === 'ArrowRight' ? 1 : -1) + lbLista.length) % lbLista.length; mostrarLb();
    }
  }, true);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-img]');
    if (b) {
      const todas = visiveis().flatMap(c => c.imagens.map((_, i) => `${c.cp}|${i}`));
      lb.dataset.modo = 'uma';
      abrirLb(todas, todas.indexOf(b.dataset.img));
      return;
    }
    if (e.target.closest('#ct-cmp-btn') && selComp.size === 2) { lb.dataset.modo = 'comparar'; abrirLb([...selComp], 0); }
  });
  document.addEventListener('change', (e) => {
    const cb = e.target.closest('[data-sel]');
    if (!cb) return;
    if (cb.checked) { selComp.add(cb.dataset.sel); while (selComp.size > 2) selComp.delete(selComp.values().next().value); }
    else selComp.delete(cb.dataset.sel);
    renderFratura();
  });

  /* ---------- inicialização ---------- */
  function tudo() { renderFiltros(); renderGeral(); desenharCurvas(); renderResultados(); renderComp(); renderFratura(); }
  tudo();
  const compEl = $('ct-comp');
  if (compEl) {
    let raf2 = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(() => { desenharPontos('ct-dots', c => delta(c), 'δ (mm)', 4); desenharPontos('ct-dots-f', c => c.registro.Fmax, 'Fmax (kN)', 2); desenharCorr(); });
    }).observe(compEl);
  }
})();
