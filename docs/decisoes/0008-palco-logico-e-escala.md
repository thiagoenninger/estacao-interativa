# 0008 — Palco lógico e escala por transform

- **Status:** aceita
- **Data:** 28/09/2026

## Contexto

O ADR 0004 definiu Full HD (1920 × 1080) como resolução de design e programação,
com compatibilidade automática para telas maiores. É preciso um ponto único que
garanta isso desde a primeira linha de interface.

## Decisão

- Toda a interface é desenhada dentro do Palco (`Stage` no código), uma área fixa de 1920 × 1080 px.
- No navegador de desenvolvimento, o Palco é encaixado na janela por `transform`
  (translate + scale, origem no canto superior esquerdo), mantendo 16:9, com
  faixas (letterbox) centralizadas quando a proporção da janela difere.
- O cálculo fica numa função pura (`calculateScale`), coberta por testes.
- As medidas do Design System (margem, colunas, zonas, órbita) ficam em um único
  módulo, `src/design-system/measures.ts`, também com testes.
- Na Etapa 06, a casca Electron passa a aplicar o zoom da janela; dentro dela o
  Palco deixa de usar `transform` (fator 1).

## Alternativas consideradas

- Layout responsivo em porcentagem ou `vw`: perde o controle exato dos pixels do
  Design System.
- Dois layouts (Full HD e 4K): dobra o trabalho e a chance de divergência.

## Consequências

- Um único layout, fiel ao Design System, em qualquer resolução 16:9.
- Nenhum componente pode usar unidades relativas à janela; só pixels lógicos.
- Se a tela final for 4K, o desempenho deve ser validado nela (Etapa 07).
