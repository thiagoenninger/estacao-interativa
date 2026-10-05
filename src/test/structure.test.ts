import { describe, expect, it } from 'vitest';

const testFiles = Object.keys(import.meta.glob('/src/**/*.test.{ts, tsx}'));

describe('test folder', () => {
  it('finds the tests', () => {
    expect(testFiles.length).toBeGreaterThan(0);
  });

  it('keeps every test file inside src/test, never next to the code', () => {
    expect(testFiles.filter((path) => !path.startsWith('/src/test/'))).toEqual([]);
  });
});
