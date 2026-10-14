import { describe, expect, it } from 'vitest';
import { createTouchGate, type PointerInfo } from '@/interaction';

const finger = (id: number, isPrimary = false): PointerInfo => ({ id, type: 'touch', isPrimary });
const mouse = (id = 1): PointerInfo => ({ id, type: 'mouse', isPrimary: true });

describe('touch gate', () => {
  it('starts with nobody touching', () => {
    expect(createTouchGate().snapshot()).toEqual({
      primaryId: null,
      accepted: 0,
      busy: 0,
      entering: 0,
    });
  });

  it('the first pointer to land is the one that counts', () => {
    const gate = createTouchGate();
    expect(gate.pointerDown(finger(4))).toBe(true);
    expect(gate.isPrimary(4)).toBe(true);
    expect(gate.snapshot().primaryId).toBe(4);
  });

  it('ignores every other pointer while the first one is down', () => {
    const gate = createTouchGate();
    gate.pointerDown(finger(1));
    expect(gate.pointerDown(finger(2))).toBe(false);
    expect(gate.pointerDown(finger(3))).toBe(false);
    expect(gate.isPrimary(2)).toBe(false);
    expect(gate.snapshot()).toMatchObject({ primaryId: 1, accepted: 1, busy: 2 });
  });

  it('a new touch counts right after the first one lifts', () => {
    const gate = createTouchGate();
    gate.pointerDown(finger(1));
    gate.pointerUp(1);
    expect(gate.snapshot().primaryId).toBeNull();
    expect(gate.pointerDown(finger(2))).toBe(true);
    expect(gate.isPrimary(2)).toBe(true);
  });

  it('a finger that was ignored does not free the gate when it lifts', () => {
    const gate = createTouchGate();
    gate.pointerDown(finger(1));
    gate.pointerDown(finger(2));
    gate.pointerUp(2);
    expect(gate.isPrimary(1)).toBe(true);
    expect(gate.pointerDown(finger(3))).toBe(false);
  });

  it('a finger that was ignored stays ignored after the first one lifts', () => {
    const gate = createTouchGate();
    gate.pointerDown(finger(1));
    gate.pointerDown(finger(2));
    gate.pointerUp(1);
    expect(gate.isPrimary(2)).toBe(false);
  });

  it('ignores the lift of a pointer it never saw', () => {
    const gate = createTouchGate();
    gate.pointerDown(finger(1));
    gate.pointerUp(99);
    expect(gate.isPrimary(1)).toBe(true);
  });

  it('the same id landing again starts a new touch (the earlier lift was lost)', () => {
    const gate = createTouchGate();
    gate.pointerDown(mouse());
    expect(gate.pointerDown(mouse())).toBe(true);
    expect(gate.snapshot()).toMatchObject({ primaryId: 1, accepted: 2, busy: 0 });
  });

  it('trusts the browser when it says a finger is the first one: the old one was a ghost', () => {
    const gate = createTouchGate();
    gate.pointerDown(finger(1));
    expect(gate.pointerDown(finger(2, true))).toBe(true);
    expect(gate.isPrimary(2)).toBe(true);
    expect(gate.isPrimary(1)).toBe(false);
  });

  it('does not trust that flag across kinds of pointer', () => {
    const gate = createTouchGate();
    gate.pointerDown(mouse());
    expect(gate.pointerDown(finger(5, true))).toBe(false);
    expect(gate.isPrimary(1)).toBe(true);
  });

  it('counts the touches that a target refused for being too faint', () => {
    const gate = createTouchGate();
    gate.pointerDown(finger(1));
    gate.refuse('entering');
    expect(gate.snapshot()).toMatchObject({ accepted: 1, entering: 1 });
  });

  it('reset forgets the pointer and the counts', () => {
    const gate = createTouchGate();
    gate.pointerDown(finger(1));
    gate.pointerDown(finger(2));
    gate.refuse('entering');
    gate.reset();
    expect(gate.snapshot()).toEqual({ primaryId: null, accepted: 0, busy: 0, entering: 0 });
  });
});
