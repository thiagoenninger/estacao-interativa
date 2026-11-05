import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { createMotionChannel, type MotionChannel } from './channel.ts';
import { startFloat, type FloatHandle } from './float-driver.ts';
import { createFloatModel, drawFloatParams, type FloatDepth, type FloatMode } from './float.ts';

gsap.registerPlugin(useGSAP);

export function useMotionChannel(): MotionChannel {
  const [channel] = useState(() => createMotionChannel());
  useGSAP(() => () => channel.stop(), { dependencies: [channel] });
  return channel;
}

export interface UseFloatOptions {
  depth: FloatDepth;
  mode?: FloatMode;
  random?: () => number;
}

export function useFloat(ref: RefObject<HTMLElement | null>, options: UseFloatOptions): void {
  const { depth, mode = 'free', random = Math.random } = options;
  const [params] = useState(() => drawFloatParams(depth, random));
  const handle = useRef<FloatHandle | null>(null);
  const firstMode = useRef(mode);

  useGSAP(
    () => {
      const element = ref.current;
      if (element === null) return undefined;
      const float = startFloat(element, createFloatModel(params, firstMode.current));
      handle.current = float;
      return () => {
        float.stop();
        handle.current = null;
      };
    },
    { dependencies: [params] },
  );

  useEffect(() => {
    handle.current?.setMode(mode);
  }, [mode]);
}
