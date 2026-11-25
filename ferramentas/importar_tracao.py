"""Importa os ensaios de tração (MTS) para o site.

Lê  Ensaio de Tração/<CP>/   (uma pasta por corpo de prova, ex.: "TR16 - 4C")
      DAQ- Actuator, … - (Timed).txt, (Timed)1.txt, ...   dados brutos MTS
      <CP>.xlsx                                           relatório MTS (dimensões e resultados)
Grava Site/dados/tracao.js         (window.DADOS_TRACAO: dados dos CPs, editáveis na página)
      Site/dados/tracao-curvas.js  (window.CURVAS_TRACAO: curvas reduzidas para o gráfico)

Os arquivos originais são apenas lidos (nunca alterados).

Procedimento (documentado também em DADOS_TRACAO.metodo):
 1. Os arquivos .txt do mesmo CP são unidos e ordenados pelo tempo. Arquivos de outro
    "Test Run" (cabeçalho) não são misturados: o CP usa o Test Run do primeiro arquivo.
 2. Pausa: intervalo de tempo entre registros > 1 s (o atuador fica parado e a força relaxa).
 3. Extensômetro confiável: do início até o último registro ANTES da pausa. Depois dela o
    canal salta sem o atuador se mover e, em seguida, cai (retirada física), por isso não é usado.
 4. E: regressão linear σ × ε (extensômetro) entre 100 e 300 MPa; R² e sensibilidade
    (janelas 50–250 e 150–350 MPa) registrados.
 5. Rp0,2: interseção da curva com a reta de módulo E deslocada de 0,2 %.
 6. Rm = Fmax / S0 (a força máxima ocorre depois da retirada do extensômetro; Rm não depende da deformação).
 7. Deformação após a retirada: só é estimada na página quando o comprimento útil (Lc) é informado:
       ε = ε_ref + [(δ − δ_ref) − C·(F − F_ref)] / Lc
    com C (complacência) ajustado no trecho com extensômetro. Sem Lc, mostra-se força × deslocamento.
 8. Alongamento após fratura (A): valor do relatório (medição física, ISO 6892-1 anexo H),
    descartado quando fisicamente impossível (> 100 %).

Uso (na pasta "Dados obtidos"):
    python3 Site/ferramentas/importar_tracao.py
"""
import glob
import hashlib
import json
import os
import re
from datetime import datetime

import numpy as np
import openpyxl

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PASTA = os.path.join(RAIZ, 'Ensaio de Tração')
SAIDA = os.path.join(RAIZ, 'Site', 'dados', 'tracao.js')
SAIDA_CURVAS = os.path.join(RAIZ, 'Site', 'dados', 'tracao-curvas.js')
VERSAO_ALGORITMO = '1.0'

JANELA_E = (100.0, 300.0)            # MPa
JANELAS_SENS = [(50.0, 250.0), (150.0, 350.0)]
GAP_PAUSA = 1.0                      # s
PONTOS_EXT = 320                     # pontos guardados no trecho com extensômetro
PONTOS_POS = 380                     # pontos guardados depois da referência
LC_PADRAO = 25.0                     # mm: comprimento útil (Lc) de todos os CPs


def sha256(caminho):
    h = hashlib.sha256()
    with open(caminho, 'rb') as f:
        for bloco in iter(lambda: f.read(1 << 20), b''):
            h.update(bloco)
    return h.hexdigest()


def ler_mts(caminho):
    """Lê um .txt da MTS: cabeçalho (chave: valor), nomes, unidades e 4 colunas numéricas."""
    with open(caminho, 'rb') as f:
        bruto = f.read()
    for cod in ('utf-8-sig', 'utf-16', 'latin-1'):
        try:
            txt = bruto.decode(cod)
            break
        except UnicodeDecodeError:
            continue
    cab, nomes, unid, linhas, invalidas = {}, None, None, [], 0
    for ln in txt.splitlines():
        s = ln.strip()
        if not s:
            continue
        partes = [p.strip() for p in re.split(r'\t|;', ln) if p.strip()]
        try:
            vals = [float(p.replace(',', '.')) for p in partes]
            if nomes and len(vals) == len(nomes):
                linhas.append(vals)
            else:
                invalidas += 1
            continue
        except ValueError:
            pass
        if nomes is None and ':' in s and len(partes) <= 2:
            k, v = s.split(':', 1)
            cab[k.strip()] = v.strip()
        elif nomes is None:
            nomes = partes
        elif unid is None:
            unid = partes
        else:
            invalidas += 1
    return {'cab': cab, 'nomes': nomes, 'unid': unid, 'dados': np.array(linhas), 'invalidas': invalidas}


def ler_relatorio(caminho):
    ws = openpyxl.load_workbook(caminho, data_only=True).worksheets[0]
    r = {}
    for row in ws.iter_rows(values_only=True):
        v = [x for x in row if x is not None]
        if len(v) >= 2 and isinstance(v[0], str):
            r[v[0].strip()] = v[1]
    return r


def num(v):
    return float(v) if isinstance(v, (int, float)) else None


def ajuste_E(s, e, lo, hi):
    m = (s >= lo) & (s <= hi)
    if m.sum() < 10:
        return None
    p = np.polyfit(e[m], s[m], 1)
    pred = np.polyval(p, e[m])
    r2 = 1 - ((s[m] - pred) ** 2).sum() / ((s[m] - s[m].mean()) ** 2).sum()
    return {'E': p[0], 'b': p[1], 'r2': r2, 'n': int(m.sum()),
            'e_ini': float(e[m].min()), 'e_fim': float(e[m].max())}


def rp02(s, e, aj):
    """Primeira interseção da curva com a reta deslocada 0,2 % (interpolação linear)."""
    d = s - (aj['E'] * (e - 0.002) + aj['b'])
    i0 = int(np.argmax(s > JANELA_E[1]))
    for i in range(max(i0, 1), len(d)):
        if d[i - 1] > 0 and d[i] <= 0:
            f = d[i - 1] / (d[i - 1] - d[i])
            return {'i': i, 'e': float(e[i - 1] + f * (e[i] - e[i - 1])), 's': float(s[i - 1] + f * (s[i] - s[i - 1]))}
    return None


def reduzir(idx, n):
    if len(idx) <= n:
        return list(idx)
    return list(np.unique(np.linspace(idx[0], idx[-1], n).round().astype(int)))


def processar(pasta, nome=None, relatorio=None):
    """nome: identificação do CP (ex.: "TR04 - 0C"); relatorio: .xlsx casado com os dados.
    Sem esses argumentos, usa o nome da pasta e o .xlsx que estiver nela (comportamento antigo)."""
    nome_pasta = nome or os.path.basename(pasta)
    txts = sorted(glob.glob(os.path.join(pasta, '*.txt')))
    xlsx = [relatorio] if relatorio else sorted(glob.glob(os.path.join(pasta, '*.xlsx')))
    if not txts:
        return None, None, [f'{nome_pasta}: nenhum .txt da MTS.']
    avisos = []
    lidos = [(f, ler_mts(f)) for f in txts]
    run0 = lidos[0][1]['cab'].get('Test Run')
    usados = []
    for f, L in lidos:
        if L['cab'].get('Test Run') != run0:
            avisos.append(f'{nome_pasta}: {os.path.basename(f)} é do {L["cab"].get("Test Run")} (≠ {run0}); ignorado.')
            continue
        if L['nomes'][:4] != ['Actuator', 'Load', 'Time', 'Extensometer'] or L['unid'][:4] != ['mm', 'kN', 'sec', 'mm/mm']:
            avisos.append(f'{nome_pasta}: colunas/unidades inesperadas em {os.path.basename(f)}: {L["nomes"]} {L["unid"]}')
        if L['invalidas']:
            avisos.append(f'{nome_pasta}: {L["invalidas"]} linha(s) inválida(s) em {os.path.basename(f)}.')
        usados.append((f, L))
    D = np.vstack([L['dados'] for _, L in usados])
    D = D[np.argsort(D[:, 2], kind='stable')]
    dup = int((np.diff(D[:, 2]) == 0).sum())
    if dup:
        avisos.append(f'{nome_pasta}: {dup} registro(s) com tempo repetido (mantidos).')
    d, F, t, e = D[:, 0], D[:, 1], D[:, 2], D[:, 3]

    rel = ler_relatorio(xlsx[0]) if xlsx else {}
    larg, esp = num(rel.get('Largura')), num(rel.get('Espessura'))
    area = num(rel.get('Área')) or (larg * esp if larg and esp else None)
    if not area:
        avisos.append(f'{nome_pasta}: sem dimensões no relatório; tensões indisponíveis.')

    # pausa e trecho confiável do extensômetro
    dt = np.diff(t)
    gaps = np.where(dt > GAP_PAUSA)[0]
    i_ref = int(gaps[0]) if len(gaps) else int(np.argmax(e))
    pausas = [{'t0': float(t[g]), 't1': float(t[g + 1]), 'dur': float(dt[g]),
               'dF': float(F[g + 1] - F[g]), 'dd': float(d[g + 1] - d[g]), 'de': float(e[g + 1] - e[g])} for g in gaps]
    queda = np.where(np.diff(e[i_ref:]) < -0.002)[0]
    i_ret = int(i_ref + queda[0] + 1) if len(queda) else None

    props = {}
    if area:
        s = F * 1000 / area
        ok = np.arange(len(s)) <= i_ref
        aj = ajuste_E(s[ok], e[ok], *JANELA_E)
        rp = rp02(s[ok], e[ok], aj) if aj else None
        sens = []
        for lo, hi in JANELAS_SENS:
            a2 = ajuste_E(s[ok], e[ok], lo, hi)
            r2 = rp02(s[ok], e[ok], a2) if a2 else None
            sens.append({'janela': [lo, hi], 'E_GPa': round(a2['E'] / 1000, 1) if a2 else None,
                         'Rp02': round(r2['s'], 1) if r2 else None})
        imax = int(np.argmax(F))
        props = {
            'S0': area,
            'E_GPa': round(aj['E'] / 1000, 2) if aj else None,
            'E_r2': round(aj['r2'], 5) if aj else None,
            'E_janela_MPa': list(JANELA_E),
            'E_faixa_def': [round(aj['e_ini'] * 100, 4), round(aj['e_fim'] * 100, 4)] if aj else None,
            'E_b': aj['b'] if aj else None,
            'Rp02': round(rp['s'], 1) if rp else None,
            'Rp02_def': round(rp['e'] * 100, 4) if rp else None,
            'Fp02_kN': round(rp['s'] * area / 1000, 4) if rp else None,
            'Fmax_kN': round(float(F[imax]), 4),
            'Rm': round(float(F[imax]) * 1000 / area, 1),
            'd_Fmax_mm': round(float(d[imax]), 4),
            'sensibilidade': sens,
        }
        if rp is None:
            avisos.append(f'{nome_pasta}: Rp0,2 não encontrado no trecho com extensômetro.')

    A_rel = num(rel.get('Alongamento após Fratura'))
    A = A_rel if A_rel is not None and 0 < A_rel <= 100 else None
    obs = []
    if A_rel is not None and A is None:
        obs.append(f'Alongamento do relatório MTS ({A_rel:.2f} %) é fisicamente impossível; aguardando valor medido.')
    if A_rel is None:
        obs.append('Alongamento após fratura não informado no relatório.')

    cp = nome_pasta.split(' - ')[0].replace(' ', '')
    num_rel = str(rel.get('Número do Ensaio', ''))
    m_rel = re.search(r'-\s*([0O\d])\s*([LC])\s*$', num_rel)
    alvo = dirc = None
    m_pasta = re.search(r'-\s*([0O\d])([LC1])\s*$', nome_pasta)
    if m_rel:
        alvo, dirc = int(m_rel.group(1).replace('O', '0')), m_rel.group(2).upper()
    elif m_pasta:
        alvo = int(m_pasta.group(1).replace('O', '0'))
        dirc = m_pasta.group(2).upper()
    if m_pasta and m_rel and (m_pasta.group(1) + m_pasta.group(2)).upper().replace('O', '0') != f'{alvo}{dirc}':
        obs.append(f'Pasta "{nome_pasta}" e relatório ("{num_rel.strip()}") divergem no código; usado o do relatório.')

    reg = {
        'cp': cp, 'alvo': alvo, 'dir': dirc, 'pasta': nome_pasta,
        'test_run': run0, 'data': usados[0][1]['cab'].get('Date'),
        'ensaio': usados[0][1]['cab'].get('Test'),
        'largura': larg, 'espessura': esp, 'area': area,
        'Lc': LC_PADRAO,                 # comprimento útil (mm)
        'A': A,                          # alongamento após fratura medido (%)
        'obs': ' '.join(obs),
        'calc': props,
        'mts': {'E_GPa': round(num(rel.get('Módulo de Elasticidade')) / 1000, 2) if num(rel.get('Módulo de Elasticidade')) else None,
                'Rp02': num(rel.get('Tensão Esc. Conv. (0,2%)')), 'Rm': num(rel.get('Resistência à Tração')),
                'Fmax_kN': num(rel.get('Força Máxima')), 'A': A_rel},
        'ref': {'i': i_ref, 't': float(t[i_ref]), 'd': float(d[i_ref]), 'F': float(F[i_ref]), 'e': float(e[i_ref])},
        'pausas': pausas,
        'retirada_t': float(t[i_ret]) if i_ret is not None else None,
        'arquivos': [{'nome': os.path.basename(f), 'sha256': sha256(f), 'registros': int(len(L['dados'])),
                      't': [float(L['dados'][0, 2]), float(L['dados'][-1, 2])]} for f, L in usados] +
                    ([{'nome': os.path.basename(xlsx[0]), 'sha256': sha256(xlsx[0])}] if xlsx else []),
        'registros': int(len(t)),
    }

    # curva reduzida: denso no trecho com extensômetro, mais esparso depois; preserva Fmax, ref e bordas das pausas
    i_ext = np.arange(0, i_ref + 1)
    i_pos = np.arange(i_ref + 1, len(t))
    keep = set(reduzir(i_ext, PONTOS_EXT)) | set(reduzir(i_pos, PONTOS_POS)) if len(i_pos) else set(reduzir(i_ext, PONTOS_EXT))
    keep |= {0, i_ref, int(np.argmax(F)), len(t) - 1}
    for g in gaps:
        keep |= {int(g), int(g) + 1}
    if props.get('Rp02') is not None:
        # densifica ao redor do Rp0,2 para o gráfico da região elástica
        keep |= set(range(0, i_ref + 1, max(1, (i_ref + 1) // 500)))
    ii = sorted(keep)
    curva = {'d': [round(float(x), 4) for x in d[ii]], 'F': [round(float(x), 4) for x in F[ii]],
             't': [round(float(x), 2) for x in t[ii]], 'e': [round(float(x) * 100, 4) for x in e[ii]],
             'n_ext': int(sum(1 for i in ii if i <= i_ref))}
    return reg, curva, avisos


TOL_FMAX = 5e-4    # kN: tolerância para casar dados brutos e relatório pela força máxima


def casar_ensaios(pastas, avisos):
    """Casa cada ensaio (conjunto de .txt) com o seu relatório (.xlsx) pela força máxima.

    Os nomes das pastas não são confiáveis (há cópias com grafias diferentes e relatórios
    guardados na pasta de outro ensaio). Por isso:
      - pastas com os mesmos .txt (mesmo SHA-256) são um único ensaio;
      - o relatório é o .xlsx (de qualquer pasta) cuja "Força Máxima" coincide com a dos dados;
        havendo mais de um, vale o modificado por último;
      - a identificação do CP (número, % σ, direção) vem do nome do relatório escolhido.
    """
    ensaios = {}
    for p in pastas:
        txts = sorted(glob.glob(os.path.join(p, '*.txt')))
        if not txts:
            avisos.append(f'{os.path.basename(p)}: nenhum .txt da MTS; ignorada.')
            continue
        chave = tuple(sorted(sha256(f) for f in txts))
        if chave in ensaios:
            ensaios[chave]['copias'].append(os.path.basename(p))
            continue
        L = [ler_mts(f) for f in txts]
        run = L[0]['cab'].get('Test Run', '').split(' ')
        ensaios[chave] = {'pasta': p, 'copias': [], 'run': ' '.join(run[:3]),
                          'Fmax': float(max(x['dados'][:, 1].max() for x in L))}
    relatorios = []
    for x in glob.glob(os.path.join(PASTA, '*', '*.xlsx')):
        if os.path.basename(x).startswith('~$'):
            continue
        relatorios.append((x, num(ler_relatorio(x).get('Força Máxima')), os.path.getmtime(x)))

    casados = []
    for ens in sorted(ensaios.values(), key=lambda e: e['pasta']):
        cands = sorted((r for r in relatorios if r[1] is not None and abs(r[1] - ens['Fmax']) < TOL_FMAX),
                       key=lambda r: r[2], reverse=True)
        onde = os.path.basename(ens['pasta']) + (f' (= {", ".join(ens["copias"])})' if ens['copias'] else '')
        if not cands:
            avisos.append(f'{ens["run"]} na pasta "{onde}" (Fmax {ens["Fmax"]:.4f} kN): nenhum relatório .xlsx '
                          f'com essa força máxima; ensaio NÃO importado.')
            continue
        rel = cands[0][0]
        m = re.search(r'TR\s*(\d+)\s*-?\s*([0O\d])\s*([LC])', os.path.basename(rel), re.I)
        if not m:
            avisos.append(f'{ens["run"]}: não identifiquei o CP pelo nome do relatório "{os.path.basename(rel)}"; ignorado.')
            continue
        nome = f'TR{int(m.group(1)):02d} - {m.group(2).replace("O", "0")}{m.group(3).upper()}'
        if len(cands) > 1:
            avisos.append(f'{nome}: {len(cands)} relatórios para o mesmo ensaio; usado o mais recente '
                          f'({os.path.relpath(rel, PASTA)}).')
        if os.path.dirname(rel) != ens['pasta']:
            avisos.append(f'{nome}: dados em "{onde}", relatório em "{os.path.relpath(rel, PASTA)}".')
        casados.append((ens, nome, rel))
    vistos = {}
    for ens, nome, rel in casados:
        cp = nome.split(' - ')[0]
        if cp in vistos:
            avisos.append(f'{cp}: dois ensaios diferentes com o mesmo CP ({vistos[cp]} e {ens["run"]}).')
        vistos[cp] = ens['run']
    return sorted(casados, key=lambda c: c[1])


def main():
    pastas = sorted(p for p in glob.glob(os.path.join(PASTA, '*')) if os.path.isdir(p))
    cps, curvas, avisos = [], {}, []
    for ens, nome, rel in casar_ensaios(pastas, avisos):
        reg, curva, av = processar(ens['pasta'], nome, rel)
        avisos += av
        if not reg:
            continue
        reg['pasta'] = os.path.basename(ens['pasta'])
        reg['relatorio'] = os.path.relpath(rel, PASTA)
        reg['id'] = len(cps) + 1
        cps.append(reg)
        curvas[reg['cp']] = curva
        c = reg['calc']
        print(f"{reg['cp']:5s} {reg['alvo']}{reg['dir']}  E={c.get('E_GPa')} GPa (R²={c.get('E_r2')})  "
              f"Rp0,2={c.get('Rp02')}  Rm={c.get('Rm')}  A={reg['A']}  | MTS Rp0,2={reg['mts']['Rp02']:.1f} E={reg['mts']['E_GPa']}")
    dados = {
        'gerado': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'versao_algoritmo': VERSAO_ALGORITMO,
        'metodo': {
            'E': f'Regressão linear σ × ε do extensômetro entre {JANELA_E[0]:.0f} e {JANELA_E[1]:.0f} MPa.',
            'Rp02': 'Interseção com a reta de módulo E deslocada de 0,2 %.',
            'Rm': 'Força máxima / área inicial S0.',
            'extensometro': 'Confiável até o último registro antes da pausa (> 1 s sem registros).',
            'pos_retirada': 'ε = ε_ref + [(δ − δ_ref) − C·(F − F_ref)] / Lc, estimada pelo atuador; requer Lc.',
            'A': 'Alongamento após fratura medido no CP (ISO 6892-1, anexo H), informado no relatório.',
        },
        'cps': cps,
    }
    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write('// Ensaios de tração · dados dos CPs e propriedades calculadas.\n')
        f.write('// Gerado por Site/ferramentas/importar_tracao.py. Campos editáveis na página: largura, espessura, Lc, A, obs.\n')
        f.write('window.DADOS_TRACAO = ' + json.dumps(dados, ensure_ascii=False, indent=1) + ';\n')
    with open(SAIDA_CURVAS, 'w', encoding='utf-8') as f:
        f.write('// Curvas reduzidas dos ensaios de tração (d: atuador mm, F: kN, t: s, e: extensômetro %).\n')
        f.write('// Gerado por Site/ferramentas/importar_tracao.py. n_ext = pontos no trecho com extensômetro confiável.\n')
        f.write('window.CURVAS_TRACAO = ' + json.dumps(curvas, separators=(',', ':')) + ';\n')
    print(f'\n{len(cps)} CPs → {os.path.relpath(SAIDA, RAIZ)}, {os.path.relpath(SAIDA_CURVAS, RAIZ)}')
    for a in avisos:
        print('AVISO:', a)


if __name__ == '__main__':
    main()
