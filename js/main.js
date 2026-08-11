// 应用入口：引导启动各子系统
// Phase 2 重构：从 286 行拆分为 core/ 下 6 个职责清晰的模块
import { route, buildNav, getCurrent, MODULES } from './core/router.js';
import { narrate, eraBroadcast } from './core/narrator.js';
import { updateHud } from './core/hud.js';
import { initBgStarNet } from './core/bgStarNet.js';
import { initAudioPanel, initShortcuts, initVoice } from './core/interactions.js';
import { installErrorHandler } from './core/errorBoundary.js';
import { Sound } from './engines/audio.js';
import { reset, subscribe } from './store.js';

// 全局应用句柄（模块通过 window.LTApp 注册能力，向后兼容）
// TODO Phase 3：改为 ES Module 单例，消除全局污染
const LTApp = {
  route,
  narrate,
  reset,
  Sound,
  starmapRipple: null  // 由星图模块挂载时注册
};
window.LTApp = LTApp;

// —— 启动序列 ——
installErrorHandler({ onNarrate: narrate });
buildNav();
initBgStarNet(document.getElementById('bgStarNet'));

const soundBtn = document.getElementById('soundToggle');
const micBtn = document.getElementById('micBtn');
initAudioPanel(soundBtn);
initShortcuts(LTApp);
initVoice(micBtn, LTApp);

route('nebula');

// 数据变化 → 实时刷新 HUD
subscribe(() => updateHud(MODULES, document.getElementById('nav')));

// 叙事条三通道：每 15s 轮播
setInterval(eraBroadcast, 15000);
