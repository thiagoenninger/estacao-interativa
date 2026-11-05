# 0021 — Motion: coreografias como dados, canal de interrupção e flutuação em JS

- **Status:** aceita
- **Data:** 19/10/2026

## Contexto

O Design System descreve o movimento em três lugares: Foundations 06 (tokens e princípios),
Motion 01 a 03 (as tabelas de M01 a M07, com início, duração e curva de cada elemento) e Motion 04
(a espera M08 e as regras de interação: "um novo toque durante uma transição interrompe e
redireciona a partir dos valores atuais, sem saltos e sem fila"; "animar somente `transform` e
`opacity`"). O Roadmap escolheu o GSAP (com `@gsap/react`) para as coreografias, porque linhas do
tempo com posição em milissegundos traduzem as tabelas uma a uma, interrompem a partir dos valores
atuais e rodam fora do React.

Até a Etapa 09 o projeto só tinha o espelho dos tokens em `src/motion/tokens.ts`. As Etapas 11 a
19 vão escrever M01 a M08; esta etapa entrega a base comum, sem animar nenhuma tela.

## Decisão

- **Uma coreografia é um dado.** `defineChoreography(id, trilhas)` guarda, para cada linha da
  tabela, o nome do alvo, o início (ms), o token de duração, o token de curva, o `from` (só do que
  entra) e o `to`. Os elementos reais só entram em `channel.play(coreografia, alvos)`. Assim as
  tabelas M01 a M08 podem ser escritas e testadas (por exemplo, "M01 com cinco esferas dura
  1080 ms") sem montar tela alguma. Tudo é conferido ao definir, não ao tocar.
- **Só propriedades baratas.** Uma trilha só pode animar `opacity`, `x`, `y`, `scale`, `scaleX`,
  `scaleY`, `rotation` e as três propriedades de traço de que o M02 precisa (`strokeOpacity`,
  `strokeWidth`, `strokeDashoffset`; é a exceção aceita no risco R1 e medida no ADR 0018). Qualquer
  outra (`left`, `width`, `filter`…) é recusada.
- **As curvas vêm do CSS.** O GSAP só entende `cubic-bezier` com um plugin à parte; em vez disso,
  `easingFunction` lê a string do token (`EASING`), resolve a curva em JavaScript e entrega ao GSAP
  uma função. O CSS continua sendo a fonte, e o teste dos tokens garante que o espelho não diverge.
- **Um canal por cena, uma coreografia por vez.** `createMotionChannel().play(...)` constrói a
  linha do tempo nova antes de mexer na antiga; se um alvo obrigatório faltar, lança erro e a que
  está tocando segue intacta. Depois corta a antiga onde ela está (`kill`, nunca `revert`) e
  inicia a nova. **Não há fila.** O `play` devolve `finished`, uma promessa que termina como
  `completed`, `interrupted` ou `stopped`.
- **Redirecionar é continuar do valor atual.** A nova coreografia anima com `to` a partir do que o
  navegador mostra agora, sem salto. A duração da nova trilha é a da tabela, inteira (não é
  encurtada pelo caminho já andado). O `from` de uma trilha vale só para o par (elemento,
  propriedade) que a coreografia interrompida **não** estava movendo; o que já estava a meio
  caminho continua dali. Trilhas `optional` somem sem erro quando o alvo não existe (as linhas do
  painel "simplesmente não existem" no Estado 03).
- **A flutuação M08 é senoidal, em JavaScript.** `createFloatModel` (puro) calcula o
  deslocamento vertical (6, 4 e 3 px por plano), a rotação de ±1° (período 1,3×) e a deriva de 2 px
  (1,7×); `drawFloatParams` sorteia uma vez, por objeto, o período (8 a 14 s) e as três fases.
  Os modos são `free`, `faded` (até 3 px), `selected` (2 px, sem rotação nem deriva) e `still`.
  Trocar de modo faz a amplitude deslizar com constante de tempo de 107 ms (95% em 320 ms, a
  duração `base`), sem salto. `startFloat` escreve só o `transform`, a cada quadro do
  `gsap.ticker`, de **uma camada própria** (dentro do elemento que as coreografias movem), para
  as duas não escreverem no mesmo `transform`.
- **Ciclo de vida no React.** `useMotionChannel` cria o canal e o para quando o componente sai;
  `useFloat(ref, { depth, mode })` sorteia uma vez e inicia a flutuação. Os dois usam `useGSAP`
  (`@gsap/react`), que limpa corretamente sob o `StrictMode`.
- **Dependências exatas:** `gsap` 3.15.0 e `@gsap/react` 2.1.2 (gratuitos para uso comercial desde
  o GSAP 3.13, como diz o Roadmap).

## Pontos que o Design System não fecha, resolvidos aqui

1. **Flutuação em CSS ou em JS.** O Roadmap citava "flutuação barata" com CSS. Mas o Motion 04
   pede três senoides com períodos diferentes, fases sorteadas por objeto, amplitude por plano e
   mudança de modo sem salto (o objeto selecionado para de flutuar no toque e volta com 2 px). Isso
   não se faz com um `@keyframes` fixo. O custo é uma função por quadro por objeto escrevendo só
   `transform`.
2. **Objeto esmaecido.** "Continuam flutuando, amplitude 3 px": adotado como o menor entre os 3 px
   e a amplitude do plano; a rotação e a deriva continuam as mesmas.
3. **Objeto selecionado.** "Flutuação mínima de 2 px, sem rotação": adotado também **sem deriva**.
   Os hotspots que "acompanham" são da Etapa 14.
4. **Movimento reduzido** (`prefers-reduced-motion`): não existe no Design System e a estação é um
   quiosque; não foi implementado.

## Alternativas descartadas

- **Escrever as animações como funções do GSAP em cada tela:** espalharia as tabelas em código
  impossível de comparar com o Design System e sem teste de duração.
- **CSS `transition` e `@keyframes` para tudo:** não interrompe a partir do valor atual com
  segurança quando há várias propriedades e atrasos, e não dá a posição em ms das tabelas.
- **Web Animations API própria:** exigiria reescrever linha do tempo, escalonamento e
  interrupção que o GSAP já resolve.
- **O plugin `CustomEase` do GSAP:** é uma peça a mais para uma conta de 30 linhas, e as curvas
  já existem como texto nos tokens.
- **Uma fila de coreografias:** contraria "interação nunca espera animação".

## Consequências

- Mudam `package.json` e `package-lock.json` (duas dependências). O aplicativo **não cresce**
  enquanto nenhuma tela importar o motion; importado, o módulo tem cerca de 100 kB (34 kB
  compactados).
- A **Etapa 07b continua pendente**: o ADR 0018 pedia que ela fosse fechada antes da Etapa 10. O
  desenvolvedor decidiu em 19/10/2026 seguir com a 10 (que é infraestrutura e não fixa nenhuma
  coreografia visual) e fechar a 07b quando houver o PC com Intel Iris Xe e tela 4K. Um resultado
  ruim muda a coreografia do M02 na Etapa 13 ou 14, antes de ela existir. O custo do JavaScript do
  GSAP, que o kit da 07a (só transições de CSS) não mede, entra nessa medição.
- Cada tela das Etapas 11 a 19 escreve suas coreografias com `defineChoreography` e toca com um
  canal; a regra "um toque novo redireciona" passa a ser consequência de usar o canal, e o portão
  de toque (ADR 0020) já deixa o toque novo passar.
- Quem criar um objeto flutuante usa `useFloat` numa camada interna, nunca no elemento que uma
  coreografia move.
