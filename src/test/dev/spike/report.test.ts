import { describe, expect, it } from 'vitest';
import type { FrameSummary } from '@/dev/spike/frame-stats';
import { buildReport, type ReportInput } from '@/dev/spike/report';
import { EMPTY_TOUCH_LOG, summarizeTouch } from '@/dev/spike/touch-log';

const GOOD: FrameSummary = {
  frames: 600,
  durationMs: 10000,
  averageFps: 59.9,
  medianFrameMs: 16.7,
  p95FrameMs: 16.9,
  worstFrameMs: 33.4,
  missedFrames: 1,
  missedPercent: 0.2,
};

const BAD: FrameSummary = { ...GOOD, averageFps: 31.2, p95FrameMs: 34.1, missedPercent: 48.3 };

function input(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    generatedAt: '08/10/2026 18:30',
    shell: 'Electron',
    versions: 'Electron 44.5.1 · Chromium 152.0.7977.130',
    screen: '3840 × 2160 px do Windows · escala 100%',
    windowCss: { width: 3840, height: 2160 },
    pixelRatio: 1,
    stageScale: 2,
    gpu: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics, D3D11)',
    diagonalInches: 43,
    results: {},
    touch: summarizeTouch(EMPTY_TOUCH_LOG),
    targets: [{ size: 64, summary: { taps: 4, hits: 4, meanErrorMm: 2.4, maxErrorMm: 3.9 } }],
    ...overrides,
  };
}

describe('buildReport', () => {
  it('opens with the date and the environment', () => {
    const text = buildReport(input());
    expect(text).toContain('# Relatório do teste de desempenho · 08/10/2026 18:30');
    expect(text).toContain('- Casca: Electron · Electron 44.5.1 · Chromium 152.0.7977.130');
    expect(text).toContain('- Tela: 3840 × 2160 px do Windows · escala 100%');
    expect(text).toContain('- Chip gráfico: ANGLE (Intel, Intel(R) Iris(R) Xe Graphics, D3D11)');
  });

  it('gives the size of the screen and the load compared to the 4K panel', () => {
    const text = buildReport(input());
    expect(text).toContain(
      '- Tamanho da tela informado: 43″ · 952 × 535 mm · 1 px lógico = 0,496 mm',
    );
    expect(text).toContain('- Palco: 3840 × 2160 pixels físicos (100% dos pixels do painel 4K)');
    const fullHd = buildReport(input({ windowCss: { width: 1920, height: 1080 }, stageScale: 1 }));
    expect(fullHd).toContain('(25% dos pixels do painel 4K)');
  });

  it('measures the load by the Stage, not by the window with its bands', () => {
    const text = buildReport(
      input({ windowCss: { width: 1707, height: 1067 }, pixelRatio: 1.5, stageScale: 1707 / 1920 }),
    );
    expect(text).toContain('- Janela: 1707 × 1067 px CSS · 2561 × 1601 pixels físicos');
    expect(text).toContain('- Palco: 2561 × 1440 pixels físicos (44% dos pixels do painel 4K)');
  });

  it('leaves the screen line out in an ordinary browser', () => {
    const text = buildReport(input({ shell: 'Navegador comum', versions: null, screen: null }));
    expect(text).toContain('- Casca: Navegador comum');
    expect(text).not.toContain('- Tela:');
  });

  it('warns when the drawing is done by software', () => {
    const text = buildReport(input({ gpu: 'ANGLE (Google, Vulkan, SwiftShader driver)' }));
    expect(text).toContain('ATENÇÃO');
    expect(buildReport(input())).not.toContain('ATENÇÃO');
  });

  it('warns when the graphics chip could not be read', () => {
    const text = buildReport(input({ gpu: 'indisponível' }));
    expect(text).toContain('ATENÇÃO');
    expect(text).toContain('WebGL indisponível');
  });

  it('writes a row per scene measured, in the order of the scenes, with the verdict', () => {
    const text = buildReport(input({ results: { m02: BAD, idle: GOOD } }));
    const rows = text.split('\n').filter((line) => /^\| (Espera|M02)/.test(line));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toBe('| Espera (M08) | 59,9 | 16,7 | 16,9 | 33,4 | 0,2% | bom |');
    expect(rows[1]).toBe('| M02 completa | 31,2 | 16,7 | 34,1 | 33,4 | 48,3% | ruim |');
  });

  it('skips the scenes that were not run and marks the ones with no data', () => {
    const text = buildReport(input({ results: { idle: null } }));
    expect(text).toContain('| Espera (M08) | sem dados |');
    expect(text).not.toContain('M02 completa');
  });

  it('reports the touch and the targets, in millimeters', () => {
    const touch = {
      ...summarizeTouch(EMPTY_TOUCH_LOG),
      accepted: 12,
      ignored: 3,
      maxSimultaneous: 4,
      types: ['touch'],
      touches: 12,
      averageDurationMs: 96.4,
      veryShort: 1,
      maxTravelPx: 7.25,
    };
    const text = buildReport(input({ touch }));
    expect(text).toContain('- Tipos de ponteiro vistos: touch');
    expect(text).toContain(
      '- Toques aceitos: 12 · ignorados (segundo dedo): 3 · máximo ao mesmo tempo: 4',
    );
    expect(text).toContain('duração média: 96 ms · menores que 40 ms: 1');
    expect(text).toContain('| 64 | 31,7 | 4 | 4 | 2,4 | 3,9 |');
  });

  it('says so when no pointer was seen', () => {
    expect(buildReport(input())).toContain('- Tipos de ponteiro vistos: nenhum');
  });
});
