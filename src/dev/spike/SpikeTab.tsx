import { useEffect, useRef, useState } from 'react';
import { calculateScale } from '../../app/stage/scale';
import { useWindowSize } from '../../app/stage/useWindowSize';
import { Button } from '../../design-system/buttons/Button';
import { loadContent } from '../../content';
import { getStation } from '../../platform/station';
import type { StationInfo } from '../../platform/station-info';
import { judge, VERDICT_LABEL } from './criteria';
import { readGpuRenderer } from './environment';
import type { FrameSummary } from './frame-stats';
import { formatDateTime, formatNumber } from './format';
import { loadComparedTo4k, panelSize, stagePhysicalSize, touchTargetsMm } from './physical-size';
import { buildReport } from './report';
import { startRunner, type SceneResult } from './runner';
import { MEASURE_MS, SCENES, WARMUP_MS, type SceneId } from './scenes';
import { SpikeStage } from './SpikeStage';
import { TargetsPanel } from './TargetsPanel';
import { summarizeTaps, TARGET_SIZES, type Tap } from './target-taps';
import { TouchPanel } from './TouchPanel';
import {
  EMPTY_TOUCH_LOG,
  summarizeTouch,
  trackTouch,
  type TouchEvent,
  type TouchLog,
} from './touch-log';
import './spike.css';

const DIAGONALS = [24, 27, 32, 43, 55] as const;

interface Run {
  scene: SceneId;
  index: number;
  total: number;
}

function describeInfo(info: StationInfo | null) {
  if (!info) return { versions: null, screen: null };
  return {
    versions: `Electron ${info.versions.electron} · Chromium ${info.versions.chrome}`,
    screen: `${Math.round(info.display.width)} × ${Math.round(info.display.height)} px do Windows · escala ${Math.round(info.display.scaleFactor * 100)}%`,
  };
}

/**
 * Performance test of Stage 07a: plays the scenes that carry the heaviest animations of the
 * project, measures the frames, records touch and taps, and writes a report to send back.
 * Development tool only.
 */
export function SpikeTab() {
  const station = getStation();
  const { width, height } = useWindowSize();
  const [objects] = useState(() => loadContent().index?.listObjects() ?? []);
  const [diagonal, setDiagonal] = useState<number>(43);
  const [info, setInfo] = useState<StationInfo | null>(null);
  const [gpu] = useState(readGpuRenderer);
  const [run, setRun] = useState<Run | null>(null);
  const [results, setResults] = useState<Partial<Record<SceneId, FrameSummary | null>>>({});
  const [touchLog, setTouchLog] = useState<TouchLog>(EMPTY_TOUCH_LOG);
  const [taps, setTaps] = useState<Record<number, Tap[]>>({});
  const [report, setReport] = useState('');
  const runnerRef = useRef<{ cancel: () => void } | null>(null);
  const fpsRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    if (!station) return;
    let alive = true;
    station.getInfo().then(
      (value) => alive && setInfo(value),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [station]);

  useEffect(() => {
    if (!run) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') runnerRef.current?.cancel();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [run]);

  useEffect(() => () => runnerRef.current?.cancel(), []);

  function start(ids: readonly SceneId[]) {
    if (runnerRef.current) return;
    const total = ids.length;
    runnerRef.current = startRunner({
      scenes: ids,
      warmupMs: WARMUP_MS,
      measureMs: MEASURE_MS,
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      cancelFrame: (handle) => window.cancelAnimationFrame(handle),
      onScene: (scene, index) => setRun({ scene, index, total }),
      onFps: (fps) => {
        if (fpsRef.current) fpsRef.current.textContent = `${formatNumber(fps, 0)} fps`;
      },
      onDone: (done: SceneResult[]) => {
        runnerRef.current = null;
        setResults((current) => ({
          ...current,
          ...Object.fromEntries(done.map((item) => [item.id, item.summary])),
        }));
        setRun(null);
      },
    });
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const stageScale = calculateScale(width, height).factor;
  const physical = stagePhysicalSize(stageScale, pixelRatio);
  const panel = panelSize(diagonal);
  const targetsMm = touchTargetsMm(diagonal);
  const touchSummary = summarizeTouch(touchLog);

  function makeReport() {
    const { versions, screen } = describeInfo(info);
    setReport(
      buildReport({
        generatedAt: formatDateTime(new Date()),
        shell: station ? 'Electron' : 'Navegador comum',
        versions,
        screen,
        windowCss: { width, height },
        pixelRatio,
        stageScale,
        gpu,
        diagonalInches: diagonal,
        results,
        touch: touchSummary,
        targets: TARGET_SIZES.map((size) => ({
          size,
          summary: summarizeTaps(taps[size] ?? [], diagonal),
        })),
      }),
    );
  }

  function copyReport() {
    void navigator.clipboard?.writeText(report).catch(() => undefined);
  }

  function onTouchEvent(event: TouchEvent) {
    setTouchLog((current) => trackTouch(current, event));
  }

  const activeScene = run ? SCENES.find((scene) => scene.id === run.scene) : undefined;

  return (
    <div className="spike-tab" data-testid="spike-tab">
      <div className="spike-column spike-column--scenes">
        <h2 className="type-overline showcase-heading">Cenas · {MEASURE_MS / 1000} s cada</h2>
        <table className="spike-table" data-testid="spike-results">
          <thead>
            <tr className="type-caption">
              <th scope="col">Cena</th>
              <th scope="col">fps</th>
              <th scope="col">pior 5%</th>
              <th scope="col">perdidos</th>
              <th scope="col">veredito</th>
            </tr>
          </thead>
          <tbody>
            {SCENES.map((scene) => {
              const summary = results[scene.id];
              return (
                <tr key={scene.id} data-testid={`scene-row-${scene.id}`}>
                  <th scope="row">
                    <Button
                      variant="secondary"
                      onPress={() => start([scene.id])}
                      disabled={run !== null}
                    >
                      {scene.label}
                    </Button>
                  </th>
                  {summary ? (
                    <>
                      <td className="type-data">{formatNumber(summary.averageFps, 1)}</td>
                      <td className="type-data">{formatNumber(summary.p95FrameMs, 1)} ms</td>
                      <td className="type-data">{formatNumber(summary.missedPercent, 1)}%</td>
                      <td className="type-data" data-verdict={judge(summary)}>
                        {VERDICT_LABEL[judge(summary)]}
                      </td>
                    </>
                  ) : (
                    <td className="type-data" colSpan={4}>
                      {summary === null ? 'sem dados' : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        <Button
          variant="primary"
          onPress={() => start(SCENES.map((scene) => scene.id))}
          disabled={run !== null}
        >
          Medir todas ({Math.round((SCENES.length * (WARMUP_MS + MEASURE_MS)) / 1000)} s)
        </Button>
        <p className="type-caption showcase-note">
          A cena ocupa o Palco inteiro e a tela fica parada de propósito. Para parar antes, toque em
          Parar ou aperte Esc. Não mexa no computador durante a medição.
        </p>
      </div>

      <div className="spike-column spike-column--touch">
        <TouchPanel log={touchLog} onEvent={onTouchEvent} />
        <TargetsPanel
          taps={taps}
          diagonalInches={diagonal}
          onTap={(size, tap) =>
            setTaps((current) => ({ ...current, [size]: [...(current[size] ?? []), tap] }))
          }
        />
        <Button
          variant="secondary"
          onPress={() => {
            setTouchLog(EMPTY_TOUCH_LOG);
            setTaps({});
          }}
        >
          Zerar toques e alvos
        </Button>
      </div>

      <div className="spike-column spike-column--screen">
        <h2 className="type-overline showcase-heading">Tela em teste</h2>
        <div className="showcase-row" role="group" aria-label="Diagonal da tela em polegadas">
          {DIAGONALS.map((inches) => (
            <Button
              key={inches}
              variant={inches === diagonal ? 'primary' : 'secondary'}
              aria-pressed={inches === diagonal}
              onPress={() => setDiagonal(inches)}
            >
              {inches}″
            </Button>
          ))}
        </div>
        <dl className="spike-stats" data-testid="spike-physical">
          <div>
            <dt className="type-caption">Tamanho físico</dt>
            <dd className="type-data" data-testid="spike-size">
              {formatNumber(panel.widthMm, 0)} × {formatNumber(panel.heightMm, 0)} mm
            </dd>
          </div>
          <div>
            <dt className="type-caption">1 px lógico</dt>
            <dd className="type-data" data-testid="spike-mm-per-px">
              {formatNumber(panel.mmPerLogicalPx, 3)} mm
            </dd>
          </div>
          <div>
            <dt className="type-caption">Alvo mínimo · ideal</dt>
            <dd className="type-data" data-testid="spike-targets-mm">
              {formatNumber(targetsMm.minimum, 1)} mm · {formatNumber(targetsMm.recommended, 1)} mm
            </dd>
          </div>
          <div>
            <dt className="type-caption">Palco em pixels físicos · carga do 4K</dt>
            <dd className="type-data" data-testid="spike-load">
              {physical.width} × {physical.height} ·{' '}
              {formatNumber(loadComparedTo4k(physical.width, physical.height) * 100, 0)}%
            </dd>
          </div>
          <div>
            <dt className="type-caption">Chip gráfico</dt>
            <dd className="type-data" data-testid="spike-gpu">
              {gpu}
            </dd>
          </div>
        </dl>
        <div className="showcase-row">
          <Button variant="primary" onPress={makeReport}>
            Gerar relatório
          </Button>
          <Button variant="secondary" onPress={copyReport} disabled={report === ''}>
            Copiar
          </Button>
        </div>
        <textarea
          className="spike-report type-data"
          data-testid="spike-report"
          readOnly
          value={report}
          placeholder="O relatório aparece aqui."
          aria-label="Relatório"
        />
      </div>

      {run && (
        <>
          <SpikeStage key={run.scene} scene={run.scene} objects={objects} />
          <div className="spike-hud" data-testid="spike-hud">
            <span className="type-data">
              {run.index + 1}/{run.total} · {activeScene?.label}
            </span>
            <output ref={fpsRef} className="type-data">
              — fps
            </output>
            <Button variant="secondary" onPress={() => runnerRef.current?.cancel()}>
              Parar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
