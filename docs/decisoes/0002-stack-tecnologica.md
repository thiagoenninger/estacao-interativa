# 0002 — Stack tecnológica
 
- **Status:** aceita
- **Data:** 28-09-2026
 
## Contexto
 
Aplicação touchscreen, offline, em modo quiosque no Windows 11, com animações
precisas.
 
## Decisão
 
- Interface: React + TypeScript + Vite
- Estado: Zustand + máquina de estados pura
- Motion: GSAP (coreografias) e CSS (flutuação)
- Dados: JSON + Zod
- Desktop: Electron + electron-builder
- Qualidade: ESLint, Prettier, Vitest
- Ambiente de desenvolvimento: Node.js 24 LTS
 
## Alternativas consideradas
 
- Svelte e Vue: sem ganho relevante; o gargalo é a pintura da tela.
- XState: formal demais para quatro níveis de navegação.
- Motion (ex-Framer Motion): linhas do tempo em milissegundos ficam indiretas.
- Tauri: o motor WebView2 do sistema muda sozinho e a casca exige Rust.
- Edge em quiosque + PWA: pouco controle e atualização frágil offline.
 
## Consequências
 
- Chromium fixo dentro do app: as três estações renderizam igual.
- Instalador maior (~100 MB), irrelevante para o hardware previsto.
- Versões exatas das bibliotecas são fixadas no package.json (Etapa 02).
