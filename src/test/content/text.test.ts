import { describe, expect, it } from 'vitest';
import { hasText, isDraft } from '@/content/text.ts';

describe('draft markers', () => {
  it('recognizes text between square brackets', () => {
    expect(isDraft('[TEXTO — curadoria]')).toBe(true);
    expect(isDraft('[VALOR]')).toBe(true);
    expect(isDraft('  [COMPONENTE] ')).toBe(true);
  });

  it('does not take real text for a draft', () => {
    expect(isDraft('Al(OH)₃')).toBe(false);
    expect(isDraft('(Ce,La,Nd,Th)PO₄')).toBe(false);
    expect(isDraft('Texto [com colchetes] no meio')).toBe(false);
    expect(isDraft(null)).toBe(false);
  });

  it('hasText is false for empty, null and drafts', () => {
    expect(hasText('Um texto real.')).toBe(true);
    expect(hasText('')).toBe(false);
    expect(hasText('   ')).toBe(false);
    expect(hasText(null)).toBe(false);
    expect(hasText('[TEXTO — curadoria]')).toBe(false);
  });
});
