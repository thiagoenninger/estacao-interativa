export interface PointerInfo {
  id: number;
  type: string;
  isPrimary: boolean;
}

export type Refusal = 'busy' | 'entering';

export interface GateSnapshot {
  primaryId: number | null;
  accepted: number;
  busy: number;
  entering: number;
}

export interface TouchGate {
  pointerDown(pointer: PointerInfo): boolean;
  pointerUp(id: number): void;
  isPrimary(id: number): boolean;
  refuse(reason: 'entering'): void;
  reset(): void;
  snapshot(): GateSnapshot;
}

export function createTouchGate(): TouchGate {
  let primary: PointerInfo | null = null;
  let accepted = 0;
  let busy = 0;
  let entering = 0;

  return {
    pointerDown(pointer) {
      if (primary === null || primary.id === pointer.id) {
        primary = pointer;
        accepted += 1;
        return true;
      }
      if (pointer.isPrimary && pointer.type === primary.type) {
        primary = pointer;
        accepted += 1;
        return true;
      }
      busy += 1;
      return false;
    },
    pointerUp(id) {
      if (primary?.id === id) primary = null;
    },
    isPrimary(id) {
      return primary?.id === id;
    },
    refuse() {
      entering += 1;
    },
    reset() {
      primary = null;
      accepted = 0;
      busy = 0;
      entering = 0;
    },
    snapshot() {
      return { primaryId: primary?.id ?? null, accepted, busy, entering };
    },
  };
}
