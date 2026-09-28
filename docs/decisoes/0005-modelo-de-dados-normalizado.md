# 0005 — Modelo de dados normalizado
 
- **Status:** aceita
- **Data:** 28-09-2026
 
## Contexto
 
O modelo do Design System (Assets 04) guarda cada material dentro de cada
objeto, repetindo fichas e misturando metal, mineral e minério.
 
## Decisão
 
Entidades separadas: Elemento, Material, FonteMineral, RotaDeObtenção,
Objeto, Investigação (objeto × material) e Camada. Desenho e conteúdo
continuam ligados apenas pelo id do material e pelo id do grupo do SVG, como
define o Design System.
 
## Consequências
 
- A ficha de cada material é escrita uma única vez.
- A taxonomia distingue metal, liga, mineral, minério e matéria-prima.
- O formato exato dos arquivos é definido na Etapa 04.
