import { describe, expect, it } from 'vitest';
import { nextRunAt, HOUR_MS, GRACE_MS } from './src/schedule.mjs';

const HOUR = Date.UTC(2026, 8, 4, 14, 0, 0); // 14:00:00 UTC
const t = seconds => HOUR + seconds * 1000;

describe('nextRunAt', () => {
  it('targets :00:10 of the current hour when that is still ahead', () => {
    expect(nextRunAt(t(0))).toBe(HOUR + GRACE_MS);
    expect(nextRunAt(t(9))).toBe(HOUR + GRACE_MS);
  });

  it('moves to the next hour once :00:10 has passed', () => {
    expect(nextRunAt(t(10))).toBe(HOUR + HOUR_MS + GRACE_MS);
    expect(nextRunAt(t(12))).toBe(HOUR + HOUR_MS + GRACE_MS);
    expect(nextRunAt(t(59 * 60 + 55))).toBe(HOUR + HOUR_MS + GRACE_MS);
  });
});
