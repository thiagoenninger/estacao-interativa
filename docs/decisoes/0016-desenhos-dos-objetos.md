# 0016 — Desenhos dos objetos: o arquivo descreve formas, o aplicativo decide o resto

- **Status:** aceita
- **Data:** 05/10/2026

## Contexto

Cada objeto é um SVG com três níveis de detalhe no mesmo arquivo (Foundations 07). Os
oito desenhos da Etapa 04 ainda carregavam decisões que, pela decisão C12 do Roadmap,
pertencem ao aplicativo: `stroke-width` em cada grupo, `width` e `height` na raiz,
`vector-effect`, `style="display:none"` no nível 2, `stroke-dasharray` e o nome do objeto
em português (`aria-label` e `<title>`). Faltavam também o componente que desenha o objeto
em cada estado e uma verificação automática de que os desenhos seguem as regras.

## Decisão

- **O arquivo só descreve formas e grupos.** A raiz declara `viewBox`, `fill="none"`,
  `stroke="currentColor"` e pontas arredondadas. Três grupos de nível, nesta ordem:
  `level-0-universe`, `level-1-structure` e `level-2-internal`. Dentro de cada nível, grupos
  de componente com `id`, `data-material` e `data-stroke` (`line`, `fine`, `dashed` ou
  `filled`), e opcionalmente `data-hotspot="x,y"`. Todo traço pertence a um grupo.
- **O aplicativo decide traço, cor e estado, por CSS** (`src/object/object.css`): 2,6 px no
  universo, 3,2 px no selecionado e 2,2 px na miniatura; `fine` e `dashed` a 0,62 × (dash
  `7 6`); `non-scaling-stroke` em todos os elementos; destaque a 1,35 × com
  `color-state-active`; recuo com `opacity-object-recede` (20%), por grupo e sem máscara.
  O que o arquivo disser sobre espessura, tracejado, opacidade ou tamanho é ignorado.
- **O nome acessível vem do conteúdo.** O componente recebe `label` (o nome do objeto em
  `data/objects.json`) e o aplica à imagem. Os arquivos não carregam `role`, `aria-label`
  nem `<title>`: o texto em português fica em um único lugar, o modelo de conteúdo.
- **Três visões.** `universe` (nível 0, 2,6 px), `selected` (níveis 0 e 1, 3,2 px; o nível 2
  só aparece para o material selecionado, e só os grupos desse material) e `thumbnail`
  (nível 0, 2,2 px). Destaque e recuo existem só em `selected`. Se o material escolhido não
  existe no desenho, todos os grupos recuam.
- **Um leitor de SVG próprio**, `src/object/svg-tree.ts` (cerca de 100 linhas, sem
  biblioteca), usado pelo componente e pela auditoria. Não usa `DOMParser`, que o Node não
  tem, e assim os dois leem o arquivo do mesmo jeito.
- **O componente monta elementos React a partir da árvore**, em vez de `innerHTML`. Mudar
  de material altera atributos dos mesmos elementos, sem recriá-los, o que permite à
  Etapa de motion animar o recuo e a revelação.
- **No DOM, o `id` do grupo vira `data-group`.** O universo mostra oito desenhos ao mesmo
  tempo e vários grupos têm o mesmo nome (`frame`, `body`…): ids repetidos são inválidos em
  HTML. O código procura um grupo com `[data-group="frame"]` dentro do `svg` do objeto, e
  `presentIn.groups` continua falando dos ids do arquivo.
- **Auditoria à parte:** `npm run audit:svg` (`scripts/audit-svg.ts`, lógica em
  `src/object/audit.ts`). Ela só lê; os arquivos são corrigidos fora dela. Cada problema tem
  código estável: erros (`svg-syntax`, `file-name`, `root-viewbox`, `root-attribute`,
  `forbidden-element`, `forbidden-attribute`, `fixed-color`, `loose-shape`, `level-missing`,
  `level-order`, `level-unknown`, `group-id`, `group-duplicate`, `group-material`,
  `group-stroke`, `nested-group`, `hotspot-format`, `hotspot-outside`, `hotspot-too-many`,
  `level-2-too-many`) e avisos (`ignored-attribute`, `inline-style`,
  `accessible-name-in-file`, `dense-strokes`). Com `--release`, avisos também reprovam.
  O script não faz parte do `npm run check` nem do build: roda quando se quiser.
- **Densidade:** a regra dos 6 px entre traços paralelos é conferida só para círculos e
  elipses concêntricos, no tamanho do plano do objeto (universo) e na caixa do selecionado.
  Os demais casos continuam sendo revisão visual em 120, 340 e 640 px, na aba Objetos da
  vitrine.
- **Os oito desenhos foram corrigidos de forma mecânica**: removidos `width`, `height`,
  `vector-effect`, `role`, `aria-label`, `<title>`, `stroke-width`, `stroke-dasharray` e
  `style="display:none"`. Nenhuma forma foi alterada.

## Alternativas consideradas

- **Manter `stroke-width` no arquivo:** o designer veria o traço final na ferramenta
  vetorial, mas o valor teria de acompanhar o tamanho de cada uso (2,6, 3,2, 2,2 px); a
  decisão C12 já tinha tirado isso do arquivo.
- **`DOMParser` no navegador e uma biblioteca de XML no Node:** dois leitores que poderiam
  discordar, e uma dependência a mais. Os desenhos usam só tags e atributos.
- **`innerHTML` com o texto do SVG:** mais curto, mas troca todos os elementos a cada
  mudança de estado, o que impede transições de CSS ou de GSAP no recuo.
- **Nome acessível dentro do SVG:** mais simples, mas duplica o nome do objeto e deixa o
  texto da experiência fora do modelo de conteúdo (ADR 0013).
- **Auditoria que corrige sozinha (`--fix`):** mais poder, mas pode alterar o desenho sem
  revisão.
- **Auditoria dentro do `npm run check`:** reprovaria qualquer SVG novo ainda em
  acabamento; ficou fora por decisão do desenvolvedor.

## Consequências

- Um SVG novo ou revisado passa por `npm run audit:svg` antes de entrar. A Etapa 25
  (manual de conteúdo) deve citar o comando.
- O componente só conhece três grupos de atributos (`data-material`, `data-stroke`, o
  nível pelo `id`); `data-hotspot` já é validado, mas só será usado quando os hotspots
  entrarem na experiência.
- Os hotspots ainda não existem nos oito desenhos: o limite de 6 por material e a posição
  dentro do `viewBox` já são conferidos, a ausência não é.
- O objeto flutuante do universo (tamanhos 340, 260 e 200, toque, esmaecido) é um componente
  de outra etapa e usará `ObjectDrawing` em `universe`.
- Os testes do componente, da auditoria e do CSS ficam em `src/test/object/` (ADR 0015).
