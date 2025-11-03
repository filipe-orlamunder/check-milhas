import { describe, it, expect } from 'vitest';
import { DATE_RE, parseDateOnlyToLocal } from '../dateUtils';

describe('server/utils/dateUtils', () => {
  it('DATE_RE valida YYYY-MM-DD', () => {
    expect(DATE_RE.test('2025-01-01')).toBe(true);
    expect(DATE_RE.test('2025-1-1')).toBe(false);
    expect(DATE_RE.test('01/01/2025')).toBe(false);
  });

  it('parseDateOnlyToLocal cria Date local sem fuso', () => {
    const d = parseDateOnlyToLocal('2025-02-03');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(1); // 0-based
    expect(d.getDate()).toBe(3);
  });
});
