import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { acquireTouchGate, createTouchGate } from '@/interaction';

afterEach(() => {
  document.body.replaceChildren();
});

describe('following the window', () => {
  it('a finger that lands anywhere becomes the one that counts', () => {
    const gate = createTouchGate();
    const release = acquireTouchGate(gate);
    fireEvent.pointerDown(document.body, { pointerId: 3 });
    expect(gate.isPrimary(3)).toBe(true);
    release();
  });

  it('ignores a second finger and frees the gate when the first one lifts', () => {
    const gate = createTouchGate();
    const release = acquireTouchGate(gate);
    fireEvent.pointerDown(document.body, { pointerId: 1 });
    fireEvent.pointerDown(document.body, { pointerId: 2 });
    expect(gate.snapshot()).toMatchObject({ primaryId: 1, busy: 1 });
    fireEvent.pointerUp(document.body, { pointerId: 1 });
    expect(gate.snapshot().primaryId).toBeNull();
    release();
  });

  it('a cancelled touch frees the gate', () => {
    const gate = createTouchGate();
    const release = acquireTouchGate(gate);
    fireEvent.pointerDown(document.body, { pointerId: 1 });
    fireEvent.pointerCancel(document.body, { pointerId: 1 });
    expect(gate.snapshot().primaryId).toBeNull();
    release();
  });

  it('frees the gate after the targets have run their own "up"', () => {
    const gate = createTouchGate();
    const release = acquireTouchGate(gate);
    const target = document.createElement('div');
    document.body.append(target);
    const seen: boolean[] = [];
    target.addEventListener('pointerup', (event) => seen.push(gate.isPrimary(event.pointerId)));
    fireEvent.pointerDown(target, { pointerId: 1 });
    fireEvent.pointerUp(target, { pointerId: 1 });
    expect(seen).toEqual([true]);
    expect(gate.isPrimary(1)).toBe(false);
    release();
  });

  it('a mouse released outside the window frees the gate on the next move', () => {
    const gate = createTouchGate();
    const release = acquireTouchGate(gate);
    fireEvent.pointerDown(document.body, { pointerId: 1, pointerType: 'mouse', buttons: 1 });
    fireEvent.pointerMove(document.body, { pointerId: 1, pointerType: 'mouse', buttons: 1 });
    expect(gate.isPrimary(1)).toBe(true);
    fireEvent.pointerMove(document.body, { pointerId: 1, pointerType: 'mouse', buttons: 0 });
    expect(gate.isPrimary(1)).toBe(false);
    release();
  });

  it('a finger that moves keeps the gate', () => {
    const gate = createTouchGate();
    const release = acquireTouchGate(gate);
    fireEvent.pointerDown(document.body, { pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(document.body, { pointerId: 1, pointerType: 'touch', buttons: 0 });
    expect(gate.isPrimary(1)).toBe(true);
    release();
  });

  it('the window losing focus forgets the touch', () => {
    const gate = createTouchGate();
    const release = acquireTouchGate(gate);
    fireEvent.pointerDown(document.body, { pointerId: 1 });
    fireEvent.blur(window);
    expect(gate.snapshot().primaryId).toBeNull();
    release();
  });
});

describe('sharing the listeners', () => {
  it('keeps listening until the last user lets go', () => {
    const gate = createTouchGate();
    const first = acquireTouchGate(gate);
    const second = acquireTouchGate(gate);
    first();
    fireEvent.pointerDown(document.body, { pointerId: 1 });
    expect(gate.isPrimary(1)).toBe(true);
    second();
    fireEvent.pointerDown(document.body, { pointerId: 2 });
    expect(gate.snapshot().accepted).toBe(1);
  });

  it('letting go twice does not take away the listeners of the others', () => {
    const gate = createTouchGate();
    const first = acquireTouchGate(gate);
    const second = acquireTouchGate(gate);
    first();
    first();
    fireEvent.pointerDown(document.body, { pointerId: 1 });
    expect(gate.isPrimary(1)).toBe(true);
    second();
  });

  it('two gates follow the window on their own', () => {
    const one = createTouchGate();
    const other = createTouchGate();
    const releaseOne = acquireTouchGate(one);
    fireEvent.pointerDown(document.body, { pointerId: 1 });
    expect(one.isPrimary(1)).toBe(true);
    expect(other.isPrimary(1)).toBe(false);
    releaseOne();
  });
});
