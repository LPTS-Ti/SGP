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
      ${d.aumentos ? `<div class="cr-aum" role="tablist" aria-label="Aumento">${grupos.map((g, i) => `
        <button type="button" role="tab" class="chip${i === 0 ? ' on' : ''}" data-aum="${i}" aria-selected="${i === 0}">
          ${esc(g.aumento)} <small>${g.imagens.length} img${g.imagens.filter(im => im.quant).length ? ` · ${g.imagens.filter(im => im.quant).length} quant.` : ''}</small>
        </button>`).join('')}</div>` : ''}
      <div class="cr-scroll">
        ${grupos.map((g, i) => `<div class="cr-panel" data-aum="${i}"${i ? ' hidden' : ''}>${galeria(g.imagens, s, g.aumento)}</div>`).join('')}
      </div>
      <p class="cr-note">${nImg} de ${d.total_mev} imagens MEV da seção${nQ ? ` · ${nQ} quantificadas (SVRNA, ASTM E562 ±95%)` : ''} · ${d.mapas_ebsd} mapas EBSD (.ctf, ainda não exibidos) · clique para ampliar</p>`;
    sec.querySelectorAll('.cr-aum .chip').forEach(b => b.addEventListener('click', () => {
      sec.querySelectorAll('.cr-aum .chip').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
      sec.querySelectorAll('.cr-panel').forEach(p => { p.hidden = p.dataset.aum !== b.dataset.aum; });
      sec.querySelector('.cr-scroll').scrollTop = 0;
    }));
    depois.after(sec); depois = sec;
  });

  /* ampliar uma micrografia */
  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<div class="lb-one"></div><p class="lb-cap"></p><button class="lb-close" type="button" aria-label="Fechar">✕</button>';
  document.body.appendChild(lb);
  const fechar = () => lb.classList.remove('open');
  lb.addEventListener('click', (e) => { if (!e.target.closest('img')) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('open')) fechar(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.cr-fig');
    if (!b) return;
    const q = b.dataset.quant;
    const box = lb.querySelector('.lb-one');
    box.className = q ? 'lb-one lb-pair' : 'lb-one';
    box.innerHTML = q
      ? `<figure><img src="${esc(b.dataset.src)}" alt="${esc(b.dataset.nome)}"><figcaption>Original</figcaption></figure>
         <figure><img src="${esc(q)}" alt="Quantificação ${esc(b.dataset.nome)}"><figcaption>Quantificada</figcaption></figure>`
      : `<img src="${esc(b.dataset.src)}" alt="${esc(b.dataset.nome)}">`;
    let f = null; try { f = JSON.parse(b.dataset.fases); } catch (_) {}
    lb.querySelector('.lb-cap').innerHTML = `<b>${esc(b.closest('.slide').dataset.title)}</b> · ${esc(b.dataset.aum ? b.dataset.aum + ' · ' : '')}${esc(b.dataset.nome)} ${f ? faseTxt(f) : ''}`;
    lb.classList.add('open');
  });
})();
