import type { PointerEvent } from 'react';
import { TOUCH } from '../../design-system/measures';
import { formatNumber } from './format';
import { logicalPxToMm } from './physical-size';
import { summarizeTaps, tapOffset, TARGET_SIZES, type Tap } from './target-taps';

interface TargetsPanelProps {
  taps: Readonly<Record<number, readonly Tap[]>>;
  diagonalInches: number;
  onTap: (size: number, tap: Tap) => void;
}

function nameOf(size: number): string {
  if (size === TOUCH.minTarget) return ' · mínimo';
  if (size === TOUCH.recommendedTarget) return ' · ideal';
  return '';
}

/**
 * Squares of several sizes with a cross in the middle. Tap the center of each one a few times: the
 * table shows how many taps fell inside and how far from the center the finger lands, in
 * millimeters. It is the precision test of the infrared frame (risk R3).
 */
export function TargetsPanel({ taps, diagonalInches, onTap }: TargetsPanelProps) {
  function tapOn(size: number) {
    return (event: PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      onTap(size, tapOffset({ x: event.clientX, y: event.clientY }, rect, size));
    };
  }

  return (
    <section data-testid="targets-panel">
      <h2 className="type-overline showcase-heading">Alvos · toque no centro</h2>
      <div className="spike-targets">
        {TARGET_SIZES.map((size) => (
          <div
            key={size}
            className="spike-target"
            data-testid={`target-${size}`}
            style={{ width: size, height: size }}
            onPointerDown={tapOn(size)}
          />
        ))}
      </div>
      <table className="spike-targets-table">
        <thead>
          <tr className="type-caption">
            <th scope="col">Lado</th>
            <th scope="col">Dentro</th>
            <th scope="col">Erro médio · máximo</th>
          </tr>
        </thead>
        <tbody>
          {TARGET_SIZES.map((size) => {
            const summary = summarizeTaps(taps[size] ?? [], diagonalInches);
            return (
              <tr key={size} className="type-data">
                <th scope="row" className="type-data">
                  {size} px · {formatNumber(logicalPxToMm(size, diagonalInches), 0)} mm
                  {nameOf(size)}
                </th>
                <td data-testid={`target-hits-${size}`}>
                  {summary.hits}/{summary.taps}
                </td>
                <td data-testid={`target-error-${size}`}>
                  {formatNumber(summary.meanErrorMm, 1)} · {formatNumber(summary.maxErrorMm, 1)} mm
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
