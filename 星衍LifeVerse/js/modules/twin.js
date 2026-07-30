// 模块3：双生时空剪影 · 跨时空共振 + 结构相似度向量矩阵
import { el } from '../utils/dom.js';
import { fitCanvas, fitCanvasFlex, rafLoop, onResize } from '../utils/canvas.js';
import { buildReferences, similarity, DIMS } from '../engines/vectorMatrix.js';
import { update, getState } from '../store.js';

// 配对：从用户 dilemma + 行业动态生成 5–7 对（每对含竹简文案 + 结构同构点关键词）
function buildPairs(st) {
  const ind = (st.profile.industry || '').indexOf('互联网') >= 0;
  const fear = (st.profile.dilemma || '') + ' ' + (st.profile.fearSeed || '');
  const base = [
    { m: '技能贬值', a: '技艺贬值', tip: '竹简：「江南新闸至，旧艺渐废。」——技能贬值的结构同源。', homo: ['技能', '贬值', '结构同源'] },
    { m: '转型成本', a: '学艺成本', tip: '竹简：「离岗半岁，无俸而学。」——转型机会成本的结构同源。', homo: ['转型', '成本', '机会成本'] },
    { m: '周期下行', a: '漕运缩减', tip: '竹简：「漕损三成，吏员冗。」——行业周期下行的结构同源。', homo: ['周期', '下行', '行业'] }
  ];
  const extra = [];
  if (ind) extra.push({ m: '算法替代', a: '活字取代抄工', tip: '竹简：「活字既出，抄工散。」——技术替代人力的结构同源。', homo: ['替代', '技术', '人力'] });
  if (/停滞|瓶颈|晋升/.test(fear)) extra.push({ m: '晋升见顶', a: '科举不第', tip: '竹简：「十试不第，门第自守。」——上升通道收窄的结构同源。', homo: ['晋升', '通道', '收窄'] });
  if (/关系|家庭|张力/.test(fear)) extra.push({ m: '关系张力', a: '门第倾轧', tip: '竹简：「内闱失和，外事难成。」——关系张力的结构同源。', homo: ['关系', '张力', '内耗'] });
  extra.push({ m: '身体告警', a: '劳疾早逝', tip: '竹简：「积劳成疾，未老先衰。」——健康透支的结构同源。', homo: ['身体', '透支', '健康'] });
  return base.concat(extra).slice(0, 7);
}

export const twin = {
  id: 'twin',
  title: '双生时空剪影',
  subtitle: '左现代科技星轨 / 右古代金石星轨，悬停触发「跨时空共振」光束；右侧实时计算结构相似度',
  mount(root) {
    const PAIRS = buildPairs(getState());
    // 竹简卷轴（共振命中后从底部升起）
    const scroll = el('div', { class: 'twin-scroll', id: 'twinScroll' });
    const canvas = el('canvas', { id: 'twinCanvas', class: 'mod-canvas' });
    const tip = el('p', { class: 'hint', id: 'twinTip', text: '悬停左侧现代节点，触发与右侧古代角色的「跨时空共振」光束。' });
    const pills = PAIRS.map((p, i) =>
      el('button', { class: 'reso-pill', 'data-pair': i, text: (i + 1) + '. ' + p.m + ' ↔ ' + p.a }));

    // 向量矩阵面板
    const sliderDefs = [
      { key: 0, label: DIMS[0], val: 0.7 },
      { key: 1, label: DIMS[1], val: 0.8 },
      { key: 2, label: DIMS[2], val: 0.5 }
    ];
    const userVec = [0.7, 0.8, 0.5];
    const refs = buildReferences(userVec);
    const matrixRows = refs.map(r =>
      el('div', { class: 'matrix-row', 'data-name': r.name }, [
        el('span', { class: 'mx-name', text: r.name }),
        el('span', { class: 'mx-val', text: (r.cosine * 100).toFixed(1) + '%' })
      ]));
    const sliders = sliderDefs.map(d => {
      const s = el('input', { type: 'range', min: '0', max: '100', value: String(Math.round(d.val * 100)), class: 'mx-slider' });
      s.addEventListener('input', () => {
        userVec[d.key] = parseInt(s.value, 10) / 100;
        const live = refs.map(r => similarity(userVec, r.vec));
        matrixRows.forEach((row, i) => {
          row.querySelector('.mx-val').textContent = (live[i] * 100).toFixed(1) + '%';
        });
        update('twinPicks', live.map((v, i) => ({ name: refs[i].name, sim: v })));
      });
      return el('div', { class: 'mx-slider-row' }, [
        el('label', { text: d.label }),
        s
      ]);
    });

    const divider = el('div', { class: 'twin-divider', id: 'twinDivider' });
    const stage = el('div', { class: 'twin-stage' }, [
      el('div', { class: 'twin-canvas-wrap' }, [canvas, tip, divider, scroll, el('div', { class: 'reso-pills' }, pills)]),
      el('div', { class: 'vec-matrix' }, [
        el('h4', { text: '结构相似度向量矩阵' }),
        el('p', { class: 'muted', text: '三维结构向量 → 余弦相似度。调节滑块实时匹配历史周期。' }),
        ...sliders,
        el('div', { class: 'matrix' }, matrixRows)
      ])
    ]);
    root.appendChild(stage);

    const ctx = canvas.getContext('2d');
    let W, H, mNodes = [], aNodes = [];
    let active = -1, hover = -1, beamT = 0, dividerFrac = 0.5;
    const narrate = (t) => { if (window.LTApp) window.LTApp.narrate(t); };

    function layoutNodes() {
      const top = 64, gap = (H - 128) / 2;
      const leftX = W * dividerFrac * 0.5;
      const rightX = W * dividerFrac + (W * (1 - dividerFrac)) * 0.5;
      mNodes = []; aNodes = [];
      for (let i = 0; i < 3; i++) {
        mNodes.push({ x: leftX, y: top + i * gap, label: PAIRS[i].m });
        aNodes.push({ x: rightX, y: top + i * gap, label: PAIRS[i].a });
      }
    }
    function resize() {
      const f = fitCanvasFlex(canvas);
      W = f.W; H = f.H; ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
      layoutNodes();
    }
    function drawTrack(nodes, color, glow) {
      ctx.beginPath();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (i === 0) ctx.moveTo(n.x, n.y);
        else {
          const px = nodes[i - 1].x, py = nodes[i - 1].y;
          const mx = (px + n.x) / 2, my = (py + n.y) / 2 - 10;
          ctx.quadraticCurveTo(mx, my, n.x, n.y);
        }
      }
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
      const isModern = color === '#0ea5e9';
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        if (glow > 0) {
          ctx.save(); ctx.globalAlpha = 0.3;
          ctx.beginPath(); ctx.arc(n.x, n.y, 5 + glow, 0, Math.PI * 2);
          ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = isModern ? '#0369a1' : '#5b5346';
        ctx.font = '12px -apple-system,"PingFang SC",sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + (isModern ? -12 : 18));
      });
    }
    function draw() {
      beamT += 0.03; if (beamT > 1) beamT = 0;
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.font = '600 13px -apple-system,"PingFang SC",sans-serif';
      ctx.fillStyle = '#0369a1'; ctx.fillText('现代 · 科技星轨', W * 0.26, 34);
      ctx.fillStyle = '#7c5a2e'; ctx.fillText('古代 · 金石星轨', W * 0.74, 34);
      const dividerX = W * dividerFrac;
      const collapsedA = dividerFrac < 0.2, collapsedM = dividerFrac > 0.8;
      ctx.beginPath(); ctx.moveTo(dividerX, 40); ctx.lineTo(dividerX, H - 20);
      ctx.strokeStyle = 'rgba(120,120,140,0.25)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      if (!collapsedM) drawTrack(mNodes, '#0ea5e9', (hover === 0 || active === 0) ? 4 : 0);
      if (!collapsedA) drawTrack(aNodes, '#8a6d3b', (hover === 1 || active === 1) ? 4 : 0);
      const idx = hover >= 0 ? hover : active;
      if (idx >= 0 && !collapsedM && !collapsedA) {
        const m = mNodes[idx], a = aNodes[idx];
        const mx = (m.x + a.x) / 2, my = (m.y + a.y) / 2;
        ctx.beginPath(); ctx.moveTo(m.x, m.y);
        ctx.quadraticCurveTo(mx, my - 40, a.x, a.y);
        ctx.strokeStyle = 'rgba(217,119,6,0.55)'; ctx.lineWidth = 2; ctx.stroke();
        const t = beamT, it = 1 - t;
        const px = it * it * m.x + 2 * it * t * mx + t * t * a.x;
        const py = it * it * m.y + 2 * it * t * (my - 40) + t * t * a.y;
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fillStyle = '#d97706'; ctx.fill();
        ctx.beginPath(); ctx.arc(a.x, a.y, 6 + Math.sin(beamT * Math.PI * 2) * 4 + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(217,119,6,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    function setActive(i) {
      active = i;
      pills.forEach(p => p.classList.remove('active'));
      if (i >= 0) {
        const p = root.querySelector('.reso-pill[data-pair="' + i + '"]');
        if (p) p.classList.add('active');
        tip.textContent = PAIRS[i].tip;
        // 竹简卷轴升起：3–4 句含「结构同构点」高亮词
        const homo = PAIRS[i].homo || [PAIRS[i].m, PAIRS[i].a];
        const hl = (s) => homo.reduce((acc, w) => acc.split(w).join('<b class="homo">' + w + '</b>'), s);
        const lines = [
          '现代侧「' + PAIRS[i].m + '」与古代「' + PAIRS[i].a + '」在结构上遥相呼应。',
          hl('二者皆受制于同样的' + homo[0] + '约束，' + homo[1] + '只是表象。'),
          hl('你的应对越贴近「' + homo[0] + '」的主动管理，共振越偏向顺行而非被裹挟。'),
          '竹简原文：' + PAIRS[i].tip.replace(/^竹简：「|」——.*$/g, '')
        ];
        scroll.innerHTML = '<div class="scroll-inner"><div class="scroll-head">⟡ 结构同构 · 史鉴卷</div>' +
          lines.map(l => '<p class="scroll-line">' + l + '</p>').join('') + '</div>';
        scroll.classList.add('show');
        // 相似度 > 阈值自动封存为史鉴
        const sims = getState().twinPicks || [];
        if (sims.length && Math.max(...sims.map(s => s.sim)) > 0.8) {
          const mk = (getState().markers || []).filter(m => m.type !== 'history');
          mk.push({ year: getState().settings.probeYear || 2026, type: 'history', label: '史鉴封存：' + PAIRS[i].m });
          update('markers', mk);
        }
      } else {
        tip.textContent = '悬停左侧现代节点，触发与右侧古代角色的「跨时空共振」光束。';
        scroll.classList.remove('show');
      }
    }
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let found = -1;
      for (let i = 0; i < mNodes.length; i++) {
        if (Math.hypot(mx - mNodes[i].x, my - mNodes[i].y) <= 16) { found = i; break; }
      }
      if (found >= 0) { hover = found; setActive(found); }
      else if (active < 0) hover = -1;
    });
    canvas.addEventListener('mouseleave', () => { hover = -1; if (active < 0) setActive(-1); });
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      for (let i = 0; i < mNodes.length; i++) {
        if (Math.hypot(mx - mNodes[i].x, my - mNodes[i].y) <= 16) { setActive(i); break; }
      }
    });
    pills.forEach(p => p.addEventListener('click', () => setActive(parseInt(p.getAttribute('data-pair'), 10))));

    // 分屏分割线拖拽（L1 · 二.3）
    divider.style.left = (dividerFrac * 100) + '%';
    let draggingDiv = false;
    divider.addEventListener('dblclick', () => {
      dividerFrac = 0.5; divider.style.left = '50%'; layoutNodes();
      narrate('双生分割线已复位到 50%。');
    });
    divider.addEventListener('pointerdown', e => { e.preventDefault(); draggingDiv = true; divider.setPointerCapture(e.pointerId); });
    divider.addEventListener('pointermove', e => {
      if (!draggingDiv) return;
      const r = canvas.getBoundingClientRect();
      let f = Math.max(0.12, Math.min(0.88, (e.clientX - r.left) / r.width));
      // 吸附 30/50/70
      [0.3, 0.5, 0.7].forEach(s => { if (Math.abs(f - s) < 0.035) f = s; });
      dividerFrac = f;
      divider.style.left = (dividerFrac * 100) + '%';
      layoutNodes();
    });
    divider.addEventListener('pointerup', () => {
      if (!draggingDiv) return;
      draggingDiv = false;
      const mPct = Math.round(dividerFrac * 100), aPct = Math.round((1 - dividerFrac) * 100);
      let extra = '';
      if (dividerFrac <= 0.15) extra = ' · 单纪显现：你正完全沉浸于现代科技星轨，古代金石渐隐。';
      else if (dividerFrac >= 0.85) extra = ' · 单纪显现：你正完全沉浸于古代金石星轨，现代烟火渐隐。';
      else if ([0.3, 0.5, 0.7].includes(dividerFrac)) extra = ' · 已吸附到 ' + Math.round(dividerFrac * 100) + '% 锚点。';
      narrate('双生分屏 · 现代 ' + mPct + '% / 古代 ' + aPct + '%' + extra);
    });

    const offResize = onResize(resize);
    resize();
    const loop = rafLoop(draw);
    this._dispose = () => { loop.stop(); offResize(); };
  },
  unmount() { if (this._dispose) this._dispose(); }
};
