import { defineChoreography } from '@/motion/choreography';

export const SELECT = defineChoreography('select', [
  {
    id: 'press',
    target: 'chosen',
    at: 0,
    duration: 'instant',
    ease: 'standard',
    to: { scale: 0.96 },
  },
  {
    id: 'center',
    target: 'chosen',
    at: 80,
    duration: 'slow',
    ease: 'standard',
    to: { scale: 1.5, x: 100 },
  },
  {
    id: 'recede',
    target: 'others',
    at: 130,
    duration: 'slow',
    ease: 'standard',
    to: { opacity: 0.2, scale: 0.85 },
  },
  {
    id: 'spheres',
    target: 'spheres',
    at: 560,
    duration: 'base',
    ease: 'enter',
    stagger: 50,
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
  },
  {
    id: 'panel',
    target: 'panel',
    at: 500,
    duration: 'medium',
    ease: 'enter',
    optional: true,
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
]);

export const BACK = defineChoreography('back', [
  {
    id: 'chosen',
    target: 'chosen',
    at: 0,
    duration: 'slow',
    ease: 'standard',
    to: { scale: 1, x: 0 },
  },
  {
    id: 'others',
    target: 'others',
    at: 50,
    duration: 'slow',
    ease: 'standard',
    to: { opacity: 1, scale: 1 },
  },
  {
    id: 'spheres',
    target: 'spheres',
    at: 0,
    duration: 'base',
    ease: 'exit',
    stagger: 30,
    to: { opacity: 0, scale: 0.8 },
  },
]);

export interface Scene {
  chosen: { scale: number; x: number; opacity: number };
  others: { scale: number; opacity: number };
  spheres: { scale: number; opacity: number }[];
}

export function createScene(sphereCount = 3): Scene {
  return {
    chosen: { scale: 1, x: 0, opacity: 1 },
    others: { scale: 1, opacity: 1 },
    spheres: Array.from({ length: sphereCount }, () => ({ scale: 1, opacity: 1 })),
  };
}

export function values<T extends object>(target: T): Record<string, number> {
  return Object.fromEntries(
    Object.entries(target).filter(([, value]) => typeof value === 'number'),
  );
}
