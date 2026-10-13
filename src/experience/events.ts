export type UserEvent =
  | { readonly type: 'select-object'; readonly objectId: string }
  | { readonly type: 'select-material'; readonly materialId: string }
  | { readonly type: 'select-present-in'; readonly n: number }
  | { readonly type: 'open-layer'; readonly layerId: string }
  | { readonly type: 'open-related'; readonly objectId: string }
  | { readonly type: 'back' }
  | { readonly type: 'home' }
  | { readonly type: 'touch-background' }
  | { readonly type: 'touch-warning' };

export type SystemEvent = { readonly type: 'idle-warn' } | { readonly type: 'idle-return' };
export type ExperienceEvent = UserEvent | SystemEvent;
export type UserEventType = UserEvent['type'];

export const USER_EVENT_TYPES: readonly UserEventType[] = [
  'select-object',
  'select-material',
  'select-present-in',
  'open-layer',
  'open-related',
  'back',
  'home',
  'touch-background',
  'touch-warning',
];

export function isUserEvent(event: ExperienceEvent): event is UserEvent {
  return event.type !== 'idle-warn' && event.type !== 'idle-return';
}
