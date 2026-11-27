"""Importa as micrografias quantificadas dos CPs Charpy para o site.

Lê  Charpy Longitudinal/Selecionados Charpy/<cond>%/
    (ou, se não existir, Charpy Longitudinal/Quantificação Longitudinal/Selecionados Charpy/<cond>%/)
onde cada CP tem três arquivos de mesmo nome, por exemplo:
    CP 36 CL +20C_007.jpg   micrografia original
    CP 36 CL +20C_007.png   quantificação (SVRNA)
    CP 36 CL +20C_007.xlsx  relatório SVRNA (σ = pseudocor BLUE, ASTM E562 ±95%)

O nome identifica o CP: número, orientação (LC/L-C ou CL/C-L) e temperatura.
Copia as imagens para Site/assets/charpy/ e grava Site/dados/charpy-micro.js.
Não altera dados/charpy.js (a tabela editável).

Uso (na pasta "Dados obtidos"):
    python3 Site/ferramentas/importar_charpy_micrografias.py
"""
import glob
import json
import os
import re
import time

import openpyxl
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PASTA = next((p for p in (os.path.join(RAIZ, 'Charpy Longitudinal', 'Selecionados Charpy'),
                          os.path.join(RAIZ, 'Charpy Longitudinal', 'Quantificação Longitudinal', 'Selecionados Charpy'))
              if os.path.isdir(p)), os.path.join(RAIZ, 'Charpy Longitudinal', 'Selecionados Charpy'))
DEST = os.path.join(RAIZ, 'Site', 'assets', 'charpy')
SAIDA = os.path.join(RAIZ, 'Site', 'dados', 'charpy-micro.js')
LADO = 1200            # maior lado das imagens no site (px)
FASE_SIGMA = 'BLUE'

PADRAO = re.compile(r'CP\s*-?\s*(\d+)\s+([LC])\s*-?\s*([LC])\s+([+-]?\d+)(?:\s*°?C)?', re.I)


def ler_planilha(caminho):
    ws = openpyxl.load_workbook(caminho, data_only=True).active
    info = {}
    for row in ws.iter_rows(values_only=True):
        if not row or row[0] is None:
            continue
        k = str(row[0]).strip()
        if k == FASE_SIGMA and isinstance(row[2], (int, float)):
            ic = re.sub(r'[^0-9.,]', '', str(row[3] or '')).replace(',', '.')
            info['sigma'] = float(row[2])
            info['ic95'] = float(ic) if ic else None
        elif k in ('Modelo', 'Confiança média', 'Amostra'):
            info[k] = row[1]
    return info


def salvar(origem, destino, png=False):
    im = Image.open(origem).convert('RGB')
    im.thumbnail((LADO, LADO), Image.NEAREST if png else Image.LANCZOS)
    if png:
        im.save(destino, optimize=True)
    else:
        im.save(destino, quality=85, optimize=True)


def main():
    versao = int(time.time())
    os.makedirs(DEST, exist_ok=True)
    micro, avisos = {}, []
    for jpg in sorted(glob.glob(os.path.join(PASTA, '*%', '*.jpg'))):
        cond = int(re.search(r'(\d+)%', os.path.basename(os.path.dirname(jpg))).group(1))
        base = os.path.splitext(jpg)[0]
        nome = os.path.basename(base)
        m = PADRAO.search(nome)
        if not m:
            avisos.append(f'{nome}: não identifiquei CP/orientação/temperatura no nome; ignorado.')
            continue
        cp = f'CP-{int(m.group(1)):02d}'
        orient = f'{m.group(2).upper()}-{m.group(3).upper()}'
        temp = int(m.group(4))
        png = next((base + e for e in ('.png', '.PNG') if os.path.exists(base + e)), None)
        xlsx = base + '.xlsx' if os.path.exists(base + '.xlsx') else None
        if not png:
            avisos.append(f'{nome}: falta a quantificação (.png).')
        if not xlsx:
            avisos.append(f'{nome}: falta a planilha (.xlsx).')

        stem = f'{cond}pct_{orient}_{temp}C_{cp}'          # ex.: 4pct_C-L_20C_CP-36
        reg = {'cond': cond, 'orient': orient, 'temp': temp, 'cp': cp, 'arquivo': os.path.basename(jpg)}
        salvar(jpg, os.path.join(DEST, stem + '.jpg'))
        reg['original'] = f'assets/charpy/{stem}.jpg?v={versao}'
        if png:
            salvar(png, os.path.join(DEST, stem + '-quant.png'), png=True)
            reg['quant'] = f'assets/charpy/{stem}-quant.png?v={versao}'
        if xlsx:
            info = ler_planilha(xlsx)
            reg.update({'sigma_campo': info.get('sigma'), 'ic95': info.get('ic95'),
                        'modelo': info.get('Modelo'), 'confianca': info.get('Confiança média')})
        micro[f'{cond}|{orient}|{temp}|{cp}'] = reg
        print(f'{cond}% {orient} {temp:+d} °C {cp}: σ no campo = {reg.get("sigma_campo")} %')

    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write('// Micrografias quantificadas dos CPs Charpy (uma por CP selecionado).\n')
        f.write('// Gerado por Site/ferramentas/importar_charpy_micrografias.py. Chave: cond|orientação|temp|CP.\n')
        f.write('window.MICRO_CHARPY = ' + json.dumps(micro, ensure_ascii=False, indent=1) + ';\n')
    print(f'\n{len(micro)} CPs → {os.path.relpath(SAIDA, RAIZ)}')
    for a in avisos:
        print('AVISO:', a)


if __name__ == '__main__':
    main()
