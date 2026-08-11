// 全局状态：localStorage 持久化 + 订阅广播 + schema 校验
// 让 8 大模块形成端到端数据流：星云注入 → 退休预填 → 星图涟漪 → 双生共振 → 断代史报告

const KEY = 'xingyan_state_v1';

const DEFAULT = {
  profile: {
    injected: false,
    age: 30, industry: '互联网', dilemma: '成长停滞',
    features: { hard: '', life: '', niche: '' },
    fearSeed: ''
  },
  retirement: null,
  lastRipple: null,
  decisions: [],
  edgeResistance: {},
  secrets: [],
  positions: {},
  twinPicks: [],
  markers: [],
  reportLayout: ['profile','ripple','friction','twin','retire','letter'],
  letter: '',
  frictionUnresolved: 0,
  settings: { mute: false, probeYear: 2026, split: false, probeAggression: 0 }
};

// schema 校验：检查顶层字段是否齐全
const SCHEMA_KEYS = Object.keys(DEFAULT);

/**
 * 校验加载的状态对象是否包含必需的顶层字段
 * @param {*} data - 从 localStorage 解析的数据
 * @returns {boolean}
 */
function isValid(data) {
  if (!data || typeof data !== 'object') return false;
  for (const k of SCHEMA_KEYS) {
    if (!(k in data)) return false;
  }
  // profile 必须是对象
  if (!data.profile || typeof data.profile !== 'object') return false;
  return true;
}

/**
 * 深度合并：以 DEFAULT 为基准，用 saved 覆盖已有字段
 * 新增字段（DEFAULT 有但 saved 没有）会自动补齐默认值
 * @param {object} base - 默认状态
 * @param {object} saved - 持久化状态
 * @returns {object}
 */
function deepMerge(base, saved) {
  const result = structuredClone(base);
  for (const k of Object.keys(saved)) {
    if (k in result) {
      if (result[k] && typeof result[k] === 'object' && !Array.isArray(result[k]) &&
          saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k])) {
        result[k] = Object.assign({}, result[k], saved[k]);
      } else {
        result[k] = saved[k];
      }
    }
  }
  return result;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) {
      console.warn('[LifeVerse] 状态 schema 校验失败，回退到默认值');
      return structuredClone(DEFAULT);
    }
    return deepMerge(DEFAULT, parsed);
  } catch (e) {
    console.warn('[LifeVerse] 状态加载异常，回退到默认值:', e.message);
    return structuredClone(DEFAULT);
  }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

let state = load();
const subs = new Set();

/**
 * 获取当前状态（只读引用）
 * @returns {object} 全局状态对象
 */
export function getState() { return state; }

/**
 * 浅层合并更新状态
 * @param {object} patch - 要合并的属性
 */
export function setState(patch) {
  state = Object.assign({}, state, patch);
  persist();
  subs.forEach(fn => fn(state));
}

/**
 * 按点分路径更新深层属性
 * @param {string} path - 点分路径，如 'profile.age'
 * @param {*} value - 新值
 */
export function update(path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let obj = state;
  for (const k of keys) obj = obj[k];
  obj[last] = value;
  persist();
  subs.forEach(fn => fn(state));
}

/**
 * 订阅状态变更
 * @param {function(object): void} fn - 回调函数
 * @returns {function(): void} 取消订阅
 */
export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

/**
 * 重置到默认状态
 */
export function reset() {
  state = structuredClone(DEFAULT);
  persist();
  subs.forEach(fn => fn(state));
}
