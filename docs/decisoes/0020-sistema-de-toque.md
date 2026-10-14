# 0020 — Sistema de toque: um portão único para a tela inteira

- **Status:** aceita
- **Data:** 14/10/2026

## Contexto

O Design System tem as regras de toque em três lugares: Flows 02 ("Regras gerais de toque"),
Motion 04 ("Regras de interação e desempenho") e a decisão C10 do Roadmap (infravermelho,
um toque ativo por vez, os demais ignorados). Até a Etapa 08, cada botão cuidava só do seu
próprio toque (`usePress`): o estado pressionado no toque, a ação ao soltar dentro do alvo e o
cancelamento ao sair. Dentro de **um** botão o primeiro dedo já valia; entre **dois** botões, não.
Dois dedos em dois botões acionavam os dois, e um dedo no fundo não bloqueava ninguém. A
Etapa 07a mediu essa regra na aba Desempenho, mas só para contar, sem aplicá-la ao aplicativo.

## Decisão

- **Um portão para a tela inteira** (`createTouchGate`, em `src/interaction/`). Ele acompanha
  todos os ponteiros da janela, mesmo os que pousam no fundo, e só o **primeiro** vale: os
  outros são ignorados até ele soltar. O portão é puro (só segue números de ponteiros) e não
  conhece React nem o DOM.
- **Quem alimenta o portão:** `acquireTouchGate` instala os ouvintes na janela uma vez só,
  com contagem de uso, e os remove quando o último componente sai. O ponteiro que pousa é
  registrado na fase de captura (antes de qualquer alvo reagir) e liberado na fase de borbulhamento
  (depois de todos os alvos tratarem o "soltar").
- **`usePress` obedece ao portão.** Pede permissão ao pousar (`isPrimary`) e, se for outro
  dedo, ignora. `Button`, `IconButton`, `BackButton` e `HomeButton` já usam `usePress`, então
  todos passam a obedecer sem mudar de interface. O `usePress` continua em
  `src/design-system/buttons/`, junto dos botões.
- **Elemento entrando ignora o toque.** Na hora do toque, `effectiveOpacity` lê do navegador a
  opacidade real do elemento **multiplicada pela de todos os pais**; abaixo de 50%
  (`MIN_TOUCH_OPACITY`) o toque é ignorado. Isso vale para CSS e, na Etapa 10, para o GSAP, sem
  que a animação precise avisar nada. Um elemento escondido (opacidade 0) também é ignorado.
- **Outro dedo só é descartado enquanto o primeiro está na tela.** Depois que ele solta, um
  toque novo vale na hora, mesmo no meio de uma transição.
- **O portão não conhece as animações.** Quem redireciona uma transição interrompida é a Etapa 10.

### Pontos que o Design System não fecha, resolvidos aqui

1. **Flows 02 × Motion 04.** Flows 02 diz "dois toques simultâneos: vale o primeiro; o segundo é
   descartado até a transição terminar"; Motion 04 diz "um novo toque durante uma transição
   interrompe e redireciona, sem fila". Lidas juntas: o segundo dedo **simultâneo** é descartado;
   um toque **novo**, depois que o primeiro dedo soltou, interrompe a transição. Decidido pelo
   desenvolvedor em 13/10/2026.
2. **O dedo que toca num elemento entrando continua sendo "o toque".** O elemento o ignora, mas
   os outros dedos esperam ele soltar. O mesmo vale para o dedo que pousa no fundo.
3. **Um toque ignorado não roda depois.** Se o segundo dedo foi ignorado, soltar o primeiro não
   o "promove".
4. **Soltar perdido não trava a tela.** Se o "soltar" nunca chega: o mesmo `id` pousando de novo
   começa um toque novo; um dedo que o navegador chama de primeiro (`isPrimary`) quando o portão
   guarda outro dedo do mesmo tipo substitui o fantasma; um mouse solto fora da janela é
   liberado no movimento seguinte (nenhum botão apertado); a janela perdendo o foco zera tudo.
5. **Teclado.** O "clique sem ponteiro" (Enter e Espaço), que só existe para o desenvolvimento,
   não passa pelo portão.
6. **Arrastar, pinçar e toque longo.** Já estão resolvidos fora daqui: `touch-action: none` e
   `user-select: none` no `global.css`, zoom por pinça desligado na casca Electron
   (`setVisualZoomLevelLimits`). Um toque longo é só um toque longo: soltar dentro do alvo
   executa a ação; não existe gesto de toque longo.
7. **Todo portão enxerga a janela inteira.** O `TouchGateProvider` serve para dar a uma parte da
   árvore (os testes) a sua própria contagem, não para dividir a tela em áreas independentes.

## Alternativas descartadas

- **Descartar também por uma janela curta depois do toque** (por exemplo 300 ms): protege contra
  duplo toque do infravermelho, mas atrasa o visitante rápido e contraria "interação nunca espera
  animação".
- **Descartar até a transição terminar, ao pé da letra:** exige que cada animação avise quando
  começa e termina, e contraria o Motion 04.
- **Sinalizador `entering` ligado por cada animação:** é fácil de testar, mas um esquecimento
  deixa o botão tocável antes da hora; ler a opacidade real não depende de ninguém lembrar.
- **Portão guardado na store da experiência:** mistura o toque (hardware, janela inteira) com o
  estado da visita; o toque vale também para as telas de depuração, que não têm sessão.

## Consequências

- Nenhuma dependência nova e nenhuma tela muda. Os botões da vitrine, inclusive os da aba
  Experiência, já se comportam como na estação.
- `src/test/setup.ts` zera o portão compartilhado depois de cada teste.
- Quem criar um alvo de toque novo (hotspot, esfera de material, objeto do universo) deve usar
  `usePress`, para herdar as regras sem copiá-las.
- A Etapa 10 liga o redirecionamento das animações ao toque novo; esta etapa deixa a regra de
  quem **conta** como toque pronta e testada.
- O teste `consistency.test.ts` confere o portão contra `trackTouch`, a regra que a 07a mediu
  no hardware, em 2.000 sequências aleatórias: os dois aceitam e ignoram os mesmos toques.
