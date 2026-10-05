# 0015 — Testes concentrados em `src/test/`, com o atalho `@/` nos imports

- **Status:** aceita
- **Data:** 02/10/2026

## Contexto

Até a Etapa 04, cada arquivo de teste ficava ao lado do código que testa
(`src/content/validate.test.ts`, `src/design-system/buttons/Button.test.tsx`…). Com a
chegada de mais etapas, as pastas do código passaram a misturar arquivos de produção e
de teste, e achar "todos os testes de uma área" exigia abrir várias pastas. O
desenvolvedor pediu para concentrar os testes em um só lugar, dividido por pastas.

## Decisão

- **Todo arquivo de teste fica em `src/test/`**, em pastas que **espelham `src/`**:
  `src/app/stage/scale.ts` é testado em `src/test/app/stage/scale.test.ts`;
  `src/content/validate.ts`, em `src/test/content/validate.test.ts`; e assim por diante.
- Os auxiliares de teste ficam junto: `setup.ts` e `css.ts` (já estavam em `src/test/`) e
  `src/test/content/test-fixtures.ts` (o conteúdo mínimo válido usado pelos testes de
  conteúdo).
- **Os testes importam o código pelo atalho `@/`**, que aponta para `src/`
  (`import { validateContent } from '@/content/validate.ts'`). O atalho é configurado em
  dois lugares: `resolve.alias` no `vite.config.ts` (vale para o Vite e para o Vitest) e
  `paths` no `tsconfig.app.json` (vale para o TypeScript e para o editor).
- **O código de produção continua com imports relativos.** O script
  `scripts/validate-content.ts` roda direto no Node 24, que não conhece o atalho, e importa
  módulos de `src/content/`; esses módulos, portanto, não podem depender do `@/`.
- **Um teste-guarda** (`src/test/structure.test.ts`) falha se existir qualquer
  `*.test.ts` ou `*.test.tsx` fora de `src/test/`. Sem ele, um teste criado ao lado do código
  continuaria rodando sem ninguém perceber a quebra da regra.
- O `include` do Vitest segue `src/**/*.test.{ts,tsx}`: ele continua achando tudo, e o
  guarda cuida da regra de lugar.
- Os arquivos foram movidos com `git mv`, para o Git guardar o histórico como renomeação.

## Alternativas consideradas

- **Testes ao lado do código (padrão da maioria dos projetos React):** imports curtos e o
  teste anda junto com o arquivo, mas mistura as pastas. Foi o que o projeto tinha.
- **Pasta `test/` na raiz do repositório:** separa de vez teste e código, mas exige mais
  ajustes de configuração (`tsconfig`, ESLint, Vite) e afasta o teste do `src`.
- **Imports relativos a partir de `src/test/`:** funcionam sem configuração, mas viram
  `../../../../src/content/validate.ts`, longos e fáceis de errar ao copiar.

## Consequências

- Para cada arquivo novo em `src/`, o teste correspondente nasce no mesmo caminho dentro de
  `src/test/`.
- Mover ou renomear um arquivo de código exige mover ou renomear o teste e ajustar o import;
  o TypeScript e o `npm run check` apontam o que ficou para trás.
- O atalho `@/` também funciona no código de produção do navegador, mas por decisão não é
  usado lá. Se um dia o script de validação passar a ser compilado em vez de rodar direto no
  Node, esta regra pode ser revista em um novo ADR.
- Caminhos de `import.meta.glob` dentro de testes contam a partir do novo arquivo
  (`../../../assets/fonts/*.woff2`, em `src/test/design-system/`) ou da raiz do projeto
  (`/src/**/*.test.ts`).
