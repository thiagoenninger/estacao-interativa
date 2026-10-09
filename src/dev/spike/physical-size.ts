import { STAGE, TOUCH } from '../../design-system/measures';

export const REFERENCE_PANEL = { diagonalInches: 43, width: 3840, height: 2160 } as const;

const MM_PER_INCH = 25.4;

export interface PanelSize {
  widthMm: number;
  heightMm: number;
  mmPerLogicalPx: number;
}

export function panelSize(diagonalInches: number): PanelSize {
  const diagonalMm = diagonalInches * MM_PER_INCH;
  const widthMm = (diagonalMm * 16) / Math.hypot(16, 9);
  const heightMm = (diagonalMm * 9) / Math.hypot(16, 9);
  return { widthMm, heightMm, mmPerLogicalPx: widthMm / STAGE.width };
}

export function logicalPxToMm(px: number, diagonalInches: number): number {
  return px * panelSize(diagonalInches).mmPerLogicalPx;
}

export function stagePhysicalSize(stageScale: number, pixelRatio: number) {
  return {
    width: Math.round(STAGE.width * stageScale * pixelRatio),
    height: Math.round(STAGE.height * stageScale * pixelRatio),
  };
}

export function loadComparedTo4k(physicalWidth: number, physicalHeight: number): number {
  return (physicalWidth * physicalHeight) / (REFERENCE_PANEL.width * REFERENCE_PANEL.height);
}

export function touchTargetsMm(diagonalInches: number) {
  return {
    minimum: logicalPxToMm(TOUCH.minTarget, diagonalInches),
    recommended: logicalPxToMm(TOUCH.recommendedTarget, diagonalInches),
    material: logicalPxToMm(TOUCH.materialTarget, diagonalInches),
    gap: logicalPxToMm(TOUCH.minGap, diagonalInches),
  };
}
