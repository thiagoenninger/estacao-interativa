# 0014 — Nomes em inglês para assets, ids e chaves de dados (glossário)

- **Status:** aceita
- **Data:** 02/10/2026

## Contexto

O ADR 0009 definiu código, arquivos e pastas em inglês. O kit de design chegou com
nomes em português (`objetos`, `esferas`, `bicicleta.svg`, `data-tipo`, grupos como
`carroceria` e `pneus`) e o Roadmap (C12 e C13) usava esses nomes. Antes de criar os
dados, os nomes precisam ficar definitivos, porque ids de grupo no SVG e no JSON
precisam coincidir para sempre.

## Decisão

Todos os nomes técnicos passam para o inglês. Textos que o visitante lê continuam em
português. Este glossário substitui os nomes em português do Roadmap (C12 e C13).

**Pastas:** `assets/objects`, `assets/materials`, `assets/minerals`, `assets/photos`,
`assets/icons`, `assets/textures`, `assets/fonts`, e `data/`.

**Arquivos:** `object-<name>.svg`, `material-<id>-sphere.png`, `mineral-<name>.png`,
`photo-<theme>-<nn>.jpg`, `icon-<name>.svg`. As texturas da Etapa 03 mantêm o nome
(`lattice.svg`, `registration-mark.svg`).

**Níveis do desenho:** `level-0-universe`, `level-1-structure`, `level-2-internal`.

**Atributos nos SVGs:** `data-material` (id do material), `data-stroke` (valores `line`,
`fine`, `dashed`, `filled`; antes `data-tipo`) e `data-hotspot` (previsto).

**Objetos:** `car`, `bicycle`, `phone`, `headphones`, `can`, `laptop`, `pot`, `watch`.

**Materiais do catálogo:** `aluminium`, `steel`, `copper`, `lithium`, `cobalt`, `gold`,
`neodymium`. Grafia `aluminium` (IUPAC). Nos desenhos aparecem também materiais fora
do catálogo: `rubber`, `polymers`, `glass`, `silicon` (fora do escopo, C1), e `lead`,
`platinum` (ainda sem decisão: o validador avisa).

**Planos:** `near`, `mid`, `far`.

**Chaves do JSON:** `nome`→`name`, `plano`→`plane`, `posicao`→`position`,
`materiais`→`materials`, `familia`→`family`, `simbolo`→`symbol`,
`numeroAtomico`→`atomicNumber`, `classificacao`→`classification`, `esfera`→`sphere`,
`grupos`→`groups`, `dados`→`facts`, `rotulo`→`label`, `valor`→`value`,
`presenteEm`→`presentIn`, `porque`→`why`, `camadas`→`layers`, `titulo`→`title`,
`texto`→`text`, `imagem`→`image`, `credito`→`credit`, `relacionados`→`related`.

**Camadas de um material:** `origin`, `production`, `uses`, `curiosities`.

**Ids de grupo nos SVGs** (tradução pela troca de nome; o desenho não foi tocado):

| Objeto     | Português → inglês |
| ---------- | ------------------ |
| car        | carroceria→body, vidros→windows, pneus→tires, rodas→wheels, farois→headlights, portas→doors, motor→engine, bateria_auto→car-battery, catalisador→catalytic-converter, radiador→radiator |
| bicycle    | pneus→tires, aros→rims, quadro→frame, garfo→fork, guidao→handlebar, selim→saddle, transmissao→drivetrain, corrente→chain, cubos→hubs, raios→spokes, freios→brakes, cabos→cables, farol→headlight |
| phone      | corpo→body, tela→screen, botao→button, alto_falante→speaker, cameras→cameras, lateral→side-frame, placa→circuit-board, chip→chip, trilhas→traces, bateria→battery, conectores→connectors, bobina→coil |
| headphones | arco→headband, conchas→ear-cups, almofadas→ear-pads, haste→slider, cabo→cable, driver→driver, bobina→coil, fiacao→wiring |
| can        | corpo→body, tampa→lid, anel→pull-ring, gargalo→neck, costura→seam, verniz→lacquer, parede→wall |
| laptop     | tampa→lid, tela→screen, base→base, dobradica→hinge, teclado→keyboard, trackpad→trackpad, portas→ports, placa→motherboard, processador→processor, memoria→memory, bateria→battery, cooler→cooler |
| pot        | corpo→body, borda→rim, cabo→handle, rebites→rivets, interior→interior, fundo_aco→steel-base, fundo_aluminio→aluminium-base, alma_cabo→handle-core |
| watch      | pulseira→strap, caixa→case, mostrador→dial, ponteiros→hands, coroa→crown, marcadores→markers, movimento→movement, bateria_rel→watch-battery, quartzo→quartz-crystal |

**Padrão de ids:** minúsculas, sem acento, hífen como separador
(`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`). O Zod recusa qualquer outro.

**Fica em português dentro dos SVGs:** `aria-label` e `<title>`, que são texto para o
leitor de tela. A limpeza deles é da auditoria da Etapa 05.

## Alternativas consideradas

- **Manter os nomes em português nos SVGs e traduzir só no código:** dois nomes para a
  mesma coisa, com tabela de tradução para manter. Foi descartada.
- **Migrar só na Etapa 05, junto com a auditoria:** os dados já nasceriam com ids que
  mudariam logo depois.

## Consequências

- Os arquivos do kit e os do repositório têm nomes diferentes; este glossário é a ponte.
- O Design System e o Roadmap seguem com os nomes antigos nos textos; vale a leitura
  deste ADR quando houver divergência.
- Um novo objeto segue os mesmos padrões e entra com os mesmos testes.
