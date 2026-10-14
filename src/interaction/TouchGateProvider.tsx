import type { ReactNode } from 'react';
import { TouchGateContext } from './context.ts';
import type { TouchGate } from './touch-gate.ts';

interface TouchGateProviderProps {
  gate: TouchGate;
  children: ReactNode;
}

export function TouchGateProvider({ gate, children }: TouchGateProviderProps) {
  return <TouchGateContext.Provider value={gate}>{children}</TouchGateContext.Provider>;
}
