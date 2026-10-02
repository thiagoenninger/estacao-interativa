export function isDraft(value: unknown): boolean {
  return typeof value === 'string' && /^\[.*\]$/.test(value.trim());
}

export function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && !isDraft(value);
}
