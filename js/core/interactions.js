// 交互层：音效面板 + 全局快捷键 + 语音指令
import { Sound } from '../engines/audio.js';
import { reset } from '../store.js';
import { narrate } from './narrator.js';
import { route, getCurrent } from './router.js';

/**
 * 初始化分层音效面板
 * @param {HTMLElement} soundBtn - 音效按钮
 */
export function initAudioPanel(soundBtn) {
  const panel = document.getElementById('audioPanel');
  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', (e) => {
    if (panel.style.display !== 'none' && !panel.contains(e.target) && e.target !== soundBtn)
      panel.style.display = 'none';
  });
  const mute = document.getElementById('ch_mute');
  mute.checked = Sound.isMuted();
  mute.addEventListener('change', () => {
    Sound.setMuted(mute.checked);
    soundBtn.textContent = mute.checked ? '🔇' : '🔊';
  });
  [['nebula', 'ch_nebula'], ['gravity', 'ch_gravity'], ['ripple', 'ch_ripple'], ['resonance', 'ch_resonance']]
    .forEach(([ch, id]) => {
      const cb = document.getElementById(id);
      cb.checked = Sound.getChannels()[ch];
      cb.addEventListener('change', () => Sound.setChannel(ch, cb.checked));
    });
}

/**
 * 初始化全局快捷键
 * Space: 星图涟漪 / R: 重置 / M: 静音
 * @param {object} app - 全局应用句柄（需含 starmapRipple）
 */
export function initShortcuts(app) {
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      const current = getCurrent();
      if (current && current.id === 'starmap' && app.starmapRipple) {
        app.starmapRipple();
        narrate('空格 · 在星图投下一颗「决策石子」，涟漪向外扩散。');
      } else {
        narrate('提示：切换到「星图宇宙」后按空格，可一键生成决策涟漪。');
      }
    } else if (e.key === 'r' || e.key === 'R') {
      reset();
      const cur = getCurrent();
      const stage = document.getElementById('stage');
      if (cur) { cur.unmount && cur.unmount(); stage.innerHTML = ''; cur.mount(stage); }
      narrate('已重置星云与星图（R 键）。');
    } else if (e.key === 'm' || e.key === 'M') {
      const muted = Sound.toggleMuted();
      const soundBtn = document.getElementById('soundToggle');
      if (soundBtn) soundBtn.textContent = muted ? '🔇' : '🔊';
      narrate(muted ? '已静音（M 键）。' : '已开启音效（M 键）。');
    }
  });
}

/**
 * 初始化语音指令（Web Speech API，Chrome / Edge 原生支持）
 * @param {HTMLElement} micBtn - 麦克风按钮
 * @param {object} app - 全局应用句柄
 */
export function initVoice(micBtn, app) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const tip = document.getElementById('voiceTip');
  if (!SR) {
    micBtn.title = '当前浏览器不支持语音指令（请用 Chrome / Edge）';
    micBtn.addEventListener('click', () => {
      tip.style.display = 'block';
      tip.textContent = '当前浏览器不支持 Web Speech API，请用 Chrome / Edge 体验语音指令。';
      setTimeout(() => (tip.style.display = 'none'), 2600);
    });
    return;
  }
  const rec = new SR();
  rec.lang = 'zh-CN'; rec.interimResults = false; rec.maxAlternatives = 1;
  let active = false;
  micBtn.addEventListener('click', () => {
    if (active) rec.stop();
    else { try { rec.start(); } catch (e) {} }
  });
  rec.onstart = () => {
    active = true; micBtn.classList.add('rec');
    tip.style.display = 'block';
    tip.textContent = '聆听中… 说：涟漪 / 宇宙 / 退休 / 重置 / 分屏 / 报告';
  };
  rec.onend = () => { active = false; micBtn.classList.remove('rec'); setTimeout(() => { if (!active) tip.style.display = 'none'; }, 1500); };
  rec.onerror = () => { active = false; micBtn.classList.remove('rec'); tip.style.display = 'block'; tip.textContent = '语音识别结束或不可用。'; setTimeout(() => (tip.style.display = 'none'), 2000); };
  rec.onresult = (e) => {
    const txt = (e.results[0][0].transcript || '').toLowerCase();
    tip.textContent = '识别：' + txt;
    let handled = true;
    if (txt.includes('涟漪') || txt.includes('生成')) {
      const cur = getCurrent();
      if (cur && cur.id === 'starmap' && app.starmapRipple) app.starmapRipple();
      else route('starmap');
    } else if (txt.includes('宇宙') || txt.includes('平行') || txt.includes('分裂')) {
      const sp = document.getElementById('btnSplit'); if (sp) sp.click(); else route('probe');
    } else if (txt.includes('退休')) { route('retirement'); }
    else if (txt.includes('重置') || txt.includes('清空')) {
      reset();
      const cur = getCurrent();
      const stage = document.getElementById('stage');
      if (cur) { cur.unmount && cur.unmount(); stage.innerHTML = ''; cur.mount(stage); }
    } else if (txt.includes('分屏')) { route('twin'); }
    else if (txt.includes('报告')) { route('report'); }
    else handled = false;
    if (handled) narrate('语音指令：「' + txt + '」已执行。');
  };
}
