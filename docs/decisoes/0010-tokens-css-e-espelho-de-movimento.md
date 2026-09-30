# 0010 — Tokens do Design System em CSS, com espelho em TypeScript apenas para movimento

- **Status:** aceita
- **Data:** 29/09/2026

## Contexto

A Etapa 03 traz para o código os tokens do Design System: cor, tipografia,
espaço, forma, traço, opacidade, profundidade, toque e movimento. Eles são
usados em dois lugares: nos estilos (CSS) e, no caso do movimento, também no
JavaScript (GSAP, temporizadores de ociosidade). É preciso decidir onde cada
número mora, para que nunca existam dois valores diferentes para a mesma coisa.

## Decisão

- **O CSS é a fonte** de todos os tokens: `src/design-system/tokens/` (`color.css`,
  `typography.css`, `space-shape.css`, `motion.css`), reunidos por `tokens.css`,
  importado uma única vez em `src/main.tsx`.
- **Primitivas só definem tokens semânticos.** O código de interface usa sempre o
  token semântico (`--color-text-primary`), nunca a primitiva (`--ink-900`).
- **Movimento tem um espelho em TypeScript**, `src/motion/tokens.ts`, porque
  animações em JavaScript precisam dos números. Um teste
  (`src/motion/tokens.test.ts`) lê o CSS e falha se qualquer valor divergir.
  As regras de ociosidade (`IDLE`) só existem em TypeScript, porque só o
  JavaScript as usa.
- **Cores, tipografia, espaço e forma não têm espelho.** Se um dia o JavaScript
  precisar de um deles, lê-se o valor do CSS ou cria-se o espelho com o mesmo
  tipo de teste.
- **Cores com transparência** usam `color-mix(in srgb, …)` sobre a primitiva, para
  que a cor e a opacidade continuem ligadas ao token de origem.
- **Testes de tokens** conferem o Design System: existência dos 22 tokens
  semânticos, mapeamentos, contrastes prometidos (arredondados a uma casa
  decimal), ausência de `var()` sem definição e as escalas de espaço, forma,
  traço, opacidade e profundidade.

## Glossário das primitivas de cor

Os nomes das primitivas passam para o inglês (ADR 0009). Este quadro complementa
o glossário do ADR 0009.

| Design System (português) | Nome no código    | Valor     |
| ------------------------- | ----------------- | --------- |
| papel-50                  | `--paper-50`      | `#F2F3EE` |
| papel-100                 | `--paper-100`     | `#E6E7E1` |
| papel-200                 | `--paper-200`     | `#D9DBD3` |
| papel-300                 | `--paper-300`     | `#B3B7AC` |
| lápis-500                 | `--pencil-500`    | `#646861` |
| grafite-700               | `--graphite-700`  | `#454943` |
| tinta-900                 | `--ink-900`       | `#1C1E1B` |
| óxido-500                 | `--oxide-500`     | `#A33A22` |
| óxido-700                 | `--oxide-700`     | `#7F2C18` |
| malaquita-600             | `--malachite-600` | `#2F6B55` |
| branco                    | `--white`         | `#FFFFFF` |

Outros termos que entram no glossário nesta etapa:

| Conceito (Design System)                                                                                                  | Nome no código                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Fundo                                                                                                                     | `Background`                                                                                                               |
| Retícula                                                                                                                  | `lattice`                                                                                                                  |
| Marca de registro                                                                                                         | `registration mark`                                                                                                        |
| Botão interativo                                                                                                          | `Button` (`primary`, `secondary`)                                                                                          |
| Botão de ícone                                                                                                            | `IconButton`                                                                                                               |
| Botão Voltar                                                                                                              | `BackButton`                                                                                                               |
| Botão Início                                                                                                              | `HomeButton`                                                                                                               |
| Etiqueta interativa                                                                                                       | `interactive label`                                                                                                        |
| Vitrine                                                                                                                   | `showcase`                                                                                                                 |
| Ícones: voltar, início, informação, fechar, explorar, próximo, anterior, aprofundar, conexões, toque, som, acessibilidade | `back`, `home`, `info`, `close`, `explore`, `next`, `previous`, `deepen`, `connections`, `touch`, `sound`, `accessibility` |

## Alternativas consideradas

- **Tokens em TypeScript, gerando o CSS:** exige uma etapa de geração e esconde
  do CSS a origem dos valores.
- **Nomes de primitivas em português:** contrariam o ADR 0009.
- **Espelho em TypeScript para todos os tokens:** duplica valores que o
  JavaScript não usa.

## Consequências

- Uma mudança de valor é feita em um só arquivo; o teste avisa se o espelho de
  movimento ficou para trás.
- Nenhum componente pode escrever um valor de cor, espaço ou tempo à mão.
- As primitivas em inglês têm de ser lembradas ao ler o Design System em
  português; o quadro acima é a tradução oficial.
