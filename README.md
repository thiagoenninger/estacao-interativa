# Estação Interativa dos Objetos

Experiência interativa para instalação permanente da Casa de Metal: telas
touchscreen em modo quiosque onde visitantes investigam objetos cotidianos e
descobrem os metais e minerais que os compõem.

> **Status:** em desenvolvimento — Etapa 07a de 25.

## Escopo

A experiência investiga exclusivamente metais, ligas, minerais, minérios,
cerâmicas, refratários e matérias-primas minerais. Outros materiais não
aparecem como opção de exploração.

## Stack

- React 19 + TypeScript 6 + Vite 8
- Vitest (testes) · ESLint + Prettier (qualidade de código)
- Zod (validação dos dados)
- Electron 44 (casca desktop, modo quiosque)
- Previsto: Zustand (estado) · GSAP (motion)

## Requisitos

- Node.js 24 LTS (o projeto recusa outras versões)
- Windows 11 (desenvolvimento e estações)

## Como rodar

```powershell
npm install          # primeira vez, ou quando o package.json mudar
npm run dev          # servidor de desenvolvimento em http://localhost:5173
```

Ferramentas de desenvolvimento, na URL ou no teclado:

- Grade de depuração: `http://localhost:5173/?grid` ou a tecla G.
- Vitrine do Design System, do conteúdo, dos objetos, da plataforma e do desempenho (cores, tipografia, ícones, botões, dados, desenhos, casca Electron, teste de desempenho): `http://localhost:5173/?showcase`.

| Comando                    | O que faz                                                          |
| -------------------------- | ------------------------------------------------------------------ |
| `npm run dev`              | Servidor de desenvolvimento                                        |
| `npm run build`            | Valida os dados, confere os tipos e gera a versão de produção      |
| `npm run preview`          | Serve a versão de produção gerada                                  |
| `npm run electron:dev`     | Abre o aplicativo desktop sobre o servidor de desenvolvimento      |
| `npm run electron:start`   | Gera a versão de produção e abre o aplicativo em tela cheia        |
| `npm run check`            | Tipos, lint, formatação, dados e testes (tudo junto)               |
| `npm run validate:data`    | Valida `data/` contra `assets/` (rascunhos viram avisos)           |
| `npm run validate:release` | Mesma validação, mas rascunhos e lacunas viram erro (versão final) |
| `npm run audit:svg`        | Audita os desenhos dos objetos (formas, grupos e níveis)           |
| `npm run format`           | Formata o código com o Prettier                                    |
| `npm run test:watch`       | Testes em modo contínuo                                            |

## Teste de desempenho

A aba **Desempenho** da vitrine mede os quadros por segundo das animações mais pesadas do projeto (espera, traço, recuo, anel e a seleção de material completa), registra os toques e a precisão dos alvos e gera um relatório para copiar. Rode no computador e na tela em que o aplicativo vai ficar:

```powershell
npm run electron:start -- --windowed --showcase
```

Maximize a janela na tela que quer medir, abra a aba **Desempenho**, escolha o tamanho (diagonal) dessa tela e toque em **Medir todas**. Cada cena dura 10 s mais 1,5 s de aquecimento: não mexa no computador enquanto mede. Os critérios e o que o teste não faz estão no ADR 0018.

## Convenções

- Código (nomes de arquivos, pastas, variáveis, componentes, comentários e commits) em inglês.
- Documentação e textos da experiência em português (ADR 0009).
- Fontes, ícones, texturas, objetos e esferas ficam em `assets/`; nenhum recurso é carregado da rede.
- O conteúdo da experiência fica em `data/` (JSON); nada de texto de objeto ou material no código (ADR 0013).
- Nomes de arquivos, pastas e ids seguem o glossário do ADR 0014.
- Os testes ficam todos em `src/test/`, em pastas que espelham `src/`, e importam o código por `@/` (ADR 0015).
- Os desenhos dos objetos só descrevem formas e grupos; traço, cor e estado vêm do aplicativo (ADR 0016).
- A casca Electron (`electron/`) é fina: a lógica que dá para testar fica em módulos puros; a página nunca acessa o Node.js (ADR 0017).
- O teste de desempenho (`src/dev/spike/`) é uma ferramenta de desenvolvimento: mede cenas fixas, com limites fixos, e a decisão sobre o resultado é tomada no hardware real (ADR 0018).

## Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [Registro de decisões](docs/decisoes/README.md)

## Versionamento

- `stage-NN` — marcos das etapas de desenvolvimento. Não são versões distribuídas.
- `vX.Y.Z` — versões oficiais instaladas nas estações (Semantic Versioning).
- Commits no padrão Conventional Commits.

## Licença

Uso restrito. Todos os direitos reservados. Licença a definir pela instituição.
As fontes IBM Plex têm licença própria (SIL Open Font License 1.1), em
`assets/fonts/LICENSE.txt`.
