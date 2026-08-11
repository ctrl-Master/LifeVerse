import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for Node environment
const mockStore = {};
globalThis.localStorage = {
  getItem: (key) => mockStore[key] || null,
  setItem: (key, value) => { mockStore[key] = String(value); },
  removeItem: (key) => { delete mockStore[key]; },
  clear: () => { Object.keys(mockStore).forEach((k) => delete mockStore[k]); },
};

// 需要在 mock 之后 import，确保 store.js 能访问到 localStorage
const { getState, setState, update, subscribe, reset } = await import('../../js/store.js');

describe('store', () => {
  beforeEach(() => {
    localStorage.clear();
    reset();
  });

  describe('getState', () => {
    it('应返回默认状态', () => {
      const s = getState();
      expect(s.profile).toBeDefined();
      expect(s.profile.injected).toBe(false);
      expect(s.profile.age).toBe(30);
      expect(s.retirement).toBeNull();
      expect(s.decisions).toEqual([]);
    });
  });

  describe('setState', () => {
    it('应合并 patch 到状态', () => {
      setState({ retirement: { age: 60 } });
      expect(getState().retirement).toEqual({ age: 60 });
    });

    it('不应覆盖未传入的字段', () => {
      const before = getState();
      setState({ retirement: { age: 60 } });
      const after = getState();
      expect(after.profile).toEqual(before.profile);
      expect(after.decisions).toEqual(before.decisions);
    });
  });

  describe('update', () => {
    it('应支持点号路径深层更新', () => {
      update('profile.age', 35);
      expect(getState().profile.age).toBe(35);
    });

    it('应支持嵌套路径', () => {
      update('profile.features.hard', 'React/Vue');
      expect(getState().profile.features.hard).toBe('React/Vue');
    });

    it('应支持数组路径', () => {
      update('decisions', [{ name: 'test' }]);
      expect(getState().decisions).toEqual([{ name: 'test' }]);
    });
  });

  describe('subscribe', () => {
    it('状态变更时应通知订阅者', () => {
      let called = false;
      const unsub = subscribe(() => { called = true; });
      setState({ test: true });
      expect(called).toBe(true);
      unsub();
    });

    it('取消订阅后不应再被通知', () => {
      let count = 0;
      const unsub = subscribe(() => { count++; });
      unsub();
      setState({ test: true });
      expect(count).toBe(0);
    });

    it('多个订阅者都应被通知', () => {
      let c1 = 0, c2 = 0;
      const u1 = subscribe(() => { c1++; });
      const u2 = subscribe(() => { c2++; });
      setState({ test: true });
      expect(c1).toBe(1);
      expect(c2).toBe(1);
      u1();
      u2();
    });
  });

  describe('reset', () => {
    it('应恢复到默认状态', () => {
      update('profile.age', 50);
      update('decisions', [{ name: 'x' }]);
      reset();
      const s = getState();
      expect(s.profile.age).toBe(30);
      expect(s.decisions).toEqual([]);
    });
  });

  describe('persistence', () => {
    it('setState 后应持久化到 localStorage', () => {
      setState({ retirement: { year: 2050 } });
      const raw = localStorage.getItem('xingyan_state_v1');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw);
      expect(parsed.retirement).toEqual({ year: 2050 });
    });
  });
});
