import { gsap } from 'gsap';
import type { AnimatableProp, Choreography, Track, TweenValues } from './choreography.ts';
import { easingFunction } from './easing.ts';
import { DURATION } from './tokens.ts';

export type MotionTarget = gsap.TweenTarget;

export type TargetMap = Readonly<Record<string, MotionTarget | null | undefined>>;

export type PlayOutcome = 'completed' | 'interrupted' | 'stopped';

export interface PlayHandle {
  readonly choreographyId: string;
  readonly timeline: gsap.core.Timeline;
  readonly finished: Promise<PlayOutcome>;
}

export interface MotionChannelOptions {
  paused?: boolean;
}

export interface MotionChannel {
  play(choreography: Choreography, targets: TargetMap): PlayHandle;
  current(): PlayHandle | null;
  stop(): void;
}

type Touched = Map<object, Set<AnimatableProp>>;

interface Active {
  handle: PlayHandle;
  touched: Touched;
  settle(outcome: PlayOutcome): void;
}

function remember(touched: Touched, element: object, props: Iterable<string>): void {
  let known = touched.get(element);
  if (known === undefined) {
    known = new Set();
    touched.set(element, known);
  }
  for (const prop of props) known.add(prop as AnimatableProp);
}

function startValues(track: Track, element: object, resume: Touched | null): TweenValues | null {
  if (track.from === undefined) return null;
  const moving = resume?.get(element);
  const entries = Object.entries(track.from).filter(
    ([prop]) => !moving?.has(prop as AnimatableProp),
  );
  return entries.length === 0 ? null : Object.fromEntries(entries);
}

function resolve(choreography: Choreography, track: Track, targets: TargetMap): object[] | null {
  const raw = targets[track.target];
  const elements = raw === undefined || raw === null ? [] : gsap.utils.toArray<object>(raw);
  if (elements.length > 0) return elements;
  if (track.optional === true) return null;
  throw new Error(
    `Choreography "${choreography.id}": track "${track.id}" needs the target "${track.target}", ` +
      'which is missing or empty',
  );
}

function build(
  choreography: Choreography,
  targets: TargetMap,
  resume: Touched | null,
): { timeline: gsap.core.Timeline; touched: Touched } {
  const timeline = gsap.timeline({ paused: true });
  const touched: Touched = new Map();

  for (const track of choreography.tracks) {
    const elements = resolve(choreography, track, targets);
    if (elements === null) continue;

    const vars = {
      ...track.to,
      duration: DURATION[track.duration] / 1000,
      ease: easingFunction(track.ease),
    };
    const stagger = (track.stagger ?? 0) / 1000;

    elements.forEach((element, index) => {
      const position = track.at / 1000 + index * stagger;
      const from = startValues(track, element, resume);
      if (from === null) timeline.to(element, vars, position);
      else timeline.fromTo(element, from, vars, position);
      remember(touched, element, Object.keys(track.to));
    });
  }

  return { timeline, touched };
}

export function createMotionChannel(options: MotionChannelOptions = {}): MotionChannel {
  let active: Active | null = null;

  function end(outcome: PlayOutcome): void {
    const finishing = active;
    if (finishing === null) return;
    active = null;
    if (outcome !== 'completed') finishing.handle.timeline.kill();
    finishing.settle(outcome);
  }

  return {
    play(choreography, targets) {
      const { timeline, touched } = build(choreography, targets, active?.touched ?? null);
      end('interrupted');

      let settle: (outcome: PlayOutcome) => void = () => undefined;
      const finished = new Promise<PlayOutcome>((resolvePlay) => {
        settle = resolvePlay;
      });
      const handle: PlayHandle = { choreographyId: choreography.id, timeline, finished };
      const play: Active = { handle, touched, settle };
      active = play;

      timeline.eventCallback('onComplete', () => {
        if (active === play) end('completed');
      });
      if (options.paused !== true) timeline.play();
      return handle;
    },
    current: () => active?.handle ?? null,
    stop: () => end('stopped'),
  };
}
