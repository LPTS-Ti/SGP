"""Importa as imagens selecionadas do Kit 1 (MEV e ótico) para o site.

Para cada planilha SVRNA (.xlsx) em
    KIT 1/MEV/Imagens selecionadas/
    KIT 1/Ótico/Imagens selecionadas/
o script:
  1. lê a % de fase sigma (pseudocor BLUE) e o intervalo ASTM E562 (±95%);
  2. acha a imagem original indicada em "Arquivo da imagem" da planilha
     (primeiro na própria pasta, depois nas pastas de sessão do Kit 1);
  3. copia a original (.jpg) e a quantificação (.png de mesmo nome da planilha)
     para Site/assets/kit1/<condição>/;
  4. grava tudo em Site/dados/kit1-campos.js, lido pela página.

Uso (na pasta "Dados obtidos"):
    python3 Site/ferramentas/importar_kit1.py
"""
import glob
import json
import os
import re
import sys
import time

import openpyxl
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = os.path.join(RAIZ, 'Site')
FONTES = {
    'mev': os.path.join(RAIZ, 'KIT 1', 'MEV'),
    'mo': os.path.join(RAIZ, 'KIT 1', 'Ótico'),
}
LARGURA = 1600          # largura das imagens no site (px)
FASE_SIGMA = 'BLUE'     # pseudocor da fase sigma no SVRNA


def ler_planilha(caminho):
    ws = openpyxl.load_workbook(caminho, data_only=True).active
    info, fases = {}, {}
    for row in ws.iter_rows(values_only=True):
        if not row or row[0] is None:
            continue
        chave = str(row[0]).strip()
        if chave in ('Amostra', 'Arquivo da imagem', 'Data/hora', 'Modelo',
                     'Confiança média', 'Pontos ASTM E562', 'Método de segmentação'):
            info[chave] = row[1]
        elif chave.isupper() and isinstance(row[2], (int, float)):
            ic = re.sub(r'[^0-9.,]', '', str(row[3] or '')).replace(',', '.')
            fases[chave] = (float(row[2]), float(ic) if ic else None)
    return info, fases


def achar_original(pasta_sel, pasta_tecnica, nome_arquivo):
    direto = os.path.join(pasta_sel, nome_arquivo)
    if os.path.exists(direto):
        return direto
    achados = sorted(glob.glob(os.path.join(pasta_tecnica, '**', nome_arquivo), recursive=True))
    achados = [a for a in achados if 'Imagens selecionadas' not in a]
    return achados[-1] if achados else None


def salvar(origem, destino, png=False, altura=None):
    im = Image.open(origem)
    im = im.convert('RGB')
    if altura and im.height > altura:          # tira a barra de dados do MEV
        im = im.crop((0, 0, im.width, altura))
    w, h = im.size
    if w > LARGURA:
        im = im.resize((LARGURA, round(h * LARGURA / w)),
                       Image.NEAREST if png else Image.LANCZOS)
    if png:
        im.save(destino, optimize=True)
    else:
        im.save(destino, quality=85, optimize=True)


def main():
    versao = int(time.time())   # força o navegador a recarregar imagens trocadas
    campos = {}
    avisos = []
    for tec, pasta_tecnica in FONTES.items():
        pasta_sel = os.path.join(pasta_tecnica, 'Imagens selecionadas')
        if not os.path.isdir(pasta_sel):
            continue
        for xlsx in sorted(glob.glob(os.path.join(pasta_sel, '*.xlsx'))):
            if os.path.basename(xlsx).startswith('~$'):
                continue
            base = os.path.splitext(os.path.basename(xlsx))[0]          # ex.: 2%_BSE_019
            m = re.match(r'(\d+)%', base)
            if not m:
                avisos.append(f'{base}: não identifiquei a condição pelo nome; ignorado.')
                continue
            cond = m.group(1)
            info, fases = ler_planilha(xlsx)
            if FASE_SIGMA not in fases:
                avisos.append(f'{base}: planilha sem a fase {FASE_SIGMA}; ignorado.')
                continue

            arq = info.get('Arquivo da imagem') or base + '.jpg'
            original = achar_original(pasta_sel, pasta_tecnica, arq)
            quant = next((p for p in (os.path.join(pasta_sel, base + e) for e in ('.png', '.PNG', '.tif', '.tiff'))
                          if os.path.exists(p)), None)
            if arq != base + '.jpg':
                avisos.append(f'{base}: a planilha indica a imagem "{arq}"; '
                              f'usei {os.path.relpath(original, RAIZ) if original else "(não encontrada)"} como original.')
            if not original:
                avisos.append(f'{base}: original "{arq}" não encontrada.')
            if not quant:
                avisos.append(f'{base}: imagem de quantificação (.png) não encontrada.')

            pasta_dest = os.path.join(SITE, 'assets', 'kit1', cond)
            os.makedirs(pasta_dest, exist_ok=True)
            lista = campos.setdefault(cond, {}).setdefault(tec, [])
            n = len(lista) + 1
            reg = {
                'campo': info.get('Amostra') or base,
                'arquivo_planilha': os.path.basename(xlsx),
                'sigma': fases[FASE_SIGMA][0],
                'ic95': fases[FASE_SIGMA][1],
                'modelo': info.get('Modelo'),
                'confianca': info.get('Confiança média'),
                'pontos_astm': info.get('Pontos ASTM E562'),
                'original': None,
                'quant': None,
            }
            altura_q = Image.open(quant).height if quant else None
            if original:
                destino = f'{tec}-{n}.jpg'
                salvar(original, os.path.join(pasta_dest, destino), altura=altura_q)
                reg['original'] = f'assets/kit1/{cond}/{destino}?v={versao}'
            if quant:
                destino = f'{tec}-{n}-quant.png'
                salvar(quant, os.path.join(pasta_dest, destino), png=True)
                reg['quant'] = f'assets/kit1/{cond}/{destino}?v={versao}'
            lista.append(reg)
            print(f'{tec.upper():3} {cond}%  {reg["campo"]:<12} σ = {reg["sigma"]:.2f} ± {reg["ic95"]} %')

    # Galeria: micrografias complementares (sem quantificação) em subpastas de
    # "Imagens selecionadas" (ex.: pt2/). Mantém a barra de dados do MEV (escala).
    galeria = {}
    for tec, pasta_tecnica in FONTES.items():
        pasta_sel = os.path.join(pasta_tecnica, 'Imagens selecionadas')
        fotos = sorted(f for f in glob.glob(os.path.join(pasta_sel, '*', '*'))
                       if os.path.splitext(f)[1].lower() in ('.jpg', '.jpeg', '.tif', '.tiff', '.png'))
        for foto in fotos:
            base = os.path.splitext(os.path.basename(foto))[0]           # ex.: 4%_BSE_012
            m = re.match(r'(\d+)%', base)
            if not m:
                avisos.append(f'galeria {base}: não identifiquei a condição pelo nome; ignorado.')
                continue
            cond = m.group(1)
            pasta_dest = os.path.join(SITE, 'assets', 'kit1', cond)
            os.makedirs(pasta_dest, exist_ok=True)
            lista = galeria.setdefault(cond, {}).setdefault(tec, [])
            destino = f'{tec}-gal-{len(lista) + 1}.jpg'
            salvar(foto, os.path.join(pasta_dest, destino))
            lista.append({'campo': base, 'src': f'assets/kit1/{cond}/{destino}?v={versao}'})
        for cond in sorted(galeria):
            if tec in galeria[cond]:
                print(f'{tec.upper():3} {cond}%  galeria: {len(galeria[cond][tec])} imagens')

    saida = os.path.join(SITE, 'dados', 'kit1-campos.js')
    with open(saida, 'w', encoding='utf-8') as f:
        f.write('// Campos quantificados do Kit 1 (um por imagem selecionada).\n')
        f.write('// Gerado por Site/ferramentas/importar_kit1.py a partir das planilhas SVRNA.\n')
        f.write('// Rode o script de novo depois de mudar as imagens selecionadas.\n')
        f.write('window.CAMPOS_KIT1 = ' + json.dumps(campos, ensure_ascii=False, indent=2) + ';\n')
        f.write('\n// Galeria: micrografias complementares (subpastas de "Imagens selecionadas", ex.: pt2/).\n')
        f.write('window.GALERIA_KIT1 = ' + json.dumps(galeria, ensure_ascii=False, indent=2) + ';\n')
    print(f'\nGravado: {os.path.relpath(saida, RAIZ)}')
    for a in avisos:
        print('AVISO:', a, file=sys.stderr)


if __name__ == '__main__':
    main()
