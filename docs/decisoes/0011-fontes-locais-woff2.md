# 0011 — Fontes locais em WOFF2, versionadas no repositório

- **Status:** aceita
- **Data:** 29/09/2026

## Contexto

A experiência opera offline, em quiosques, por anos (ADR 0002 e Flows 03). Nenhuma
fonte pode depender de rede, e o resultado visual precisa ser idêntico em todas as
estações e em todas as máquinas de desenvolvimento.

## Decisão

- Famílias do Design System: **IBM Plex Sans** (300, 400, 500, 600, 700),
  **IBM Plex Sans Condensed** (600) e **IBM Plex Mono** (400, 500).
- Os arquivos **WOFF2** ficam em `assets/fonts/`, versionados no Git. Origem: pacotes
  Fontsource 5.3.0 (só para baixar; nenhum pacote de fonte entra no `package.json`).
- **Subconjuntos:** `latin` e `latin-ext` (cobrem o português e nomes de minerais
  com acentos e símbolos). São 16 arquivos, cerca de 324 kB no total.
- `src/design-system/fonts.css` declara os 16 `@font-face`, cada um com
  `font-display: swap`, `format('woff2')` e o `unicode-range` oficial do subconjunto.
  O Vite copia os arquivos para o build com nome com hash.
- A licença (SIL Open Font License 1.1) fica junto: `assets/fonts/LICENSE.txt`.
- `font-synthesis: none` no `body`: se um peso faltar, o navegador não inventa
  negrito nem itálico. O Design System não usa itálico.
- Testes (`fonts.test.ts`): 16 faces, pesos exatos, arquivos existentes, nenhum `http`
  no CSS, `unicode-range` presente.

## Alternativas consideradas

- **Pacotes `@fontsource` como dependência:** mais uma dependência a atualizar; os
  arquivos são estáticos e não mudam.
- **Fonte variável:** um arquivo só, mas a Plex Sans Condensed e a Mono não têm o
  mesmo formato, e a diferença de tamanho não compensa a troca.
- **Google Fonts pela rede:** proibido pela operação offline.

## Consequências

- O visual das fontes não depende da máquina nem da rede.
- Trocar a versão de uma fonte é uma decisão explícita: novo commit com os arquivos e
  novo ADR, se a família mudar.
- A tela mostra o fallback do sistema por um instante se a fonte demorar; em
  quiosque, com arquivos locais, isso não é perceptível. A vitrine mostra "8 de 8
  carregadas".
