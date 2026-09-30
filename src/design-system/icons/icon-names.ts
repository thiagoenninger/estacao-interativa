export const ICON_NAMES = [
  'accessibility',
  'back',
  'close',
  'connections',
  'deepen',
  'explore',
  'home',
  'info',
  'next',
  'previous',
  'sound',
  'touch',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const ICON_SIZE = { sm: 20, md: 28, lg: 32 } as const;

export type IconSize = keyof typeof ICON_SIZE;
