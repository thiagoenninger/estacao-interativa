import { describe, expect, it } from 'vitest';
import { createMotionChannel } from '@/motion/channel';
import { defineChoreography } from '@/motion/choreography';
import { BACK, createScene, SELECT, values } from './fixtures';

function setup(paused = true) {
  const scene = createScene(5);
  const targets = { chosen: scene.chosen, others: scene.others, spheres: scene.spheres };
  return { scene, targets, channel: createMotionChannel({ paused }) };
}

const seek = (timeline: { time(seconds: number, suppressEvents: boolean): unknown }, ms: number) =>
  timeline.time(ms / 1000, false);

describe('building a play', () => {
  it('lasts as long as the table says: 1080 ms with five spheres', () => {
    const { channel, targets } = setup();
    expect(channel.play(SELECT, targets).timeline.duration() * 1000).toBeCloseTo(1080, 6);
  });

  it('draws the start of an entering element at once, so it never flashes before its turn', () => {
    const { channel, scene, targets } = setup();
    channel.play(SELECT, targets);
    for (const sphere of scene.spheres) expect(values(sphere)).toEqual({ opacity: 0, scale: 0.8 });
  });

  it('leaves alone what has no from: the chosen object stays where it is until its turn', () => {
    const { channel, scene, targets } = setup();
    channel.play(SELECT, targets);
    expect(values(scene.chosen)).toEqual({ scale: 1, x: 0, opacity: 1 });
  });

  it('staggers the elements of one target, 50 ms apart', () => {
    const { channel, scene, targets } = setup();
    const handle = channel.play(SELECT, targets);
    seek(handle.timeline, 560);
    expect(scene.spheres[0]?.opacity).toBeCloseTo(0, 6);
    seek(handle.timeline, 560 + 160);
    // The first sphere is half-way through its 320 ms, the fifth has not started.
    expect(scene.spheres[0]?.opacity).toBeGreaterThan(0.5);
    expect(scene.spheres[4]?.opacity).toBe(0);
    seek(handle.timeline, 1080);
    for (const sphere of scene.spheres) expect(values(sphere)).toEqual({ opacity: 1, scale: 1 });
  });

  it('follows the table in time: pressed at 80 ms, centered at 780 ms', () => {
    const { channel, scene, targets } = setup();
    const handle = channel.play(SELECT, targets);
    seek(handle.timeline, 80);
    expect(scene.chosen.scale).toBeCloseTo(0.96, 6);
    seek(handle.timeline, 780);
    expect(values(scene.chosen)).toEqual({ scale: 1.5, x: 100, opacity: 1 });
  });
});

describe('targets', () => {
  it('fails on a required target that is missing, naming the track and the target', () => {
    const { channel, scene } = setup();
    expect(() => channel.play(SELECT, { chosen: scene.chosen, spheres: scene.spheres })).toThrow(
      'track "recede" needs the target "others"',
    );
  });

  it('fails on a required target that is empty', () => {
    const { channel, scene } = setup();
    expect(() =>
      channel.play(SELECT, { chosen: scene.chosen, others: scene.others, spheres: [] }),
    ).toThrow('track "spheres" needs the target "spheres"');
  });

  it('skips an optional target that is missing: the panel does not exist in state 03', () => {
    const { channel, targets } = setup();
    expect(channel.play(SELECT, targets).timeline.duration() * 1000).toBeCloseTo(1080, 6);
  });

  it('plays an optional target when it is there', () => {
    const { channel, targets } = setup();
    const panel = { opacity: 1 };
    channel.play(SELECT, { ...targets, panel });
    expect(panel.opacity).toBe(0);
  });

  it('a failed play leaves the play in progress untouched', () => {
    const { channel, scene, targets } = setup();
    const first = channel.play(SELECT, targets);
    seek(first.timeline, 400);
    const before = values(scene.chosen);
    expect(() => channel.play(BACK, { chosen: scene.chosen })).toThrow('needs the target');
    expect(channel.current()).toBe(first);
    expect(values(scene.chosen)).toEqual(before);
  });
});

describe('interruption: a new touch redirects from where the values are', () => {
  it('does not jump: the first frame of the new play is the last frame of the old one', () => {
    const { channel, scene, targets } = setup();
    const first = channel.play(SELECT, targets);
    seek(first.timeline, 500);
    const before = {
      chosen: values(scene.chosen),
      others: values(scene.others),
      sphere: values(scene.spheres[0] as object),
    };

    const second = channel.play(BACK, targets);
    expect(values(scene.chosen)).toEqual(before.chosen);
    expect(values(scene.others)).toEqual(before.others);
    expect(values(scene.spheres[0] as object)).toEqual(before.sphere);
    seek(second.timeline, 0);
    expect(values(scene.chosen)).toEqual(before.chosen);
  });

  it('moves on from there, and reaches the end of the new table', () => {
    const { channel, scene, targets } = setup();
    const first = channel.play(SELECT, targets);
    seek(first.timeline, 500);
    const startScale = scene.chosen.scale;

    const second = channel.play(BACK, targets);
    seek(second.timeline, 350);
    expect(scene.chosen.scale).toBeLessThan(startScale);
    expect(scene.chosen.scale).toBeGreaterThan(1);
    seek(second.timeline, 1000);
    expect(values(scene.chosen)).toEqual({ scale: 1, x: 0, opacity: 1 });
    expect(values(scene.others)).toEqual({ scale: 1, opacity: 1 });
  });

  it('does not restart an entering value that the old play was already moving', () => {
    const { channel, scene, targets } = setup();
    const first = channel.play(SELECT, targets);
    seek(first.timeline, 760);
    const halfWay = scene.spheres[0]?.opacity ?? 0;
    expect(halfWay).toBeGreaterThan(0);
    expect(halfWay).toBeLessThan(1);

    channel.play(SELECT, targets);
    expect(scene.spheres[0]?.opacity).toBe(halfWay);
  });

  it('still applies the start of an element the old play never moved', () => {
    const { channel, scene } = setup();
    const only = defineChoreography('only', [
      { id: 'a', target: 'chosen', at: 0, duration: 'slow', ease: 'standard', to: { scale: 2 } },
    ]);
    const first = channel.play(only, { chosen: scene.chosen });
    seek(first.timeline, 300);

    channel.play(SELECT, {
      chosen: scene.chosen,
      others: scene.others,
      spheres: scene.spheres,
    });
    for (const sphere of scene.spheres) expect(values(sphere)).toEqual({ opacity: 0, scale: 0.8 });
  });

  it('applies the start again when the old play had finished', () => {
    const { channel, scene, targets } = setup();
    const first = channel.play(SELECT, targets);
    seek(first.timeline, 1080);
    expect(channel.current()).toBeNull();
    channel.play(SELECT, targets);
    for (const sphere of scene.spheres) expect(values(sphere)).toEqual({ opacity: 0, scale: 0.8 });
  });

  it('keeps no queue: five quick plays leave only the last one running', async () => {
    const { channel, targets } = setup();
    const plays = [SELECT, BACK, SELECT, BACK, SELECT].map((choreography) =>
      channel.play(choreography, targets),
    );
    const last = plays[plays.length - 1];
    expect(channel.current()).toBe(last);
    expect(plays.filter((play) => play.timeline.paused() === false)).toHaveLength(0);

    const outcomes = await Promise.all(plays.slice(0, -1).map((play) => play.finished));
    expect(outcomes).toEqual(['interrupted', 'interrupted', 'interrupted', 'interrupted']);
  });

  it('an interrupted timeline is cut loose from the clock, so it never moves anything again', () => {
    const { channel, targets } = setup();
    const first = channel.play(SELECT, targets);
    seek(first.timeline, 400);
    expect(first.timeline.parent).not.toBeNull();
    channel.play(BACK, targets);
    expect(first.timeline.parent).toBeNull();
  });
});

describe('how a play ends', () => {
  it('completed: the timeline reached its end, and the channel is free', async () => {
    const { channel, targets } = setup();
    const handle = channel.play(SELECT, targets);
    expect(channel.current()).toBe(handle);
    seek(handle.timeline, 1080);
    await expect(handle.finished).resolves.toBe('completed');
    expect(channel.current()).toBeNull();
  });

  it('stopped: values stay where they were', async () => {
    const { channel, scene, targets } = setup();
    const handle = channel.play(SELECT, targets);
    seek(handle.timeline, 500);
    const there = values(scene.chosen);
    channel.stop();
    await expect(handle.finished).resolves.toBe('stopped');
    expect(channel.current()).toBeNull();
    expect(values(scene.chosen)).toEqual(there);
  });

  it('stop with nothing playing does nothing', () => {
    expect(() => createMotionChannel().stop()).not.toThrow();
  });
});

describe('with the real clock', () => {
  const quick = defineChoreography('quick', [
    {
      id: 'press',
      target: 'thing',
      at: 0,
      duration: 'instant',
      ease: 'standard',
      to: { scale: 0.5 },
    },
  ]);

  it('runs a play to the end by itself', async () => {
    const thing = { scale: 1 };
    const channel = createMotionChannel();
    await expect(channel.play(quick, { thing }).finished).resolves.toBe('completed');
    expect(thing.scale).toBeCloseTo(0.5, 6);
  });

  it('a touch in the middle of a play takes it over', async () => {
    const thing = { scale: 1 };
    const channel = createMotionChannel();
    const slow = defineChoreography('slow', [
      {
        id: 'grow',
        target: 'thing',
        at: 0,
        duration: 'slower',
        ease: 'standard',
        to: { scale: 3 },
      },
    ]);
    const first = channel.play(slow, { thing });
    await new Promise((resolve) => setTimeout(resolve, 120));
    const second = channel.play(quick, { thing });
    await expect(first.finished).resolves.toBe('interrupted');
    await expect(second.finished).resolves.toBe('completed');
    expect(thing.scale).toBeCloseTo(0.5, 6);
  });
});

describe('on real elements', () => {
  it('moves opacity and transform through GSAP, so the browser can run it on the GPU', () => {
    const element = document.createElement('div');
    const channel = createMotionChannel({ paused: true });
    const move = defineChoreography('move', [
      {
        id: 'a',
        target: 'box',
        at: 0,
        duration: 'base',
        ease: 'standard',
        to: { opacity: 0.25, x: 40 },
      },
    ]);
    const handle = channel.play(move, { box: element });
    seek(handle.timeline, 320);
    expect(element.style.opacity).toBe('0.25');
    expect(element.style.transform).toContain('translate(40px');
  });
});
