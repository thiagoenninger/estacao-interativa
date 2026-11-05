export {
  createMotionChannel,
  type MotionChannel,
  type MotionChannelOptions,
  type MotionTarget,
  type PlayHandle,
  type PlayOutcome,
  type TargetMap,
} from './channel.ts';
export {
  ANIMATABLE,
  choreographyEnd,
  defineChoreography,
  trackEnd,
  type AnimatableProp,
  type Choreography,
  type DurationName,
  type Track,
  type TweenValues,
} from './choreography.ts';
export {
  cubicBezier,
  easingFunction,
  parseCubicBezier,
  type EasingFunction,
  type EasingName,
} from './easing.ts';
export { startFloat, type FloatHandle, type Ticker } from './float-driver.ts';
export {
  DRIFT_AMPLITUDE,
  FADED_AMPLITUDE,
  FLOAT_AMPLITUDE,
  FLOAT_BLEND_TAU,
  ROTATION_AMPLITUDE,
  ROTATION_PERIOD_FACTOR,
  DRIFT_PERIOD_FACTOR,
  SELECTED_AMPLITUDE,
  createFloatModel,
  drawFloatParams,
  type FloatDepth,
  type FloatMode,
  type FloatModel,
  type FloatParams,
  type FloatSample,
} from './float.ts';
export { useFloat, useMotionChannel, type UseFloatOptions } from './hooks.ts';
export { createRandom } from './random.ts';
export { DURATION, EASING, IDLE, STAGGER_STEP } from './tokens.ts';
