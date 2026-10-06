import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ObjectDrawing } from '@/object/ObjectDrawing';

/** Level groups and component groups of the drawing that was rendered. */
function parts(container: HTMLElement) {
  const level = (n: number) => container.querySelector<SVGGElement>(`[data-level="${n}"]`);
  const group = (id: string) => container.querySelector<SVGGElement>(`g[data-group="${id}"]`);
  return { level, group };
}

describe('ObjectDrawing: the drawing and its name', () => {
  it('is an image with the name given by the content', () => {
    render(<ObjectDrawing file="object-bicycle.svg" label="Bicicleta" />);
    const image = screen.getByRole('img', { name: 'Bicicleta' });
    expect(image.getAttribute('viewBox')).toBe('0 0 700 460');
    expect(image.getAttribute('data-object')).toBe('object-bicycle.svg');
  });

  it('draws the file as it is: root attributes, groups, materials and shapes', () => {
    const { container } = render(<ObjectDrawing file="object-bicycle.svg" label="Bicicleta" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('stroke-linecap')).toBe('round');
    expect(svg?.getAttribute('fill')).toBe('none');
    expect(container.querySelectorAll('g[data-material]')).toHaveLength(13);
    expect(container.querySelectorAll('circle')).toHaveLength(9);
    expect(parts(container).group('frame')?.getAttribute('data-material')).toBe('aluminium');
    expect(parts(container).group('frame')?.getAttribute('data-stroke')).toBe('line');
  });

  it('has no title, no inline style and no text of its own', () => {
    const { container } = render(<ObjectDrawing file="object-can.svg" label="Lata" />);
    expect(container.querySelector('title')).toBeNull();
    expect(container.querySelector('[style]')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('has no id: it names the groups with data-group, so many drawings can share a page', () => {
    const { container } = render(
      <>
        <ObjectDrawing file="object-bicycle.svg" label="Bicicleta" />
        <ObjectDrawing file="object-bicycle.svg" label="Bicicleta" view="thumbnail" />
      </>,
    );
    expect(container.querySelectorAll('[id]')).toHaveLength(0);
    expect(container.querySelectorAll('g[data-group="frame"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-level="1"]')).toHaveLength(2);
  });

  it('adds the class it is given', () => {
    const { container } = render(
      <ObjectDrawing file="object-can.svg" label="Lata" className="mine" />,
    );
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('object-drawing mine');
  });

  it('throws for a drawing that does not exist', () => {
    expect(() => render(<ObjectDrawing file="object-nothing.svg" label="Nada" />)).toThrow(
      'Object drawing not found',
    );
  });
});

describe('ObjectDrawing: levels', () => {
  it('shows only level 0 in the universe', () => {
    const { container } = render(<ObjectDrawing file="object-bicycle.svg" label="Bicicleta" />);
    const { level } = parts(container);
    expect(container.querySelector('svg')?.getAttribute('data-view')).toBe('universe');
    expect(level(0)?.getAttribute('data-visible')).toBe('true');
    expect(level(1)?.getAttribute('data-visible')).toBe('false');
    expect(level(2)?.getAttribute('data-visible')).toBe('false');
  });

  it('shows only level 0 in the thumbnail', () => {
    const { container } = render(
      <ObjectDrawing file="object-bicycle.svg" label="Bicicleta" view="thumbnail" />,
    );
    expect(parts(container).level(1)?.getAttribute('data-visible')).toBe('false');
  });

  it('shows levels 0 and 1 when selected, and keeps level 2 off without a material', () => {
    const { container } = render(
      <ObjectDrawing file="object-bicycle.svg" label="Bicicleta" view="selected" />,
    );
    const { level } = parts(container);
    expect(level(0)?.getAttribute('data-visible')).toBe('true');
    expect(level(1)?.getAttribute('data-visible')).toBe('true');
    expect(level(2)?.getAttribute('data-visible')).toBe('false');
    expect(
      container.querySelectorAll('[data-state="recede"], [data-state="highlight"]'),
    ).toHaveLength(0);
  });
});

describe('ObjectDrawing: highlight, recede and the inside', () => {
  it('highlights the groups of the material and recedes the others', () => {
    const { container } = render(
      <ObjectDrawing
        file="object-bicycle.svg"
        label="Bicicleta"
        view="selected"
        material="steel"
      />,
    );
    const { group } = parts(container);
    expect(group('fork')?.getAttribute('data-state')).toBe('highlight');
    expect(group('chain')?.getAttribute('data-state')).toBe('highlight');
    expect(group('frame')?.getAttribute('data-state')).toBe('recede');
    expect(group('cables')?.getAttribute('data-state')).toBe('recede');
    expect(container.querySelector('svg')?.getAttribute('data-material')).toBe('steel');
  });

  it('reveals the internal groups of the material, and only them', () => {
    const { container } = render(
      <ObjectDrawing
        file="object-bicycle.svg"
        label="Bicicleta"
        view="selected"
        material="copper"
      />,
    );
    const { level, group } = parts(container);
    expect(level(2)?.getAttribute('data-visible')).toBe('true');
    expect(group('headlight')?.getAttribute('data-visible')).toBe('true');
    expect(group('headlight')?.getAttribute('data-state')).toBe('highlight');
    // the envelope stays on the screen, receded, giving the scale of the inside
    expect(group('frame')?.getAttribute('data-visible')).toBe('true');
    expect(group('frame')?.getAttribute('data-state')).toBe('recede');
  });

  it('keeps an internal group off when it is made of another material', () => {
    const { container } = render(
      <ObjectDrawing
        file="object-bicycle.svg"
        label="Bicicleta"
        view="selected"
        material="steel"
      />,
    );
    expect(parts(container).group('headlight')?.getAttribute('data-visible')).toBe('false');
  });

  it('recedes every group when the material is not in the drawing', () => {
    const { container } = render(
      <ObjectDrawing file="object-bicycle.svg" label="Bicicleta" view="selected" material="gold" />,
    );
    const states = [...container.querySelectorAll('g[data-state]')].map((group) =>
      group.getAttribute('data-state'),
    );
    expect(new Set(states)).toEqual(new Set(['recede']));
  });

  it('ignores the material in the universe and the thumbnail', () => {
    for (const view of ['universe', 'thumbnail'] as const) {
      const { container, unmount } = render(
        <ObjectDrawing file="object-bicycle.svg" label="Bicicleta" view={view} material="steel" />,
      );
      expect(
        container.querySelectorAll('[data-state="highlight"], [data-state="recede"]'),
      ).toHaveLength(0);
      unmount();
    }
  });

  it('changes the groups without replacing the elements (the motion will need them)', () => {
    const { container, rerender } = render(
      <ObjectDrawing
        file="object-bicycle.svg"
        label="Bicicleta"
        view="selected"
        material="steel"
      />,
    );
    const frame = parts(container).group('frame');
    rerender(
      <ObjectDrawing
        file="object-bicycle.svg"
        label="Bicicleta"
        view="selected"
        material="aluminium"
      />,
    );
    expect(parts(container).group('frame')).toBe(frame);
    expect(frame?.getAttribute('data-state')).toBe('highlight');
  });
});

describe('ObjectDrawing: size', () => {
  const size = (container: HTMLElement) => {
    const svg = container.querySelector('svg');
    return [Number(svg?.getAttribute('width')), Number(svg?.getAttribute('height'))] as const;
  };

  it('uses the longest side it is given', () => {
    const { container } = render(
      <ObjectDrawing file="object-bicycle.svg" label="Bicicleta" size={340} />,
    );
    const [width, height] = size(container);
    expect(width).toBeCloseTo(340);
    expect(height).toBeCloseTo((340 * 460) / 700);
  });

  it('fits a box, like the selected object in 640 × 480', () => {
    const { container } = render(
      <ObjectDrawing file="object-can.svg" label="Lata" view="selected" />,
    );
    const [width, height] = size(container);
    expect(height).toBeCloseTo(480);
    expect(width).toBeCloseTo((480 * 210) / 320);
  });

  it('has a default for the thumbnail and for the universe', () => {
    const thumbnail = render(
      <ObjectDrawing file="object-bicycle.svg" label="B" view="thumbnail" />,
    );
    expect(size(thumbnail.container)[0]).toBeCloseTo(120);
    thumbnail.unmount();
    const universe = render(<ObjectDrawing file="object-bicycle.svg" label="B" />);
    expect(size(universe.container)[0]).toBeCloseTo(260);
  });
});
