import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { BackButton, HomeButton } from './NavigationButtons';

const inside = { pointerId: 1, clientX: 0, clientY: 0 };
const outside = { pointerId: 1, clientX: 500, clientY: 500 };

function pressed(element: HTMLElement) {
  return element.getAttribute('data-pressed');
}

describe('touch rules', () => {
  it('shows pressed on pointer down, before the finger is released', () => {
    render(<Button>Continuar</Button>);
    const button = screen.getByRole('button');
    expect(pressed(button)).toBe('false');
    fireEvent.pointerDown(button, inside);
    expect(pressed(button)).toBe('true');
  });

  it('runs the action on pointer up, inside the target', () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Continuar</Button>);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, inside);
    expect(onPress).not.toHaveBeenCalled();
    fireEvent.pointerUp(button, inside);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(pressed(button)).toBe('false');
  });

  it('cancels when the finger is released outside the target', () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Continuar</Button>);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, inside);
    fireEvent.pointerMove(button, outside);
    expect(pressed(button)).toBe('false');
    fireEvent.pointerUp(button, outside);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('cancels when the browser cancels the touch', () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Continuar</Button>);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, inside);
    fireEvent.pointerCancel(button, inside);
    fireEvent.pointerUp(button, inside);
    expect(onPress).not.toHaveBeenCalled();
    expect(pressed(button)).toBe('false');
  });

  it('ignores a second touch while the first one is active', () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Continuar</Button>);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, { ...inside, pointerId: 1 });
    fireEvent.pointerDown(button, { ...inside, pointerId: 2 });
    fireEvent.pointerUp(button, { ...inside, pointerId: 2 });
    expect(onPress).not.toHaveBeenCalled();
    fireEvent.pointerUp(button, { ...inside, pointerId: 1 });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled', () => {
    const onPress = vi.fn();
    render(
      <Button onPress={onPress} disabled>
        Continuar
      </Button>,
    );
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, inside);
    fireEvent.pointerUp(button, inside);
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(pressed(button)).toBe('false');
  });

  it('accepts the keyboard (a click without a pointer) for development', () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Continuar</Button>);
    fireEvent.click(screen.getByRole('button'), { detail: 0 });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not run twice for one touch (pointer up plus the click that follows it)', () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Continuar</Button>);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, inside);
    fireEvent.pointerUp(button, inside);
    fireEvent.click(button, { detail: 1 });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Button', () => {
  it('is primary by default and secondary on request', () => {
    const { rerender } = render(<Button>Continuar</Button>);
    expect(screen.getByRole('button').className).toContain('button--primary');
    rerender(<Button variant="secondary">Continuar</Button>);
    expect(screen.getByRole('button').className).toContain('button--secondary');
  });

  it('writes the label in the Interactive Label style', () => {
    render(<Button>Continuar</Button>);
    expect(screen.getByText('Continuar').className).toBe('type-interactive-label');
  });

  it('draws an icon only when asked', () => {
    const { container, rerender } = render(<Button>Continuar</Button>);
    expect(container.querySelector('svg')).toBeNull();
    rerender(<Button icon="next">Continuar</Button>);
    expect(container.querySelector('svg')?.getAttribute('data-icon')).toBe('next');
  });

  it('can be forced to look pressed (showcase)', () => {
    render(<Button pressed>Continuar</Button>);
    expect(pressed(screen.getByRole('button'))).toBe('true');
  });
});

describe('IconButton', () => {
  it('has an accessible name and no visible label', () => {
    render(<IconButton icon="close" label="Fechar" />);
    const button = screen.getByRole('button', { name: 'Fechar' });
    expect(button.textContent).toBe('');
    expect(button.className).toContain('button--icon-only');
  });

  it('follows the same touch rules', () => {
    const onPress = vi.fn();
    render(<IconButton icon="close" label="Fechar" onPress={onPress} />);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, inside);
    fireEvent.pointerUp(button, inside);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Back Button and Home Button', () => {
  it('Back is primary with the back icon and the text Voltar', () => {
    const { container } = render(<BackButton />);
    expect(screen.getByRole('button').textContent).toBe('Voltar');
    expect(screen.getByRole('button').className).toContain('button--primary');
    expect(container.querySelector('svg')?.getAttribute('data-icon')).toBe('back');
  });

  it('Home is secondary with the home icon and the text Início', () => {
    const { container } = render(<HomeButton />);
    expect(screen.getByRole('button').textContent).toBe('Início');
    expect(screen.getByRole('button').className).toContain('button--secondary');
    expect(container.querySelector('svg')?.getAttribute('data-icon')).toBe('home');
  });
});
