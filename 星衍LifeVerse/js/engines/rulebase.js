// 引擎：关系传导规则库（模块8 业务逻辑来源）
// 规划：200 → 2000 条生产规则；当前为可运行原型（Schema + 内联示例规则）
// 生产化：将 strength/resistance 由查表获得，而非写死在内联常量中

export const RULE_SCHEMA = {
  fields: {
    from:   { type: 'enum',   desc: '传导源节点 id' },
    to:     { type: 'enum',   desc: '传导目标节点 id' },
    trigger:{ type: 'string', desc: '触发事件关键词（如 转行 / 延迟退休 / 收入下降）' },
    strength:{ type: 'float', range: [0, 1], desc: '基础传导强度' },
    resistance:{ type: 'float', range: [0, 1], desc: '关系阻尼系数（≥0.5 触发反弹波）' },
    effect: { type: 'string', desc: '自然语言效应描述模板' },
    confidence: { type: 'float', range: [0, 1], desc: '规则置信度（来源权重）' },
    source: { type: 'enum',   desc: '规则来源：专家 / 统计 / 用户校准' }
  },
  plan: '原型内置 14 条示例规则；生产中扩展至 2000 条，按 trigger 模糊匹配 + 置信度加权。'
};

// 节点效应文案模板（命中后用于日志与报告）
export const EFFECT_MAP = {
  me:      '轨迹主参数变化',
  spouse:  '家庭现金流承压节点前移，其“稳定优先”权重上调',
  child:   '教育预算曲线重算，兴趣班投入弹性区间收窄',
  father:  '养老支持金计划调整，退休协同方案需重排',
  mother:  '照护时间分配变化，随迁意愿参数更新',
  boss:    '团队人力缺口风险上升，接任者培养计划提前',
  mate:    '协作依赖重构，其晋升窗口概率 +3pt',
  mentor:  '行业人脉网络节点迁移，推荐背书路径变化',
  cohort1: '同代人星云统计分布微调',
  cohort2: '镜像人群路径样本更新',
  cohort3: '同类岗位竞争密度变化'
};

export function describeEffect(id, impact) {
  const base = EFFECT_MAP[id] || '轨迹参数微调';
  const pct = Math.round(impact * 100);
  return `${base}（传导强度 ${pct}%）`;
}

// 分域规则卡包（规划：200→2000 条；当前为可运行原型卡包，覆盖 5 大域）
// 每条字段：id 规则编号 / title 标题 / domain 域 / impact 传导强度 / reach 预计波及人数 / risk 摩擦风险(高/低) / rebound 是否易反弹 / effect 主体-动作-客体文案
export const DOMAIN_COLORS = { family: '#d97706', career: '#0ea5e9', body: '#059669', money: '#7c3aed', social: '#e11d48' };
export const DOMAIN_LABELS = { family: '家庭', career: '事业', body: '身体', money: '金钱', social: '社交' };

export const RULE_PACKS = {
  family: [
    { id: 'family.bond',  title: '结婚 / 分手', domain: 'family', impact: 0.80, reach: 4, risk: '高', rebound: true,  effect: '家庭关系重组，配偶与子女的轨迹权重重排' },
    { id: 'family.child', title: '生育',         domain: 'family', impact: 0.85, reach: 5, risk: '中', rebound: true,  effect: '育儿时间线前置，教育预算曲线重算' },
    { id: 'family.care',  title: '照护父母',     domain: 'family', impact: 0.70, reach: 3, risk: '高', rebound: true,  effect: '父母照护诉求上升，随迁与时间分配参数变化' }
  ],
  career: [
    { id: 'career.switch', title: '换工作',   domain: 'career', impact: 0.75, reach: 3, risk: '中', rebound: false, effect: '职业赛道切换，技能与被引用人脉网络迁移' },
    { id: 'career.study',  title: '进修',     domain: 'career', impact: 0.45, reach: 2, risk: '低', rebound: false, effect: '能力曲线上修，晋升窗口概率微调' },
    { id: 'career.found',  title: '创业',     domain: 'career', impact: 0.90, reach: 4, risk: '高', rebound: true,  effect: '现金流与风险敞口同步放大，同事/上级链路松动' },
    { id: 'career.layoff', title: '被裁 / 降薪', domain: 'career', impact: 0.82, reach: 3, risk: '高', rebound: true, effect: '收入锚点失稳， cohort 竞争密度上升' }
  ],
  body: [
    { id: 'body.health', title: '健康预警', domain: 'body', impact: 0.65, reach: 3, risk: '高', rebound: true,  effect: '身体信号倒逼节奏放缓，工作强度上限下移' }
  ],
  money: [
    { id: 'money.debt',  title: '负债累积', domain: 'money', impact: 0.68, reach: 3, risk: '高', rebound: true,  effect: '现金流承压，储蓄与退休计划协同重排' },
    { id: 'money.invest',title: '投资波动', domain: 'money', impact: 0.50, reach: 2, risk: '中', rebound: false, effect: '资产曲线震荡，风险偏好参数微调' }
  ],
  social: [
    { id: 'social.relocate', title: '搬家 / 换城', domain: 'social', impact: 0.60, reach: 4, risk: '中', rebound: false, effect: '地缘圈层迁移，同事/导师链路需重建' },
    { id: 'social.cut',      title: '断联',         domain: 'social', impact: 0.40, reach: 2, risk: '低', rebound: false, effect: '弱联系溶解，信息源收窄' }
  ]
};

// 扁平检索表：ruleId → 规则元信息
const RULE_INDEX = {};
Object.values(RULE_PACKS).forEach(list => list.forEach(r => { RULE_INDEX[r.id] = r; }));

export function lookupRule(ruleId) {
  if (!ruleId) return null;
  return RULE_INDEX[ruleId] || null;
}

// 反弹故事句：把纯数字的摩擦度改成叙事句
export function describeRebound(from, to, impact, resistance) {
  const FL = { me: '你', spouse: '配偶一栏', child: '子女一栏', father: '父亲一栏', mother: '母亲一栏',
    boss: '上级一栏', mate: '同事一栏', mentor: '导师一栏', cohort1: '同代人A', cohort2: '同代人B', cohort3: '同代人C' };
  const src = FL[from] || from, dst = FL[to] || to;
  const pct = Math.round(resistance * 100);
  const lvl = resistance >= 0.7 ? '狠狠' : '把';
  return `${src}的阻力${lvl}浪潮折了回来——「${dst}」的惯性比你预想得更顽固（摩擦度 +${pct}%，传导强度被削去约 ${Math.round(resistance * 60)}%）`;
}
