// 模块5：光阴探针 & 平行宇宙撕裂（L1 增强：多轨道探针）
//  - 底部光阴探针轨道：可拖手柄（x→年份），轨道实时形变（P0 · 7.1/7.2/7.3）
//  - 松手 1.2s 回放（P0 · 7.3）
//  - 多轨道：拖出/添加多条平行宇宙探针，每轨独立年份（L1 · 五.1）
//  - Ctrl+拖手柄：复制该平行宇宙轨道
//  - 激进度 agg≥0.92 → A/B 撕裂（P2 · 7.4）
// 算法不重写：仅消费 year → 轨道半径映射（现有 system() 逻辑）
import { el } from '../utils/dom.js';
import { fitCanvas, fitCanvasFlex, rafLoop, onResize } from '../utils/canvas.js';
import { Sound } from '../engines/audio.js';
import { update, getState, subscribe } from '../store.js';

const MIN_Y = 2026, MAX_Y = 2036;
const PALETTE = ['#4f46e5', '#0ea5e9', '#059669', '#d97706', '#e11d48'];
// 政策窗（静态，仅展示性提示）
const POLICY_WINDOWS = [
  { year: 2030, label: '缴费年限调整窗口' },
  { year: 2035, label: '延迟退休政策到位' }
];

export const probe = {
  id: 'probe',
  title: '光阴探针 & 平行宇宙撕裂',
  subtitle: '拖动底部探针手柄改变年份，星系轨道实时扩张；可添加多条平行宇宙轨道，Ctrl+拖复制；激进度拉满将撕裂',
  mount(root) {
    const canvas = el('canvas', { id: 'probeCanvas', class: 'mod-canvas' });
    const sl = el('input', { type: 'range', id: 'sl_probe', min: String(MIN_Y), max: String(MAX_Y), value: '2026', class: 'probe-slider' });
    const probeYear = el('span', { id: 'probeYear', class: 'probe-year', text: '年份 2026' });
    const addTrackBtn = el('button', { class: 'btn', id: 'btnAddTrack', text: '＋ 添加平行宇宙轨道' });
    const btnSplit = el('button', { id: 'btnSplit', class: 'btn', text: '✂ 路径分叉撕裂（A/B 双轨）' });
    const agg = el('input', { type: 'range', id: 'sl_agg', min: '0', max: '1', step: '0.01', value: '0', class: 'probe-slider' });
    const aggVal = el('span', { id: 'aggVal', text: '激进度 0%' });
    const splitWrap = el('div', { id: 'splitWrap', class: 'split-wrap', style: { display: 'none' } }, [
      el('div', { class: 'split-panel' }, [el('h4', { text: 'A · 转行' }), el('p', { class: 'muted', text: '技能重组，前 3 年轨道半径快速扩张，不确定性高但上限更高。' })]),
      el('div', { class: 'split-panel' }, [el('h4', { text: 'B · 不转行' }), el('p', { class: 'muted', text: '轨道缓慢扩张，稳定但受行业周期压制，天花板可见。' })])
    ]);
    const track = el('div', { class: 'probe-track', id: 'probeTrack' }, [
      el('div', { class: 'probe-track-fill', id: 'probeTrackFill' })
    ]);
    const headsEl = el('div', { class: 'probe-heads', id: 'probeHeads' });
    const pinsEl = el('div', { class: 'probe-pins', id: 'probePins' });
    track.appendChild(headsEl);
    track.appendChild(pinsEl);
    const stage = el('div', { class: 'probe-stage' }, [
      el('div', { class: 'probe-canvas-wrap' }, [canvas]),
      el('div', { class: 'probe-controls' }, [
        el('div', { class: 'probe-axis' }, [el('span', { text: '2026' }), probeYear, el('span', { text: '2036' })]),
        sl, addTrackBtn, btnSplit,
        el('div', { class: 'probe-axis', style: { marginTop: '14px' } }, [el('span', { text: '激进度（满阈值撕裂）' }), aggVal]),
        agg
      ]),
      track,
      splitWrap
    ]);
    root.appendChild(stage);

    const narrate = (t) => { if (window.LTApp) window.LTApp.narrate(t); };
    const ctx = canvas.getContext('2d');
    let W, H, cy, t = 0, split = false, aggression = 0, playing = false, tearTimer = null;
    let tracks = [{ year: 2026, color: PALETTE[0] }];
    const rings = [[26, '#4f46e5'], [42, '#d97706'], [58, '#0ea5e9'], [74, '#059669']];

    function resize() {
      const f = fitCanvasFlex(canvas);
      W = f.W; H = f.H; cy = H / 2; ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
      renderHeads();
      renderPins();
    }
    function system(cx, grow, title, titleColor) {
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fillStyle = titleColor; ctx.fill();
      ctx.fillStyle = titleColor; ctx.font = '600 12px -apple-system,"PingFang SC",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, cx, 18);
      rings.forEach((r, idx) => {
        const rr = r[0] + (tracks[0].year - 2026) * (idx === 0 ? 5 * grow : 2 * grow) + Math.sin(t * 2 + idx) * 2;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = r[1] + '55'; ctx.lineWidth = 1; ctx.stroke();
        const ang = t * (0.6 + idx * 0.15) + idx;
        const px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr;
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fillStyle = r[1]; ctx.fill();
      });
    }
    function draw() {
      t += 0.012; ctx.clearRect(0, 0, W, H);
      const n = tracks.length;
      tracks.forEach((tr, i) => {
        const cx = n === 1 ? W / 2 : W * (i + 1) / (n + 1);
        system(cx, 1.0 + aggression * 0.6, '轨道' + (i + 1) + ' · ' + tr.year, tr.color);
      });
      if (split) {
        ctx.save();
        ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(225,29,72,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(W / 2, 30); ctx.lineTo(W / 2, H - 20); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = '#e11d48'; ctx.font = '600 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('撕裂面', W / 2, 24); ctx.restore();
      }
    }
    function setTrackYear(i, y, fromUser) {
      y = Math.max(MIN_Y, Math.min(MAX_Y, Math.round(y)));
      tracks[i].year = y;
      probeYear.textContent = '年份 ' + tracks[0].year;
      sl.value = String(tracks[0].year);
      renderHeads();
      renderPins();
      // 经过事件钉：轻微卡顿 + 音效（记忆点）
      if (fromUser) {
        const pa = pinAt(y);
        if (pa && pa !== lastPinYear) { Sound.gravity(); narrate('⟡ 探针掠过 ' + pa + ' 年事件钉。'); }
        lastPinYear = pa;
        update('settings.probeYear', tracks[0].year);
        Sound.ripple(0);
      }
    }
    function renderHeads() {
      headsEl.innerHTML = '';
      tracks.forEach((tr, i) => {
        const head = el('div', { class: 'probe-head', 'data-idx': i, text: String(tr.year) });
        head.style.left = ((tr.year - MIN_Y) / (MAX_Y - MIN_Y) * 100) + '%';
        head.style.background = tr.color;
        head.addEventListener('pointerdown', e => {
          e.preventDefault();
          head.setPointerCapture(e.pointerId);
          const startY = tracks[i].year, sx = e.clientX;
          const move = ev => {
            if (e.ctrlKey && Math.abs(ev.clientX - sx) > 6 && tracks.length < 5) {
              // Ctrl+拖：复制该平行宇宙轨道
              tracks.push({ year: startY, color: PALETTE[tracks.length % PALETTE.length] });
              narrate('已复制平行宇宙轨道（Ctrl+拖），当前 ' + tracks.length + ' 条。');
              renderHeads(); return;
            }
            const r = document.getElementById('probeTrack').getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
            setTrackYear(i, MIN_Y + pct * (MAX_Y - MIN_Y), true);
          };
          const up = () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            startPlayback(i);
          };
          document.addEventListener('pointermove', move);
          document.addEventListener('pointerup', up);
        });
        headsEl.appendChild(head);
      });
      document.getElementById('probeTrackFill').style.width = ((tracks[0].year - MIN_Y) / (MAX_Y - MIN_Y) * 100) + '%';
    }
    function yearFromClientX(clientX) {
      const r = document.getElementById('probeTrack').getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      return MIN_Y + pct * (MAX_Y - MIN_Y);
    }
    // 事件钉：决策钉 / 退休钉 / 政策窗
    function renderPins() {
      if (!pinsEl) return;
      pinsEl.innerHTML = '';
      const stt = getState();
      const pins = [];
      (stt.decisions || []).forEach(d => { if (d.year) pins.push({ year: d.year, cls: 'pin-dec', label: d.name }); });
      (stt.markers || []).forEach(m => pins.push({ year: m.year, cls: m.type === 'retire' ? 'pin-retire' : 'pin-policy', label: m.label }));
      POLICY_WINDOWS.forEach(p => pins.push({ year: p.year, cls: 'pin-policy', label: p.label }));
      pins.forEach(p => {
        const tick = el('div', { class: 'probe-pin ' + p.cls, title: p.year + ' · ' + p.label });
        tick.style.left = ((p.year - MIN_Y) / (MAX_Y - MIN_Y) * 100) + '%';
        tick.addEventListener('click', (e) => { e.stopPropagation(); setTrackYear(0, p.year, true); narrate('探针跳至 ' + p.year + '：' + p.label); });
        pinsEl.appendChild(tick);
      });
    }
    let lastPinYear = null;
    function pinAt(year) {
      const ys = [];
      getState().decisions.forEach(d => { if (d.year) ys.push(d.year); });
      getState().markers.forEach(m => ys.push(m.year));
      POLICY_WINDOWS.forEach(p => ys.push(p.year));
      return ys.find(y => Math.abs(y - year) <= 0.5) || null;
    }
    // 主轨道条点击 / 拖动 → 轨道 0
    document.getElementById('probeTrack').addEventListener('pointerdown', e => {
      if (e.target.classList.contains('probe-head')) return;
      setTrackYear(0, yearFromClientX(e.clientX), true);
    });
    sl.addEventListener('input', () => { cancelPlayback(); setTrackYear(0, parseInt(sl.value, 10), true); });

    // 回放：探针头从 2026 走到当前年份（1.2s）
    let playRAF = 0;
    function cancelPlayback() { if (playRAF) { cancelAnimationFrame(playRAF); playRAF = 0; } playing = false; }
    function startPlayback(i) {
      cancelPlayback(); playing = true;
      const from = MIN_Y, to = tracks[i].year, dur = 1200, t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        setTrackYear(i, from + (to - from) * k, false);
        if (k < 1) { playRAF = requestAnimationFrame(step); }
        else { playing = false; playRAF = 0; }
      };
      playRAF = requestAnimationFrame(step);
    }

    // 添加平行宇宙轨道
    addTrackBtn.addEventListener('click', () => {
      if (tracks.length >= 5) { narrate('已达轨道上限（5 条）。'); return; }
      tracks.push({ year: 2026, color: PALETTE[tracks.length % PALETTE.length] });
      renderHeads();
      narrate('已添加第 ' + tracks.length + ' 条平行宇宙轨道。');
      Sound.connect();
    });

    // 激进撕裂（P2 · 7.4）
    agg.addEventListener('input', () => {
      aggression = parseFloat(agg.value);
      aggVal.textContent = '激进度 ' + Math.round(aggression * 100) + '%';
      update('settings.probeAggression', aggression);
      if (aggression >= 0.92) {
        if (!tearTimer) tearTimer = setTimeout(() => { doTear(true); tearTimer = null; }, 200);
      } else if (tearTimer) { clearTimeout(tearTimer); tearTimer = null; }
    });
    function doTear(on) {
      if (split === on) return;
      split = on;
      btnSplit.textContent = split ? '✂ 合并双轨（单星系）' : '✂ 路径分叉撕裂（A/B 双轨）';
      splitWrap.style.display = split ? 'grid' : 'none';
      update('settings.split', split);
      Sound.connect();
    }
    btnSplit.addEventListener('click', () => { doTear(!split); });

    if (getState().settings.probeYear > MIN_Y) setTrackYear(0, getState().settings.probeYear, false);
    if (getState().settings.split) doTear(true);

    const offResize = onResize(resize);
    resize();
    const loop = rafLoop(draw);
    // 订阅 store：星图抛决策 / 退休钉生成后，事件钉实时刷新
    let unsub = null;
    if (typeof subscribe === 'function') unsub = subscribe(() => { renderPins(); });
    this._dispose = () => { loop.stop(); offResize(); if (unsub) unsub(); cancelPlayback(); if (tearTimer) clearTimeout(tearTimer); };
  },
  unmount() { if (this._dispose) this._dispose(); }
};
