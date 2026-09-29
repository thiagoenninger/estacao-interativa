# Estação Interativa dos Objetos

Experiência interativa para instalação permanente da Casa de Metal: telas
touchscreen em modo quiosque onde visitantes investigam objetos cotidianos e
descobrem os metais e minerais que os compõem.

> **Status:** em desenvolvimento — Etapa 02 de 25.

## Escopo

A experiência investiga exclusivamente metais, ligas, minerais, minérios,
cerâmicas, refratários e matérias-primas minerais. Outros materiais não
aparecem como opção de exploração.

## Stack

- React 19 + TypeScript 6 + Vite 8
- Vitest (testes) · ESLint + Prettier (qualidade de código)
- Previsto: Zustand (estado) · GSAP (motion) · Zod (dados) · Electron (quiosque)

## Requisitos

- Node.js 24 LTS (o projeto recusa outras versões)
- Windows 11 (desenvolvimento e estações)

## Como rodar

```powershell
npm install          # primeira vez, ou quando o package.json mudar
npm run dev          # servidor de desenvolvimento em http://localhost:5173
```

Grade de depuração: abra `http://localhost:5173/?grid` ou aperte a tecla G.

| Comando                | O que faz                                      |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento                    |
| `npm run build`        | Confere os tipos e gera a versão de produção   |
| `npm run preview`      | Serve a versão de produção gerada              |
| `npm run check`        | Tipos, lint, formatação e testes (tudo junto)  |
| `npm run format`       | Formata o código com o Prettier                |
| `npm run test:watch`   | Testes em modo contínuo                        |

## Convenções

- Código (nomes de arquivos, pastas, variáveis, componentes, comentários e commits) em inglês.
- Documentação e textos da experiência em português (ADR 0009).

## Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [Registro de decisões](docs/decisoes/README.md)

## Versionamento

- `stage-NN` — marcos das etapas de desenvolvimento. Não são versões distribuídas.
- `vX.Y.Z` — versões oficiais instaladas nas estações (Semantic Versioning).
- Commits no padrão Conventional Commits.

## Licença

Uso restrito. Todos os direitos reservados. Licença a definir pela instituição.
