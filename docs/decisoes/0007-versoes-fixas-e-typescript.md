# 0007 — Versões fixas e TypeScript 6.0

- **Status:** aceita
- **Data:** 28/09/2026

## Contexto

As estações rodam por anos sem supervisão, e uma atualização silenciosa de
biblioteca pode quebrar a experiência. Além disso, em 28/09/2026 a versão mais
recente do TypeScript é a 7.0, mas o typescript-eslint (8.71) só declara
suporte a versões anteriores à 6.1.

## Decisão

- Todas as dependências são instaladas em versão exata (`save-exact=true` no
  `.npmrc`), e o `package-lock.json` é versionado.
- O TypeScript fica fixado na 6.0.3 até o typescript-eslint suportar a 7.x.
- O `package.json` declara `engines.node = ^24.0.0` e o `.npmrc` ativa
  `engine-strict`: o npm recusa instalar em outra versão do Node.
- O `vite.config.ts` interrompe `dev`, `build` e testes com uma mensagem clara se o
  Node não for o 24, já que o `engine-strict` só protege a instalação.
- Atualizações de dependências são decisões deliberadas, feitas em etapa
  própria e com `npm run check` passando.

## Alternativas consideradas

- Faixas com `^`: atualizam sozinhas na próxima instalação.
- TypeScript 7 sem o typescript-eslint: perde as regras de lint que entendem tipos.

## Consequências

- A instalação é reproduzível: `npm ci` monta exatamente o mesmo conjunto.
- Correções de segurança não chegam sozinhas; é preciso revisar periodicamente
  (`npm outdated`), o que fica registrado na Etapa 22.
- Ao trocar para o Node 26 LTS, este ADR e o `engines` são revisados.
