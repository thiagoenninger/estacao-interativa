import type { EasingName } from './easing.ts';
import { DURATION, EASING } from './tokens.ts';

export type DurationName = keyof typeof DURATION;

export const ANIMATABLE = [
  'opacity',
  'x',
  'y',
  'scale',
  'scaleX',
  'scaleY',
  'rotation',
  'strokeOpacity',
  'strokeWidth',
  'strokeDashoffset',
] as const;

export type AnimatableProp = (typeof ANIMATABLE)[number];

export type TweenValues = Partial<Record<AnimatableProp, number>>;

export interface Track {
  id: string;
  target: string;
  at: number;
  duration: DurationName;
  ease: EasingName;
  from?: TweenValues;
  to: TweenValues;
  stagger?: number;
  optional?: boolean;
}

export interface Choreography {
  readonly id: string;
  readonly tracks: readonly Track[];
}

const allowed = new Set<string>(ANIMATABLE);

function fail(choreographyId: string, message: string): never {
  throw new Error(`Choreography "${choreographyId}": ${message}`);
}

function checkValues(id: string, trackId: string, label: string, values: TweenValues): void {
  for (const [prop, value] of Object.entries(values)) {
    if (!allowed.has(prop)) {
      fail(
        id,
        `track "${trackId}" animates "${prop}" in ${label}; allowed: ${ANIMATABLE.join(', ')}`,
      );
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      fail(id, `track "${trackId}" has a ${label} value for "${prop}" that is not a finite number`);
    }
  }
}

export function defineChoreography(id: string, tracks: readonly Track[]): Choreography {
  if (id.trim() === '') throw new Error('A choreography needs an id');
  if (tracks.length === 0) fail(id, 'has no tracks');

  const seen = new Set<string>();
  for (const track of tracks) {
    if (track.id.trim() === '') fail(id, 'has a track without an id');
    if (seen.has(track.id)) fail(id, `has two tracks called "${track.id}"`);
    seen.add(track.id);

    if (track.target.trim() === '') fail(id, `track "${track.id}" has no target`);
    if (!Number.isFinite(track.at) || track.at < 0) {
      fail(id, `track "${track.id}" starts at ${track.at}; it must be 0 or more`);
    }
    if (!(track.duration in DURATION)) fail(id, `track "${track.id}" has an unknown duration`);
    if (!(track.ease in EASING)) fail(id, `track "${track.id}" has an unknown easing`);
    if (track.stagger !== undefined && !(Number.isFinite(track.stagger) && track.stagger >= 0)) {
      fail(id, `track "${track.id}" has a stagger that is not 0 or more`);
    }

    const toProps = Object.keys(track.to);
    if (toProps.length === 0) fail(id, `track "${track.id}" has nothing to animate`);
    checkValues(id, track.id, 'to', track.to);
    if (track.from !== undefined) {
      checkValues(id, track.id, 'from', track.from);
      for (const prop of Object.keys(track.from)) {
        if (!toProps.includes(prop)) {
          fail(id, `track "${track.id}" has "${prop}" in from but not in to`);
        }
      }
    }
  }

  return Object.freeze({ id, tracks: Object.freeze([...tracks]) });
}

export function trackEnd(track: Track, count = 1): number {
  const staggerTotal = (track.stagger ?? 0) * Math.max(0, count - 1);
  return track.at + staggerTotal + DURATION[track.duration];
}

export function choreographyEnd(
  choreography: Choreography,
  counts: Readonly<Record<string, number>> = {},
): number {
  return Math.max(
    ...choreography.tracks.map((track) => trackEnd(track, counts[track.target] ?? 1)),
  );
}
