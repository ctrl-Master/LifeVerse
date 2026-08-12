// 模块2/7/8：星图宇宙 · 关系引力场 · 阻尼与反弹波
// 交互升级（依据 LifeVerse_Interaction_Spec_v1）：
//  - 点星体 → 扇形决策菜单 → 真 castRipple（P0 · 规格 8.1 / 附录A）
//  - 关系编辑模式：拖星体改边权（P1 · 规格 8.2）
//  - 长按连线 → 阻尼滑条（P1 · 规格 8.3）
//  - 星图 / 时间轴 三视图切换（P0 · 规格 9），共享 nodes/links/probeYear
// 算法不重写：仅消费 castRipple / links，不碰 DECAY 与衰减公式。
import { el } from '../utils/dom.js';
import { fitCanvas, fitCanvasFlex, rafLoop, onResize } from '../utils/canvas.js';
import { Sound } from '../engines/audio.js';
import { NODES, LINKS, DECAY, nodeById, castRipple, SCENES } from '../engines/starmap.js';
import { describeEffect, describeRebound, lookupRule, RULE_PACKS, DOMAIN_COLORS } from '../engines/rulebase.js';
import { update, getState, subscribe } from '../store.js';
import { escapeHtml } from '../utils/sanitize.js';
import { LTApp } from '../core/app.js';

// 扇形决策菜单项（规格附录 A；ruleId 映射到 rulebase 分域卡包）
const DECISIONS = [
  { text: '换工作',    ruleId: 'career.switch', impact: 0.75, need: null },
  { text: '搬家/换城', ruleId: 'social.relocate', impact: 0.60, need: null },
  { text: '结婚/分手', ruleId: 'family.bond',  impact: 0.80, need: 'injected' },
  { text: '进修',      ruleId: 'career.study',  impact: 0.45, need: null },
  { text: '生育',      ruleId: 'family.child',  impact: 0.85, need: 'injected' },
  { text: '创业',      ruleId: 'career.found',  impact: 0.90, need: null }
];

export const starmapView = {
  id: 'starmap',
  title: '星图宇宙 · 关系引力场',
  subtitle: '点星体弹出扇形决策；拖「关系编辑」改强弱；长按连线调阻尼。手势先于菜单',
  mount(root) {
    const canvas = el('canvas', { id: 'starmapCanvas', class: 'mod-canvas' });
    const log = el('div', { class: 'ripple-log', id: 'rippleLog' });
    const toolbar = el('div', { class: 'starmap-toolbar' }, [
      el('button', { class: 'dynasty-tab', 'data-scene': 'career', text: '转行 AI 产品经理' }),
      el('button', { class: 'dynasty-tab', 'data-scene': 'retire', text: '延迟退休 3 年' }),
      el('button', { class: 'dynasty-tab', 'data-scene': 'spouse', text: '配偶收入下降 30%' })
    ]);
    const relinkBtn = el('button', { class: 'dyn-btn', id: 'relinkBtn', text: '✥ 关系编辑' });
    const secretBtn = el('button', { class: 'dyn-btn', id: 'secretBtn', text: '🔒 秘密边' });
    const viewSeg = el('div', { class: 'view-seg' }, [
      el('button', { class: 'view-opt active', 'data-view': 'map', text: '星图' }),
      el('button', { class: 'view-opt', 'data-view': 'timeline', text: '时间轴' })
    ]);
    const legend = el('div', { class: 'legend', html:
      '<span><i class="st-core"></i>核心</span>' +
      '<span><i class="st-inf"></i>已受影响</span>' +
      '<span><i class="st-pot"></i>潜力（待触发）</span>' +
      '<span><i class="st-conf"></i>冲突（高阻尼）</span>' });
    const fanMenu = el('div', { class: 'fan-menu', id: 'fanMenu' });
    const dampBox = el('div', { class: 'damp-box', id: 'dampBox' });
    const wrap = el('div', { class: 'starmap-canvas-wrap' }, [canvas, fanMenu, dampBox]);
    const stage = el('div', { class: 'starmap-stage' }, [
      el('div', { class: 'starmap-head' }, [toolbar, relinkBtn, secretBtn, viewSeg, legend]),
      wrap,
      log
    ]);
    root.appendChild(stage);

    const ctx = canvas.getContext('2d');
    let W, H, viewMode = 'map', relinkMode = false;
    let ripples = [], pulses = [], dragging = null, dragOffset = { x: 0, y: 0 }, moved = false;
    let fanNode = null, lpTimer = null, pressNode = null, downPos = { x: 0, y: 0 }, downEdge = -1, cloneCnt = 0;
    let secretMode = false, secretFirst = null;
    const narrate = (t) => { if (LTApp) LTApp.narrate(t); };
    const nodes = NODES.map(n => ({ ...n }));
    const links = LINKS.map(l => l.slice());
    // 用 store 中已调整的阻尼覆盖（跨会话保留）
    (getState().edgeResistance || {}); // 预留

    function nodeById2(id) { for (const n of nodes) if (n.id === id) return n; return null; }
    function edgeKey(a, b) { return [a, b].sort().join('|'); }
    // 星体状态色标（L1 · 三.3）：核心 / 已受影响 / 潜力 / 冲突
    const STATE_COLOR = { core: '#4f46e5', influenced: '#0ea5e9', potential: '#d97706', conflict: '#e11d48' };
    function nodeState(n) {
      for (const lk of links) {
        if ((lk[0] === n.id || lk[1] === n.id) && lk[3] >= 0.5) return 'conflict';
      }
      if (affected.has(n.id)) return 'influenced';
      if (n.tier === 0) return 'core';
      return 'potential';
    }

    function layout() {
      const cx = W / 2, cy = H / 2;
      if (viewMode === 'timeline') {
        const pad = 70, span = W - pad * 2, tiers = 4;
        const perTier = {}, idx = {};
        nodes.forEach(n => { perTier[n.tier] = (perTier[n.tier] || 0) + 1; });
        nodes.forEach(n => {
          idx[n.tier] = idx[n.tier] || 0;
          const colX = pad + (n.tier / (tiers - 1)) * span;
          const cnt = perTier[n.tier], k = idx[n.tier];
          const spread = (k - (cnt - 1) / 2) * 46;
          n.x = n.tier === 0 ? cx : colX;
          n.y = cy + (n.tier === 0 ? 0 : spread);
          idx[n.tier]++;
        });
        return;
      }
      const tierR = [0, Math.min(W, H) * 0.20, Math.min(W, H) * 0.33, Math.min(W, H) * 0.44];
      const tierCount = {}, tierIdx = {};
      nodes.forEach(n => tierCount[n.tier] = (tierCount[n.tier] || 0) + 1);
      nodes.forEach(n => {
        if (n.tier === 0) { n.x = cx; n.y = cy; return; }
        tierIdx[n.tier] = tierIdx[n.tier] || 0;
        const angle = (tierIdx[n.tier] / tierCount[n.tier]) * Math.PI * 2 - Math.PI / 2 + n.tier * 0.5;
        n.x = cx + Math.cos(angle) * tierR[n.tier];
        n.y = cy + Math.sin(angle) * tierR[n.tier];
        tierIdx[n.tier]++;
      });
    }
    function resize() {
      const f = fitCanvasFlex(canvas);
      W = f.W; H = f.H; ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
      layout();
    }

    let breath = 0, affected = new Set();
    function draw() {
      breath += 0.02;
      const lr = getState().lastRipple;
      affected = new Set(lr && lr.results ? lr.results.map(r => r.to) : []);
      ctx.clearRect(0, 0, W, H);
      // 时间轴视图：当前探针年份竖线
      if (viewMode === 'timeline') {
        const py = getState().settings.probeYear || 2026;
        const mx = 70 + ((py - 2026) / 10) * (W - 140);
        ctx.strokeStyle = 'rgba(14,165,233,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(mx, 30); ctx.lineTo(mx, H - 30); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#0ea5e9'; ctx.font = '600 11px -apple-system,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('探针 ' + py, mx, 22);
      }
      links.forEach(lk => {
        const a = nodeById2(lk[0]), b = nodeById2(lk[1]);
        const hi = lk[3] >= 0.5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y);
        let mx, my;
        if (viewMode === 'timeline') { mx = (a.x + b.x) / 2; my = (a.y + b.y) / 2; }
        else { mx = (a.x + b.x) / 2; my = (a.y + b.y) / 2 - 18; }
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.strokeStyle = hi
          ? 'rgba(225,29,72,' + (0.22 + lk[2] * 0.22).toFixed(2) + ')'
          : 'rgba(79,70,229,' + (0.10 + lk[2] * 0.22).toFixed(2) + ')';
        ctx.lineWidth = 0.6 + lk[2] * 2.2; ctx.stroke();
      });
      // 秘密边：仅自己可见的虚线（脱敏，涟漪可走但日志不展开）
      (getState().secrets || []).forEach(s => {
        const a = nodeById2(s.from), b = nodeById2(s.to);
        if (!a || !b) return;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(124,58,237,0.45)'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 4]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(124,58,237,0.7)'; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('密', (a.x + b.x) / 2, (a.y + b.y) / 2 - 3);
      });
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += 0.025;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const a = nodeById2(p.from), b = nodeById2(p.to);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 18;
        const t = p.t, it = 1 - t;
        const px = it * it * a.x + 2 * it * t * mx + t * t * b.x;
        const py = it * it * a.y + 2 * it * t * my + t * t * b.y;
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(217,119,6,0.85)'; ctx.fill();
      }
      for (let j = ripples.length - 1; j >= 0; j--) {
        const rp = ripples[j];
        rp.r += rp.echo ? 1.2 : 1.6; rp.alpha -= 0.008;
        if (rp.alpha <= 0 || rp.r > rp.max) { ripples.splice(j, 1); continue; }
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = rp.echo
          ? 'rgba(225,29,72,' + rp.alpha.toFixed(3) + ')'
          : 'rgba(79,70,229,' + rp.alpha.toFixed(3) + ')';
        ctx.lineWidth = rp.echo ? 2.2 : 1.5; ctx.stroke();
      }
      nodes.forEach(n => {
        if (fanNode && n.id === fanNode.id) {
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 10, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(79,70,229,0.6)'; ctx.lineWidth = 2; ctx.stroke();
        }
        const glow = n.tier === 0 ? 6 + Math.sin(breath) * 2 : 3;
        const col = STATE_COLOR[nodeState(n)];
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + glow, 0, Math.PI * 2);
        ctx.fillStyle = col + '22'; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        // 状态微环（L1.5 真切换）：冲突=红色脉动，受影响=青色，潜力=琥珀，核心=靛
        const st = nodeState(n);
        if (st !== 'core') {
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = col + (st === 'conflict' ? 'cc' : '99');
          ctx.lineWidth = st === 'conflict' ? 2.2 : 1.4;
          if (st === 'conflict') { ctx.setLineDash([3, 3]); ctx.globalAlpha = 0.6 + Math.sin(breath * 2) * 0.3; }
          ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#1a1d2e'; ctx.font = '600 11px -apple-system,"PingFang SC",sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(n.label, n.x, n.y + n.r + 16);
      });
    }

    function cast(sourceId, eventName, baseImpact, ruleId) {
      log.innerHTML = '';
      const src = nodeById2(sourceId);
      ripples.push({ x: src.x, y: src.y, r: src.r, max: Math.min(W, H) * 0.55, alpha: 0.55, echo: false });
      Sound.ripple(0);
      const yr = getState().settings.probeYear || 2026;
      narrate('在「' + (src.label || '') + '」投下决策「' + eventName + '」，涟漪向关联星体扩散。');
      const { results } = castRipple(sourceId, baseImpact, links);
      const head = el('div', { class: 'rl-item rl-story' });
      head.innerHTML = '<span class="rl-tag" style="background:var(--accent-light);color:var(--accent)">' + yr + ' 年</span>' +
        '<strong>' + escapeHtml(eventName) + '</strong>（影响强度 ' + baseImpact.toFixed(2) + '）';
      log.appendChild(head);
      const record = { source: sourceId, name: eventName, impact: baseImpact, ruleId: ruleId || null, results: [], year: yr };
      let frictionCount = 0;
      results.forEach((r, idx) => {
        setTimeout(() => {
          pulses.push({ from: r.from, to: r.to, t: 0 });
          const tn = nodeById2(r.to);
          setTimeout(() => ripples.push({ x: tn.x, y: tn.y, r: tn.r, max: 90, alpha: 0.45, echo: false }), 350);
          let friction = '';
          if (r.resistance >= 0.5) {
            frictionCount++;
            friction = ' <span class="rl-friction">⚠ 反弹</span>';
            setTimeout(() => ripples.push({ x: tn.x, y: tn.y, r: tn.r, max: 70, alpha: 0.5, echo: true }), 600);
            Sound.echo();
          }
          const story = r.resistance >= 0.5 ? describeRebound(r.from, r.to, r.impact, r.resistance) : (nodeById2(r.from).label + ' → ' + tn.label + '：' + describeEffect(r.to, r.impact));
          const item = el('div', { class: 'rl-item rl-story' });
          item.innerHTML = '<span class="rl-tag" style="background:rgba(217,119,6,0.10);color:#d97706">第' + r.depth + '圈</span>' + escapeHtml(story) + friction;
          log.appendChild(item);
          log.scrollTop = log.scrollHeight;
          record.results.push(r);
        }, idx * 420);
      });
      update('lastRipple', record);
      const dec = (getState().decisions || []).concat([{ source: sourceId, name: eventName, impact: baseImpact, ruleId: ruleId || null, at: Date.now(), year: yr, rebound: frictionCount > 0 }]);
      update('decisions', dec);
      // 决策钉：写入 markers，供探针轨道识别
      const markers = (getState().markers || []).filter(m => !(m.type === 'decision' && m.label === eventName && m.year === yr));
      markers.push({ year: yr, type: 'decision', label: eventName });
      update('markers', markers);
      if (frictionCount > 0) update('frictionUnresolved', (getState().frictionUnresolved || 0) + frictionCount);
    }

    // ===== 扇形决策菜单（情境卡） =====
    function openFan(node) {
      closeFan();
      fanNode = node;
      fanMenu.style.display = 'block';
      const R = 78;
      const stt = getState();
      DECISIONS.forEach((d, i) => {
        const rule = lookupRule(d.ruleId) || { reach: 2, risk: '低' };
        const unlocked = !d.need || (d.need === 'injected' && stt.profile.injected);
        const ang = -Math.PI / 2 + i * (Math.PI * 2 / DECISIONS.length);
        const item = el('button', { class: 'fan-item' + (unlocked ? '' : ' fan-locked') });
        item.style.left = (node.x + Math.cos(ang) * R) + 'px';
        item.style.top = (node.y + Math.sin(ang) * R) + 'px';
        item.innerHTML = '<span class="fi-main">' + escapeHtml(d.text) + '</span>' +
          '<span class="fi-sub">' + (unlocked ? ('预计波及 ' + rule.reach + ' 人 · 摩擦风险 ' + rule.risk) : '需先注入星云解锁') + '</span>';
        item.title = '影响强度 ' + d.impact.toFixed(2);
        if (unlocked) item.addEventListener('click', (e) => { e.stopPropagation(); cast(node.id, d.text, d.impact, d.ruleId); closeFan(); });
        else item.addEventListener('click', (e) => { e.stopPropagation(); narrate('「' + d.text + '」需先到星云模块注入质能解锁。'); });
        fanMenu.appendChild(item);
      });
    }
    function closeFan() { fanNode = null; fanMenu.style.display = 'none'; fanMenu.innerHTML = ''; }

    // ===== 阻尼滑条 =====
    function openDamp(edgeIdx) {
      closeDamp();
      const lk = links[edgeIdx];
      const a = nodeById2(lk[0]), b = nodeById2(lk[1]);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      dampBox.style.display = 'block';
      dampBox.style.left = mx + 'px';
      dampBox.style.top = my + 'px';
      dampBox.innerHTML = '';
      const title = el('div', { class: 'damp-title', text: a.label + '—' + b.label });
      const slider = el('input', { type: 'range', class: 'damp-range', min: '0', max: '1', step: '0.05', value: String(lk[3]) });
      const val = el('div', { class: 'damp-val', text: '阻尼 ' + (lk[3] * 100).toFixed(0) + '%' + (lk[3] >= 0.5 ? ' · 将反弹' : '') });
      slider.addEventListener('input', () => {
        const v = parseFloat(slider.value);
        links[edgeIdx][3] = v;
        val.textContent = '阻尼 ' + (v * 100).toFixed(0) + '%' + (v >= 0.5 ? ' · 将反弹' : '');
        val.style.color = v >= 0.5 ? '#e11d48' : '#6b7280';
        const k = edgeKey(lk[0], lk[1]);
        const map = Object.assign({}, getState().edgeResistance); map[k] = v;
        update('edgeResistance', map);
      });
      const close = el('button', { class: 'damp-close', text: '✕' });
      close.addEventListener('click', (e) => { e.stopPropagation(); closeDamp(); });
      dampBox.appendChild(title); dampBox.appendChild(slider); dampBox.appendChild(val); dampBox.appendChild(close);
    }
    function closeDamp() { dampBox.style.display = 'none'; dampBox.innerHTML = ''; }

    // ===== 命中检测 =====
    function hitNode(mx, my) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (Math.hypot(mx - n.x, my - n.y) <= (n.r + 10)) return n;
      }
      return null;
    }
    function nearestEdge(mx, my) {
      let best = -1, bestD = 9;
      links.forEach((lk, i) => {
        const a = nodeById2(lk[0]), b = nodeById2(lk[1]);
        const d = distToSeg(mx, my, a.x, a.y, b.x, b.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    }
    function distToSeg(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
      if (l2 === 0) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * dx + (py - y1) * dy) / l2; t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }
    function evtPos(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function relinkWeights(node) {
      const me = nodeById2('me');
      const d = Math.hypot(node.x - me.x, node.y - me.y);
      const dMax = Math.min(W, H) * 0.5;
      const w = Math.max(0.05, Math.min(1, 1 - d / dMax));
      links.forEach(lk => {
        if ((lk[0] === node.id && lk[1] === 'me') || (lk[1] === node.id && lk[0] === 'me')) lk[2] = w;
      });
    }

    // ===== 指针交互 =====
    canvas.addEventListener('pointerdown', e => {
      const pos = evtPos(e);
      downPos = pos; moved = false; downEdge = -1;
      if (fanNode) { closeFan(); return; } // 扇形外点击关闭
      const n = hitNode(pos.x, pos.y);
      if (n && e.ctrlKey) {
        const clone = { id: n.id + '_c' + (cloneCnt++), x: n.x + 34, y: n.y + 34, r: n.r, tier: n.tier, label: n.label + '·副本' };
        nodes.push(clone); links.push(['me', clone.id, 0.5, 0.3]);
        Sound.gravity(); narrate('已复制星体（Ctrl+拖拽）· 副本为可视化演示。'); return;
      }
      if (n) {
        pressNode = n; dragging = n;
        dragOffset.x = pos.x - n.x; dragOffset.y = pos.y - n.y;
        canvas.setPointerCapture(e.pointerId);
        return;
      }
      // 空白处：检测最近连线，启动长按阻尼
      downEdge = nearestEdge(pos.x, pos.y);
      if (downEdge >= 0) {
        lpTimer = setTimeout(() => { openDamp(downEdge); lpTimer = null; }, 400);
      }
    });
    canvas.addEventListener('pointermove', e => {
      const pos = evtPos(e);
      if (Math.hypot(pos.x - downPos.x, pos.y - downPos.y) > 8 && lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
      if (!dragging) return;
      dragging.x = pos.x - dragOffset.x; dragging.y = pos.y - dragOffset.y; moved = true;
      if (relinkMode) relinkWeights(dragging);
    });
    canvas.addEventListener('pointerup', e => {
      if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
      if (dragging && !moved && !relinkMode) {
        if (secretMode) {
          if (!secretFirst) { secretFirst = dragging; narrate('已选起点「' + dragging.label + '」，再点一个星体完成秘密边。'); }
          else if (secretFirst !== dragging) {
            const secrets = (getState().secrets || []).concat([{ from: secretFirst.id, to: dragging.id, label: secretFirst.label + '↔' + dragging.label }]);
            update('secrets', secrets);
            narrate('已建立秘密边：' + secretFirst.label + ' ↔ ' + dragging.label + '（仅自己可见）');
            Sound.gravity(); secretFirst = null;
          }
        } else {
          openFan(dragging); // 轻点=扇形决策
        }
      }
      dragging = null; pressNode = null;
    });
    canvas.addEventListener('pointercancel', () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } dragging = null; });

    // ===== 工具栏 =====
    toolbar.querySelectorAll('.dynasty-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        toolbar.querySelectorAll('.dynasty-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const sc = SCENES[tab.getAttribute('data-scene')];
        if (sc) cast(sc.source, sc.name, sc.impact, sc.source);
      });
    });
    relinkBtn.addEventListener('click', () => {
      relinkMode = !relinkMode;
      relinkBtn.classList.toggle('active', relinkMode);
      relinkBtn.textContent = relinkMode ? '✥ 关系编辑（开）' : '✥ 关系编辑';
    });
    secretBtn.addEventListener('click', () => {
      secretMode = !secretMode; secretFirst = null;
      secretBtn.classList.toggle('active', secretMode);
      secretBtn.textContent = secretMode ? '🔒 秘密边（开）' : '🔒 秘密边';
      narrate(secretMode ? '秘密边模式：依次点击两个星体，建立一条仅自己可见的虚线边。' : '已退出秘密边模式。');
    });
    viewSeg.querySelectorAll('.view-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        viewSeg.querySelectorAll('.view-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        viewMode = opt.getAttribute('data-view');
        layout();
      });
    });

    const offResize = onResize(resize);
    resize();
    const loop = rafLoop(draw);
    // 注册全局涟漪触发（供快捷键空格 / 语音指令调用）
    LTApp.starmapRipple = () => {
      const src = nodes[1 + Math.floor(Math.random() * (nodes.length - 1))];
      cast(src.id, '全局决策石子', 0.72, null);
    };
    this._dispose = () => { loop.stop(); offResize(); if (lpTimer) clearTimeout(lpTimer); };
  },
  unmount() { if (this._dispose) this._dispose(); LTApp.starmapRipple = null; }
};
