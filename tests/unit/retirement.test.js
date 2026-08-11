import { describe, it, expect } from 'vitest';
import { delayMonths, minPayYears, computeRetirement, FAFA } from '../../js/engines/retirement.js';

describe('delayMonths', () => {
  it('男职工 1965-01 应返回 1（首个延迟月）', () => {
    expect(delayMonths('male', 1965, 1)).toBe(1);
  });

  it('男职工 1965-05 应返回 2（4个月+1）', () => {
    expect(delayMonths('male', 1965, 5)).toBe(2);
  });

  it('男职工 1964-01 应返回 0（政策前出生）', () => {
    expect(delayMonths('male', 1964, 1)).toBe(0);
  });

  it('男职工封顶 36 个月', () => {
    expect(delayMonths('male', 1976, 1)).toBe(36);
  });

  it('女干部 1970-01 应返回 1', () => {
    expect(delayMonths('female55', 1970, 1)).toBe(1);
  });

  it('女干部 1969-01 应返回 0', () => {
    expect(delayMonths('female55', 1969, 1)).toBe(0);
  });

  it('女工人 1975-01 应返回 1', () => {
    expect(delayMonths('female50', 1975, 1)).toBe(1);
  });

  it('女工人封顶 60 个月', () => {
    expect(delayMonths('female50', 1984, 1)).toBe(60);
  });
});

describe('minPayYears', () => {
  it('2029 年退休最低缴费 15 年', () => {
    expect(minPayYears(2029)).toBe(15);
  });

  it('2030 年退休最低缴费 15.5 年', () => {
    expect(minPayYears(2030)).toBe(15.5);
  });

  it('2039 年封顶 20 年', () => {
    expect(minPayYears(2039)).toBe(20);
  });

  it('2025 年（政策前）仍为 15 年', () => {
    expect(minPayYears(2025)).toBe(15);
  });
});

describe('computeRetirement', () => {
  const baseParams = {
    birthYear: 1990,
    birthMonth: 6,
    type: 'male',
    startYear: 2012,
    flex: 0,
  };

  it('应返回完整结果对象', () => {
    const r = computeRetirement(baseParams);
    expect(r).toHaveProperty('baseAge');
    expect(r).toHaveProperty('delayMonths');
    expect(r).toHaveProperty('statutoryAge');
    expect(r).toHaveProperty('actualAge');
    expect(r).toHaveProperty('date');
    expect(r).toHaveProperty('countdownYears');
    expect(r).toHaveProperty('minPayYears');
    expect(r).toHaveProperty('payYears');
    expect(r).toHaveProperty('ageText');
  });

  it('男职工 baseAge 应为 60', () => {
    expect(computeRetirement(baseParams).baseAge).toBe(60);
  });

  it('女干部 baseAge 应为 55', () => {
    expect(computeRetirement({ ...baseParams, type: 'female55' }).baseAge).toBe(55);
  });

  it('女工人 baseAge 应为 50', () => {
    expect(computeRetirement({ ...baseParams, type: 'female50' }).baseAge).toBe(50);
  });

  it('弹性提前不超过原法定年龄（应触发 clamped）', () => {
    const r = computeRetirement({ ...baseParams, flex: -36 });
    expect(r.clamped).toBe(true);
  });

  it('弹性延迟最多 36 个月（超出应 clamped）', () => {
    const r = computeRetirement({ ...baseParams, flex: 48 });
    expect(r.clamped).toBe(true);
  });

  it('正常退休不触发 clamped', () => {
    const r = computeRetirement(baseParams);
    expect(r.clamped).toBe(false);
  });

  it('ageText 应包含实际退休年龄信息', () => {
    const r = computeRetirement(baseParams);
    expect(r.ageText).toContain('实际退休年龄');
    expect(r.ageText).toContain('法定');
  });

  it('缴费年限应正确计算', () => {
    const r = computeRetirement({ ...baseParams, startYear: 2012 });
    expect(r.payYears).toBeGreaterThan(0);
  });

  it('计发月数表应包含 50-66 岁', () => {
    expect(FAFA[50]).toBe(195);
    expect(FAFA[60]).toBe(139);
    expect(FAFA[66]).toBe(93);
  });
});
