import type { ReactNode } from 'react';
import { calculateScale } from './scale';
import { useWindowSize } from './useWindowSize';
import './stage.css';

interface StageProps {
  children?: ReactNode;
  diagnostics?: boolean;
}

export function Stage({ children, diagnostics = false }: StageProps) {
  const { width, height } = useWindowSize();
  const { factor, offsetX, offsetY } = calculateScale(width, height);

  return (
    <div className="stage-window" data-testid="stage-window">
      <div
        className="stage"
        data-testid="stage"
        style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${factor})` }}
      >
        {children}
      </div>
      {diagnostics && (
        <div className="stage-diagnostics" data-testid="stage-diagnostics">
          window {width} × {height} · scale {factor.toFixed(3)}
        </div>
      )}
    </div>
  );
}
