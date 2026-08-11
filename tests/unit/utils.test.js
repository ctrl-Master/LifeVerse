import { describe, it, expect } from 'vitest';
import { clamp, lerp, dist, fmt1 } from '../../js/utils/math.js';

describe('math utils', () => {
  describe('clamp', () => {
    it('应限制在范围内', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-1, 0, 10)).toBe(0);
      expect(clamp(11, 0, 10)).toBe(10);
    });
    it('边界值应正确', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('lerp', () => {
    it('t=0 应返回 a', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });
    it('t=1 应返回 b', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });
    it('t=0.5 应返回中点', () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
    });
  });

  describe('dist', () => {
    it('应计算两点距离', () => {
      expect(dist(0, 0, 3, 4)).toBe(5);
    });
    it('同点距离应为 0', () => {
      expect(dist(5, 5, 5, 5)).toBe(0);
    });
  });

  describe('fmt1', () => {
    it('应保留一位小数', () => {
      expect(fmt1(3.14159)).toBe('3.1');
      expect(fmt1(2.56)).toBe('2.6');
    });
    it('整数应显示 .0', () => {
      expect(fmt1(5)).toBe('5.0');
    });
  });
});
