"""Importa os ensaios de CTOD (ISO 12135:2016, SE(B)) para o site.

Lê  CTOD/<CP>/            uma pasta por corpo de prova, ex.: "CT16 4CL" (CP, % σ alvo, orientação)
      <CP>.xlsm           planilha de cálculo ISO 12135 (resultado, critérios, medições, registro corrigido)
      *.png               imagens do estereomicroscópio (fratura, medidas, pré-trinca, entalhe)
      Data Acquisition 1 - (Timed).txt (também em subpasta)   registro bruto da MTS (só rastreabilidade)
Grava Site/dados/ctod.js          (window.DADOS_CTOD: dados, resultados e critérios por CP)
      Site/dados/ctod-curvas.js   (window.CURVAS_CTOD: registro completo F, V, deslocamento, tempo)
      Site/assets/ctod/<CP>/      imagens reduzidas (JPEG, mantendo proporção, escala e faixa de metadados)

Princípios:
  - O resultado de CTOD NÃO é recalculado: vem da planilha (aba Resumo / Cálculos), junto com a situação
    de qualificação e os critérios da aba "Verificação da norma". Valor calculado ≠ resultado qualificado.
  - O registro F × V usado é o da aba "Dados do ensaio" (colunas corrigidas: sinal da força invertido e
    zero no 1º ponto), o mesmo usado no cálculo. Todos os pontos são mantidos (sem suavização nem redução).
    O deslocamento do atuador recebe a mesma correção (sinal invertido, zero no 1º ponto).
  - Cada número guarda a origem (aba e rótulo da planilha).
  - Inconsistências entre pasta, planilha, arquivos da MTS e imagens são listadas em "avisos".

Uso (na pasta "Dados obtidos"):
    python3 Site/ferramentas/importar_ctod.py
"""
import glob
import hashlib
import json
import os
import re
from datetime import datetime

import openpyxl
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PASTA = os.path.join(RAIZ, 'CTOD')
SITE = os.path.join(RAIZ, 'Site')
SAIDA = os.path.join(SITE, 'dados', 'ctod.js')
SAIDA_CURVAS = os.path.join(SITE, 'dados', 'ctod-curvas.js')
ASSETS = os.path.join(SITE, 'assets', 'ctod')
LARGURA = 1800          # largura máxima das imagens no site (px)

# Subpastas de CTOD/ que não são corpos de prova do projeto (ensaios de teste/calibração)
PASTAS_IGNORADAS = {'testes'}

# Imagens que não entram na galeria do site por repetirem informação de outra imagem do mesmo CP
# (os arquivos originais continuam na pasta CTOD).
#   CT16: as duas superfícies de fratura sem medidas — a mesma vista aparece na imagem com as nove medidas de a_j
#   CT22: a superfície de fratura sem medidas (e a cópia idêntica "fratura 2") e a vista lateral sem cotas
#         — repetidas pela imagem com as nove medidas e pela vista lateral com as medidas do entalhe ("Image.png")
EXCLUIR_IMAGENS = {
    'CT16': ('fratura 1.png', 'fratura 2.png'),
    'CT22': ('fratura 1.png', 'fratura 2.png', 'medida da trinca.png'),
}

ORIENT = {'CL': 'C-L', 'LC': 'L-C', 'LT': 'L-T', 'TL': 'T-L', 'C': 'C', 'L': 'L'}


def num(v):
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def txt(v):
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.strftime('%Y-%m-%d')
    s = str(v).strip()
    return s or None


def linhas(ws):
    return [list(r) for r in ws.iter_rows(values_only=True)]


def por_rotulo(rows, col_valor, col_rot=0):
    """{rótulo da coluna A: linha inteira} — primeira ocorrência de cada rótulo."""
    d = {}
    for r in rows:
        if len(r) > col_rot and isinstance(r[col_rot], str) and r[col_rot].strip():
            d.setdefault(r[col_rot].strip(), r)
    return d


def pega(d, inicio, col, conv=num):
    """Valor da linha cujo rótulo começa com `inicio`."""
    for k, r in d.items():
        if k.startswith(inicio):
            return conv(r[col]) if len(r) > col else None
    return None


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def cabecalho_mts(p):
    cab = {}
    with open(p, encoding='utf-8-sig', errors='ignore') as f:
        for _ in range(8):
            ln = f.readline()
            if ':' in ln:
                k, v = ln.split(':', 1)
                cab[k.strip()] = v.strip()
    return cab


def tipo_imagem(nome):
    n = nome.lower()
    if 'medida' in n and 'fratura' in n:
        return 'medicao', 'Superfície de fratura com as nove medidas de a_j'
    if 'fratura' in n:
        return 'fratura', 'Superfície de fratura'
    if 'pre-trinca' in n or 'pré-trinca' in n:
        lado = re.search(r'\b(L\d)\b', nome)
        return 'pretrinca', 'Pré-trinca por fadiga' + (f' — face {lado.group(1)}' if lado else '')
    if 'entalhe' in n or 'medida da trinca' in n or n.startswith('image'):
        return 'entalhe', 'Vista lateral do entalhe e da trinca'
    return 'outra', 'Imagem'


def processar(pasta, versao, avisos):
    nome = os.path.basename(pasta).strip()                        # "CT16 4CL"
    m = re.match(r'(CT\s*\d+)\s*(\d+)\s*([A-Z]+)$', nome, re.I)
    if not m:
        avisos.append(f'Pasta "{nome}": nome fora do padrão "CTnn <σ%><orientação>"; ignorada.')
        return None, None
    cp, alvo, ori = m.group(1).replace(' ', '').upper(), int(m.group(2)), m.group(3).upper()
    xl = [x for x in glob.glob(os.path.join(pasta, '*.xls*')) if not os.path.basename(x).startswith('~$')]
    if not xl:
        avisos.append(f'{nome}: planilha .xlsm não encontrada.')
        return None, None
    wb = openpyxl.load_workbook(xl[0], data_only=True, read_only=True)
    W = {ws.title: linhas(ws) for ws in wb.worksheets if ws.title != 'Dados do ensaio'}
    ref = lambda aba, rot: {'aba': aba, 'rotulo': rot}

    # --- cadastro, geometria, propriedades (coluna C = valor de entrada) ---
    cad = por_rotulo(W['Cadastro do ensaio'], 2)
    geo = por_rotulo(W['Geometria e propriedades'], 2)
    calc = por_rotulo(W['Cálculos'], 2)
    res = por_rotulo(W['Resumo'], 1)
    pts = por_rotulo(W['Pontos do registro'], 4)

    ensaio = {
        'id_planilha': pega(res, 'Corpo de prova', 1, txt),
        'orient_planilha': pega(res, 'Orientação', 1, txt),
        'material': pega(res, 'Material', 1, txt),
        'produto': pega(cad, 'Forma do produto', 2, txt),
        'data': pega(res, 'Data', 1, txt),
        'operador': pega(res, 'Operador', 1, txt),
        'temp': pega(res, 'Temperatura de ensaio', 1),
        'temp_pre': pega(cad, 'Temperatura de pré-trincamento', 2),
        'dT': pega(cad, 'Desvio máximo da temperatura', 2),
        'meio': pega(cad, 'Meio de condicionamento', 2, txt),
        'encharque': pega(cad, 'Tempo de encharque', 2),
        'controle': pega(cad, 'Tipo de controle', 2, txt),
        'geometria': pega(res, 'Geometria', 1, txt),
        'parametro': pega(res, 'Parâmetro', 1, txt),
        'faces': pega(res, 'Faces', 1, txt),
        'cabecalho_planilha': pega(cad, 'Ensaio (cabeçalho', 2, txt),
    }
    aj = []
    for r in W['Medições da trinca']:
        if isinstance(r[0], (int, float)) and 1 <= r[0] <= 9 and num(r[1]) is not None and len(aj) < 9:
            aj.append(num(r[1]))
    geom = {
        'B': pega(res, 'B', 1), 'BN': pega(res, 'BN', 1), 'W': pega(res, 'W', 1), 'S': pega(res, 'S (SE(B))', 1),
        'z': pega(geo, 'Espessura do gume', 2), 'am': pega(geo, 'Comprimento do entalhe usinado', 2),
        'a_o': pega(res, 'a_o (nove medidas)', 1), 'a_oW': pega(res, 'a_o/W', 1),
        'b_o': pega(calc, 'Ligamento inicial', 2), 'pretrinca': pega(calc, 'Comprimento da pré-trinca', 2),
        'a_j': aj, 'max_dev': pega(calc, 'Máx. desvio das 7 medidas', 2), 'lim_dev': pega(calc, 'Limite 0,10·a_o', 2),
        'min_ext': pega(calc, 'Menor extensão local da pré-trinca', 2),
    }
    props = {'Rp02': pega(geo, 'Limite de escoamento 0,2 %', 2), 'Rm': pega(geo, 'Resistência à tração', 2),
             'E': pega(geo, 'Módulo de elasticidade', 2), 'nu': pega(geo, 'Coeficiente de Poisson', 2),
             'Rp02_pre': pega(geo, 'Limite de escoamento 0,2 % (pré', 2)}

    # --- leitura do registro (coluna E = valor adotado) e candidatos a pop-in ---
    reg = {
        'n': pega(pts, 'Número de pontos', 2), 'Fmax': pega(pts, 'Força máxima', 4),
        'nFmax': pega(pts, 'Índice do 1º atingimento de Fmax', 2),
        'i1': pega(pts, 'Índice inicial da janela elástica', 4), 'i2': pega(pts, 'Índice final da janela elástica', 4),
        'kV': pega(pts, 'Inclinação elástica F–V', 4), 'R2': pega(pts, 'R² da reta F–V', 2),
        'V0': pega(pts, 'Interseção da reta F–V', 2), 'ks': pega(pts, 'Inclinação da secante', 2),
        'nd': pega(pts, 'Índice da interseção', 2), 'Fd': pega(pts, 'Força na interseção', 2),
        'FQ': pega(pts, 'Força provisória', 4),
        'ponto_modo': pega(pts, 'Como escolher o ponto', 2, txt), 'ponto_tipo': pega(pts, 'Tipo do ponto', 2, txt),
        'janela': [pega(pts, 'Início da janela da reta', 2), pega(pts, 'Fim da janela da reta', 2)],
        'popin_min': pega(pts, 'Queda relativa mínima', 2),
        'popins': [],
    }
    em_popin = False
    for r in W['Pontos do registro']:
        if isinstance(r[0], str) and r[0].startswith('Candidato'):
            em_popin = True
            continue
        if em_popin:
            if isinstance(r[0], str) and r[0].startswith('Total'):
                break
            if isinstance(r[0], (int, float)) and num(r[1]) is not None:
                reg['popins'].append({'n': int(r[1]), 'F_antes': num(r[2]), 'F_depois': num(r[3]),
                                      'queda_pct': num(r[4]), 'V': num(r[5]), 'quando': txt(r[6])})
    reg['n_ponto'] = pega(calc, 'Índice do ponto no registro', 2)

    calculo = {
        'KF': pega(calc, 'Fator K/F', 2), 'KQ': pega(calc, 'Fator de intensidade de tensões provisório', 2),
        'FmaxFQ': pega(calc, 'Razão Fmax/FQ', 2), 'K': pega(calc, 'K no ponto', 2),
        'Ve': pega(calc, 'Abertura elástica analítica', 2), 'Vp': pega(calc, 'Componente plástica da abertura', 2),
        'd_el': pega(calc, 'Parcela elástica', 2), 'rp': pega(calc, 'Fator de rotação plástica', 2),
        'd_pl': pega(calc, 'Parcela plástica', 2), 'delta': pega(calc, 'CTOD não corrigido', 2),
        'lim_classe': pega(calc, 'Limite de classificação 0,2 + δ', 2), 'classe': pega(calc, 'Classe do valor', 2, txt),
        'simbolo': pega(calc, 'Símbolo do resultado', 2, txt), 'FL': pega(calc, 'Força limite FL', 2),
        'Ff1': pega(calc, 'Ff máximo — critério de escoamento', 2), 'Ff2': pega(calc, 'Ff máximo — critério Kf/E', 2),
    }
    # resultado principal (aba Resumo, linha "δ pontual")
    resultado = None
    for r in W['Resumo']:
        if isinstance(r[0], str) and r[0].strip() == 'δ pontual':
            resultado = {'simbolo': txt(r[1]), 'valor': num(r[2]), 'unidade': txt(r[3]),
                         'origem': ref('Resumo', 'δ pontual')}
    if resultado and calculo['delta'] is not None and abs(resultado['valor'] - calculo['delta']) > 1e-9:
        avisos.append(f'{nome}: δ do Resumo ({resultado["valor"]}) ≠ δo da aba Cálculos ({calculo["delta"]}).')

    # critérios aplicáveis e pendências
    crit, pend, qualif = [], [], {}
    for r in W['Verificação da norma']:
        if isinstance(r[0], str) and re.match(r'^[A-Z]{1,2}\d{2}$', r[0].strip()) and txt(r[4]) == 'Sim':
            crit.append({'id': r[0].strip(), 'criterio': txt(r[1]), 'ref': txt(r[2]), 'grupo': txt(r[3]),
                         'obrig': txt(r[5]), 'valor': r[6] if isinstance(r[6], (int, float)) else txt(r[6]),
                         'limite': txt(r[7]), 'situacao': txt(r[8])})
        if isinstance(r[0], str) and r[0].startswith('δ pontual'):
            v = [x for x in r[1:] if x not in (None, '')]          # grupos | não atende | não avaliado | situação
            if len(v) >= 4:
                qualif = {'grupos': txt(v[0]), 'nao_atende': num(v[1]), 'nao_avaliado': num(v[2]), 'situacao': txt(v[3])}
    em_p = False
    for r in W['Resumo']:
        if isinstance(r[0], str) and r[0].startswith('4. Pendências'):
            em_p = True
            continue
        if em_p and isinstance(r[1], str) and re.match(r'^[A-Z]{1,2}\d{2}$', r[1].strip()):
            pend.append({'id': txt(r[1]), 'criterio': txt(r[2]), 'situacao': txt(r[3])})

    # --- registro corrigido da planilha (todos os pontos) ---
    ws = wb['Dados do ensaio']
    t, F, V, d = [], [], [], []
    d0 = None
    for r in ws.iter_rows(min_row=6, values_only=True):
        if not isinstance(r[0], (int, float)) or num(r[7]) is None:
            continue
        if d0 is None:
            d0 = num(r[4]) or 0.0
        t.append(round(num(r[1]), 3)); F.append(round(num(r[7]), 5)); V.append(round(num(r[8]), 6))
        d.append(round(-((num(r[4]) or 0.0) - d0), 6))
    if reg['n'] and len(F) != int(reg['n']):
        avisos.append(f'{nome}: {len(F)} pontos lidos na aba "Dados do ensaio", mas a planilha indica {int(reg["n"])}.')
    t0 = t[0] if t else 0
    curvas = {'t': [round(x - t0, 3) for x in t], 'F': F, 'V': V, 'd': d}

    # --- arquivos da MTS (rastreabilidade) ---
    mts = []
    for p in sorted(glob.glob(os.path.join(pasta, '**', '*.txt'), recursive=True)):
        c = cabecalho_mts(p)
        mts.append({'arquivo': os.path.relpath(p, PASTA), 'test': c.get('Test'), 'run': c.get('Test Run'),
                    'data': c.get('Date'), 'sha256': sha(p)})
    runs = {x['run'] for x in mts if x['run']}
    if runs and not any(cp in r.replace(' ', '').upper() for r in runs):
        avisos.append(f'{nome}: os arquivos da MTS identificam o ensaio como {", ".join(sorted(runs))} '
                      f'(nome gravado pela máquina); o CP é tratado como {nome}.')
    if ensaio['id_planilha'] and not ensaio['id_planilha'].replace(' ', '').upper().endswith(f'{alvo}{ori}'):
        avisos.append(f'{nome}: a planilha identifica o CP como "{ensaio["id_planilha"]}" (aba Resumo), '
                      f'que não corresponde a {alvo}% {ORIENT.get(ori, ori)}.')
    datas_mts = sorted({datetime.strptime(x['data'].split()[0], '%m/%d/%Y').strftime('%Y-%m-%d')
                        for x in mts if x['data'] and re.match(r'\d+/\d+/\d{4}', x['data'])})
    ensaio['datas_mts'] = datas_mts
    if ensaio['data'] and datas_mts and ensaio['data'] not in datas_mts:
        avisos.append(f'{nome}: data do ensaio na planilha = {ensaio["data"]}; data gravada nos arquivos da MTS = '
                      f'{", ".join(datas_mts)}.')
    if ensaio['orient_planilha'] and ORIENT.get(ori) and ensaio['orient_planilha'] != ORIENT.get(ori):
        avisos.append(f'{nome}: orientação na planilha = {ensaio["orient_planilha"]}; pelo nome da pasta = '
                      f'{ORIENT.get(ori)}.')

    # --- imagens ---
    dest = os.path.join(ASSETS, cp)
    os.makedirs(dest, exist_ok=True)
    for f in glob.glob(os.path.join(dest, '*')):
        os.remove(f)
    imagens, vistos = [], {}
    for p in sorted(glob.glob(os.path.join(pasta, '*.png')) + glob.glob(os.path.join(pasta, '*.jpg'))):
        h = sha(p)
        arq = os.path.basename(p)
        if arq in EXCLUIR_IMAGENS.get(cp, ()):
            continue
        if h in vistos:
            avisos.append(f'{nome}: "{arq}" é idêntica a "{vistos[h]}" (mesmo arquivo); mostrada uma vez.')
            continue
        vistos[h] = arq
        base = re.sub(r'^\s*' + re.escape(nome) + r'\s*', '', arq, flags=re.I)
        tipo, titulo = tipo_imagem(base)
        nimg = re.search(r'\b(\d)\b', os.path.splitext(base)[0])
        if nimg and tipo == 'fratura':
            titulo += f' — {nimg.group(1)}'
        im = Image.open(p).convert('RGB')
        w, hh = im.size
        if w > LARGURA:
            im = im.resize((LARGURA, round(hh * LARGURA / w)), Image.LANCZOS)
        out = f'{len(imagens) + 1:02d}-{tipo}.jpg'
        im.save(os.path.join(dest, out), quality=88, optimize=True)
        czi = os.path.splitext(p)[0] + '.czi'
        imagens.append({'src': f'assets/ctod/{cp}/{out}?v={versao}', 'arquivo': arq, 'tipo': tipo, 'titulo': titulo,
                        'px': [w, hh], 'czi': os.path.basename(czi) if os.path.exists(czi) else None})
    # mesma ordem de apresentação para todos os CPs: fratura com medidas, fratura, entalhe, pré-trinca, outras
    ORDEM_TIPO = {'medicao': 0, 'fratura': 1, 'entalhe': 2, 'pretrinca': 3, 'outra': 4}
    imagens.sort(key=lambda im: (ORDEM_TIPO.get(im['tipo'], 9), im['arquivo'].lower()))
    for p in glob.glob(os.path.join(pasta, '*.czi')):
        if not os.path.exists(os.path.splitext(p)[0] + '.png'):
            avisos.append(f'{nome}: "{os.path.basename(p)}" existe só em .czi (formato Zeiss), sem .png; '
                          f'não exibida. Exporte em PNG para incluir.')

    reg_out = {
        'cp': cp, 'nome': nome, 'alvo': alvo, 'orient': ORIENT.get(ori, ori), 'orient_codigo': ori,
        'pasta': os.path.basename(pasta), 'planilha': os.path.relpath(xl[0], PASTA),
        'ensaio': ensaio, 'geom': geom, 'props': props, 'registro': reg, 'calc': calculo,
        'resultado': resultado,          # situação de qualificação e critérios da norma não vão para o site
        'mts': mts, 'imagens': imagens,
        'origens': {
            'resultado': 'Resumo › 3. Resultados › δ pontual', 'calc': 'Cálculos (seções 9–11)',
            'registro': 'Pontos do registro (seções 2 e 3)', 'geom': 'Resumo › 2 e Medições da trinca',
            'props': 'Geometria e propriedades › 3',
            'curvas': 'Dados do ensaio (F e V corrigidos; deslocamento do atuador com sinal invertido e zero no 1º ponto)',
        },
    }
    print(f'{cp} {alvo}% {reg_out["orient"]}  δ = {resultado and resultado["valor"]:.4f} mm ({calculo["simbolo"]}, classe '
          f'{calculo["classe"]})  Fmax = {reg["Fmax"]:.3f} kN  '
          f'a_o/W = {geom["a_oW"]:.3f}  {len(F)} pontos  {len(imagens)} imagens  {len(crit)} critérios aplicáveis')
    return reg_out, curvas


def main():
    versao = int(datetime.now().timestamp())
    os.makedirs(ASSETS, exist_ok=True)
    avisos, cps, curvas = [], [], {}
    for p in sorted(x for x in glob.glob(os.path.join(PASTA, '*')) if os.path.isdir(x)):
        if os.path.basename(p).strip().lower() in PASTAS_IGNORADAS:
            continue
        reg, cv = processar(p, versao, avisos)
        if reg:
            cps.append(reg)
            curvas[reg['cp']] = cv
    dados = {'gerado': datetime.now().strftime('%Y-%m-%d %H:%M'), 'norma': 'ISO 12135:2016',
             'fonte': 'CTOD/<CP>/<CP>.xlsm (planilha de cálculo ISO 12135) e arquivos da MTS',
             'cps': cps, 'avisos': avisos}
    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write('// Ensaios de CTOD (ISO 12135:2016) · gerado por Site/ferramentas/importar_ctod.py — não editar à mão.\n')
        f.write('window.DADOS_CTOD = ' + json.dumps(dados, ensure_ascii=False, indent=1, default=str) + ';\n')
    with open(SAIDA_CURVAS, 'w', encoding='utf-8') as f:
        f.write('// Registros completos dos ensaios de CTOD (t: s desde o 1º ponto; F: kN; V = CMOD: mm; d: atuador, mm).\n')
        f.write('window.CURVAS_CTOD = ' + json.dumps(curvas, separators=(',', ':')) + ';\n')
    print(f'\n{len(cps)} CP(s) → {os.path.relpath(SAIDA, RAIZ)}, {os.path.relpath(SAIDA_CURVAS, RAIZ)}')
    for a in avisos:
        print('AVISO:', a)


if __name__ == '__main__':
    main()
