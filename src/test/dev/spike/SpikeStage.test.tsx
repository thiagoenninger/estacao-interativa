import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadContent } from '@/content';
import { PHASE_INTERVAL_MS, SCENE_IDS, type SceneId } from '@/dev/spike/scenes';
import { SpikeStage } from '@/dev/spike/SpikeStage';

const objects = loadContent().index?.listObjects() ?? [];

function stage(scene: SceneId) {
  render(<SpikeStage scene={scene} objects={objects} />);
  return screen.getByTestId('spike-stage');
}

describe('SpikeStage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('the content has the eight objects the test draws', () => {
    expect(objects).toHaveLength(8);
  });

  it('idle is the universe alone: eight floating objects and no selection', () => {
    const root = stage('idle');
    expect(root.getAttribute('data-selected')).toBe('false');
    expect(root.querySelectorAll('.spike-slot')).toHaveLength(8);
    expect(root.querySelectorAll('.spike-float')).toHaveLength(8);
    expect(root.querySelector('.spike-center')).toBeNull();
    expect(root.getAttribute('data-fx')).toBe('');
  });

  it('with a selection the bicycle leaves the universe and takes the center', () => {
    const root = stage('selected');
    expect(root.getAttribute('data-selected')).toBe('true');
    expect(root.querySelectorAll('.spike-slot')).toHaveLength(7);
    const bicycle = screen.getByRole('img', { name: 'Bicicleta' });
    expect(bicycle.getAttribute('data-view')).toBe('selected');
    expect(bicycle.getAttribute('data-material')).toBe('steel');
    expect(root.querySelectorAll('.spike-layer')).toHaveLength(1);
  });

  it('draws the orbit: the ring, the active arc and five spheres', () => {
    const root = stage('selected');
    expect(root.querySelector('.spike-ring')).not.toBeNull();
    expect(root.querySelector('.spike-arc')).not.toBeNull();
    expect(root.querySelectorAll('.spike-node')).toHaveLength(5);
    expect(root.querySelectorAll('.spike-node--selected')).toHaveLength(1);
  });

  it('puts the spheres on the ring, the first at the top and the others every 72°', () => {
    const root = stage('selected');
    const nodes = [...root.querySelectorAll<HTMLElement>('.spike-node')];
    const point = (node: HTMLElement) => [
      Number(node.style.getPropertyValue('--node-x')),
      Number(node.style.getPropertyValue('--node-y')),
    ];
    const [x0 = 0, y0 = 0] = point(nodes[0] as HTMLElement);
    expect(x0).toBeCloseTo(0, 6);
    expect(y0).toBeCloseTo(-400, 6);
    for (const node of nodes) {
      const [x = 0, y = 0] = point(node);
      expect(Math.hypot(x, y)).toBeCloseTo(400, 6);
    }
  });

  it('the scenes with a copy draw the object twice, the base one with no material', () => {
    const root = stage('recede-copy');
    expect(root.querySelectorAll('.spike-layer')).toHaveLength(2);
    const base = root.querySelector('.spike-layer--base svg');
    const lit = root.querySelector('.spike-layer--lit svg');
    expect(base?.getAttribute('data-material')).toBeNull();
    expect(lit?.getAttribute('data-material')).toBe('steel');
  });

  it('only the full M02 scenes have the information panel, with five blocks', () => {
    for (const scene of SCENE_IDS) {
      const { unmount } = render(<SpikeStage scene={scene} objects={objects} />);
      const panels = document.querySelectorAll('.spike-panel');
      expect(panels.length, scene).toBe(scene === 'm02' || scene === 'm02-copy' ? 1 : 0);
      if (panels[0]) expect(panels[0].querySelectorAll('.spike-block')).toHaveLength(5);
      unmount();
    }
  });

  it('the stage carries the effects of the scene for the CSS', () => {
    expect(stage('m02').getAttribute('data-fx')).toBe(
      'stroke-width recede-group arc-heat orbit-slide universe-recede panel',
    );
  });

  it('flips between phase a and b on its own, without React', () => {
    vi.useFakeTimers();
    const root = stage('stroke-width');
    expect(root.getAttribute('data-phase')).toBe('a');
    act(() => {
      vi.advanceTimersByTime(PHASE_INTERVAL_MS);
    });
    expect(root.getAttribute('data-phase')).toBe('b');
    act(() => {
      vi.advanceTimersByTime(PHASE_INTERVAL_MS);
    });
    expect(root.getAttribute('data-phase')).toBe('a');
  });

  it('the baselines never change phase and leave no timer behind', () => {
    vi.useFakeTimers();
    const root = stage('selected');
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(PHASE_INTERVAL_MS * 3);
    });
    expect(root.getAttribute('data-phase')).toBe('a');
  });

  it('stops its timer when it leaves the page', () => {
    vi.useFakeTimers();
    const { unmount } = render(<SpikeStage scene="m02" objects={objects} />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
