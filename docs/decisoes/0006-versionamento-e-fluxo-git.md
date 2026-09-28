# 0006 — Versionamento e fluxo Git
 
- **Status:** aceita
- **Data:** 28-09-2026
 
## Contexto
 
Projeto desenvolvido em 25 etapas e distribuído para três estações físicas.
 
## Decisão
 
- A branch `main` está sempre funcional.
- Cada etapa é desenvolvida numa branch `etapa/NN-nome` e entra na `main`
  por Pull Request, com merge commit.
- Commits seguem Conventional Commits (feat, fix, docs, refactor, test, chore).
- `stage-NN`: tag anotada que marca uma etapa validada. Nunca é versão
  distribuída.
- `vX.Y.Z`: versão oficial para as estações, em Semantic Versioning,
  publicada no GitHub Releases.
- Assets são versionados junto com o código; substituir um asset mantém o
  nome do arquivo (Design System, Assets 03).
 
## Consequências
 
- O histórico mostra onde cada etapa começa e termina.
- Qualquer versão instalada pode ser reconstruída a partir da sua tag.
