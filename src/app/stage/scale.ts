import { STAGE } from '../../design-system/measures';

export interface Scale {
  factor: number;
  offsetX: number;
  offsetY: number;
}

// Computes how to fit the 1920x1080 logical Stage into a window
// The Stage keeps its 16:9 ratio
export function calculateScale(windowWidth: number, windowHeight: number): Scale {
  if (!(windowWidth > 0) || !(windowHeight > 0)) {
    return { factor: 1, offsetX: 0, offsetY: 0 };
  }
  const factor = Math.min(windowWidth / STAGE.width, windowHeight / STAGE.height);
  return {
    factor,
    offsetX: (windowWidth - STAGE.width * factor) / 2,
    offsetY: (windowHeight - STAGE.height * factor) / 2,
  };
}
