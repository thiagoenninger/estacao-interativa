import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MainPrompt } from '@/universe/MainPrompt';
import { UNIVERSE_TEXT } from '@/universe/texts.ts';

describe('MainPrompt', () => {
  it('asks the question in the Display style, as the main heading', () => {
    render(<MainPrompt />);
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.textContent).toBe('Você sabe do que as coisas são feitas?');
    expect(title.classList.contains('type-display')).toBe(true);
  });

  it('invites the visitor in Body Large, next to the touch icon', () => {
    render(<MainPrompt />);
    const hint = screen.getByTestId('main-prompt').querySelector('p');
    expect(hint?.textContent).toBe('Toque em um objeto para descobrir.');
    expect(hint?.classList.contains('type-body-large')).toBe(true);
    expect(
      screen.getByTestId('main-prompt-icon').querySelector('[data-icon="touch"]'),
    ).toBeTruthy();
  });

  it('has the pulsing ring around the icon', () => {
    render(<MainPrompt />);
    expect(
      screen.getByTestId('main-prompt-icon').contains(screen.getByTestId('main-prompt-ring')),
    ).toBe(true);
  });

  it('has nothing to touch: it is only a call', () => {
    render(<MainPrompt />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('keeps the texts in one place', () => {
    expect(UNIVERSE_TEXT.region).toBe('Universo de objetos');
  });
});
