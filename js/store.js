// 全局状态：localStorage 持久化 + 订阅广播
// 让 8 大模块形成端到端数据流：星云注入 → 退休预填 → 星图涟漪 → 双生共振 → 断代史报告

const KEY = 'xingyan_state_v1';

const DEFAULT = {
  profile: {
    injected: false,
    age: 30, industry: '互联网', dilemma: '成长停滞',
    features: { hard: '', life: '', niche: '' },
    fearSeed: ''        // 命运种子：一句话「我最怕的是…」
  },
  retirement: null,     // computeRetirement 结果
  lastRipple: null,     // { source, name, impact, results:[{from,to,depth,impact,resistance}] }
  decisions: [],        // 扇形决策快照：{source,name,impact,ruleId,at,year,rebound}
  edgeResistance: {},   // 长按连线调阻尼后覆盖：{ 'me|spouse': 0.7 }
  secrets: [],          // 秘密边：{from,to,label}（仅自己可见）
  positions: {},        // 可编辑引力微粒当前值：{age,city,job,...}
  twinPicks: [],        // 选中的共振对相似度列表：{name,sim}
  markers: [],          // 事件钉：{year,type,label} type: decision|retire|policy
  reportLayout: ['profile','ripple','friction','twin','retire','letter'], // 报告章节顺序
  letter: '',           // 给十年后的信（末段）
  frictionUnresolved: 0,// 未解摩擦累计（高阻尼边）
  settings: { mute: false, probeYear: 2026, split: false, probeAggression: 0 }
};

let state = load();
const subs = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return Object.assign(structuredClone(DEFAULT), JSON.parse(raw));
  } catch (e) { return structuredClone(DEFAULT); }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

export function getState() { return state; }
export function setState(patch) {
  state = Object.assign({}, state, patch);
  persist();
  subs.forEach(fn => fn(state));
}
export function update(path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let obj = state;
  for (const k of keys) obj = obj[k];
  obj[last] = value;
  persist();
  subs.forEach(fn => fn(state));
}
export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
export function reset() {
  state = structuredClone(DEFAULT);
  persist();
  subs.forEach(fn => fn(state));
}
