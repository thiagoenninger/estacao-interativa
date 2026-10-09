import { judge, VERDICT_LABEL } from './criteria';
import type { FrameSummary } from './frame-stats';
import { formatNumber } from './format';
import { GPU_UNAVAILABLE, isSoftwareRenderer } from './environment';
import { loadComparedTo4k, panelSize, stagePhysicalSize } from './physical-size';
import { SCENES, type SceneId } from './scenes';
import type { TapSummary } from './target-taps';
import type { TouchSummary } from './touch-log';

export interface ReportInput {
  generatedAt: string;
  shell: string;
  versions: string | null;
  screen: string | null;
  windowCss: { width: number; height: number };
  pixelRatio: number;
  stageScale: number;
  gpu: string;
  diagonalInches: number;
  results: Partial<Record<SceneId, FrameSummary | null>>;
  touch: TouchSummary;
  targets: { size: number; summary: TapSummary }[];
}

const n1 = (value: number) => formatNumber(value, 1);

/** The report the person copies and sends back: Markdown, in Portuguese, one screenful. */
export function buildReport(input: ReportInput): string {
  const physicalWidth = Math.round(input.windowCss.width * input.pixelRatio);
  const physicalHeight = Math.round(input.windowCss.height * input.pixelRatio);
  const stagePhysical = stagePhysicalSize(input.stageScale, input.pixelRatio);
  const load = loadComparedTo4k(stagePhysical.width, stagePhysical.height);
  const panel = panelSize(input.diagonalInches);
  const lines: string[] = [];

  lines.push(`# Relatório do teste de desempenho · ${input.generatedAt}`, '', '## Ambiente', '');
  lines.push(`- Casca: ${input.shell}${input.versions ? ` · ${input.versions}` : ''}`);
  if (input.screen) lines.push(`- Tela: ${input.screen}`);
  lines.push(
    `- Janela: ${Math.round(input.windowCss.width)} × ${Math.round(input.windowCss.height)} px CSS · ${physicalWidth} × ${physicalHeight} pixels físicos`,
    `- Palco: ${stagePhysical.width} × ${stagePhysical.height} pixels físicos (${formatNumber(load * 100, 0)}% dos pixels do painel 4K)`,
    `- Escala do Palco: ${formatNumber(input.stageScale, 3)}`,
    `- Tamanho da tela informado: ${input.diagonalInches}″ · ${formatNumber(panel.widthMm, 0)} × ${formatNumber(panel.heightMm, 0)} mm · 1 px lógico = ${formatNumber(panel.mmPerLogicalPx, 3)} mm`,
    `- Chip gráfico: ${input.gpu}`,
  );
  if (isSoftwareRenderer(input.gpu)) {
    lines.push(
      '- **ATENÇÃO:** o desenho está sendo feito por software, não pela placa gráfica. Estes números não valem para a estação.',
    );
  }
  if (input.gpu === GPU_UNAVAILABLE) {
    lines.push(
      '- **ATENÇÃO:** não foi possível ler o chip gráfico (WebGL indisponível). Confirme que a aceleração por hardware está ligada; sem ela, estes números não valem para a estação.',
    );
  }

  lines.push('', '## Cenas', '');
  lines.push(
    '| Cena | fps médio | quadro típico (ms) | pior 5% (ms) | pior quadro (ms) | quadros perdidos | veredito |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
  );
  for (const scene of SCENES) {
    const summary = input.results[scene.id];
    if (summary === undefined) continue;
    if (summary === null) {
      lines.push(`| ${scene.label} | sem dados | | | | | |`);
      continue;
    }
    lines.push(
      `| ${scene.label} | ${n1(summary.averageFps)} | ${n1(summary.medianFrameMs)} | ${n1(summary.p95FrameMs)} | ${n1(summary.worstFrameMs)} | ${formatNumber(summary.missedPercent, 1)}% | ${VERDICT_LABEL[judge(summary)]} |`,
    );
  }

  lines.push('', '## Toque', '');
  const touch = input.touch;
  lines.push(
    `- Tipos de ponteiro vistos: ${touch.types.length ? touch.types.join(', ') : 'nenhum'}`,
    `- Toques aceitos: ${touch.accepted} · ignorados (segundo dedo): ${touch.ignored} · máximo ao mesmo tempo: ${touch.maxSimultaneous}`,
    `- Toques terminados: ${touch.touches} · duração média: ${formatNumber(touch.averageDurationMs, 0)} ms · menores que 40 ms: ${touch.veryShort}`,
    `- Maior deslocamento do dedo durante um toque: ${n1(touch.maxTravelPx)} px lógicos`,
  );

  lines.push('', '## Alvos', '');
  lines.push(
    '| Lado (px) | Lado (mm) | toques | dentro | erro médio (mm) | erro máximo (mm) |',
    '| ---: | ---: | ---: | ---: | ---: | ---: |',
  );
  for (const { size, summary } of input.targets) {
    lines.push(
      `| ${size} | ${n1(size * panel.mmPerLogicalPx)} | ${summary.taps} | ${summary.hits} | ${n1(summary.meanErrorMm)} | ${n1(summary.maxErrorMm)} |`,
    );
  }
  return lines.join('\n');
}
