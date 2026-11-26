/* Como Recebido · tubo interativo + páginas das seções longitudinal e circunferencial
 * Imagens: dados/como-recebido.js (window.COMO_RECEBIDO), gerado por
 *   Site/ferramentas/importar_como_recebido.py
 */
(function () {
  const D = window.COMO_RECEBIDO;
  const slide = document.querySelector('.slide[data-id="como-recebido"]');
  if (!D || !slide) return;
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const SEC = {
    long: { id: 'cr-long', nome: 'Seção longitudinal', desc: 'Plano paralelo ao eixo do tubo: bandas de ferrita e austenita alongadas no sentido longitudinal.' },
    circ: { id: 'cr-circ', nome: 'Seção circunferencial', desc: 'Plano perpendicular ao eixo do tubo (face do anel).' },
  };

  /* destaque cruzado: passar o mouse no tubo acende o número ao lado, e vice-versa */
  const art = slide.querySelector('.tubo-art');
  const marcar = (reg) => {
    art.classList.toggle('hl-long', reg === 'long');
    art.classList.toggle('hl-circ', reg === 'circ');
    slide.querySelectorAll('.stat-link').forEach(a => a.classList.toggle('hl', a.dataset.reg === reg));
  };
  slide.addEventListener('pointerover', (e) => { const r = e.target.closest('[data-reg]'); marcar(r ? r.dataset.reg : null); });
  slide.addEventListener('pointerleave', () => marcar(null));

  /* fases da quantificação SVRNA: pseudocor → nome exibido */
  const FASES = {
    BLUE:   { nome: 'Ferrita (δ)',    cor: '#2f5bff' },
    YELLOW: { nome: 'Austenita (γ)',  cor: '#f2d200' },
  };
  const n2 = (v, d = 2) => (v == null || isNaN(v)) ? '—' : Number(v).toFixed(d).replace('.', ',');
  const faseTxt = (f) => Object.keys(FASES).filter(k => f && f[k]).map(k =>
    `<span class="cr-f"><i style="background:${FASES[k].cor}"></i>${FASES[k].nome} <b>${n2(f[k].p)} %</b>${f[k].ic != null ? ` ± ${n2(f[k].ic)}` : ''}</span>`).join('');

  const media = (lista) => {
    const q = lista.filter(im => im.fases);
    if (!q.length) return '';
    const linhas = Object.keys(FASES).map(k => {
      const v = q.map(im => im.fases[k] && im.fases[k].p).filter(x => typeof x === 'number');
      if (!v.length) return '';
      const m = v.reduce((a, b) => a + b, 0) / v.length;
      const dp = v.length > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)) : null;
      return `<span class="cr-f"><i style="background:${FASES[k].cor}"></i>${FASES[k].nome} <b>${n2(m)} %</b>${dp != null ? ` ± ${n2(dp)}` : ''}</span>`;
    }).join('');
    return `<div class="cr-media"><span class="cr-mlbl">Média de ${q.length} campo${q.length > 1 ? 's' : ''} quantificado${q.length > 1 ? 's' : ''}</span>${linhas}</div>`;
  };

  const fig = (im, s, aum) => {
    const nome = im.arquivo.replace(/\.(jpe?g|png)$/i, '');
    const dados = `data-src="${esc(im.src)}" data-quant="${esc(im.quant || '')}" data-nome="${esc(nome)}" data-aum="${esc(aum || '')}" data-fases="${esc(JSON.stringify(im.fases || null))}"`;
    if (im.quant) return `
      <figure class="cr-pair">
        <div class="cr-pair-imgs">
          <button type="button" class="cr-fig" ${dados} aria-label="Ampliar ${esc(nome)}"><img src="${esc(im.src)}" alt="MEV ${esc(s.nome)} · ${esc(nome)}" loading="lazy"><span>Original</span></button>
          <button type="button" class="cr-fig" ${dados} aria-label="Ampliar quantificação de ${esc(nome)}"><img src="${esc(im.quant)}" alt="Quantificação · ${esc(nome)}" loading="lazy"><span>Quantificada</span></button>
        </div>
        <figcaption><b>${esc(nome)}</b>${faseTxt(im.fases)}</figcaption>
      </figure>`;
    return `
      <figure class="cr-one">
        <button type="button" class="cr-fig" ${dados} aria-label="Ampliar ${esc(nome)}"><img src="${esc(im.src)}" alt="MEV ${esc(s.nome)} · ${esc(nome)}" loading="lazy"></button>
        <figcaption><b>${esc(nome)}</b>${im.fases ? faseTxt(im.fases) : ''}</figcaption>
      </figure>`;
  };

  const galeria = (lista, s, aum) => {
    const q = lista.filter(im => im.quant), r = lista.filter(im => !im.quant);
    return `${media(lista)}
      ${q.length ? `<div class="cr-pairs">${q.map(im => fig(im, s, aum)).join('')}</div>` : ''}
      ${r.length ? `${q.length ? '<h3 class="cr-sub">Sem quantificação</h3>' : ''}<div class="cr-ones">${r.map(im => fig(im, s, aum)).join('')}</div>` : ''}`;
  };

  /* páginas das seções */
  let depois = slide;
  ['long', 'circ'].forEach(k => {
    const d = D[k]; if (!d) return;
    const s = SEC[k];
    const grupos = d.aumentos || [{ aumento: '', imagens: d.imagens || [] }];
    const nImg = grupos.reduce((a, g) => a + g.imagens.length, 0);
    const nQ = grupos.reduce((a, g) => a + g.imagens.filter(im => im.quant).length, 0);
    // Quantificação = aumentos com campos quantificados; MEV = os demais (sub-abas por aumento)
    const ehQuant = (g) => g.quantificacao || g.imagens.some(im => im.quant);
    const quantG = grupos.filter(ehQuant);
    const mevG = grupos.filter(g => !ehQuant(g));
    const abas = [
      quantG.length && { k: 'quant', nome: 'Quantificação', info: `${quantG.map(g => esc(g.aumento)).filter(Boolean).join(', ')}${quantG.some(g => g.aumento) ? ' · ' : ''}${nQ ? `${nQ} campos` : 'pendente'}` },
      mevG.length && { k: 'mev', nome: 'MEV', info: mevG.length > 1 ? mevG.map(g => esc(g.aumento)).join(' · ') : `${mevG[0].imagens.length} img` },
      { k: 'ebsd', nome: 'EBSD', info: '' },
    ].filter(Boolean);
    const sec = document.createElement('section');
    sec.className = 'slide inner';
    sec.dataset.id = s.id;
    sec.dataset.title = `Como Recebido · ${s.nome}`;
    sec.innerHTML = `
      <header class="slide-head">
        <img class="logo-sm" src="assets/logo-lpts-claro.png" alt="LPTS">
        <a class="back" href="#como-recebido" data-goto="como-recebido">← Como Recebido</a>
      </header>
      <div class="cond-top">
        <div>
          <p class="kicker">02 · Como Recebido</p>
          <h2>${s.nome}</h2>
        </div>
        <nav class="cond-tabs" aria-label="Seções">
          <a href="#cr-long" data-goto="cr-long" class="${k === 'long' ? 'on' : ''}">Longitudinal</a>
          <a href="#cr-circ" data-goto="cr-circ" class="${k === 'circ' ? 'on' : ''}">Circunferencial</a>
        </nav>
      </div>
      <p class="lede" style="margin-top:10px">${s.desc}</p>
      <div class="cr-aum cr-tabs" role="tablist" aria-label="Resultados">${abas.map((t, i) => `
        <button type="button" role="tab" class="chip${i === 0 ? ' on' : ''}" data-tab="${t.k}" aria-selected="${i === 0}">
          ${t.nome}${t.info ? ` <small>${t.info}</small>` : ''}
        </button>`).join('')}</div>
      ${mevG.length > 1 ? `<div class="cr-aum cr-sub-aum" role="tablist" aria-label="Aumento (MEV)" hidden>${mevG.map((g, i) => `
        <button type="button" role="tab" class="chip${i === 0 ? ' on' : ''}" data-aum="${i}" aria-selected="${i === 0}">
          ${esc(g.aumento)} <small>${g.imagens.length} img</small>
        </button>`).join('')}</div>` : ''}
      <div class="cr-scroll">
        ${quantG.length ? `<div class="cr-panel" data-tab="quant">${nQ ? '' : `<p class="cr-pend"><b>Quantificação de fases pendente.</b> Imagens a ${esc(quantG.map(g => g.aumento.replace('x', '')).join(', '))}× selecionadas para a quantificação SVRNA (ferrita × austenita).</p>`}${quantG.map(g =>
          `${quantG.length > 1 ? `<h3 class="cr-sub">${esc(g.aumento)}</h3>` : ''}${galeria(g.imagens, s, g.aumento)}`).join('')}</div>` : ''}
        ${mevG.map((g, i) => `<div class="cr-panel" data-tab="mev" data-aum="${i}" hidden>${galeria(g.imagens, s, g.aumento)}</div>`).join('')}
        <div class="cr-panel" data-tab="ebsd" hidden>
          <div class="ebsd-vazio">
            <p class="ebsd-tag">Em preparação</p>
            <p>Os resultados de EBSD da ${s.nome.toLowerCase()} ainda serão inseridos${d.mapas_ebsd ? ` (${d.mapas_ebsd} mapas disponíveis)` : ''}.</p>
          </div>
        </div>
      </div>
      <p class="cr-note">${nImg} de ${d.total_mev} imagens MEV da seção${nQ ? ` · ${nQ} quantificadas (SVRNA, ASTM E562 ±95%)` : ''} · clique para ampliar</p>`;
    // abas principais: Quantificação | MEV (sub-abas por aumento) | EBSD
    let mevAtual = '0';
    const mostrar = (tab) => {
      sec.querySelectorAll('.cr-tabs .chip').forEach(x => { const on = x.dataset.tab === tab; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
      const sub = sec.querySelector('.cr-sub-aum');
      if (sub) sub.hidden = tab !== 'mev';
      sec.querySelectorAll('.cr-panel').forEach(p => {
        p.hidden = p.dataset.tab !== tab || (tab === 'mev' && p.dataset.aum !== mevAtual);
      });
      sec.querySelector('.cr-scroll').scrollTop = 0;
    };
    sec.querySelectorAll('.cr-tabs .chip').forEach(b => b.addEventListener('click', () => mostrar(b.dataset.tab)));
    sec.querySelectorAll('.cr-sub-aum .chip').forEach(b => b.addEventListener('click', () => {
      mevAtual = b.dataset.aum;
      sec.querySelectorAll('.cr-sub-aum .chip').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
      mostrar('mev');
    }));
    mostrar(abas[0].k);
    depois.after(sec); depois = sec;
  });

  /* ampliar uma micrografia */
  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<div class="lb-one"></div><p class="lb-cap"></p>' +
    '<button class="lb-nav lb-prev" type="button" aria-label="Micrografia anterior">‹</button>' +
    '<button class="lb-nav lb-next" type="button" aria-label="Próxima micrografia">›</button>' +
    '<button class="lb-close" type="button" aria-label="Fechar">✕</button>';
  document.body.appendChild(lb);
  const fechar = () => lb.classList.remove('open');

  // navegação ← →: percorre as micrografias da aba aberta (uma por campo; o par original + quantificada conta uma vez)
  let lista = [], atual = 0;
  const camposDaAba = (b) => {
    const painel = b.closest('.cr-panel') || b.closest('.slide');
    return [...painel.querySelectorAll('.cr-pair, .cr-one')].map(f => f.querySelector('.cr-fig')).filter(Boolean);
  };
  const ir = (passo) => { if (lista.length > 1) mostrar(lista[(atual + passo + lista.length) % lista.length]); };
  lb.addEventListener('click', (e) => {
    if (e.target.closest('.lb-prev')) { ir(-1); return; }
    if (e.target.closest('.lb-next')) { ir(1); return; }
    if (!e.target.closest('img')) fechar();
  });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') fechar();
    else if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.cr-fig');
    if (!b) return;
    lista = camposDaAba(b);
    mostrar(b.closest('.cr-pair, .cr-one')?.querySelector('.cr-fig') || b);
  });
  function mostrar(b) {
    atual = Math.max(0, lista.indexOf(b));
    const q = b.dataset.quant;
    const box = lb.querySelector('.lb-one');
    box.className = q ? 'lb-one lb-pair' : 'lb-one';
    box.innerHTML = q
      ? `<figure><img src="${esc(b.dataset.src)}" alt="${esc(b.dataset.nome)}"><figcaption>Original</figcaption></figure>
         <figure><img src="${esc(q)}" alt="Quantificação ${esc(b.dataset.nome)}"><figcaption>Quantificada</figcaption></figure>`
      : `<img src="${esc(b.dataset.src)}" alt="${esc(b.dataset.nome)}">`;
    let f = null; try { f = JSON.parse(b.dataset.fases); } catch (_) {}
    const pos = lista.length > 1 ? ` <span class="lb-pos">${atual + 1} / ${lista.length} · ← → para navegar</span>` : '';
    lb.querySelector('.lb-cap').innerHTML = `<b>${esc(b.closest('.slide').dataset.title)}</b> · ${esc(b.dataset.aum ? b.dataset.aum + ' · ' : '')}${esc(b.dataset.nome)} ${f ? faseTxt(f) : ''}${pos}`;
    lb.querySelectorAll('.lb-nav').forEach(x => { x.hidden = lista.length < 2; });
    lb.classList.add('open');
  }
})();
