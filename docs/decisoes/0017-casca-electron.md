# 0017 — Casca Electron: TypeScript direto, protocolo `app://`, zoom exato e página isolada

- **Status:** aceita
- **Data:** 06/10/2026

## Contexto

A Etapa 06 cria a casca desktop (camada Plataforma) em Electron: a janela em tela cheia
das estações, que carrega a mesma interface que já roda no navegador. As perguntas a
resolver eram como escrever e executar o código da casca, de onde a interface é carregada
em produção, como o Palco de 1920 × 1080 se ajusta a telas diferentes e o quanto a página
pode alcançar do sistema.

## Decisão

- **Electron 44.5.1, versão exata** (Chromium 152, Node 24.21), como as demais
  dependências (ADR 0007). Uma versão principal nova sai a cada 8 semanas; a atualização
  é uma decisão consciente, nunca um `npm install` solto.
- **TypeScript executado direto pelo Electron.** O Electron 44 traz o Node 24, que roda
  `.ts` sem compilar. O `tsc` só confere os tipos (`tsconfig.electron.json`). Não há
  etapa de compilação da casca agora; se o empacotamento exigir arquivos `.js`, o
  agrupamento entra na Etapa 22.
- **A interface vem de `app://station/`**, um protocolo próprio registrado como padrão e
  seguro, que serve só a pasta `dist/`. Caminhos com `..`, `.`, barra invertida, caractere
  nulo ou barra codificada são recusados antes de tocar em qualquer arquivo, e a resposta
  leva a política de segurança de conteúdo. Em desenvolvimento, a janela carrega o servidor
  do Vite (sem a política de conteúdo, por causa do recarregamento a quente).
- **Quiosque por padrão em `electron:start`**: tela cheia, sem moldura, sem menu, sem
  cursor. `--windowed` abre uma janela comum. O atalho de manutenção fica para a Etapa 21.
- **Zoom exato em quiosque, nenhum em janela comum.** O fator é
  `min(largura / 1920, altura / 1080)` da tela em pixels lógicos, limitado de 0,25 a 5,
  e é a casca quem o aplica. A página fica com 1920 × 1080 px CSS e a escala do Palco em 1;
  o Windows com escala de 150% em 4K deixa de importar. Em janela comum, o Palco se
  escala por `transform`, como no navegador.
- **Página isolada.** Sandbox do Chromium, isolamento de contexto, sem integração com o
  Node, sem `<webview>`, sem janelas novas, sem navegação para outra origem, todas as
  permissões do sistema negadas, uma só instância. O DevTools só existe em desenvolvimento
  ou com `--devtools` (ignorado quando instalado).
- **Uma ponte mínima e somente leitura.** `preload.cjs` (CommonJS, porque um preload em
  sandbox não pode ser TypeScript nem módulo) expõe `window.station.getInfo()`, congelado.
  A casca só responde se o pedido vem da página da própria origem. A aba Plataforma da
  vitrine usa essa ponte para mostrar versões, modo, tela e zoom.
- **Módulos puros e uma cola fina.** Opções de lançamento, zoom, segurança e opções da
  janela ficam em módulos sem `electron` nem `node:*`, testados no Vitest; `main.ts` só os
  liga. Um teste lê o texto de `main.ts` e `preload.cjs` e falha se alguma proteção
  sumir.
- **Variáveis e opções com limite.** `ELECTRON_RENDERER_URL` só vale em máquina de
  desenvolvimento (`localhost`) e fora do aplicativo instalado; `--devtools`, `--showcase`,
  `--grid` e `--cursor` (cursor visível no quiosque, para testar sem tela de toque) também.

## Alternativas consideradas

- **Compilar a casca com um agrupador (tsup, esbuild) desde já:** é preciso no
  empacotamento, mas hoje só acrescentaria uma dependência e uma etapa a cada mudança.
- **`file://` em vez de protocolo próprio:** mais simples, mas dá à página acesso ao
  disco por caminho, não tem origem confiável para a política de conteúdo e as regras de
  navegação e de `fetch` se comportam diferente.
- **Servidor HTTP local em produção:** abre uma porta na máquina da exposição.
- **Zoom por `transform` também em quiosque:** deixa a escala 2 ou 1,333 na página, com
  texto e traços renderizados em tamanho fracionário, e o Palco dependente da escala do Windows.
- **Preload em TypeScript:** exigiria desligar o sandbox ou compilar o arquivo.
- **Registrar logs e atualizações já na primeira casca (electron-log, autoUpdater):**
  fora do escopo; entram nas etapas de quiosque, empacotamento e atualização (21, 22 e 24).

## Consequências

- Atualizar o Electron exige conferir de novo o zoom, a ponte e as proteções (os testes
  da casca e a aba Plataforma ajudam).
- O primeiro `electron .` numa máquina baixa o executável do Electron; é preciso internet
  uma vez. O instalador final já o leva dentro.
- A Etapa 07 mede o traço e o toque no hardware real com esta casca. Se a tela final for 4K,
  o zoom 2 (ou 1,333 a 150%) passa a valer ali.
- A Etapa 21 acrescenta o preparo do Windows, o início automático, a recuperação de falhas e
  o atalho de manutenção, e a Etapa 22 o empacotamento, sobre esta base.
- Os testes da casca ficam em `src/test/electron/` e `src/test/platform/` (ADR 0015).
