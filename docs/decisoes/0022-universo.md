# 0022 — Universo: regras de layout em código, toque que chega à sessão e camadas separadas

- **Status:** aceita
- **Data:** 05/11/2026

## Contexto

Até a Etapa 10 o aplicativo abria num Palco vazio: o conteúdo (Etapa 04), os desenhos (05), a sessão (08), o toque (09) e o motion (10) existiam, mas nenhuma tela os usava. O Design System descreve o universo em vários lugares: o grid e as distâncias (Foundations 03), o toque e as margens (Foundations 04), o desenho e os tamanhos (Foundations 07), o objeto, o rótulo e o chamado (Components 01), a flutuação (Motion 04) e o estado 01 (Flows 01). A Etapa 11 junta tudo na primeira tela.

Dois pontos pediam decisão. As posições provisórias de `data/objects.json` quebravam regras do próprio Design System: bicicleta e automóvel ficavam a 69 px um do outro (o mínimo é 96 px) e o rótulo do automóvel terminava a 1019,6 px, depois dos 1016 px da área útil. E a animação de seleção (M01) só existe na Etapa 13, enquanto o toque no objeto já precisa funcionar.

## Decisão

- **Uma pasta para a tela:** `src/universe/` guarda o layout, os textos, o objeto, o chamado e a tela. O `App.tsx` carrega o conteúdo, cria **uma sessão** e a entrega por `ExperienceProvider`.
- **As regras do layout viram código.** `checkUniverseLayout` devolve os problemas das posições (`too-close`, `outside-stage`, `label-outside-safe-area`, `over-prompt` e `label-over-object`) e um teste o roda nos dados do projeto. A curadoria pode redesenhar o universo, e o teste diz se as regras do Design System continuam valendo.
- **Posições ajustadas, só duas:** bicicleta de (560, 640) para (560, 590) e automóvel de (300, 900) para (300, 880). Os outros seis objetos ficam como estavam.
- **Um objeto em camadas, cada uma com um dono:** a caixa (posição e tamanho, que as coreografias vão mover), a camada de flutuação (só a flutuação escreve o `transform`), o corpo (desenho e rótulo, que encolhe quando pressionado) e o botão de toque, parado e fora das camadas que flutuam.
- **O pressionado é CSS.** Escala 0,96 em 80 ms e o rótulo em óxido com sublinhado de 2 px, como nos botões; o canal de movimento não entra no feedback de toque.
- **O toque despacha de verdade.** Soltar dentro do alvo envia `select-object` à sessão. Como M01 só chega na Etapa 13, a tela **fica parada**: a mudança de nível aparece na leitura da sessão (`?grid`). A Etapa 13 troca a reação da tela e não mexe no toque.
- **Qualquer toque reinicia a contagem.** Um ouvinte de `pointerdown` na janela chama `session.touch()` (Flows 03), inclusive no fundo.
- **A vitrine fica com o Palco inteiro.** Com `?showcase` o universo não é desenhado, para os oito objetos flutuando não pesarem nas medições da aba Desempenho.
- **A flutuação usa `useFloat`** da Etapa 10, uma por objeto, com o plano como profundidade. O objeto aceita `faded` (20%, escala 0,85, sem rótulo, flutuação de 3 px) para a Etapa 13.
- **Textos na interface, não nos dados:** o chamado fica em `texts.ts`.

### Pontos que o Design System não fecha, resolvidos aqui

1. **O rótulo não faz parte do alvo.** O Design System fixa o alvo como "caixa do objeto + 16 px"; o rótulo começa onde a folga termina. Tocar só no texto não seleciona.
2. **Cor do rótulo no universo.** Só o pressionado e o selecionado têm cor definida; o universo usa `color-text-primary`.
3. **Largura do rótulo para o teste de layout.** Estimada em 13,4 px por letra (Plex Mono 18 px com espaçamento de 0,14 em), conferida no Chromium com diferença de cerca de 1 px.
4. **Zona do chamado.** 980 × 272 px a partir de (64, 64): título de 2 linhas (200 px), 24 px de respiro e a linha do convite (48 px).
5. **Objetos e margem.** "Objetos flutuantes podem invadir a margem, nunca a borda" e "nenhum texto fora da área útil" lidos juntos: o objeto (com a folga da flutuação) só não pode tocar a borda do Palco; o rótulo, que é texto, fica dentro da área útil.
6. **Quem cria a sessão.** O `App`, uma por aplicação, desligada ao sair. A aba Experiência da vitrine continua com a sessão dela.

## Alternativas descartadas

- **Conferir o layout só no validador de dados (`validate:data`):** é outro lugar e outra hora (no build). O teste roda em toda conferência e pode, depois, ser reaproveitado no validador pela Etapa 20.
- **Um único `<button>` com desenho e rótulo:** o alvo balançaria com a flutuação e o rótulo entraria na área de toque, fora da regra "caixa + 16 px".
- **Flutuação por `@keyframes` de CSS:** já descartada no ADR 0021 (três senoides, fases por objeto e troca de modo sem salto).
- **Pressionado pelo canal de movimento:** seria resposta atrasada a um toque que exige 80 ms, e traria o GSAP para dentro do feedback mais simples.
- **Manter o universo desenhado por baixo da vitrine:** os oito objetos flutuando mudariam os números da aba Desempenho.
- **Ligar a seleção a uma troca imediata de tela (sem animação):** é trabalho que a Etapa 13 refaria.

## Consequências

- O aplicativo **cresce**: o pacote principal passa de 225,5 kB para cerca de 446 kB (140,6 kB compactados), porque agora traz o conteúdo, os desenhos e o GSAP; a vitrine passa de 206,0 para cerca de 61 kB.
- Nenhuma dependência nova.
- Quem alterar posições em `data/objects.json` roda `npm run check`: o teste de layout acusa distância curta, objeto sobre a borda, rótulo fora da área útil e alvo sobre o chamado.
- A Etapa 13 anima a caixa de cada objeto e o chamado, e passa `faded` aos demais objetos; o toque e o despacho já estão prontos.
- Os oito objetos flutuando dão uma conta por quadro cada. O custo no Intel Iris Xe em 4K entra na medição da **07b**, que continua pendente.
- O ícone do chamado pulsa por CSS e não passa pelo motion.
