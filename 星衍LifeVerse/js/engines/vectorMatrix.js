// 引擎：结构相似度向量矩阵（模块3 历史匹配透明化）
// 三维结构向量：[系统网络脆弱性, 替代技术出现速度, 官僚体制锁死程度]
// 方法：余弦相似度 cosine(a,b) = dot / (|a|·|b|)

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  na = Math.sqrt(na); nb = Math.sqrt(nb);
  if (!na || !nb) return 0;
  return dot / (na * nb);
}

function norm(v) {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map(x => x / n);
}

// 返回与 v 正交的单位向量（叉乘一个主轴）
function perpTo(v) {
  const a = Math.abs(v[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const px = v[1] * a[2] - v[2] * a[1];
  const py = v[2] * a[0] - v[0] * a[2];
  const pz = v[0] * a[1] - v[1] * a[0];
  const len = Math.hypot(px, py, pz) || 1;
  return [px / len, py / len, pz / len];
}

// 由目标余弦 c 与基准向量 U 构造历史向量：D = c·Û + √(1-c²)·P，保证 cosine(U,D)=c
function buildFromCosine(U, c) {
  const u = norm(U);
  const p = perpTo(u);
  const s = Math.sqrt(1 - c * c);
  return u.map((x, i) => x * c + p[i] * s);
}

export const DIMS = ['系统网络脆弱性', '替代技术出现速度', '官僚体制锁死程度'];

// 以「当前用户结构向量」为基准，按 PRD 文档标注的相似度构造历史参照向量
// 默认 user 向量下，与各朝代余弦 ≈ 文档示例值（唐 0.985 / 宋 0.94 / 明 0.95）
export function buildReferences(userVec) {
  return [
    { name: '唐朝 · 漕运吏员', cosine: 0.985, vec: buildFromCosine(userVec, 0.985) },
    { name: '明朝 · 工部匠户', cosine: 0.95,  vec: buildFromCosine(userVec, 0.95) },
    { name: '宋朝 · 市舶司',   cosine: 0.94,  vec: buildFromCosine(userVec, 0.94) }
  ];
}

// 实时计算：当前用户向量 vs 某历史向量
export function similarity(userVec, refVec) {
  return cosine(norm(userVec), refVec);
}
