# Estação Interativa dos Objetos

Experiência interativa para instalação permanente da Casa de Metal: telas
touchscreen em modo quiosque onde visitantes investigam objetos cotidianos e
descobrem os metais e minerais que os compõem.

> **Status:** em desenvolvimento — Etapa 11 de 25.

## Escopo

A experiência investiga exclusivamente metais, ligas, minerais, minérios,
cerâmicas, refratários e matérias-primas minerais. Outros materiais não
aparecem como opção de exploração.

## Stack

- React 19 + TypeScript 6 + Vite 8
- Vitest (testes) · ESLint + Prettier (qualidade de código)
- Zod (validação dos dados)
- Zustand (estado da experiência)
- Electron 44 (casca desktop, modo quiosque)
- GSAP 3 + @gsap/react (motion)

## Requisitos

- Node.js 24 LTS (o projeto recusa outras versões)
- Windows 11 (desenvolvimento e estações)

## Como rodar

```powershell
npm install          # primeira vez, ou quando o package.json mudar
npm run dev          # servidor de desenvolvimento em http://localhost:5173
```

Ferramentas de desenvolvimento, na URL ou no teclado:

- Grade de depuração: `http://localhost:5173/?grid` ou a tecla G. A grade também mostra, no canto, o nível da sessão e o objeto selecionado.
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

## Experiência (máquina de estados)

A aba **Experiência** da vitrine (`?showcase`) navega pela máquina de estados com botões: escolhe objeto, material, camada, objeto relacionado, Voltar e Início, e mostra o estado, a trilha, o registro de cada evento e a contagem de inatividade (aviso aos 50 s, retorno aos 60 s). O seletor de velocidade (1×, 5×, 20×, 60×) acelera o relógio para ver o retorno automático sem esperar um minuto. **Tudo aberto (demonstração)** libera todos os materiais e camadas, porque o conteúdo provisório ainda tem poucos abertos. As regras e as decisões estão no ADR 0019.

## Toque (um dedo por vez)

A tela inteira aceita **um toque de cada vez**: o primeiro dedo que pousa vale, mesmo no fundo, e os outros são ignorados até ele soltar. Um elemento ainda entrando (opacidade abaixo de 50%) ignora o toque. A ação acontece ao soltar dentro do alvo; sair do alvo cancela. Os botões já seguem essas regras (`usePress` e `src/interaction/`); as decisões estão no ADR 0020.

## Movimento (motion)

A base das animações M01 a M08 fica em `src/motion/`: os tokens de duração e curva (espelho do CSS), o padrão de coreografia (cada tabela do Motion vira dados), o **canal** que toca uma coreografia por vez e a flutuação em espera (M08). Um toque novo durante uma transição **interrompe e redireciona a partir dos valores atuais**, sem salto e sem fila. O React decide o que existe; o GSAP decide como se move. O universo (Etapa 11) usa só a flutuação em espera; as coreografias entram a partir da Etapa 13. As decisões estão no ADR 0021.

## Universo (tela inicial)

O aplicativo abre no **universo** (Estado 01): o chamado principal no canto superior esquerdo ("Você sabe do que as coisas são feitas?") e os 8 objetos em três planos de profundidade, cada um com o seu rótulo, flutuando devagar (M08). Tocar num objeto o seleciona de verdade na sessão; a animação de seleção chega na Etapa 13, por isso a tela ainda não muda. Com `?grid`, um quadro no canto mostra o nível da sessão e o objeto selecionado. As posições dos objetos ficam em `data/objects.json` e seguem regras do Design System conferidas por teste (ADR 0022).

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
