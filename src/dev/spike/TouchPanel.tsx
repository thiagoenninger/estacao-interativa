import type { PointerEvent } from 'react';
import { formatNumber } from './format';
import { summarizeTouch, type PointerSample, type TouchEvent, type TouchLog } from './touch-log';

const PAD = { width: 520, height: 180 } as const;

interface TouchPanelProps {
  log: TouchLog;
  onEvent: (event: TouchEvent) => void;
}

function sampleOf(event: PointerEvent<HTMLDivElement>): PointerSample {
  const rect = event.currentTarget.getBoundingClientRect();
  const scale = rect.width > 0 ? rect.width / PAD.width : 1;
  return {
    id: event.pointerId,
    type: event.pointerType,
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top) / scale,
    time: event.timeStamp,
  };
}

export function TouchPanel({ log, onEvent }: TouchPanelProps) {
  const summary = summarizeTouch(log);

  function forward(kind: TouchEvent['kind']) {
    return (event: PointerEvent<HTMLDivElement>) => {
      if (kind === 'down') event.currentTarget.setPointerCapture?.(event.pointerId);
      onEvent({ kind, sample: sampleOf(event) });
    };
  }

  return (
    <section data-testid="touch-panel">
      <h2 className="type-overline showcase-heading">Toque</h2>
      <div
        className="spike-pad"
        data-testid="touch-pad"
        style={{ width: PAD.width, height: PAD.height }}
        onPointerDown={forward('down')}
        onPointerMove={forward('move')}
        onPointerUp={forward('up')}
        onPointerCancel={forward('cancel')}
      >
        {Object.values(log.active).map((sample) => (
          <span
            key={sample.id}
            className="spike-finger"
            data-primary={sample.id === log.primaryId}
            style={{ left: sample.x, top: sample.y }}
          />
        ))}
        <span className="type-caption spike-pad-hint">Toque aqui, com um e com vários dedos.</span>
      </div>
      <dl className="spike-stats" data-testid="touch-stats">
        <div>
          <dt className="type-caption">Aceitos / ignorados</dt>
          <dd className="type-data" data-testid="touch-counts">
            {summary.accepted} / {summary.ignored}
          </dd>
        </div>
        <div>
          <dt className="type-caption">Máximo ao mesmo tempo</dt>
          <dd className="type-data" data-testid="touch-max">
            {summary.maxSimultaneous}
          </dd>
        </div>
        <div>
          <dt className="type-caption">Duração média · abaixo de 40 ms</dt>
          <dd className="type-data" data-testid="touch-duration">
            {formatNumber(summary.averageDurationMs, 0)} ms · {summary.veryShort}
          </dd>
        </div>
        <div>
          <dt className="type-caption">Maior deslocamento · ponteiro</dt>
          <dd className="type-data" data-testid="touch-travel">
            {formatNumber(summary.maxTravelPx, 1)} px · {summary.types.join(', ') || '—'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
