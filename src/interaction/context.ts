import { createContext, useContext, useEffect } from 'react';
import { acquireTouchGate } from './attach.ts';
import { createTouchGate, type TouchGate } from './touch-gate.ts';
export const sharedTouchGate: TouchGate = createTouchGate();

export const TouchGateContext = createContext<TouchGate>(sharedTouchGate);

export function useTouchGate(): TouchGate {
  const gate = useContext(TouchGateContext);
  useEffect(() => acquireTouchGate(gate), [gate]);
  return gate;
}
