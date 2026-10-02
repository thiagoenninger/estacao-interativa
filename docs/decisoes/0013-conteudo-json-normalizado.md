# 0013 — Conteúdo em JSON normalizado, validado por Zod e por regras próprias

- **Status:** aceita
- **Data:** 02/10/2026

## Contexto

O Design System liga desenho e conteúdo só por dois ids: o do material e o do grupo
no SVG. Os objetos são 8 hoje e podem crescer; o texto vai ser escrito pela
curadoria ao longo das etapas seguintes. O ADR 0005 já decidiu pelo modelo
normalizado; esta etapa o torna concreto. Um erro de conteúdo (id que não existe,
texto grande demais, grupo que mudou de nome no SVG) não pode chegar a um quiosque.

## Decisão

- **Sete arquivos JSON em `data/`:** `meta`, `elements`, `materials`, `mineral-sources`,
  `routes`, `objects`, `investigations`. Um material existe uma vez; a relação
  objeto × material (a "investigação") guarda o que é só daquele par: onde o material
  aparece, o porquê, camadas que mudam e objetos relacionados.
- **Zod valida a forma** (`schemas.ts`): tipos, campos obrigatórios, ids em minúsculas
  com hífen, nomes de arquivo. Objetos estritos: campo desconhecido é erro.
- **Regras próprias validam o que cruza arquivos** (`validate.ts`), cada uma com um código
  estável: ids únicos e existentes, arquivos que existem, grupos que existem no SVG
  e são do material certo, limites do Design System (3 a 8 materiais por objeto,
  até 6 lugares por material, até 5 camadas, até 4 relacionados, 3 dados por ficha,
  `why` com até 180 caracteres), objeto relacionado que contém o mesmo material e
  escopo curatorial (C1: borracha, polímeros, vidro, silício e afins nunca entram no
  catálogo). Os limites ficam em `rules.ts`, fora do Zod.
- **Camada de consultas** (`queries.ts`): o resto da aplicação não lê JSON. Pede a
  órbita de um objeto ou a ficha de um material. Material sem ficha completa vira
  nó `disabled`; camada sem texto vira `coming-soon` ("EM BREVE").
- **Rascunho e ausência são coisas diferentes.** Texto entre colchetes
  (`[TEXTO — curadoria]`, `[VALOR]`) é rascunho: o campo existe, falta escrever.
  `null` é ausência intencional e nunca é erro.
- **Modo desenvolvimento e modo release.** Erro de estrutura sempre falha. Rascunho e
  objeto com menos de 3 materiais são **aviso** em desenvolvimento e **erro** em
  `npm run validate:release`. Assim a equipe trabalha com conteúdo incompleto, mas a
  versão final não sai com marcador de rascunho.
- **A validação bloqueia o build:** `npm run build` começa por `validate:data`. O
  script `scripts/validate-content.ts` roda direto no Node 24 (remoção de tipos),
  sem ferramenta extra.
- **Aviso, não erro, para material de desenho fora do catálogo:** se um SVG usa um
  material que não está no catálogo nem na lista de fora do escopo (hoje, chumbo e
  platina no automóvel), o validador avisa (`svg-unmapped-material`).

## Alternativas consideradas

- **Um JSON único por objeto, com tudo dentro:** repete a ficha do alumínio em cada
  objeto e dificulta corrigir um texto uma vez só.
- **Banco de dados ou CMS:** a experiência é offline e o conteúdo muda por versão,
  não ao vivo; JSON no Git dá histórico e revisão.
- **Só TypeScript (sem Zod):** não valida o JSON em tempo de execução nem dá mensagem
  clara de onde está o erro.
- **Rascunho como erro sempre:** travaria o trabalho enquanto a curadoria escreve.

## Consequências

- Escrever conteúdo é editar JSON, e o `npm run validate:data` aponta o arquivo e o
  campo de qualquer erro.
- Um teste com o conteúdo real garante que a bicicleta (objeto de referência)
  continua completa; os demais objetos têm a estrutura e os textos de rascunho.
- Trocar o nome de um grupo no SVG sem atualizar `investigations.json` quebra o build
  (`svg-group-missing`), que é o comportamento desejado.
- O catálogo tem 7 materiais (alumínio, aço, cobre, lítio, cobalto, ouro, neodímio).
  Esferas de borracha, polímeros, vidro e silício, que o Design System lista, não são
  entregues por estarem fora do escopo (C1).
