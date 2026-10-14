export { acquireTouchGate } from './attach.ts';
export { MIN_TOUCH_OPACITY } from './constants.ts';
export { TouchGateContext, sharedTouchGate, useTouchGate } from './context.ts';
export { effectiveOpacity, isEntering } from './opacity.ts';
export { TouchGateProvider } from './TouchGateProvider.tsx';
export {
  createTouchGate,
  type GateSnapshot,
  type PointerInfo,
  type Refusal,
  type TouchGate,
} from './touch-gate.ts';
