/* Kit 1 · tabela editável + páginas por condição (MO × MEV)
 *
 * Dados: dados/kit1.js (window.DADOS_KIT1).
 * Edição: botão "Editar" na página do Kit 1. As alterações ficam guardadas neste
 * navegador e podem ser gravadas com "Salvar arquivo", que baixa um novo kit1.js
 * para substituir Site/dados/kit1.js.
 *
 * Fotos: geradas por Site/ferramentas/importar_kit1.py a partir de
 *   KIT 1/MEV/Imagens selecionadas   e   KIT 1/Ótico/Imagens selecionadas
 * e listadas em dados/kit1-campos.js (window.CAMPOS_KIT1).
 */
(function () {
  const KEY = 'faseSigma.kit1';
  const CAMPOS = window.CAMPOS_KIT1 || {};   // dados/kit1-campos.js (gerado pelo importador)
  const camposDe = (cond, tec) => (CAMPOS[cond] && CAMPOS[cond][tec]) || [];
  const GALERIA = window.GALERIA_KIT1 || {};  // micrografias complementares (subpastas de "Imagens selecionadas")
  const galeriaDe = (cond) => (GALERIA[cond] && GALERIA[cond].mev) || [];
  const base = window.DADOS_KIT1;
  if (!base) return;

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const ASSINATURA = (() => {   // hash curto do conteúdo do arquivo de dados
    const s = JSON.stringify(base || null); let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return s.length + ':' + h;
  })();
  const store = {
    // a cópia local guarda a "assinatura" do arquivo de dados de onde veio; se o arquivo mudou
    // (importador ou edição), a cópia antiga é descartada e valem os dados novos do arquivo
    get() {
      try {
        const v = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (v && v.base === ASSINATURA && v.data) return v.data;
        if (v) localStorage.removeItem(KEY);
      } catch (e) {}
      return null;
    },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify({ base: ASSINATURA, data: v })); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };

  let data = store.get() || clone(base);
  let editing = false;

  const $ = (id) => document.getElementById(id);
  const fmt = (v) => (v === null || v === undefined || v === '' || isNaN(v))
    ? null
    : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parse = (txt) => {
    txt = String(txt).trim().replace(/\s/g, '').replace(',', '.');
    if (txt === '' || txt === '—' || txt === '-') return null;
    const n = Number(txt);
    return isNaN(n) ? NaN : n;
  };
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const TECS = [
    { k: 'mo', nome: 'Microscopia óptica', curto: 'MO', foto: 'mo' },
    { k: 'mev', nome: 'MEV · BSE', curto: 'MEV', foto: 'mev' },
    { k: 'ferrito', nome: 'Ferritoscópio', curto: 'Ferritoscópio' },
  ];

  /* ---------- tabela ---------- */
  function cell(c, tec, campo) {
    const v = c[tec][campo];
    if (editing) {
      const shown = v === null || v === undefined ? '' : String(v).replace('.', ',');
      return `<td><input inputmode="decimal" data-c="${c.id}" data-t="${tec}" data-f="${campo}" value="${esc(shown)}" aria-label="${tec} ${campo} ${c.rotulo}"></td>`;
    }
    const f = fmt(v);
    return f === null ? '<td class="empty">—</td>' : `<td class="c-${tec}">${f}</td>`;
  }

  function renderTable() {
    $('k1-titulo').textContent = data.titulo || 'Kit 1';
    $('k1-sub').textContent = data.subtitulo || '';
    $('k1-body').innerHTML = data.condicoes.map(c => `
      <tr>
        <td class="c-cond">
          <a class="cond-link" href="#kit1-${c.id}" data-goto="kit1-${c.id}">
            <b>${esc(c.rotulo)}</b> σ <span class="arrow" aria-hidden="true">→</span>
          </a>
        </td>
        ${TECS.map(t => cell(c, t.k, 'media') + (t.k === 'ferrito' ? '' : cell(c, t.k, 'dp'))).join('')}
        <td class="c-sit"><a class="mg-link" href="#kit1-${c.id}" data-goto="kit1-${c.id}">Ver micrografia <span class="arrow" aria-hidden="true">→</span></a></td>
      </tr>`).join('');
  }

  function dirty() { return JSON.stringify(data) !== JSON.stringify(base); }
  function refreshBadge() { $('k1-badge').hidden = !dirty(); }

  function onInput(e) {
    const inp = e.target.closest('input');
    if (!inp) return;
    const c = data.condicoes.find(x => x.id === inp.dataset.c);
    if (inp.dataset.f === 'situacao') {
      c.situacao = inp.value;
    } else {
      const n = parse(inp.value);
      inp.classList.toggle('bad', Number.isNaN(n));
      if (Number.isNaN(n)) return;
      c[inp.dataset.t][inp.dataset.f] = n;
    }
    store.set(data);
    refreshBadge();
    renderPanelValues();
  }

  function setEditing(on) {
    editing = on;
    document.querySelector('.k1').classList.toggle('editing', on);
    $('k1-edit').textContent = on ? 'Concluir' : 'Editar';
    $('k1-save').hidden = !on;
    $('k1-reset').hidden = !on;
    renderTable();
    if (on) document.querySelector('#k1-body input')?.focus();
  }

  function saveFile() {
    const txt =
`// Dados do Kit 1 · Quantificação de fase sigma
// Gerado pela página em ${new Date().toLocaleString('pt-BR')}.
// Substitua Site/dados/kit1.js por este arquivo. Use null para valor ainda não medido.
window.DADOS_KIT1 = ${JSON.stringify(data, null, 2)};
`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' }));
    a.download = 'kit1.js';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function reset() {
    if (!confirm('Descartar as alterações feitas neste navegador e voltar aos valores do arquivo dados/kit1.js?')) return;
    store.clear();
    data = clone(base);
    renderTable(); renderPanelValues(); refreshBadge();
  }

  /* ---------- páginas por condição: imagens lado a lado ---------- */
  const N_CAMPOS = 2;   // campos mostrados por técnica
  const pct = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function fig(src, rotulo, alt, grupo) {
    if (!src) return `<figure class="mg-fig vazio"><span>${rotulo}<br><small>aguardando imagem</small></span></figure>`;
    return `<figure class="mg-fig" data-grupo="${grupo}" tabindex="0" role="button" aria-label="Ampliar ${esc(alt)}">
        <img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">
        <figcaption>${rotulo}</figcaption>
      </figure>`;
  }

  function campoCap(f, i) {
    if (!f) return `<p class="mg-cap"><b>Campo ${i + 1}</b></p>`;
    return `<p class="mg-cap"><span><b>Campo ${i + 1}</b> · ${esc(String(f.campo).replace(/^\d+%_/, ''))}</span>
      <span class="mg-sig">σ <b>${pct(f.sigma)} %</b>${f.ic95 != null ? ` ± ${pct(f.ic95)}` : ''}</span></p>`;
  }

  function linha(c, t) {
    const cs = camposDe(c.id, t.foto);
    const n = Math.max(N_CAMPOS, cs.length);
    const campos = Array.from({ length: n }, (_, i) => {
      const f = cs[i];
      const g = `${c.id}-${t.foto}-${i}`;
      return `
        <div class="mg-field">
          <div class="mg-pair">
            ${fig(f && f.original, 'Original', `${t.curto} ${c.rotulo} campo ${i + 1} original`, g)}
            ${fig(f && f.quant, 'Quantificada', `${t.curto} ${c.rotulo} campo ${i + 1} quantificada`, g)}
          </div>
          ${campoCap(f, i)}
        </div>`;
    }).join('');
    return `
      <div class="mg-row" data-tec="${t.foto}">
        <div class="mg-label">
          <h3>${t.nome}</h3>
          <span class="panel-val" data-val="${c.id}:${t.k}"></span>
          <span class="mg-sub">média da condição</span>
          ${cs.length ? `<span class="mg-meta">${esc(cs[0].modelo || '')}${cs[0].pontos_astm ? `<br>IC 95% · ASTM E562` : ''}</span>` : ''}
        </div>
        ${campos}
      </div>`;
  }

  function condSlide(c) {
    const tabs = data.condicoes.map(x =>
      `<a href="#kit1-${x.id}" data-goto="kit1-${x.id}" class="${x.id === c.id ? 'on' : ''}">${esc(x.rotulo)}</a>`).join('');
    const sec = document.createElement('section');
    sec.className = 'slide inner';
    sec.dataset.id = `kit1-${c.id}`;
    sec.dataset.title = `Kit 1 · ${c.rotulo}`;
    sec.innerHTML = `
      <header class="slide-head">
        <img class="logo-sm" src="assets/logo-lpts-claro.png" alt="LPTS">
        <a class="back" href="#kit1" data-goto="kit1">← Kit 1</a>
      </header>
      <div class="cond-top">
        <div>
          <p class="kicker">Kit 1 · Quantificação de σ</p>
          <h2>Condição ${esc(c.rotulo)} σ</h2>
        </div>
        <div class="cond-acts">
          ${secTabs(c, 'quant')}
          <nav class="cond-tabs" aria-label="Condições">${tabs}</nav>
        </div>
      </div>
      <div class="mg">${[TECS[1], TECS[0]].map(t => linha(c, t)).join('')}</div>`;
    return sec;
  }

  /* abas de seção da condição: Quantificação | MEV (se houver galeria) | EBSD */
  function secTabs(c, ativo) {
    const s = [['quant', 'Quantificação', `kit1-${c.id}`]];
    if (galeriaDe(c.id).length) s.push(['x1000', 'MEV', `kit1-${c.id}-galeria`]);
    s.push(['ebsd', 'EBSD', `kit1-${c.id}-ebsd`]);
    return `<nav class="cond-tabs sec-tabs" aria-label="Seções">${s.map(([k, nome, id]) =>
      `<a href="#${id}" data-goto="${id}" class="${k === ativo ? 'on' : ''}">${nome}</a>`).join('')}</nav>`;
  }

  /* ---------- seção ×1000: micrografias MEV-BSE complementares (sem quantificação) ---------- */
  function galSlide(c) {
    const fotos = galeriaDe(c.id);
    const tabs = data.condicoes.filter(x => galeriaDe(x.id).length).map(x =>
      `<a href="#kit1-${x.id}-galeria" data-goto="kit1-${x.id}-galeria" class="${x.id === c.id ? 'on' : ''}">${esc(x.rotulo)}</a>`).join('');
    const sec = document.createElement('section');
    sec.className = 'slide inner';
    sec.dataset.id = `kit1-${c.id}-galeria`;
    sec.dataset.title = `Kit 1 · ${c.rotulo} · MEV`;
    sec.innerHTML = `
      <header class="slide-head">
        <img class="logo-sm" src="assets/logo-lpts-claro.png" alt="LPTS">
        <a class="back" href="#kit1" data-goto="kit1">← Kit 1</a>
      </header>
      <div class="cond-top">
        <div>
          <p class="kicker">Kit 1 · MEV · BSE · 1000×</p>
          <h2>Condição ${esc(c.rotulo)} σ <span class="gl-n">${fotos.length} campos</span></h2>
        </div>
        <div class="cond-acts">
          ${secTabs(c, 'x1000')}
          <nav class="cond-tabs" aria-label="Condições">${tabs}</nav>
        </div>
      </div>
      <p class="gl-lede">Campos complementares da mesma amostra a 1000×, sem quantificação, mostrando a distribuição da fase σ (contraste claro) nos contornos de grão. Clique para ampliar.</p>
      <div class="gl">${fotos.map((f, i) => `
        <figure class="mg-fig gl-fig" data-gal="${c.id}" data-i="${i}" tabindex="0" role="button" aria-label="Ampliar ${esc(f.campo)}">
          <img src="${esc(f.src)}" alt="MEV-BSE ${esc(c.rotulo)} σ, ${esc(f.campo)}" loading="lazy">
          <figcaption>${esc(String(f.campo).replace(/^\d+%_/, '').replace('_', ' '))}</figcaption>
        </figure>`).join('')}
      </div>`;
    return sec;
  }

  /* ---------- seção EBSD: reservada para os resultados que ainda serão inseridos ---------- */
  function ebsdSlide(c) {
    const tabs = data.condicoes.map(x =>
      `<a href="#kit1-${x.id}-ebsd" data-goto="kit1-${x.id}-ebsd" class="${x.id === c.id ? 'on' : ''}">${esc(x.rotulo)}</a>`).join('');
    const sec = document.createElement('section');
    sec.className = 'slide inner';
    sec.dataset.id = `kit1-${c.id}-ebsd`;
    sec.dataset.title = `Kit 1 · ${c.rotulo} · EBSD`;
    sec.innerHTML = `
      <header class="slide-head">
        <img class="logo-sm" src="assets/logo-lpts-claro.png" alt="LPTS">
        <a class="back" href="#kit1" data-goto="kit1">← Kit 1</a>
      </header>
      <div class="cond-top">
        <div>
          <p class="kicker">Kit 1 · EBSD</p>
          <h2>Condição ${esc(c.rotulo)} σ</h2>
        </div>
        <div class="cond-acts">
          ${secTabs(c, 'ebsd')}
          <nav class="cond-tabs" aria-label="Condições">${tabs}</nav>
        </div>
      </div>
      <div class="ebsd-vazio">
        <p class="ebsd-tag">Em preparação</p>
        <p>Os resultados de EBSD desta condição ainda serão inseridos.</p>
      </div>`;
    return sec;
  }

  function renderPanelValues() {
    document.querySelectorAll('[data-val]').forEach(el => {
      const [cid, tec] = el.dataset.val.split(':');
      const c = data.condicoes.find(x => x.id === cid);
      const m = fmt(c[tec].media), d = fmt(c[tec].dp);
      if (m === null) { el.className = 'panel-val empty'; el.textContent = 'pendente'; return; }
      el.className = 'panel-val';
      el.innerHTML = `${m}${d !== null ? ` <small>± ${d}</small>` : ''}<small>%</small>`;
    });
  }

  /* ampliar: mostra o par (original + quantificada) do campo em tela cheia */
  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<div class="lb-pair"></div><p class="lb-cap"></p><button class="lb-close" type="button" aria-label="Fechar">✕</button>';
  document.body.appendChild(lb);
  let galAtual = null;   // { cond, i } quando a ampliação é de uma foto da galeria
  function abrirGaleria(cond, i) {
    const fotos = galeriaDe(cond), c = data.condicoes.find(x => x.id === cond);
    i = (i + fotos.length) % fotos.length;
    galAtual = { cond, i };
    const f = fotos[i];
    lb.querySelector('.lb-pair').innerHTML =
      `<figure><img src="${esc(f.src)}" alt="MEV-BSE ${esc(c.rotulo)} σ, ${esc(f.campo)}"><figcaption>${esc(f.campo)}</figcaption></figure>`;
    lb.querySelector('.lb-cap').innerHTML =
      `MEV · BSE · Condição <b>${esc(c.rotulo)} σ</b> · ${i + 1} / ${fotos.length} <span class="lb-hint">← → para navegar · Esc para fechar</span>`;
    lb.classList.add('open');
  }
  function abrir(figEl) {
    if (figEl.dataset.gal) { abrirGaleria(figEl.dataset.gal, Number(figEl.dataset.i)); return; }
    galAtual = null;
    const field = figEl.closest('.mg-field');
    lb.querySelector('.lb-pair').innerHTML = [...field.querySelectorAll('.mg-fig:not(.vazio)')]
      .map(f => `<figure>${f.querySelector('img').outerHTML.replace(' loading="lazy"', '')}<figcaption>${f.querySelector('figcaption').textContent}</figcaption></figure>`).join('');
    const tec = figEl.closest('.mg-row').querySelector('.mg-label h3').textContent;
    lb.querySelector('.lb-cap').innerHTML = `${esc(tec)} · ${field.querySelector('.mg-cap').innerHTML}`;
    lb.classList.add('open');
  }
  const fechar = () => lb.classList.remove('open');
  lb.addEventListener('click', (e) => { if (!e.target.closest('img')) fechar(); });
  document.addEventListener('click', (e) => {
    const f = e.target.closest('.mg-fig:not(.vazio)');
    if (f) abrir(f);
  });
  document.addEventListener('keydown', (e) => {
    if (lb.classList.contains('open') && e.key === 'Escape') { fechar(); return; }
    if (lb.classList.contains('open') && galAtual && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      abrirGaleria(galAtual.cond, galAtual.i + (e.key === 'ArrowRight' ? 1 : -1)); return;
    }
    const f = e.target.closest && e.target.closest('.mg-fig:not(.vazio)');
    if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrir(f); }
  });

  /* ---------- inicialização ---------- */
  const kitSlide = document.querySelector('.slide[data-id="kit1"]');
  let after = kitSlide;
  data.condicoes.forEach(c => {
    const s = condSlide(c); after.after(s); after = s;
    if (galeriaDe(c.id).length) { const g = galSlide(c); after.after(g); after = g; }
    { const e = ebsdSlide(c); after.after(e); after = e; }
  });

  renderTable(); renderPanelValues(); refreshBadge();
  $('k1-body').addEventListener('input', onInput);
  $('k1-edit').addEventListener('click', () => setEditing(!editing));
  $('k1-save').addEventListener('click', saveFile);
  $('k1-reset').addEventListener('click', reset);
})();
