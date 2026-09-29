# 0009 — Código em inglês, documentação em português

- **Status:** aceita
- **Data:** 28/09/2026

## Contexto

O projeto mistura duas naturezas de texto: o código, que é lido por
ferramentas, bibliotecas e outros desenvolvedores, e o conteúdo e a
documentação, lidos pela equipe da Casa de Metal e pelo público. Nomes de
domínio em português (por exemplo, `Palco` e `calcularEscala`) conviveriam,
na mesma linha, com os nomes em inglês das bibliotecas (`useState`).

## Decisão

- **Em inglês:** nomes de arquivos e pastas de código, variáveis, funções,
  componentes, tipos, classes CSS, identificadores de teste, descrições de
  testes, comentários no código e mensagens de commit.
- **Em português:** README, `docs/` (arquitetura e ADRs), documentos das etapas
  e todo texto que o visitante lê (interface e conteúdo).
- **Nos documentos em português**, o conceito mantém o termo do Design System
  (por exemplo, Palco) e indica o nome no código na primeira menção
  (`Stage`). A tabela abaixo é o glossário oficial.

| Conceito (Design System) | Nome no código             |
| ------------------------ | -------------------------- |
| Palco                    | `Stage`                    |
| Escala                   | `scale`                    |
| Grade de depuração       | `DebugGrid`                |
| Área útil                | `safe area` (`SAFE_AREA`)  |
| Zona de exploração       | `exploration zone`         |
| Zona de informação       | `information zone`         |
| Zona de navegação        | `navigation zone`          |
| Universo                 | `universe`                 |
| Objeto                   | `object`                   |
| Órbita                   | `orbit`                    |
| Material                 | `material`                 |
| Hotspot                  | `hotspot`                  |
| Painel                   | `panel`                    |
| Camada                   | `layer`                    |
| Trilha                   | `trail`                    |
| Sessão                   | `session`                  |

Termos novos entram nesta tabela quando aparecerem.

## Nomes vindos do Design System

Os nomes de pastas de assets (`objetos`, `materiais`...), os nomes de arquivos
(`obj_bicicleta.svg`), as chaves do modelo de conteúdo (`objetos`, `materiais`,
`presenteEm`...), os nomes de níveis dos SVGs (`nivel-0-universo`...) e os
valores do atributo `data-tipo` (`linha`, `fina`, `tracejada`, `macica`) vêm
do Design System em português. Em 28/09/2026 foi decidido que **todos também
passam para o inglês**. A lista dos novos nomes e a migração dos arquivos
já existentes ficam para as Etapas 04 (dados e assets) e 05 (SVGs), antes da
auditoria dos desenhos. Até lá, esses nomes não são usados no código.

## Consequências

- Um único idioma dentro de cada arquivo de código, com o mesmo vocabulário
  das bibliotecas usadas.
- Quem lê a documentação em português precisa do glossário para achar o nome
  no código, e a curadoria não precisa ler o código em inglês para revisar
  o conteúdo.
