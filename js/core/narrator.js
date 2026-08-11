// 叙事系统：时代广播 + 内心独白 + 叙事条控制
import { getState } from '../store.js';

/**
 * 更新顶部叙事条文案
 * @param {string} text - 叙事文案
 * @param {string} [channel] - 频道标识：sys / era / mono
 */
export function narrate(text, channel) {
  const t = document.getElementById('narrativeText');
  const bar = document.getElementById('narrativeBar');
  if (t) t.textContent = text;
  if (bar) {
    bar.classList.toggle('echo', /反弹|阻力|摩擦|折了回来/.test(text));
    bar.setAttribute('data-ch', channel || 'sys');
  }
}

// 时代广播文案表
const ERA = {
  2026: '2026 · 行业周期横盘，确定性成为稀缺品', 2027: '2027 · AI 重构岗位边界，中年转型窗口开启',
  2028: '2028 · 延迟退休细则落地，长线规划被迫前移', 2029: '2029 · 行业周期下行，现金防御优先',
  2030: '2030 · 缴费年限门槛抬升，补缴窗口收窄', 2031: '2031 · 银发经济扩容，第二曲线浮现',
  2032: '2032 · 组织扁平化，个体价值重估', 2033: '2033 · 地缘与产业再布局',
  2034: '2034 · 技能半衰期缩短', 2035: '2035 · 延迟退休政策到位，代际接力显性化', 2036: '2036 · 长周期收束，静水流深'
};

/**
 * 生成内心独白
 * @returns {string} 独白文案
 */
function monologue() {
  const s = getState();
  const d = s.profile.dilemma || (s.profile.fearSeed ? '怕 ' + s.profile.fearSeed : '未知');
  const pool = [
    '内心独白：我真正怕的，或许不是「' + d + '」，而是来不及准备。',
    '内心独白：每一个决策，都是给未来的自己写的一封信。',
    '内心独白：若十年后回望，我最想确认的，是今天没有逃避。'
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 时代广播：叙事条三通道轮播（时代 / 独白）
 */
export function eraBroadcast() {
  const yr = getState().settings.probeYear || 2026;
  const ch = Math.random() < 0.5 ? 'era' : 'mono';
  narrate(ch === 'era' ? ('时代广播 · ' + (ERA[yr] || ('探针 ' + yr + ' · 时代静默'))) : monologue(), ch);
}
