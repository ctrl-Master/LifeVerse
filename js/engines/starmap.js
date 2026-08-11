// 引擎：人生星图 · 关系引力场（模块2/7/8 核心）
// 11 节点 / 14 引力线，BFS 涟漪传导 + 阻尼(Resistance) + 反弹波(Echo)
// v2.2 修复：resistance≥0.5 时真实衰减 nextImpact *= (1 - resistance*0.6)，而非仅视觉/日志层

export const COLORS = { me: '#4f46e5', family: '#d97706', work: '#0ea5e9', cohort: '#94a3b8' };

export const NODES = [
  { id: 'me',      label: '我',        tier: 0, color: COLORS.me,     r: 16 },
  { id: 'spouse',  label: '配偶',      tier: 1, color: COLORS.family, r: 11 },
  { id: 'child',   label: '子女',      tier: 1, color: COLORS.family, r: 9  },
  { id: 'father',  label: '父亲',      tier: 1, color: COLORS.family, r: 10 },
  { id: 'mother',  label: '母亲',      tier: 1, color: COLORS.family, r: 10 },
  { id: 'boss',    label: '直属上级',  tier: 2, color: COLORS.work,   r: 8  },
  { id: 'mate',    label: '核心同事',  tier: 2, color: COLORS.work,   r: 8  },
  { id: 'mentor',  label: '行业导师',  tier: 2, color: COLORS.work,   r: 8  },
  { id: 'cohort1', label: '同代人A',   tier: 3, color: COLORS.cohort, r: 6  },
  { id: 'cohort2', label: '同代人B',   tier: 3, color: COLORS.cohort, r: 6  },
  { id: 'cohort3', label: '同代人C',   tier: 3, color: COLORS.cohort, r: 6  }
];

// [src, dst, strength, resistance]
export const LINKS = [
  ['me','spouse',0.9,0.30], ['me','child',0.85,0.20], ['me','father',0.7,0.70], ['me','mother',0.7,0.70],
  ['me','boss',0.5,0.40], ['me','mate',0.45,0.30], ['me','mentor',0.4,0.20],
  ['spouse','child',0.8,0.25], ['father','mother',0.75,0.30],
  ['mate','cohort1',0.2,0.30], ['mentor','cohort2',0.2,0.30], ['boss','cohort3',0.15,0.30],
  ['me','cohort1',0.15,0.20], ['me','cohort2',0.12,0.20]
];

export const DECAY = [1, 0.7, 0.4, 0.15];

export function nodeById(id) {
  for (const n of NODES) if (n.id === id) return n;
  return null;
}

/**
 * 涟漪传导引擎（BFS）
 * @param {string} sourceId 事件源
 * @param {number} baseImpact 初始影响强度
 * @param {object} [links] 可选自定义引力线（默认 LINKS）
 * @returns {{results: Array, affected: Set}}
 */
export function castRipple(sourceId, baseImpact, links = LINKS) {
  const results = [];
  const visited = { [sourceId]: true };
  const queue = [{ id: sourceId, depth: 0, impact: baseImpact }];

  while (queue.length) {
    const cur = queue.shift();
    for (const lk of links) {
      const nb = lk[0] === cur.id ? lk[1] : (lk[1] === cur.id ? lk[0] : null);
      if (!nb || visited[nb]) continue;
      const strength = lk[2];
      const resistance = lk[3] || 0;
      // 衰减
      let nextImpact = cur.impact * strength * (DECAY[cur.depth + 1] || 0.1);
      // v2.2 阻尼真实衰减：高阻尼削弱传导
      if (resistance >= 0.5) nextImpact *= (1 - resistance * 0.6);
      if (Math.abs(nextImpact) < 0.05) continue;
      visited[nb] = true;
      queue.push({ id: nb, depth: cur.depth + 1, impact: nextImpact });
      results.push({
        from: cur.id, to: nb, depth: cur.depth + 1,
        impact: nextImpact, resistance
      });
    }
  }
  results.sort((a, b) => a.depth - b.depth);
  const affected = new Set(results.map(r => r.to));
  affected.add(sourceId);
  return { results, affected };
}

export const SCENES = {
  career: { source: 'me',   name: '我 2027 年转行 AI 产品经理', impact: 0.9 },
  retire: { source: 'me',   name: '我选择延迟退休 3 年（弹性上限）', impact: 0.75 },
  spouse: { source: 'spouse', name: '配偶收入下降 30%', impact: 0.85 }
};
