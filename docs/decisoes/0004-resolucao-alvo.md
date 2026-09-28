# 0004 — Resolução-alvo Full HD
 
- **Status:** aceita
- **Data:** 28-09-2026
 
## Contexto
 
O Design System usa 1920 × 1080 como canvas de referência. A resolução da
tela final (Full HD ou 4K) ainda não está confirmada.
 
## Decisão
 
Design e programação seguem 1920 × 1080. Todo o layout usa pixels lógicos
dessa grade. A aplicação desktop mede a tela e aplica um fator de escala,
para que um painel 4K funcione sem mudança de código.
 
## Consequências
 
- Um único layout, fiel ao Design System.
- Se a tela final for 4K, o desempenho precisa ser validado nela, porque há
  quatro vezes mais pixels para desenhar.
