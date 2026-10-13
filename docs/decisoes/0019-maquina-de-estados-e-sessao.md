# 0019 — Máquina de estados pura, store Zustand e serviço de inatividade com relógio injetável

- **Status:** aceita
- **Data:** 09/10/2026

## Contexto

O Roadmap decidiu que a Matriz de interações do Design System (Flows 02) vira uma tabela
testável (estado + evento → novo estado), que o estado fica numa store Zustand e que a
inatividade é um serviço ligado à máquina desde a Etapa 08. As regras estão nos Fluxos 01 a 03:
quatro níveis de profundidade, Voltar que desfaz um nível, Início que leva direto ao universo,
troca de material dentro do mesmo nível, objeto relacionado que abre o outro objeto com o mesmo
material, aviso aos 50 s, retorno aos 60 s e qualquer toque reiniciando a contagem.

As telas ainda não existem (Etapas 11 a 19) e o sistema de toque e o motion também não (Etapas
09 e 10). A máquina precisa ser fechada e testada antes deles, sem depender de nenhum.

## Decisão

- **A máquina é uma função pura.** `transition(estado, evento, catálogo)` devolve o próximo
  estado, e devolve **o mesmo objeto** quando o evento não muda nada, o que permite comparar
  com `===`. Não há tempo, React nem Zustand dentro dela. Mora em `src/experience/`.
- **A Matriz de interações é uma tabela:** `TRANSITIONS[nível][evento]`. Uma linha da matriz
  marcada como "—", "Sem ação" ou "Não existe" é simplesmente uma entrada que não existe. Um
  teste confere a tabela contra a matriz, nível por nível.
- **O estado é um dado simples:** nível (`universe`, `object`, `material`, `layer`), objeto,
  material, camada, item de "Presente em" destacado, trilha (no máximo 4 nós) e se o aviso de
  retorno está na tela. O início de uma visita é `INITIAL_STATE`, congelado: o retorno
  automático devolve exatamente ele, sem memória do visitante anterior.
- **A máquina não lê o conteúdo.** Ela faz perguntas de sim ou não a um **catálogo**: o
  objeto existe, o material abre, o item existe, a camada abre, o objeto relacionado abre.
  `createCatalog(index)` responde a partir de `src/content`: material desabilitado (ficha
  incompleta), camada "EM BREVE" e objeto relacionado sem o material aberto não abrem. Os
  testes da máquina usam um catálogo feito à mão.
- **Zustand 5.0.15, versão exata, guarda o estado e avisa o React.** É a primeira dependência
  nova desde o Electron. Usamos `zustand/vanilla` para a store (que também funciona fora do
  React) e `useStore` nos ganchos `useExperience(seletor)` e `useSession()`.
- **A sessão junta a store e o serviço de inatividade**, uma por estação, sem nada
  compartilhado (Flows 03). `session.dispatch(evento)` roda a máquina e conta como toque,
  mesmo quando o evento não muda nada; `session.touch()` conta um toque que a máquina não
  modela.
- **O serviço de inatividade só pergunta e avisa.** Pergunta se o visitante está fora do
  universo, e manda a máquina avisar (50 s) e voltar (60 s). Qualquer toque reinicia a
  contagem do zero. Os tempos são constantes (`IDLE_WARN_AFTER_MS`, `IDLE_RETURN_AFTER_MS`).
- **O relógio é injetado.** O serviço usa um `Clock` (`now`, `setTimeout`, `clearTimeout`). A
  produção usa o relógio do sistema, os testes usam um relógio falso que só anda quando o
  teste manda, e a aba Experiência usa um **relógio acelerado** (1×, 5×, 20×, 60×) que troca
  de velocidade sem salto no tempo e reagenda os temporizadores já criados.
- **Os controles de depuração são a aba Experiência da vitrine.** Cada botão manda um evento
  da matriz, inclusive os que o nível atual ignora, para que "nada acontece" também apareça no
  registro. Um seletor troca entre o conteúdo real e um catálogo de demonstração com tudo
  aberto, porque no conteúdo provisório só a bicicleta tem materiais abertos e o objeto
  relacionado não poderia ser testado.

### Pontos que o Design System não fecha, resolvidos aqui

Cada um é uma linha na tabela ou na função de transição e pode ser trocado sem mexer no resto.

1. **No universo não há aviso.** Os Fluxos dizem "de qualquer estado", mas voltar ao universo
   estando nele não faz nada, e um aviso "Voltando ao início" seria falso. O serviço não corre
   no universo.
2. **Tocar de novo no item "Presente em" destacado desliga o destaque.** A matriz só diz
   "destaca os hotspots". Trocar de material, abrir camada ou voltar também limpam o destaque.
3. **A camada não reage a objeto esmaecido nem a item de "Presente em"** (a matriz traz "—").
4. **O objeto relacionado abre no nível de material**, com o mesmo material selecionado e a
   camada fechada (Fluxos 01: "abre o outro objeto já com o mesmo material selecionado").
5. **Tocar na esfera de material estando na camada fecha a camada**, também quando é o
   material que já estava aberto.
6. **Durante o aviso, qualquer toque o fecha e também faz a sua ação.** É a leitura de "qualquer
   toque reinicia a contagem". Se o Thiago preferir que o primeiro toque só feche o aviso, a
   mudança é de uma linha em `transition`.
7. **A trilha é provisória.** Guarda objeto, material, objeto relacionado (até 4 nós, os mais
   antigos saem). Trocar de material substitui o último material em vez de empilhar; Voltar
   ao objeto tira o material; escolher outro protagonista começa uma trilha nova. A posição e o
   desenho ficam para a Etapa 18 (decisão C5), que pode ajustar as regras.

## Fora do escopo desta etapa

O sistema de toque (um toque por vez, bloqueio de elementos que ainda estão entrando) é a
Etapa 09. A interrupção de transições no meio da animação e as coreografias são a Etapa 10 em
diante. A tela do aviso de retorno, a barra de contagem e o M07 são a Etapa 19. A trilha
desenhada é a Etapa 18. Aqui a máquina só decide o estado seguinte.

## Alternativas consideradas

- **`useReducer` com Context:** o Roadmap já o descartou. Cada mudança renderiza de novo toda a
  árvore que lê o contexto, e o serviço de inatividade precisaria viver dentro do React, o que
  o torna mais difícil de testar.
- **XState:** modela bem máquinas de estado, mas traz uma dependência grande e uma linguagem
  própria para uma tabela de quatro níveis e nove eventos. A tabela em TypeScript é mais curta
  e os testes a conferem contra a matriz.
- **Store própria com `useSyncExternalStore` (uns 30 linhas):** evitaria a dependência, mas
  repete o que o Zustand já faz bem, e o Roadmap já escolheu o Zustand.
- **Temporizador por polling (`setInterval` de 100 ms):** mais simples de acelerar, mas acorda
  o processador sem necessidade e o aviso viria com até 100 ms de atraso. O relógio injetável
  mantém o `setTimeout` exato.
- **Guardar o estado do aviso só no serviço:** o aviso é um estado da experiência (08 no mapa
  de estados) e as telas precisam lê-lo pela mesma store.

## Consequências

- A Etapa 09 liga o toque a `session.dispatch`, e as Etapas 11 a 19 só leem a store
  (`useExperience`) e mandam eventos. Nenhuma tela decide para onde ir.
- `package.json` e `package-lock.json` mudam: `zustand` entra em `dependencies` com a versão
  exata `5.0.15`, e o `npm` marca duas entradas do lock (`@types/react` e `csstype`) como
  `devOptional`, porque o Zustand declara o React como dependência par opcional.
- O pacote principal do aplicativo quase não muda (+0,5 kB); a vitrine ganha cerca de 15,7 kB
  (4,0 kB comprimidos), só carregados com `?showcase`. Quando as telas passarem a usar a store, o
  Zustand entra no pacote principal.
- O tipo `Catalog` é a fronteira entre a experiência e o conteúdo: mudar o formato dos dados
  não mexe na máquina.
- Os testes (143 novos) ficam em `src/test/experience/` e `src/test/dev/showcase/` (ADR 0015).
  Um teste com 24 000 eventos aleatórios (e semente fixa) confere, depois de cada evento, que o
  estado respeita as regras: por exemplo, o universo está vazio e a trilha nunca passa de 4 nós.
