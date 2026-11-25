"""Importa as micrografias do material como recebido (seções longitudinal e circunferencial).

Origem: Antes e Depois do Tratamento termico/Antes/<Seção>/MEV/
  - se existir a subpasta "Selecionadas" (ou "Imagens selecionadas"):
      * com subpastas de aumento (x250, x500, x1000...), as imagens são agrupadas por aumento;
      * sem subpastas, usa as imagens dela num grupo só;
  - senão, usa a seleção padrão abaixo.
Quantificação (SVRNA): mesmo nome da imagem com .png (imagem quantificada) e .xlsx (relatório).
Se não estiverem ao lado da imagem, procura também na pasta MEV.
As imagens sem quantificação são copiadas COM a barra de dados do MEV (aumento e escala);
as quantificadas são recortadas na altura da quantificação para ficarem lado a lado.
Saída: Site/assets/como-recebido/ e Site/dados/como-recebido.js

Uso (na pasta "Dados obtidos"):
    python3 Site/ferramentas/importar_como_recebido.py
"""
import glob
import json
import os
import re
import time

import openpyxl
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ORIGEM = os.path.join(RAIZ, 'Antes e Depois do Tratamento termico', 'Antes')
DEST = os.path.join(RAIZ, 'Site', 'assets', 'como-recebido')
SAIDA = os.path.join(RAIZ, 'Site', 'dados', 'como-recebido.js')
LARGURA = 1400
PASTAS_SEL = ('Selecionadas', 'Imagens selecionadas')

PADRAO = {
    'Longitudinal': ['Longitudinal_049.jpg', 'Longitudinal_044.jpg', 'Longitudinal_041.jpg',
                     'Longitudinal_027.jpg', 'Longitudinal_005.jpg', 'Longitudinal_012.jpg'],
    'Circunferencial': ['Como Recebido_002.jpg', 'Como Recebido_005.jpg', 'Como Recebido_019.jpg',
                        'Como Recebido_044.jpg', 'Como Recebido_053.jpg', 'Como Recebido_060.jpg'],
}


def ler_planilha(caminho):
    ws = openpyxl.load_workbook(caminho, data_only=True).active
    fases, info = {}, {}
    na_tabela = False
    for row in ws.iter_rows(values_only=True):
        k = str(row[0]).strip() if row and row[0] is not None else ''
        if k.startswith('Fase'):
            na_tabela = True
            continue
        if na_tabela:
            if not k:
                na_tabela = False
                continue
            if isinstance(row[2], (int, float)):
                ic = re.sub(r'[^0-9.,]', '', str(row[3] or '')).replace(',', '.')
                fases[k] = {'p': float(row[2]), 'ic': float(ic) if ic else None}
        elif k in ('Modelo', 'Confiança média'):
            info[k] = row[1]
    return fases, info


def achar(base, mev, exts):
    nome = os.path.basename(base)
    for pasta in (os.path.dirname(base), mev):
        for e in exts:
            p = os.path.join(pasta, nome + e)
            if os.path.exists(p):
                return p
    return None


def reduzir(im):
    if im.width > LARGURA:
        im = im.resize((LARGURA, round(im.height * LARGURA / im.width)),
                       Image.NEAREST if im.mode == 'P' else Image.LANCZOS)
    return im


def importar(arquivos, mev, prefixo, versao):
    lista = []
    for i, f in enumerate(arquivos, 1):
        base = os.path.splitext(f)[0]
        png = achar(base, mev, ('.png', '.PNG'))
        xlsx = achar(base, mev, ('.xlsx',))
        im = Image.open(f).convert('RGB')
        reg = {'arquivo': os.path.basename(f)}
        if png:
            q = Image.open(png).convert('RGB')
            if im.width == q.width and im.height > q.height:
                im = im.crop((0, 0, q.width, q.height))      # tira a barra do MEV para alinhar com a quantificação
            nq = f'{prefixo}-{i}-quant.png'
            q = q.resize((LARGURA, round(q.height * LARGURA / q.width)), Image.NEAREST) if q.width > LARGURA else q
            q.save(os.path.join(DEST, nq), optimize=True)
            reg['quant'] = f'assets/como-recebido/{nq}?v={versao}'
        if xlsx:
            fases, info = ler_planilha(xlsx)
            reg['fases'] = fases
            if info.get('Confiança média') is not None:
                reg['confianca'] = info['Confiança média']
        nome = f'{prefixo}-{i}.jpg'
        reduzir(im).save(os.path.join(DEST, nome), quality=85, optimize=True)
        reg['src'] = f'assets/como-recebido/{nome}?v={versao}'
        lista.append(reg)
    return lista


def imagens(pasta):
    return sorted(glob.glob(os.path.join(pasta, '*.jpg')) + glob.glob(os.path.join(pasta, '*.JPG')))


def main():
    versao = int(time.time())
    os.makedirs(DEST, exist_ok=True)
    dados = {}
    for secao, padrao in PADRAO.items():
        mev = os.path.join(ORIGEM, secao, 'MEV')
        chave = 'long' if secao == 'Longitudinal' else 'circ'
        for f in glob.glob(os.path.join(DEST, chave + '-*')):
            os.remove(f)
        sel = next((os.path.join(mev, p) for p in PASTAS_SEL if os.path.isdir(os.path.join(mev, p))), None)
        d = {'secao': secao,
             'total_mev': len(glob.glob(os.path.join(mev, '*.jpg'))),
             'mapas_ebsd': len(glob.glob(os.path.join(ORIGEM, secao, 'EBSD', '*.ctf')))}
        subs = sorted([p for p in glob.glob(os.path.join(sel, '*')) if os.path.isdir(p)],
                      key=lambda p: int(re.sub(r'\D', '', os.path.basename(p)) or 0)) if sel else []
        if subs:
            d['aumentos'] = []
            for p in subs:
                aum = os.path.basename(p)
                lista = importar(imagens(p), mev, f'{chave}-{aum}', versao)
                d['aumentos'].append({'aumento': aum, 'imagens': lista})
                print(f'{secao} {aum}: {len(lista)} imagens, {sum("quant" in r for r in lista)} quantificadas')
        else:
            arquivos = imagens(sel) if sel else [os.path.join(mev, a) for a in padrao if os.path.exists(os.path.join(mev, a))]
            d['imagens'] = importar(arquivos, mev, chave, versao)
            print(f'{secao}: {len(d["imagens"])} imagens')
        dados[chave] = d
    with open(SAIDA, 'w', encoding='utf-8') as fh:
        fh.write('// Micrografias do material como recebido. Gerado por Site/ferramentas/importar_como_recebido.py\n')
        fh.write('window.COMO_RECEBIDO = ' + json.dumps(dados, ensure_ascii=False, indent=1) + ';\n')
    print('Gravado:', os.path.relpath(SAIDA, RAIZ))


if __name__ == '__main__':
    main()
