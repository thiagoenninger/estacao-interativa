# 0018 — Teste de desempenho: kit de medição no aplicativo, limites fixos e decisão no hardware real

- **Status:** aceita (o resultado das medições entra em outro ADR, depois da Etapa 07b)
- **Data:** 08/10/2026

## Contexto

O Roadmap põe o spike da Etapa 07 no hardware real: o risco R1 (desempenho em 4K numa placa
gráfica integrada, porque o M02 anima propriedades que exigem repintura), o R2 (espessura do
traço com zoom) e o R3 (toque infravermelho, com um toque por vez, decisão C10). O Design
System pede só `transform` e `opacity` nas animações e meta de 60 fps; a seleção de material
(M02) anima também a espessura e a opacidade do traço por grupo, e o anel se desenha.

O equipamento final só será escolhido depois que o aplicativo estiver pronto. O candidato de
referência é um painel de 43 polegadas, 3840 × 2160, toque infravermelho de 20 pontos
(precisão de 3 mm, brilho de 350 cd/m²), com mini-PC Intel Core i5-1130G7 (Iris Xe), 16 GB de
memória e Windows 11. O Design System supõe toque capacitivo e 500 cd/m²; a decisão C10 já
adotou o infravermelho, e a diferença de brilho fica para os testes de campo (Etapa 23).

## Decisão

- **Dividir a Etapa 07.** A 07a entrega o kit de medição e a primeira medição no computador de
  desenvolvimento, sem depender de equipamento. A 07b roda o mesmo kit no hardware de
  referência e registra o resultado em um novo ADR; ela precisa estar fechada **antes da
  Etapa 10** (infraestrutura de motion), quando uma surpresa de desempenho começaria a custar
  caro. As Etapas 08 e 09 não dependem dela.
- **O kit mora no aplicativo**, como a aba Desempenho da vitrine (ADR 0012), em
  `src/dev/spike/`. Se o destino da vitrine (Etapa 22) for removê-la, o kit sai junto.
- **Oito cenas sobre a mesma página**, com duas bases (universo sozinho e objeto selecionado):
  o custo de cada efeito é a diferença para a base. As cenas são a espessura do traço, o
  recuo por grupo, o recuo por cópia, o anel desenhado e a M02 completa (com e sem a cópia).
  A troca entre antes e depois se repete sem pausa: é o pior caso.
- **Medição e limites fixos.** 1,5 s de aquecimento descartado e 10 s medidos, com o instante
  de cada quadro vindo de `requestAnimationFrame`. Bom: média de 57 fps ou mais, 5% piores de
  18 ms ou menos e no máximo 2% de quadros perdidos. Ruim: média abaixo de 45 fps ou mais de
  10% de quadros perdidos. Atenção: o que ficar entre os dois. Os números vivem em
  `criteria.ts` e mudam só por um novo ADR.
- **A carga se mede pelo Palco.** O relatório informa os pixels físicos que o Palco ocupa e a
  fração do painel 4K (Full HD é 25%; a tela de 2560 × 1600 do PC de desenvolvimento, 44%).
  Isso permite comparar medições de telas diferentes.
- **Toque.** `trackTouch` aplica a regra do Design System (o primeiro dedo vale, os outros são
  ignorados até ele terminar) e conta o que o painel entrega: dedos ao mesmo tempo, toques
  muito curtos e deslocamento. Quadrados de 32 a 112 px medem onde o dedo cai em relação ao
  centro, em milímetros, para a diagonal informada.
- **Um relatório em Markdown**, copiável, com o ambiente, as cenas, o toque e os alvos. Ele
  avisa quando o desenho é feito por software (SwiftShader, llvmpipe) e não pela placa.
- **A mitigação do R1 é medida, não adotada.** O recuo por cópia (cruzar a opacidade de duas
  cópias do desenho) fica ao lado do recuo por grupo para a 07b comparar. Qualquer mudança
  visual volta para decisão do Thiago, como diz o Roadmap.

## Alternativas consideradas

- **Esperar o hardware e fazer a Etapa 07 inteira depois:** pararia o desenvolvimento sem
  necessidade; as Etapas 08 e 09 não dependem do resultado.
- **Medir com o painel de desempenho do DevTools:** depende de quem mede, não se repete e não
  gera relatório.
- **Uma biblioteca de medição (como o stats.js) ou testes automáticos no CI:** o CI não tem a
  placa gráfica real, e a biblioteca seria uma dependência a mais para uma conta de 30 linhas.
- **Simular o 4K numa tela Full HD forçando o fator de escala:** o fator muda o tamanho do
  pixel, não quantos pixels a placa desenha; o número sairia errado e pareceria confiável.
- **Medir só a M02 completa:** diria que está lento, mas não o quê. As cenas por efeito dizem
  onde cortar.

## Consequências

- Nenhuma medição vale sem o chip gráfico real. Se o relatório disser SwiftShader, llvmpipe ou
  "indisponível", a medição é refeita.
- O kit mede transições de CSS. Se a Etapa 10 usar GSAP, o custo do JavaScript se soma, e a
  medição se repete nos testes de campo (Etapa 23).
- A 07b não exige o equipamento final: serve qualquer computador com Intel de 11ª geração (Iris
  Xe) ligado a uma tela 4K. Para o 4K de verdade, nada substitui uma tela 4K.
- Um resultado ruim muda a coreografia do M02 antes da Etapa 10, não depois dela.
- A vitrine ganha cerca de 21 kB (só carregados com `?showcase`); o aplicativo não muda de
  tamanho. Os testes ficam em `src/test/dev/spike/` (ADR 0015).
