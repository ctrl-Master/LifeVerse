import { describe, it, expect } from 'vitest';
import {
  NODES,
  LINKS,
  DECAY,
  castRipple,
  nodeById,
  SCENES,
  COLORS,
} from '../../js/engines/starmap.js';

describe('NODES', () => {
  it('应有 11 个节点', () => {
    expect(NODES).toHaveLength(11);
  });

  it('应包含 me 节点且 tier=0', () => {
    const me = NODES.find((n) => n.id === 'me');
    expect(me).toBeDefined();
    expect(me.tier).toBe(0);
  });

  it('每个节点应有 id/label/tier/color/r 属性', () => {
    NODES.forEach((n) => {
      expect(n.id).toBeDefined();
      expect(n.label).toBeDefined();
      expect(n.tier).toBeDefined();
      expect(n.color).toBeDefined();
      expect(n.r).toBeGreaterThan(0);
    });
  });
});

describe('LINKS', () => {
  it('应有 14 条引力线', () => {
    expect(LINKS).toHaveLength(14);
  });

  it('每条线应为 [src, dst, strength, resistance] 格式', () => {
    LINKS.forEach((lk) => {
      expect(lk).toHaveLength(4);
      expect(typeof lk[0]).toBe('string');
      expect(typeof lk[1]).toBe('string');
      expect(lk[2]).toBeGreaterThan(0);
      expect(lk[2]).toBeLessThanOrEqual(1);
      expect(lk[3]).toBeGreaterThanOrEqual(0);
      expect(lk[3]).toBeLessThanOrEqual(1);
    });
  });
});

describe('DECAY', () => {
  it('衰减数组应为 [1, 0.7, 0.4, 0.15]', () => {
    expect(DECAY).toEqual([1, 0.7, 0.4, 0.15]);
  });
});

describe('nodeById', () => {
  it('应能找到 me 节点', () => {
    expect(nodeById('me').id).toBe('me');
  });

  it('不存在的 id 应返回 null', () => {
    expect(nodeById('nonexistent')).toBeNull();
  });
});

describe('castRipple', () => {
  it('从 me 发射应返回受影响节点集合', () => {
    const { results, affected } = castRipple('me', 0.9);
    expect(results.length).toBeGreaterThan(0);
    expect(affected.has('me')).toBe(true);
  });

  it('涟漪应按 depth 排序', () => {
    const { results } = castRipple('me', 0.9);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].depth).toBeGreaterThanOrEqual(results[i - 1].depth);
    }
  });

  it('高阻尼边应触发真实衰减（impact 被削弱）', () => {
    const { results } = castRipple('me', 0.9);
    const highResistance = results.filter((r) => r.resistance >= 0.5);
    highResistance.forEach((r) => {
      expect(r.impact).toBeLessThan(0.9 * 0.7 * 0.4);
    });
  });

  it('极低 impact（<0.05）应被跳过', () => {
    const { results } = castRipple('me', 0.01);
    expect(results.length).toBe(0);
  });

  it('results 每条应包含 from/to/depth/impact/resistance', () => {
    const { results } = castRipple('me', 0.9);
    results.forEach((r) => {
      expect(r).toHaveProperty('from');
      expect(r).toHaveProperty('to');
      expect(r).toHaveProperty('depth');
      expect(r).toHaveProperty('impact');
      expect(r).toHaveProperty('resistance');
    });
  });

  it('自定义 links 参数应生效', () => {
    const customLinks = [['me', 'spouse', 0.9, 0.3]];
    const { results } = castRipple('me', 0.9, customLinks);
    expect(results).toHaveLength(1);
    expect(results[0].to).toBe('spouse');
  });
});

describe('SCENES', () => {
  it('应包含 career/retire/spouse 三个场景', () => {
    expect(SCENES.career).toBeDefined();
    expect(SCENES.retire).toBeDefined();
    expect(SCENES.spouse).toBeDefined();
  });

  it('每个场景应有 source/name/impact', () => {
    Object.values(SCENES).forEach((sc) => {
      expect(sc.source).toBeDefined();
      expect(sc.name).toBeDefined();
      expect(sc.impact).toBeGreaterThan(0);
      expect(sc.impact).toBeLessThanOrEqual(1);
    });
  });
});

describe('COLORS', () => {
  it('应包含 me/family/work/cohort 四色', () => {
    expect(COLORS.me).toBeDefined();
    expect(COLORS.family).toBeDefined();
    expect(COLORS.work).toBeDefined();
    expect(COLORS.cohort).toBeDefined();
  });
});
