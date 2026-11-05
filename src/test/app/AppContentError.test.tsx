import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';

vi.mock('@/content/load.ts', () => ({
  loadContent: () => ({ content: null, issues: [], index: null }),
}));

describe('App · content that does not load', () => {
  it('says so in Portuguese and shows no universe', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByTestId('station-error').textContent).toBe(
      'Não foi possível carregar o conteúdo.',
    );
    expect(screen.queryByTestId('universe')).toBeNull();
  });
});
