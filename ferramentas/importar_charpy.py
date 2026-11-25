"""Gera Site/dados/charpy.js a partir de
    Charpy Longitudinal/Controle dos CPs do Charpy.xlsx

Lê as abas de 2%, 4% e 6% de fase sigma (blocos L-C e C-L, a +20, -20 e -50 °C)
e os CPs "Não tratado" da aba "Testes de tratamento" como referência (0%).

ATENÇÃO: sobrescreve dados/charpy.js. Se você editou valores pela página e
salvou o arquivo, rode este script só se quiser voltar aos valores da planilha.

Uso (na pasta "Dados obtidos"):
    python3 Site/ferramentas/importar_charpy.py
"""
import json
import os
import re

import openpyxl

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PLANILHA = os.path.join(RAIZ, 'Charpy Longitudinal', 'Controle dos CPs do Charpy.xlsx')
# Série de referência 0% (sem fase deletéria), L-C e C-L. Quando existe, substitui os
# CPs "Não tratado" da aba "Testes de tratamento".
PLANILHA_0 = os.path.join(RAIZ, 'Charpy Longitudinal', 'Controle dos CPs do Charpy - sem fase deletéria.xlsx')
SAIDA = os.path.join(RAIZ, 'Site', 'dados', 'charpy.js')
ACOMP = os.path.join(RAIZ, 'Docs', 'Fase_Sigma_Acompanhamento.xlsx')   # aba "Charpy e fase sigma"

# Quantificações informadas pela equipe e ainda não registradas na aba acima
# (cond, orientação, temperatura, CP) -> % de fase sigma medida
COMPLEMENTO_SIGMA = {
    (2, 'L-C', 20, 'CP-04'): 3.01,
    (6, 'C-L', 20, 'CP-19'): 6.985,
}


def num(v):
    return float(v) if isinstance(v, (int, float)) else None


def temp_de(txt):
    m = re.search(r'([+-]?\d+)\s*°?\s*C', str(txt or ''))
    return int(m.group(1)) if m else None


def main():
    wb = openpyxl.load_workbook(PLANILHA, data_only=True)
    cps, avisos = [], []

    for ws in wb.worksheets:
        m = re.search(r'(\d+)%', ws.title)
        if not m or ws.title.startswith('Cópia'):
            continue
        cond = int(m.group(1))
        orient, temp, posicoes = None, None, set()
        for row in ws.iter_rows(values_only=True):
            b = row[1] if len(row) > 1 else None
            if isinstance(b, str) and 'SENTIDO' in b:
                orient = 'L-C' if 'L-C' in b else 'C-L'
                temp, posicoes = None, set()
                continue
            if isinstance(b, str) and b.startswith('Média'):
                temp, posicoes = None, set()
                continue
            if not (isinstance(b, str) and b.startswith('CP-')):
                continue
            t = temp_de(row[8])
            if t is not None:
                temp = t
            pos = row[2]
            energia = num(row[7])
            # linha solta "CP-16 B" repetida no fim dos blocos C-L, sem ensaio
            # (os blocos C-L usam as posições D e E do tubo)
            if energia is None and orient == 'C-L' and pos not in ('D', 'E'):
                avisos.append(f'{ws.title}: {b} posição {pos} ignorado (linha sem ensaio fora do bloco).')
                continue
            posicoes.add(pos)
            cps.append({
                'cond': cond, 'orient': orient, 'temp': temp,
                'cp': b, 'pos': pos, 'sigma': None,
                'fe_pre': [num(row[3]), num(row[4])],
                'tt': row[6],
                'energia': energia,
                'fe_pos': [num(row[9]), num(row[10])],
                'obs': '',
            })

    # referência 0%: planilha própria (colunas: CP, posição, Fe pré L1/L2/média, TT, energia,
    # temperatura, Fe pós L1/L2/média)
    if os.path.exists(PLANILHA_0):
        w0 = openpyxl.load_workbook(PLANILHA_0, data_only=True)
        for ws in w0.worksheets:
            orient, temp = None, None
            for row in ws.iter_rows(values_only=True):
                a = row[0] if row else None
                if isinstance(a, str) and 'SENTIDO' in a:
                    orient = 'L-C' if 'L-C' in a else 'C-L'
                    temp = None
                    continue
                if isinstance(a, str) and a.startswith('Média'):
                    temp = None
                    continue
                if not (isinstance(a, str) and a.startswith('CP-')):
                    continue
                t = temp_de(row[7])
                if t is not None:
                    temp = t
                cps.append({
                    'cond': 0, 'orient': orient, 'temp': temp,
                    'cp': a.strip(), 'pos': row[1], 'sigma': None,
                    'fe_pre': [num(row[2]), num(row[3])],
                    'tt': 'Não tratado',
                    'energia': num(row[6]),
                    'fe_pos': [num(row[8]), num(row[9])],
                    'obs': '',
                })
    # sem a planilha acima: CPs não tratados da aba "Testes de tratamento" (bloco L-C à direita)
    elif 'Testes de tratamento' in wb.sheetnames:
        ws = wb['Testes de tratamento']
        temp = None
        for row in ws.iter_rows(values_only=True):
            if len(row) < 20:
                continue
            cp, pos, tt, energia, tmarc = row[12], row[13], row[17], num(row[18]), row[19]
            t = temp_de(tmarc)
            if t is not None:
                temp = t
            if isinstance(cp, str) and cp.startswith('CP-') and tt == 'Não tratado':
                cps.append({
                    'cond': 0, 'orient': 'L-C', 'temp': temp,
                    'cp': cp, 'pos': pos, 'sigma': None,
                    'fe_pre': [num(row[14]), num(row[15])],
                    'tt': tt, 'energia': energia,
                    'fe_pos': [num(row[20]), num(row[21]) if len(row) > 21 else None],
                    'obs': 'Referência não tratada (aba Testes de tratamento)',
                })

    # fase sigma medida nos CPs selecionados para quantificação
    quant = dict(COMPLEMENTO_SIGMA)
    if os.path.exists(ACOMP):
        wa = openpyxl.load_workbook(ACOMP, data_only=True)
        if 'Charpy e fase sigma' in wa.sheetnames:
            for row in wa['Charpy e fase sigma'].iter_rows(values_only=True):
                m = re.search(r'(\d+)%', str(row[0] or ''))
                if m and isinstance(row[4], str) and isinstance(row[5], (int, float)):
                    quant.setdefault((int(m.group(1)), row[1], int(row[2]), row[4].strip()), float(row[5]))
    for k, v in quant.items():
        alvo = [c for c in cps if (c['cond'], c['orient'], c['temp'], c['cp']) == k]
        if alvo:
            alvo[0]['sigma'] = v
        else:
            avisos.append(f'Quantificação sem CP correspondente: {k} = {v} %')

    for i, c in enumerate(cps):
        c['id'] = i + 1
    dados = {
        'fonte': 'Charpy Longitudinal/Controle dos CPs do Charpy.xlsx' + (' + Controle dos CPs do Charpy - sem fase deletéria.xlsx' if os.path.exists(PLANILHA_0) else ''),
        'cps': cps,
    }
    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write('// Ensaios Charpy · controle dos corpos de prova\n')
        f.write('// Gerado por Site/ferramentas/importar_charpy.py; também pode ser\n')
        f.write('// substituído pelo botão "Salvar arquivo" da página (modo Editar).\n')
        f.write('// cond = % de fase sigma (0 = não tratado) · temp em °C · energia em J · sigma = % medida no CP quantificado · null = sem valor.\n')
        f.write('window.DADOS_CHARPY = ' + json.dumps(dados, ensure_ascii=False, indent=1) + ';\n')

    from collections import Counter
    cont = Counter((c['cond'], c['orient'], c['temp']) for c in cps if c['energia'] is not None)
    for k in sorted(cont):
        print(f'{k[0]}% {k[1]} {k[2]:+d} °C: {cont[k]} CPs com energia')
    print(f'CPs quantificados: {sum(c["sigma"] is not None for c in cps)}')
    print(f'Total: {len(cps)} linhas → {os.path.relpath(SAIDA, RAIZ)}')
    for a in avisos:
        print('AVISO:', a)


if __name__ == '__main__':
    main()
