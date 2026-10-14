import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/design-system/buttons/Button';
import { IconButton } from '@/design-system/buttons/IconButton';
import { createTouchGate, sharedTouchGate, TouchGateProvider } from '@/interaction';

const at = (pointerId: number) => ({ pointerId, clientX: 0, clientY: 0 });
const pressed = (element: HTMLElement) => element.getAttribute('data-pressed');

function twoButtons() {
  const first = vi.fn();
  const second = vi.fn();
  render(
    <>
      <Button onPress={first}>Primeiro</Button>
      <Button onPress={second}>Segundo</Button>
    </>,
  );
  return {
    first,
    second,
    a: screen.getByRole('button', { name: 'Primeiro' }),
    b: screen.getByRole('button', { name: 'Segundo' }),
  };
}

describe('one touch at a time, across buttons', () => {
  it('ignores a button touched while another finger is down on a different button', () => {
    const { first, second, a, b } = twoButtons();
    fireEvent.pointerDown(a, at(1));
    fireEvent.pointerDown(b, at(2));
    expect(pressed(b)).toBe('false');
    fireEvent.pointerUp(b, at(2));
    fireEvent.pointerUp(a, at(1));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('a first finger on the background also blocks the button', () => {
    const { second, b } = twoButtons();
    fireEvent.pointerDown(document.body, at(1));
    fireEvent.pointerDown(b, at(2));
    fireEvent.pointerUp(b, at(2));
    expect(second).not.toHaveBeenCalled();
    expect(pressed(b)).toBe('false');
  });

  it('a new touch counts at once after the first finger lifts', () => {
    const { first, second, a, b } = twoButtons();
    fireEvent.pointerDown(a, at(1));
    fireEvent.pointerUp(a, at(1));
    fireEvent.pointerDown(b, at(2));
    fireEvent.pointerUp(b, at(2));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('a touch that was ignored does not run later, when the first finger lifts', () => {
    const { second, a, b } = twoButtons();
    fireEvent.pointerDown(a, at(1));
    fireEvent.pointerDown(b, at(2));
    fireEvent.pointerUp(a, at(1));
    fireEvent.pointerUp(b, at(2));
    expect(second).not.toHaveBeenCalled();
  });

  it('a cancelled touch frees the next one', () => {
    const { second, a, b } = twoButtons();
    fireEvent.pointerDown(a, at(1));
    fireEvent.pointerCancel(a, at(1));
    fireEvent.pointerDown(b, at(2));
    fireEvent.pointerUp(b, at(2));
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('works the same for icon buttons', () => {
    const onPress = vi.fn();
    render(
      <>
        <IconButton icon="close" label="Fechar" onPress={onPress} />
        <Button>Outro</Button>
      </>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outro' }), at(1));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Fechar' }), at(2));
    fireEvent.pointerUp(screen.getByRole('button', { name: 'Fechar' }), at(2));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('the keyboard (a click without a pointer) is not held back by the gate', () => {
    const { first, a } = twoButtons();
    fireEvent.pointerDown(document.body, at(1));
    fireEvent.click(a, { detail: 0 });
    expect(first).toHaveBeenCalledTimes(1);
  });
});

describe('elements that are still entering', () => {
  function entering(opacity: string) {
    const onPress = vi.fn();
    render(
      <div style={{ opacity }}>
        <Button onPress={onPress}>Entrando</Button>
      </div>,
    );
    return { onPress, button: screen.getByRole('button') };
  }

  it('ignores the touch below 50% of opacity', () => {
    const { onPress, button } = entering('0.3');
    fireEvent.pointerDown(button, at(1));
    expect(pressed(button)).toBe('false');
    fireEvent.pointerUp(button, at(1));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('accepts the touch at 50% and above', () => {
    const { onPress, button } = entering('0.5');
    fireEvent.pointerDown(button, at(1));
    expect(pressed(button)).toBe('true');
    fireEvent.pointerUp(button, at(1));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('accepts the touch once the element has finished entering', () => {
    const onPress = vi.fn();
    const { rerender } = render(
      <div style={{ opacity: 0.2 }}>
        <Button onPress={onPress}>Entrando</Button>
      </div>,
    );
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, at(1));
    fireEvent.pointerUp(button, at(1));
    expect(onPress).not.toHaveBeenCalled();
    rerender(
      <div style={{ opacity: 1 }}>
        <Button onPress={onPress}>Entrando</Button>
      </div>,
    );
    fireEvent.pointerDown(button, at(2));
    fireEvent.pointerUp(button, at(2));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('an element that is not there yet (opacity 0) is not touchable', () => {
    const { onPress, button } = entering('0');
    fireEvent.pointerDown(button, at(1));
    fireEvent.pointerUp(button, at(1));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('the finger that touched it still counts as the one touch, so the others wait', () => {
    const onPress = vi.fn();
    render(
      <>
        <div style={{ opacity: 0.1 }}>
          <Button>Entrando</Button>
        </div>
        <Button onPress={onPress}>Pronto</Button>
      </>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Entrando' }), at(1));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Pronto' }), at(2));
    fireEvent.pointerUp(screen.getByRole('button', { name: 'Pronto' }), at(2));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('counts the refusal in the gate', () => {
    const { button } = entering('0.1');
    fireEvent.pointerDown(button, at(1));
    expect(sharedTouchGate.snapshot().entering).toBe(1);
  });
});

describe('recovering from a lost touch', () => {
  it('a finger that the browser calls the first one replaces a ghost', () => {
    const { second, a, b } = twoButtons();
    fireEvent.pointerDown(a, { ...at(1), pointerType: 'touch', isPrimary: true });
    // The "up" of the first finger never arrived. A new finger lands, alone on the screen.
    fireEvent.pointerDown(b, { ...at(2), pointerType: 'touch', isPrimary: true });
    fireEvent.pointerUp(b, { ...at(2), pointerType: 'touch', isPrimary: true });
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('a mouse released outside the window does not lock the screen', () => {
    const { second, a, b } = twoButtons();
    fireEvent.pointerDown(a, { ...at(1), pointerType: 'mouse', buttons: 1 });
    fireEvent.pointerMove(document.body, { ...at(1), pointerType: 'mouse', buttons: 0 });
    fireEvent.pointerDown(b, { ...at(2), pointerType: 'touch', isPrimary: true });
    fireEvent.pointerUp(b, { ...at(2), pointerType: 'touch', isPrimary: true });
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('a gate of its own', () => {
  it('a provider gives its buttons a gate with its own count', () => {
    const gate = createTouchGate();
    render(
      <>
        <div style={{ opacity: 0.1 }}>
          <Button>Fora</Button>
        </div>
        <TouchGateProvider gate={gate}>
          <div style={{ opacity: 0.1 }}>
            <Button>Dentro</Button>
          </div>
        </TouchGateProvider>
      </>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Dentro' }), at(1));
    expect(gate.snapshot().entering).toBe(1);
    expect(sharedTouchGate.snapshot().entering).toBe(0);
  });

  it('every gate follows the whole window, so a touch anywhere is seen by both', () => {
    const gate = createTouchGate();
    render(
      <>
        <Button>Fora</Button>
        <TouchGateProvider gate={gate}>
          <Button>Dentro</Button>
        </TouchGateProvider>
      </>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Fora' }), at(1));
    expect(gate.isPrimary(1)).toBe(true);
    expect(sharedTouchGate.isPrimary(1)).toBe(true);
  });

  it('stops following the window when the buttons leave the screen', () => {
    const gate = createTouchGate();
    const { unmount } = render(
      <TouchGateProvider gate={gate}>
        <Button>Dentro</Button>
      </TouchGateProvider>,
    );
    unmount();
    fireEvent.pointerDown(document.body, at(1));
    expect(gate.snapshot().accepted).toBe(0);
  });
});
