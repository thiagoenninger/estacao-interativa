# Arquitetura - Estação Interativa dos Objetos

Documento vivo. Resume a arquitetura aprovada no Roadmap Mestre (v1.1, 28/09/2026). Cada decisão importante tem um registro próprio em [decisoes/](decisoes/README.md).

## Visão Geral

Aplicação desktop para Windows 11, em modo quiosque, executada em três estações independentes. Todas rodam a mesma versão, cada uma com sua própria sessão, sem sincronização entre elas. Todo funcionamento é offline.

## Princípios

- O Design System é especificação de implementação, não inspiração.
- O objeto é o protagonista; a navegação é uma transformação contínua do mesmo universo, nunca uma sequência de páginas.
- Palco lógico de 1920x1080 (Full HD). Outras resoluções são atendidas por escala automática.
- Conteúdo, experiência e interface ficam separados.
- O React decide o que existe na tela, o GSAP decide como se move.
- Código, dados e assets são distribuídos juntos, em um único pacote.

## Camadas

| Camada      | Responsabilidade                                      |
| ----------- | ----------------------------------------------------- |
| Plataforma  | Electron: janela, quiosque, escala, logs, atualização |
| Experiência | Máquina de estados, sessão e retorno automático       |
| Interface   | Componentes React do Design System                    |
| Motion      | Coreografias M01–M08 (GSAP) e flutuação (CSS)         |
| Conteúdo    | Dados JSON validados e consultas                      |


## Estrutura prevista

- `data/` — conteúdo em JSON
- `assets/` — objetos, materiais, minerais, fotos, ícones, texturas, fontes
  (nomes das subpastas definidos pelo Design System, Assets 03)
- `src/` — aplicação (app, design-system, experience, interaction, motion,
  content e as partes da experiência)
- `electron/` - processo principal da aplicação desktop
- `scripts/` - validação de dados e auditoria de SVG
- `docs/` - esta documentação

## Dados

Modelo normalizado: Elemento, Material, FonteMineral, RotaDeObtenção, Objeto, Investigação (objeto x material) e Camada. Desenho e conteúdo ligam-se apenas pelo id do material e pelo id do grupo do SVG.

## Distribuição

Instalador publicado no Github Releases. Atualização remota prevista para a Etapa 24.

## Estrutura atual do código (Etapa 06)

| Pasta                           | Conteúdo                                                                  |
| ------------------------------- | ------------------------------------------------------------------------- |
| `assets/fonts/`                 | Fontes IBM Plex em WOFF2 e a licença                                      |
| `assets/icons/`                 | Os 12 ícones do Design System (SVG, `icon-*.svg`)                         |
| `assets/textures/`              | Retícula e marca de registro do fundo                                     |
| `assets/objects/`               | Os 8 desenhos de objetos (SVG, `object-*.svg`)                            |
| `assets/materials/`             | As 7 esferas de material (PNG, `material-*-sphere.png`)                   |
| `data/`                         | O conteúdo da experiência em JSON normalizado (ADR 0013)                  |
| `scripts/`                      | `validate-content.ts` valida `data/`; `audit-svg.ts` audita os desenhos; `electron-dev.ts` abre o app desktop em desenvolvimento |
| `src/app/`                      | Inicialização da aplicação (`App.tsx`)                                    |
| `src/app/stage/`                | Palco 1920 × 1080 (`Stage`), cálculo de escala e grade de depuração       |
| `src/content/`                  | Esquemas (Zod), validador, consultas e carregamento do conteúdo           |
| `src/design-system/`            | Medidas do grid, `fonts.css` e `tokens.css` (reúne `tokens/`)             |
| `src/design-system/tokens/`     | Cor, tipografia, espaço e forma, movimento (CSS: fonte dos tokens)        |
| `src/design-system/icons/`      | Componente `Icon` e lista dos nomes                                       |
| `src/design-system/buttons/`    | `Button`, `IconButton`, `BackButton`, `HomeButton` e a regra de toque     |
| `src/design-system/background/` | `Background`: retícula e marcas de registro                               |
| `src/motion/`                   | Espelho em TypeScript dos tokens de movimento                             |
| `src/object/`                   | `ObjectDrawing`, leitor de SVG, auditoria dos desenhos e regras de estado |
| `src/platform/`                 | O que a casca Electron conta à página (`StationInfo`) e `getStation()`    |
| `src/dev/showcase/`             | Vitrine de validação, aberta com `?showcase` (ADR 0012)                   |
| `src/styles/`                   | Estilos globais                                                           |
| `src/test/`                     | Todos os testes, em pastas que espelham `src/`, e os auxiliares (`setup.ts`, `css.ts`) |

## Palco e escala

Todo o desenho vive dentro do Palco (`Stage` no código), uma área fixa de
1920 × 1080 px lógicos. A função pura `calculateScale` encaixa o Palco na janela
mantendo 16:9: o menor dos dois fatores (largura e altura) vence e a sobra vira
faixa centralizada. No navegador de desenvolvimento a escala é aplicada por
`transform`; na casca Electron (Etapa 06), em modo quiosque, é aplicada por zoom da janela (veja "Casca Electron (Etapa 06)", no fim deste documento).

## Qualidade de código

`npm run check` roda, em sequência: conferência de tipos (TypeScript),
lint (ESLint), formatação (Prettier) e testes (Vitest). Toda etapa termina
com esse comando passando.

## Tokens, fontes e componentes base (Etapa 03)

Os tokens do Design System vivem em CSS (`src/design-system/tokens/`), reunidos por
`tokens.css` e importados uma vez em `main.tsx`. As primitivas só definem tokens
semânticos; o código de interface usa sempre o semântico. O movimento tem um
espelho em TypeScript (`src/motion/tokens.ts`), conferido por teste contra o CSS
(ADR 0010).

As fontes são arquivos WOFF2 versionados em `assets/fonts/`, declarados em
`fonts.css`, sem nenhum acesso à rede (ADR 0011). Os 12 estilos de texto são
classes CSS (`.type-display`, `.type-body`, `.type-interactive-label`…).

Os componentes base são o `Icon` (SVG embutido, herda a cor do texto), o `Button`
e suas variações (`IconButton`, `BackButton`, `HomeButton`) e o `Background`.
O botão segue a regra de toque do Design System: fica pressionado assim que o
dedo encosta, executa a ação ao soltar dentro do botão, cancela se o dedo sair
e ignora um segundo toque enquanto o primeiro estiver ativo.

A vitrine (`?showcase`) exibe tudo isso dentro do Palco e é carregada sob demanda
(ADR 0012).

## Modelo de dados e conteúdo (Etapa 04)

O conteúdo da experiência vive em `data/`, em sete arquivos JSON normalizados
(`meta`, `elements`, `materials`, `mineral-sources`, `routes`, `objects`,
`investigations`). O desenho e o conteúdo se ligam só por ids: o id do material
(`data-material`) e o id do grupo (`id` do grupo no SVG). Nenhum texto de objeto
ou material fica no código (ADR 0013).

`src/content/` tem quatro camadas, cada uma em seus arquivos:

1. **Forma** (`schemas.ts`, `parse.ts`): esquemas Zod, um por arquivo. Campo
   desconhecido, tipo errado ou id fora do padrão falham aqui.
2. **Regras** (`validate.ts`, `rules.ts`, `svg-index.ts`): ids que existem, limites
   do Design System, ligação com os grupos dos SVGs e escopo curatorial (C1).
   Cada problema tem um código estável (`unknown-material`, `why-too-long`…).
3. **Consultas** (`queries.ts`): a única porta de leitura para o resto da
   aplicação. Devolve a órbita de um objeto, com cada material `enabled` ou
   `disabled`, e a ficha de um material em um objeto, com camadas
   `available` ou `coming-soon`.
4. **Carregamento** (`load.ts`, `check.ts`): o Vite lê `data/` e `assets/` na
   compilação; `loadContent()` valida e só então monta as consultas.

A validação roda em três lugares: no `npm run build` (um erro impede o build), no
`npm run check` e no navegador (aba Conteúdo da vitrine). Em desenvolvimento, texto
de rascunho (`[TEXTO — curadoria]`) é aviso; na versão final
(`npm run validate:release`), é erro.

## Testes (Etapa 04b)

Todos os testes ficam em `src/test/`, em pastas que espelham `src/`: o teste de
`src/content/validate.ts` é `src/test/content/validate.test.ts`. Os auxiliares
(`setup.ts`, `css.ts`, `content/test-fixtures.ts`) ficam na mesma pasta. Os testes
importam o código pelo atalho `@/`, que aponta para `src/` (configurado em
`vite.config.ts` e `tsconfig.app.json`); o código de produção continua com imports
relativos, porque o script de validação roda direto no Node. O teste
`src/test/structure.test.ts` falha se algum teste aparecer fora de `src/test/`
(ADR 0015).

## Desenhos dos objetos (Etapa 05)

Cada objeto é um SVG em `assets/objects/` com três níveis de detalhe no mesmo arquivo
(`level-0-universe`, `level-1-structure`, `level-2-internal`). O arquivo só descreve
formas e grupos: cada grupo de componente declara `id`, `data-material` e `data-stroke`
(`line`, `fine`, `dashed` ou `filled`). Espessura, tracejado, cor e estado vêm do
aplicativo, por CSS (ADR 0016).

`src/object/` tem quatro partes:

1. **Leitura** (`svg-tree.ts`, `object-source.ts`): um leitor de SVG sem biblioteca, usado
   pelo componente e pela auditoria, e a leitura dos arquivos pelo Vite.
2. **Regras de estado** (`drawing-state.ts`, `drawing-measures.ts`): quais níveis e grupos
   aparecem em cada visão (`universe`, `selected`, `thumbnail`), quais grupos são
   destacados ou recuam, e as medidas do Design System.
3. **Componente** (`ObjectDrawing.tsx`, `object.css`): desenha o objeto em React, grupo por
   grupo, com `data-group` (o `id` do arquivo), `data-visible` e `data-state`. O nome
   acessível vem do conteúdo (`label`). Ainda não há animação.
4. **Auditoria** (`audit.ts`, mais `scripts/audit-svg.ts`): confere os desenhos contra as
   regras da Foundations 07. Roda com `npm run audit:svg` e não faz parte do `npm run check`.

## Casca Electron (Etapa 06)

A casca é a camada Plataforma: abre a janela, escolhe o modo (quiosque ou janela comum),
ajusta o zoom à tela e protege a página. Ela é fina de propósito: `electron/main.ts` só
liga as peças, e tudo o que dá para testar fica em módulos puros, sem importar `electron`
nem `node:*`, para rodarem no Vitest e na conferência de tipos do aplicativo.

| Arquivo                      | Papel                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `electron/main.ts`           | Cola: janela, protocolo `app://`, guardas de segurança, instância única      |
| `electron/launch-options.ts` | Lê a linha de comando e o ambiente: modo, quiosque, DevTools e ferramentas   |
| `electron/zoom.ts`           | Regra do zoom que faz o Palco de 1920 × 1080 caber na tela                   |
| `electron/security.ts`       | Origem permitida, política de segurança de conteúdo e caminhos aceitos       |
| `electron/window-options.ts` | Opções da janela e da página, como dados                                     |
| `electron/preload.cjs`       | A única ponte entre a página e a casca (CommonJS puro, exigido pelo sandbox) |
| `src/platform/`              | O que a página sabe da casca: `StationInfo` e `getStation()`                 |
| `scripts/electron-dev.ts`    | `npm run electron:dev`: servidor Vite + janela, e fecha os dois juntos       |

**Dois modos.** Em desenvolvimento (`npm run electron:dev`), a janela carrega o servidor do
Vite; só vale se `ELECTRON_RENDERER_URL` apontar para esta máquina (`localhost`, `127.0.0.1`
ou `[::1]`) e o aplicativo não estiver instalado. Em produção (`npm run electron:start`), a
janela carrega `dist/` pelo protocolo próprio `app://station/`, sem servidor e sem `file://`.

**Linha de comando** (depois de `--` nos scripts do npm):

| Opção        | Efeito                                                            | Instalado |
| ------------ | ----------------------------------------------------------------- | --------- |
| `--windowed` | Janela comum 1280 × 720, com moldura e cursor, em vez do quiosque | vale      |
| `--devtools` | Permite F12 e Ctrl+Shift+I em produção                            | ignorada  |
| `--showcase` | Abre a página com `?showcase` (não há barra de endereço)          | ignorada  |
| `--grid`     | Abre a página com `?grid`                                         | ignorada  |

**Quiosque.** Tela cheia, sem moldura, sem menu e sem cursor (CSS inserido depois do
carregamento). Alt+F4 fecha; o atalho de manutenção é da Etapa 21. Só há uma janela e uma
instância: abrir o aplicativo de novo traz a primeira janela para a frente.

**Zoom.** `computeZoomFactor` devolve `min(largura / 1920, altura / 1080)` da tela, em
pixels lógicos do Windows, limitado a 0,25 a 5. Em quiosque, a casca aplica esse fator
(Full HD: 1; 4K a 100%: 2; 4K a 150%, que o Windows vê como 2560 × 1440: 1,333), e a página
fica sempre com 1920 × 1080 px CSS, com a escala do Palco em 1. Numa tela que não é 16:9,
vence o menor fator e o Palco sobra em faixas. Em janela comum o zoom fica em 1 e o Palco se
escala sozinho, como no navegador. O fator é reaplicado quando a página carrega, quando a
janela entra em tela cheia e quando a tela muda (`display-metrics-changed`).

**Segurança** (ADR 0017). A página roda no sandbox do Chromium, com isolamento de contexto
e sem Node.js (`sandbox`, `contextIsolation`, `nodeIntegration: false`, `webviewTag: false`).
A única ponte é `window.station.getInfo()`, somente leitura, e a casca só responde à página
da própria origem. Em produção, uma política de segurança de conteúdo só deixa carregar o
que vem de `app://station`. Janelas novas e navegação para outra origem são recusadas, as
permissões do sistema (câmera, microfone, localização…) são todas negadas, e o DevTools só
existe em desenvolvimento ou com `--devtools`.

**Ainda não existe** (etapas seguintes): preparação do Windows para quiosque, início
automático, recuperação de falhas e atalho de manutenção (Etapa 21); empacotamento e
instalador (Etapa 22); atualização (Etapa 24); log em arquivo (a definir).
