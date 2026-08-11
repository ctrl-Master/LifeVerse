import { describe, it, expect } from 'vitest';
import { cosine, buildReferences, similarity, DIMS } from '../../js/engines/vectorMatrix.js';

describe('cosine', () => {
  it('相同向量余弦相似度应为 1', () => {
    expect(cosine([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 10);
  });

  it('正交向量余弦相似度应为 0', () => {
    expect(cosine([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 10);
  });

  it('[1,1,0] vs [1,0,0] 应为 1/√2 ≈ 0.7071', () => {
    expect(cosine([1, 1, 0], [1, 0, 0])).toBeCloseTo(1 / Math.sqrt(2), 4);
  });

  it('零向量应返回 0（避免除零）', () => {
    expect(cosine([0, 0, 0], [1, 0, 0])).toBe(0);
  });

  it('反向向量余弦应为 -1', () => {
    expect(cosine([1, 0, 0], [-1, 0, 0])).toBeCloseTo(-1, 10);
  });
});

describe('DIMS', () => {
  it('应为三维标签数组', () => {
    expect(DIMS).toHaveLength(3);
    DIMS.forEach((d) => expect(typeof d).toBe('string'));
  });
});

describe('buildReferences', () => {
  it('应返回 3 个历史参照', () => {
    const refs = buildReferences([0.7, 0.8, 0.5]);
    expect(refs).toHaveLength(3);
  });

  it('每个参照应包含 name/cosine/vec', () => {
    const refs = buildReferences([0.7, 0.8, 0.5]);
    refs.forEach((r) => {
      expect(r.name).toBeDefined();
      expect(typeof r.cosine).toBe('number');
      expect(r.vec).toHaveLength(3);
    });
  });

  it('构造的向量应满足目标余弦值', () => {
    const userVec = [0.7, 0.8, 0.5];
    const refs = buildReferences(userVec);
    refs.forEach((r) => {
      const actualSim = cosine(userVec, r.vec);
      expect(actualSim).toBeCloseTo(r.cosine, 2);
    });
  });

  it('唐/明/宋 应按文档相似度排列', () => {
    const refs = buildReferences([0.7, 0.8, 0.5]);
    expect(refs[0].name).toContain('唐');
    expect(refs[1].name).toContain('明');
    expect(refs[2].name).toContain('宋');
  });
});

describe('similarity', () => {
  it('应返回 0 到 1 之间的值', () => {
    const refs = buildReferences([0.7, 0.8, 0.5]);
    const sim = similarity([0.7, 0.8, 0.5], refs[0].vec);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it('相同向量相似度应接近 1', () => {
    const sim = similarity([1, 0, 0], [1, 0, 0]);
    expect(sim).toBeCloseTo(1, 4);
  });
});
