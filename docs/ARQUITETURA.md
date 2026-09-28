# Arquitetura - Estação Interativa dos Objetos

Documento vivo. Resume a arquitetura aprovada no Roadmap Mestre (v1.1, 28/09/2026). Cada decisão importante tem um registro próprio em [decisoes/](decisoes/README.md).

## Visão Geral

Aplicação desktop para Windows 11, em modo quiosque, executada em três estações independentes. Todas rodam a mesma versão, cada uma com sua própria sessão, sem sincronização entre elas. Todo funcionamento é offline.

## Princípios

- O Design System é especificação de implementação, não inspiração.
- O objeto é o protagonista; a navegação é uma transformação contínua do mesmo universo, nunca uma sequência de páginas.
- Palco lógico de 1920x1080 (Full HD). Outras resoluções são atendidas por escala automática.
- Conteúdo, experiência e interface ficam separados.
- O React decide o que existe na tela, o GSAP decide como se move.
- Código, dados e assets são distribuídos juntos, em um único pacote.

## Camadas

| Camada      | Responsabilidade                                      |
| ----------- | ----------------------------------------------------- |
| Plataforma  | Electron: janela, quiosque, escala, logs, atualização |
| Experiência | Máquina de estados, sessão e retorno automático       |
| Interface   | Componentes React do Design System                    |
| Motion      | Coreografias M01–M08 (GSAP) e flutuação (CSS)         |
| Conteúdo    | Dados JSON validados e consultas                      |


## Estrutura prevista

- `dados/` - conteúdo em JSON
- `assets/` - objetos, materiais, minerais, fotos, ícones, texturas, fontes
- `src/` - aplicação
- `electron/` - processo principal da aplicação desktop
- `scripts/` - validação de dados e auditoria de SVG
- `docs/` - esta documentação

## Dados

Modelo normalizado: Elemento, Material, FonteMineral, RotaDeObtenção, Objeto, Investigação (objeto x material) e Camada. Desenho e conteúdo ligam-se apenas pelo id do material e pelo id do grupo do SVG.

## Distribuição

Instalador publicado no Github Releases. Atualização remota prevista para a Etapa 24.
