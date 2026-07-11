import { describe, it, expect } from 'vitest';
import {
  estimated1RM,
  sessionVolume,
  bestWeightPR,
  best1RM,
  maxReps,
  maxSets,
  maxVolume,
  progressSeries,
} from './stats.js';

const sessions = [
  { id: 's1', date: 1000, sets: [{ weight: 100, reps: 5, rpe: 8 }, { weight: 100, reps: 5, rpe: 9 }] },
  { id: 's2', date: 2000, sets: [{ weight: 110, reps: 3, rpe: 9 }, { weight: 105, reps: 8, rpe: 10 }] },
  { id: 's3', date: 3000, sets: [{ weight: 90, reps: 12, rpe: 8 }] },
];

describe('estimated1RM', () => {
  it('applies the Epley formula', () => {
    expect(estimated1RM({ weight: 100, reps: 5 })).toBeCloseTo(100 * (1 + 5 / 30));
  });

  it('returns 0 for invalid input', () => {
    expect(estimated1RM(null)).toBe(0);
    expect(estimated1RM({ weight: 100, reps: 0 })).toBe(0);
  });
});

describe('sessionVolume', () => {
  it('sums weight*reps across sets', () => {
    expect(sessionVolume(sessions[0])).toBe(100 * 5 + 100 * 5);
  });

  it('returns 0 for empty sessions', () => {
    expect(sessionVolume({ sets: [] })).toBe(0);
  });
});

describe('bestWeightPR', () => {
  it('finds the max weight across all sets and its date', () => {
    expect(bestWeightPR(sessions)).toEqual({ value: 110, date: 2000 });
  });
});

describe('best1RM', () => {
  it('finds the best estimated 1RM and its date/set', () => {
    const result = best1RM(sessions);
    expect(result.date).toBe(2000);
    expect(result.set).toEqual({ weight: 105, reps: 8, rpe: 10 });
  });
});

describe('maxReps', () => {
  it('finds the max reps in a single set', () => {
    expect(maxReps(sessions)).toEqual({ value: 12, date: 3000 });
  });
});

describe('maxSets', () => {
  it('finds the max number of sets in a session', () => {
    expect(maxSets(sessions)).toEqual({ value: 2, date: 1000 });
  });
});

describe('maxVolume', () => {
  it('finds the max session volume', () => {
    // s1: 100*5+100*5=1000, s2: 110*3+105*8=330+840=1170, s3: 90*12=1080
    expect(maxVolume(sessions)).toEqual({ value: 1170, date: 2000 });
  });
});

describe('progressSeries', () => {
  it('builds a 1rm series sorted by date', () => {
    const series = progressSeries(sessions, '1rm');
    expect(series).toHaveLength(3);
    expect(series[0].date).toBe(1000);
    expect(series[2].date).toBe(3000);
  });

  it('builds a volume series', () => {
    const series = progressSeries(sessions, 'volume');
    expect(series.map((s) => s.value)).toEqual([1000, 1170, 1080]);
  });

  it('returns an empty array for no sessions', () => {
    expect(progressSeries([], '1rm')).toEqual([]);
  });
});
