import { describe, it, expect } from 'vitest';
import {
  lookupRule,
  describeEffect,
  describeRebound,
  RULE_PACKS,
  RULE_SCHEMA,
  EFFECT_MAP,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
} from '../../js/engines/rulebase.js';

describe('RULE_SCHEMA', () => {
  it('应包含 fields 和 plan', () => {
    expect(RULE_SCHEMA.fields).toBeDefined();
    expect(RULE_SCHEMA.plan).toBeDefined();
  });

  it('fields 应包含 from/to/trigger/strength/resistance/effect/confidence/source', () => {
    const keys = Object.keys(RULE_SCHEMA.fields);
    expect(keys).toContain('from');
    expect(keys).toContain('to');
    expect(keys).toContain('trigger');
    expect(keys).toContain('strength');
    expect(keys).toContain('resistance');
    expect(keys).toContain('effect');
    expect(keys).toContain('confidence');
    expect(keys).toContain('source');
  });
});

describe('RULE_PACKS', () => {
  it('应包含 family/career/body/money/social 五域', () => {
    expect(RULE_PACKS.family).toBeDefined();
    expect(RULE_PACKS.career).toBeDefined();
    expect(RULE_PACKS.body).toBeDefined();
    expect(RULE_PACKS.money).toBeDefined();
    expect(RULE_PACKS.social).toBeDefined();
  });

  it('每条规则应含 id/title/domain/impact/reach/risk/rebound/effect', () => {
    Object.values(RULE_PACKS).forEach((pack) => {
      pack.forEach((rule) => {
        expect(rule.id).toBeDefined();
        expect(rule.title).toBeDefined();
        expect(rule.domain).toBeDefined();
        expect(rule.impact).toBeGreaterThan(0);
        expect(rule.impact).toBeLessThanOrEqual(1);
        expect(rule.reach).toBeGreaterThan(0);
        expect(['高', '中', '低']).toContain(rule.risk);
        expect(typeof rule.rebound).toBe('boolean');
        expect(rule.effect).toBeDefined();
      });
    });
  });
});

describe('lookupRule', () => {
  it('应能查到 career.switch', () => {
    const r = lookupRule('career.switch');
    expect(r).not.toBeNull();
    expect(r.title).toBe('换工作');
  });

  it('应能查到 family.bond', () => {
    const r = lookupRule('family.bond');
    expect(r).not.toBeNull();
    expect(r.title).toBe('结婚 / 分手');
  });

  it('不存在的 ruleId 应返回 null', () => {
    expect(lookupRule('nonexistent.rule')).toBeNull();
  });

  it('null/undefined 入参应返回 null', () => {
    expect(lookupRule(null)).toBeNull();
    expect(lookupRule(undefined)).toBeNull();
  });
});

describe('describeEffect', () => {
  it('应返回包含传导强度百分比的文案', () => {
    const text = describeEffect('me', 0.5);
    expect(text).toContain('50%');
  });

  it('未知节点 id 应返回默认文案', () => {
    const text = describeEffect('unknown', 0.3);
    expect(text).toContain('轨迹参数微调');
  });

  it('EFFECT_MAP 应包含 11 个节点', () => {
    expect(Object.keys(EFFECT_MAP)).toHaveLength(11);
  });
});

describe('describeRebound', () => {
  it('高阻尼(≥0.7)应包含「狠狠」', () => {
    const text = describeRebound('me', 'father', 0.5, 0.8);
    expect(text).toContain('狠狠');
  });

  it('应包含摩擦度百分比', () => {
    const text = describeRebound('me', 'spouse', 0.5, 0.3);
    expect(text).toContain('30%');
  });

  it('应包含「折了回来」', () => {
    const text = describeRebound('me', 'spouse', 0.5, 0.5);
    expect(text).toContain('折了回来');
  });
});

describe('DOMAIN_COLORS & DOMAIN_LABELS', () => {
  it('五域颜色和标签应对应', () => {
    const domains = ['family', 'career', 'body', 'money', 'social'];
    domains.forEach((d) => {
      expect(DOMAIN_COLORS[d]).toBeDefined();
      expect(DOMAIN_LABELS[d]).toBeDefined();
    });
  });
});
