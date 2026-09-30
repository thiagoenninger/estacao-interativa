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

## Estrutura atual do código (Etapa 03)

| Pasta                            | Conteúdo                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- |
| `assets/fonts/`                  | Fontes IBM Plex em WOFF2 e a licença                                      |
| `assets/icons/`                  | Os 12 ícones do Design System (SVG, `icon-*.svg`)                         |
| `assets/textures/`               | Retícula e marca de registro do fundo                                     |
| `src/app/`                       | Inicialização da aplicação (`App.tsx`)                                    |
| `src/app/stage/`                 | Palco 1920 × 1080 (`Stage`), cálculo de escala e grade de depuração       |
| `src/design-system/`             | Medidas do grid, `fonts.css` e `tokens.css` (reúne `tokens/`)             |
| `src/design-system/tokens/`      | Cor, tipografia, espaço e forma, movimento (CSS: fonte dos tokens)        |
| `src/design-system/icons/`       | Componente `Icon` e lista dos nomes                                       |
| `src/design-system/buttons/`     | `Button`, `IconButton`, `BackButton`, `HomeButton` e a regra de toque     |
| `src/design-system/background/`  | `Background`: retícula e marcas de registro                               |
| `src/motion/`                    | Espelho em TypeScript dos tokens de movimento                             |
| `src/dev/showcase/`              | Vitrine de validação, aberta com `?showcase` (ADR 0012)                   |
| `src/styles/`                    | Estilos globais                                                           |
| `src/test/`                      | Preparação comum dos testes e utilitários de leitura de CSS               |

## Palco e escala

Todo o desenho vive dentro do Palco (`Stage` no código), uma área fixa de
1920 × 1080 px lógicos. A função pura `calculateScale` encaixa o Palco na janela
mantendo 16:9: o menor dos dois fatores (largura e altura) vence e a sobra vira
faixa centralizada. No navegador de desenvolvimento a escala é aplicada por
`transform`; na casca Electron (Etapa 06) será aplicada por zoom da janela.
As medidas do Design System ficam num só arquivo, `measures.ts`, com testes.

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
