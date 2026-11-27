# Fase Sigma — Resultados

Site de apresentação dos resultados do projeto Fase Sigma (LPTS-UFC): metalurgia do aço
inoxidável superduplex UNS S32750 e o efeito da fase σ na microestrutura, na tenacidade
(Charpy e CTOD) e nas propriedades em tração.

É um site estático (HTML, CSS e JavaScript, sem build).

## Abrir localmente

```bash
python3 -m http.server 8765
```

e acesse http://localhost:8765. (Na pasta "Dados obtidos" há também o atalho `Abrir Site.command`.)

## Estrutura

- `index.html` — páginas (slides) e navegação
- `css/`, `js/` — estilo e lógica de cada seção (Kit 1, Como Recebido, Charpy, Tração)
- `dados/` — dados gerados pelos importadores (`window.DADOS_*`)
- `assets/` — logos, ícones e micrografias
- `ferramentas/` — importadores em Python (`numpy`, `openpyxl`, `Pillow`)

## Atualizar os dados

Os importadores leem os dados brutos das pastas vizinhas a `Site/` (em "Dados obtidos",
fora deste repositório) e regravam `dados/` e `assets/`. Na pasta "Dados obtidos":

```bash
python3 Site/ferramentas/importar_tracao.py
python3 Site/ferramentas/importar_charpy.py
python3 Site/ferramentas/importar_kit1.py
```
