// HUD 系统：探针年徽章 + 人生完整度环 + 侧栏状态点
import { getState } from '../store.js';

// 模块对应色相
const HUE = {
  nebula: '#7c3aed', starmap: '#4f46e5', twin: '#0ea5e9',
  retirement: '#d97706', probe: '#0ea5e9', report: '#1f2937'
};

/**
 * 计算人生完整度（0-100）
 * @returns {number}
 */
function completeness() {
  const s = getState();
  let v = 0;
  if (s.profile.injected) v += 25;
  v += Math.min(20, (s.decisions || []).length * 5);
  v += Math.min(20, (s.markers || []).length * 4);
  if ((s.twinPicks || []).length) v += 15;
  if (s.retirement) v += 20;
  return Math.min(100, v);
}

/**
 * 更新 HUD 显示（徽章、完整度环、侧栏状态点）
 * @param {Array} modules - 模块列表（用于匹配侧栏按钮）
 * @param {HTMLElement} nav - 侧栏导航元素
 */
export function updateHud(modules, nav) {
  const s = getState();
  const yr = s.settings.probeYear || 2026;
  const yEl = document.getElementById('hudYear');
  if (yEl) yEl.textContent = '探针 ' + yr;
  const rEl = document.getElementById('hudRing');
  if (rEl) rEl.textContent = completeness() + '%';

  // 侧栏状态点
  const statusOf = (id) => {
    const st = getState();
    if (id === 'nebula') return st.profile.injected ? 'ok' : 'idle';
    if (id === 'starmap') return (st.decisions || []).length ? (st.frictionUnresolved > 0 ? 'conf' : 'ok') : 'idle';
    if (id === 'twin') return (st.twinPicks || []).length ? 'ok' : 'idle';
    if (id === 'retirement') return st.retirement ? 'ok' : 'idle';
    if (id === 'probe') return st.settings.probeYear > 2026 ? 'ok' : 'idle';
    if (id === 'report') return (st.decisions || []).length ? 'ok' : 'idle';
    return 'idle';
  };

  nav.querySelectorAll('.nav-item').forEach(b => {
    let dot = b.querySelector('.nav-dot');
    if (!dot) { dot = document.createElement('span'); dot.className = 'nav-dot'; b.appendChild(dot); }
    const mod = modules.find(m => b.textContent.includes(m.title));
    dot.className = 'nav-dot ' + (mod ? statusOf(mod.id) : 'idle');
  });
}
