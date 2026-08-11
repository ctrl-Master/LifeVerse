// 路由系统：模块注册、导航构建、视图切换
import { nebula } from '../modules/nebula.js';
import { starmapView } from '../modules/starmapView.js';
import { twin } from '../modules/twin.js';
import { retirement } from '../modules/retirement.js';
import { probe } from '../modules/probe.js';
import { report } from '../modules/report.js';
import { narrate } from './narrator.js';
import { updateHud } from './hud.js';

// 模块注册表
export const MODULES = [nebula, starmapView, twin, retirement, probe, report];

// 当前激活模块
let current = null;

/**
 * 获取当前模块
 * @returns {object|null}
 */
export function getCurrent() {
  return current;
}

/**
 * 路由切换
 * @param {string} id - 模块 ID
 */
export function route(id) {
  const m = MODULES.find(x => x.id === id);
  if (!m || (current && current.id === id)) return;
  if (current && current.unmount) current.unmount();

  const stage = document.getElementById('stage');
  const nav = document.getElementById('nav');
  stage.innerHTML = '';
  m.mount(stage);
  current = m;

  nav.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.textContent.includes(m.title));
  });
  stage.scrollTop = 0;

  // 背景色相旋转
  const DEG = { nebula: 275, starmap: 0, twin: 190, retirement: 35, probe: 190, report: 225 };
  const bg = document.getElementById('bgStarNet');
  if (bg) bg.style.filter = 'hue-rotate(' + (DEG[id] || 0) + 'deg)';

  narrate(m.subtitle || m.title);
  updateHud(MODULES, nav);
}

/**
 * 构建侧栏导航
 */
export function buildNav() {
  const nav = document.getElementById('nav');
  MODULES.forEach((m, i) => {
    const item = document.createElement('button');
    item.className = 'nav-item' + (i === 0 ? ' active' : '');
    item.innerHTML = '<span class="nav-idx">0' + (i + 1) + '</span>' + m.title + '<span class="nav-dot idle"></span>';
    item.addEventListener('click', () => route(m.id));
    nav.appendChild(item);
  });
}
