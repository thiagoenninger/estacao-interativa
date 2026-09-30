# 0012 — Vitrine interna de validação (`?showcase`)

- **Status:** aceita
- **Data:** 29/09/2026

## Contexto

As etapas 03 a 05 entregam peças visuais (cores, tipografia, ícones, botões) que
ainda não têm tela onde apareçam. Sem um lugar para vê-las, a validação dependeria
de olhar o código.

## Decisão

- A **vitrine** (`Showcase`, em `src/dev/showcase/`) abre com `?showcase` na URL, dentro
  do Palco, com abas: Cores, Tipografia, Espaço e forma, Fundo, Ícones e Botões.
- É carregada com `React.lazy`: quem não pedir a vitrine não baixa o código dela.
- As abas são feitas com o próprio `Button` do Design System: a vitrine também testa
  o componente que exibe.
- Valores de cor e de espaço exibidos são **lidos ao vivo** do CSS
  (`getComputedStyle`), nunca copiados à mão: se o token mudar, a vitrine acompanha.
- Fica em `src/dev/`, fora do código da experiência. **O destino dela é decidido na
  Etapa 22** (manter só em desenvolvimento ou remover do build de produção).
- Ferramenta de validação, não de produto: nenhum texto dela precisa de revisão
  curatorial.

## Alternativas consideradas

- **Storybook:** ferramenta pesada, com dependências e configuração próprias, para um
  conjunto pequeno de peças.
- **Página HTML separada:** duplicaria a configuração do Vite e não passaria pelo Palco.
- **Nada, só testes:** não mostra o resultado visual, que é o critério do Design System.

## Consequências

- Toda etapa visual futura acrescenta uma aba (ou seção) e ganha validação visual
  imediata.
- O código de desenvolvimento entra no repositório e no build, mas em um trecho
  separado (chunk carregado sob demanda).
- Até a Etapa 22, não deve ser tratada como parte da experiência.
