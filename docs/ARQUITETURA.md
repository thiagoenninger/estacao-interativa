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

## Estrutura atual do código (Etapa 02)

| Pasta                | Conteúdo                                                        |
| -------------------- | --------------------------------------------------------------- |
| `src/app/`           | Inicialização da aplicação (`App.tsx`)                          |
| `src/app/stage/`     | Palco 1920 × 1080 (`Stage`), cálculo de escala e grade de depuração |
| `src/design-system/` | Medidas do grid (`measures.ts`) e tokens de cor (`tokens.css`)  |
| `src/styles/`        | Estilos globais                                                 |
| `src/test/`          | Preparação comum dos testes                                     |

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
