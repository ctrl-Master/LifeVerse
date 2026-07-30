// 应用入口：无框架路由 + 背景星网 + 全局交互层（L1 交互增强）
import { nebula } from './modules/nebula.js';
import { starmapView } from './modules/starmapView.js';
import { twin } from './modules/twin.js';
import { retirement } from './modules/retirement.js';
import { probe } from './modules/probe.js';
import { report } from './modules/report.js';
import { Sound } from './engines/audio.js';
import { reset, getState, subscribe } from './store.js';

const MODULES = [nebula, starmapView, twin, retirement, probe, report];

const stage = document.getElementById('stage');
const nav = document.getElementById('nav');
const soundBtn = document.getElementById('soundToggle');
const micBtn = document.getElementById('micBtn');

let current = null;

// 全局应用句柄（模块向其中注册能力，快捷键/语音统一调度）
const LTApp = {
  route,
  narrate,
  reset,
  Sound,
  starmapRipple: null   // 由星图模块挂载时注册
};
window.LTApp = LTApp;

function narrate(text, channel) {
  const t = document.getElementById('narrativeText');
  const bar = document.getElementById('narrativeBar');
  if (t) t.textContent = text;
  if (bar) {
    bar.classList.toggle('echo', /反弹|阻力|摩擦|折了回来/.test(text));
    bar.setAttribute('data-ch', channel || 'sys');
  }
}

// HUD：探针年徽章 + 人生完整度环 + 侧栏状态点
const HUE = { nebula: '#7c3aed', starmap: '#4f46e5', twin: '#0ea5e9', retirement: '#d97706', probe: '#0ea5e9', report: '#1f2937' };
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
function updateHud() {
  const s = getState();
  const yr = s.settings.probeYear || 2026;
  const yEl = document.getElementById('hudYear'); if (yEl) yEl.textContent = '探针 ' + yr;
  const rEl = document.getElementById('hudRing'); if (rEl) rEl.textContent = completeness() + '%';
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
    dot.className = 'nav-dot ' + statusOf(MODULES.find(m => b.textContent.includes(m.title)).id);
  });
}

// 时代广播 + 内心独白（叙事条三通道轮播）
const ERA = {
  2026: '2026 · 行业周期横盘，确定性成为稀缺品', 2027: '2027 · AI 重构岗位边界，中年转型窗口开启',
  2028: '2028 · 延迟退休细则落地，长线规划被迫前移', 2029: '2029 · 行业周期下行，现金防御优先',
  2030: '2030 · 缴费年限门槛抬升，补缴窗口收窄', 2031: '2031 · 银发经济扩容，第二曲线浮现',
  2032: '2032 · 组织扁平化，个体价值重估', 2033: '2033 · 地缘与产业再布局',
  2034: '2034 · 技能半衰期缩短', 2035: '2035 · 延迟退休政策到位，代际接力显性化', 2036: '2036 · 长周期收束，静水流深'
};
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
function eraBroadcast() {
  const yr = getState().settings.probeYear || 2026;
  const ch = Math.random() < 0.5 ? 'era' : 'mono';
  narrate(ch === 'era' ? ('时代广播 · ' + (ERA[yr] || ('探针 ' + yr + ' · 时代静默'))) : monologue(), ch);
}

function buildNav() {
  MODULES.forEach((m, i) => {
    const item = document.createElement('button');
    item.className = 'nav-item' + (i === 0 ? ' active' : '');
    item.innerHTML = '<span class="nav-idx">0' + (i + 1) + '</span>' + m.title + '<span class="nav-dot idle"></span>';
    item.addEventListener('click', () => route(m.id));
    nav.appendChild(item);
  });
}

function route(id) {
  const m = MODULES.find(x => x.id === id);
  if (!m || (current && current.id === id)) return;
  if (current && current.unmount) current.unmount();
  stage.innerHTML = '';
  m.mount(stage);
  current = m;
  nav.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.textContent.includes(m.title));
  });
  stage.scrollTop = 0;
  const DEG = { nebula: 275, starmap: 0, twin: 190, retirement: 35, probe: 190, report: 225 };
  const bg = document.getElementById('bgStarNet');
  if (bg) bg.style.filter = 'hue-rotate(' + (DEG[id] || 0) + 'deg)';
  narrate(m.subtitle || m.title);
  updateHud();
}

// 背景星网（白色主视觉）
function initBgStarNet() {
  const canvas = document.getElementById('bgStarNet');
  if (!canvas) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H, particles = [];
  const COUNT = window.innerWidth < 768 ? 40 : 90;
  const LINK_DIST = 130;
  const mouse = { x: -9999, y: -9999 };
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function init() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({ x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.8 });
    }
  }
  function step() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      const dxm = mouse.x - p.x, dym = mouse.y - p.y, dm2 = dxm * dxm + dym * dym;
      if (dm2 < 22500 && dm2 > 1) { const f = 0.012 / Math.sqrt(dm2); p.vx += dxm * f; p.vy += dym * f; }
      p.vx *= 0.995; p.vy *= 0.995; p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(79,70,229,0.28)'; ctx.fill();
    }
    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x, dy = particles[a].y - particles[b].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          ctx.beginPath(); ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y);
          ctx.strokeStyle = 'rgba(79,70,229,' + (0.10 * (1 - d / LINK_DIST)).toFixed(3) + ')';
          ctx.lineWidth = 1; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(step);
  }
  window.addEventListener('resize', () => { resize(); init(); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseout', () => { mouse.x = -9999; mouse.y = -9999; });
  resize(); init();
  if (reduced) {
    for (const p of particles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(79,70,229,0.25)'; ctx.fill(); }
  } else requestAnimationFrame(step);
}

// 分层音效面板
function initAudioPanel() {
  const panel = document.getElementById('audioPanel');
  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', (e) => {
    if (panel.style.display !== 'none' && !panel.contains(e.target) && e.target !== soundBtn) panel.style.display = 'none';
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

// 全局快捷键（规格「七.3」）
function initShortcuts() {
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (current && current.id === 'starmap' && LTApp.starmapRipple) {
        LTApp.starmapRipple();
        narrate('空格 · 在星图投下一颗「决策石子」，涟漪向外扩散。');
      } else {
        narrate('提示：切换到「星图宇宙」后按空格，可一键生成决策涟漪。');
      }
    } else if (e.key === 'r' || e.key === 'R') {
      reset();
      if (current) { current.unmount && current.unmount(); stage.innerHTML = ''; current.mount(stage); }
      narrate('已重置星云与星图（R 键）。');
    } else if (e.key === 'm' || e.key === 'M') {
      const muted = Sound.toggleMuted();
      soundBtn.textContent = muted ? '🔇' : '🔊';
      narrate(muted ? '已静音（M 键）。' : '已开启音效（M 键）。');
    }
  });
}

// 语音指令（Web Speech API，纯前端，Chrome / Edge 原生支持）
function initVoice() {
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
  micBtn.addEventListener('click', () => { if (active) rec.stop(); else { try { rec.start(); } catch (e) {} } });
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
      if (current && current.id === 'starmap' && LTApp.starmapRipple) LTApp.starmapRipple();
      else route('starmap');
    } else if (txt.includes('宇宙') || txt.includes('平行') || txt.includes('分裂')) {
      const sp = document.getElementById('btnSplit'); if (sp) sp.click(); else route('probe');
    } else if (txt.includes('退休')) { route('retirement'); }
    else if (txt.includes('重置') || txt.includes('清空')) {
      reset(); if (current) { current.unmount && current.unmount(); stage.innerHTML = ''; current.mount(stage); }
    } else if (txt.includes('分屏')) { route('twin'); }
    else if (txt.includes('报告')) { route('report'); }
    else handled = false;
    if (handled) narrate('语音指令：「' + txt + '」已执行。');
  };
}

buildNav();
initBgStarNet();
initAudioPanel();
initShortcuts();
initVoice();
route('nebula');
// 数据变化 → 实时刷新 HUD（完整度环 / 侧栏状态点）
subscribe(() => updateHud());
// 叙事条三通道：每 15s 轮播「时代广播 / 内心独白」
setInterval(eraBroadcast, 15000);
