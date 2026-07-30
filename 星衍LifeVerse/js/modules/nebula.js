// 模块1：混沌星云注入 · 创世 Data Injection
import { el } from '../utils/dom.js';
import { fitCanvas, fitCanvasFlex, rafLoop, onResize } from '../utils/canvas.js';
import { Sound } from '../engines/audio.js';
import { getState, update } from '../store.js';

const LABELS = {
  age: { t: '年龄', v: '28-32', opts: ['22-26', '28-32', '33-38', '39-45', '46+'] },
  ind: { t: '行业', v: '互联网', opts: ['互联网', '制造业', '金融', '教育', '医疗', '自由职业'] },
  dilemma: { t: '困境', v: '成长停滞', opts: ['成长停滞', '收入瓶颈', '关系张力', '健康预警', '意义缺失'] }
};
const HIDDEN = {
  family: { t: '原生家庭', v: '未填', opts: ['亲密', '疏离', '重担', '未和解'] },
  debt: { t: '负债感', v: '未填', opts: ['无', '房贷', '消费债', '人情债'] },
  body: { t: '身体信号', v: '未填', opts: ['良好', '亚健', '告警', '慢病'] },
  faith: { t: '信仰/无信仰', v: '未填', opts: ['无信仰', '世俗成就', '家庭本位', '精神追求'] }
};
const CITY_OPTS = ['一线', '新一线', '二线', '返乡'];

export const nebula = {
  id: 'nebula',
  title: '混沌星云注入',
  subtitle: '把简历拖入星云，质能坍缩凝聚出代表「我」的主星体',
  mount(root) {
    const canvas = el('canvas', { id: 'nebulaCanvas', class: 'mod-canvas' });
    const meter = el('div', { class: 'meter-fill', id: 'nebulaMeter' });
    const meterText = el('span', { id: 'nebulaMeterText', text: '待注入 · 0%' });
    const hint = el('p', { class: 'hint', id: 'nebulaHint', text: '点击下方按钮，将你的简历「质能化」注入星云。' });
    const injectBtn = el('button', { class: 'btn primary', id: 'nebulaInject', text: '✦ 注入简历质能' });
    const positions = getState().positions || {};
    const chips = ['age', 'ind', 'dilemma'].map(k =>
      el('div', { class: 'grav-chip', 'data-k': k, draggable: 'true', text: LABELS[k].t + '：' + (positions[k] || LABELS[k].v) + '  ？' }));
    const hiddenRow = el('div', { class: 'grav-row hidden-row', id: 'hiddenRow', style: { display: 'none' } },
      Object.keys(HIDDEN).map(k => el('div', { class: 'grav-chip hidden-chip', 'data-k': k, draggable: 'true', text: HIDDEN[k].t + '：未填' })));
    const toggleHidden = el('button', { class: 'btn', id: 'toggleHidden', text: '✥ 隐藏维度（原生家庭 / 负债 / 身体 / 信仰）' });
    const pop = el('div', { class: 'chip-pop', id: 'chipPop', style: { display: 'none' } });
    const fearInput = el('input', { class: 'fear-input', id: 'fearSeed', placeholder: '✎ 一句话命运种子：「我最怕的是……」',
      value: getState().profile.fearSeed || '' });
    const redoRow = el('div', { class: 'redo-row', id: 'redoRow', style: { display: 'none' } }, [
      el('button', { class: 'btn', id: 'redoKeep', text: '保留决策历史' }),
      el('button', { class: 'btn', id: 'redoClear', text: '清空涟漪重来' })
    ]);

    function openEdit(key, def, chip) {
      pop.innerHTML = '';
      pop.appendChild(el('div', { class: 'pop-title', text: '编辑「' + def.t + '」' }));
      def.opts.forEach(o => {
        const b = el('button', { class: 'pop-opt', text: o });
        b.addEventListener('click', () => {
          const pos = Object.assign({}, getState().positions); pos[key] = o; update('positions', pos);
          chip.textContent = def.t + '：' + o + '  ？';
          chip.classList.add('done');
          Sound.ripple(0); narrate('质能字段「' + def.t + '」已设为 ' + o + '。');
          pop.style.display = 'none';
          if (key === 'ind') update('profile.industry', o);
          if (key === 'dilemma') update('profile.dilemma', o);
          if (key === 'age') update('profile.age', parseInt((o.match(/\\d+/) || [30])[0], 10));
        });
        pop.appendChild(b);
      });
      pop.style.display = 'block';
    }
    chips.forEach(c => c.addEventListener('click', () => openEdit(c.getAttribute('data-k'), LABELS[c.getAttribute('data-k')], c)));
    hiddenRow.querySelectorAll('.grav-chip').forEach(c => {
      const k = c.getAttribute('data-k');
      c.addEventListener('click', () => openEdit(k, HIDDEN[k], c));
      c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', k); e.dataTransfer.effectAllowed = 'copy'; });
    });
    toggleHidden.addEventListener('click', () => {
      const show = hiddenRow.style.display === 'none';
      hiddenRow.style.display = show ? 'flex' : 'none';
      narrate(show ? '已展开隐藏维度：原生家庭、负债感、身体信号、信仰——它们将影响阻尼与双生匹配。' : '已收起隐藏维度。');
    });
    fearInput.addEventListener('input', () => {
      update('profile.fearSeed', fearInput.value);
      if (fearInput.value.trim()) {
        // 命运种子：把对家庭的隐性担忧转译为默认阻尼抬升（仅 demo 推演用）
        const map = Object.assign({}, getState().edgeResistance);
        map['father|mother'] = Math.min(0.9, (map['father|mother'] || 0.30) + 0.1);
        map['me|father'] = Math.min(0.9, (map['me|father'] || 0.70));
        update('edgeResistance', map);
        if (!injected) inject();
      }
    });
    redoRow.querySelector('#redoKeep').addEventListener('click', () => { injected = true; condenseT = 1; condense = 1; redoRow.style.display = 'none'; narrate('已重塑本我，决策历史保留。'); });
    redoRow.querySelector('#redoClear').addEventListener('click', () => {
      update('decisions', []); update('lastRipple', null); update('markers', []); update('frictionUnresolved', 0);
      redoRow.style.display = 'none'; narrate('已清空涟漪，本我重塑。'); Sound.connect();
    });

    const stage = el('div', { class: 'nebula-stage' }, [
      el('div', { class: 'nebula-canvas-wrap' }, [canvas]),
      el('div', { class: 'meter', html: '' }, [meter]),
      el('div', { class: 'meter-cap' }, [meterText]),
      el('div', { class: 'grav-row' }, chips),
      hiddenRow, toggleHidden, fearInput, pop,
      injectBtn, redoRow, hint
    ]);
    root.appendChild(stage);

    const ctx = canvas.getContext('2d');
    let W, H, cx, cy, dpr = 1, zoom = 1;
    let particles = [], tagNodes = [];
    let injected = false, condenseT = 0, condense = 0, orbit = 0, fill = 0;
    const doneChips = { age: false, ind: false, dilemma: false };
    const st = getState();
    const narrate = (t) => { if (window.LTApp) window.LTApp.narrate(t); };

    function resize() {
      const f = fitCanvasFlex(canvas);
      W = f.W; H = f.H; dpr = f.dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H * 0.56;
    }
    function seed() {
      particles = [];
      for (let i = 0; i < 140; i++) {
        particles.push({ x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.6 + 0.6, a: Math.random() * 0.4 + 0.2 });
      }
    }
    function setFill(v) {
      fill = Math.max(0, Math.min(100, v));
      meter.style.width = fill + '%';
      meterText.textContent = (injected ? '自动提取中' : '待注入') + ' · ' + Math.round(fill) + '%';
    }
    function updateFeat() {
      if (fill < 72) return;
      update('profile.features.hard', 'Java后端 / 微服务');
      update('profile.features.life', '深耕期后半');
      update('profile.features.niche', '可替代中层');
    }
    function inject() {
      if (injected) return;
      injected = true; condenseT = 0;
      update('profile.injected', true); // 简历质能已注入，立即标记，下游模块据此联动
      hint.textContent = '简历被解析为「质能」——星云正坍缩，凝聚出代表你的主星体。';
      Sound.connect();
    }
    function injectChip(k) {
      if (!injected) inject();
      if (doneChips[k]) return;
      doneChips[k] = true;
      setFill(fill + 9);
      const c = root.querySelector('.grav-chip[data-k="' + k + '"]');
      if (c) c.classList.add('done');
      Sound.ripple(0);
      updateFeat();
      if (fill >= 100) {
        hint.textContent = '主星体凝聚完成 ✦ 特征已写入引力网，可进入下一步分析。';
        update('profile.injected', true);
      }
    }
    function draw() {
      orbit += 0.01;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
      if (!injected || condense < 1) {
        particles.forEach(p => {
          if (injected) {
            const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy) || 1;
            const sp = Math.min(d, 2.4 * condenseT);
            p.x += dx / d * sp; p.y += dy / d * sp;
            condenseT += 0.004; if (condenseT > 1) condenseT = 1;
          } else {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;
          }
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(120,128,160,' + p.a + ')'; ctx.fill();
        });
        if (injected && condenseT >= 1) {
          condense = 1;
          tagNodes = [
            { k: 'age', ang: -0.6, rad: 64, r: 9 },
            { k: 'ind', ang: 1.5, rad: 82, r: 9 },
            { k: 'dilemma', ang: 3.0, rad: 72, r: 9 }
          ];
          setFill(72); updateFeat();
          hint.textContent = '主星体已凝聚。四周漂浮出引力微粒——点击未填字段注入，或拖拽滑块微调。';
        }
      } else {
        particles.forEach(p => {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(150,158,190,0.18)'; ctx.fill();
        });
      }
      if (condense >= 1) {
        const pulse = 1 + Math.sin(orbit * 3) * 0.06;
        ctx.beginPath(); ctx.arc(cx, cy, 18 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79,70,229,0.18)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 12 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#4f46e5'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '600 11px -apple-system,"PingFang SC",sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('我', cx, cy + 4);
        tagNodes.forEach(t => {
          t.ang += 0.012;
          const tx = cx + Math.cos(t.ang) * t.rad, ty = cy + Math.sin(t.ang) * t.rad * 0.7;
          t.x = tx; t.y = ty;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty);
          ctx.strokeStyle = 'rgba(217,119,6,0.25)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath(); ctx.arc(tx, ty, t.r, 0, Math.PI * 2);
          ctx.fillStyle = doneChips[t.k] ? '#059669' : '#d97706'; ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '600 10px -apple-system,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(doneChips[t.k] ? '✓' : '?', tx, ty + 3);
          ctx.fillStyle = '#475069'; ctx.font = '11px -apple-system,sans-serif';
          ctx.fillText(LABELS[t.k], tx, ty - t.r - 5);
        });
      }
      ctx.restore();
    }

    chips.forEach(c => {
      c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', c.getAttribute('data-k')); e.dataTransfer.effectAllowed = 'copy'; });
    });
    injectBtn.addEventListener('click', () => {
      if (!injected) { inject(); injectBtn.textContent = '✦ 重塑本我'; return; }
      redoRow.style.display = 'flex';
      narrate('再次注入将重塑本我。请选择：保留决策历史，或清空涟漪重来。');
    });
    canvas.addEventListener('click', e => {
      if (condense < 1) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      for (const t of tagNodes) {
        if (t.x == null) continue;
        if (Math.hypot(mx - t.x, my - t.y) <= (t.r + 6)) { injectChip(t.k); break; }
      }
    });
    // 全画布拖拽：把引力微粒拖入星云完成填充（L1 · 一.4）
    canvas.addEventListener('dragover', e => { e.preventDefault(); canvas.style.outline = '2px dashed var(--accent)'; });
    canvas.addEventListener('dragleave', () => { canvas.style.outline = 'none'; });
    canvas.addEventListener('drop', e => {
      e.preventDefault(); canvas.style.outline = 'none';
      const k = e.dataTransfer.getData('text/plain');
      if (k) { injectChip(k); Sound.gravity(); narrate('质能微粒「' + LABELS[k] + '」已拖入星云。'); }
    });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      zoom = Math.max(0.5, Math.min(2.5, zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
      narrate('星云缩放 ×' + zoom.toFixed(1));
    }, { passive: false });
    const offResize = onResize(resize);
    resize(); seed();
    const loop = rafLoop(draw);

    // 若之前已注入，恢复状态
    if (st.profile.injected) {
      injected = true; condense = 1; condenseT = 1; fill = 100;
      tagNodes = [{ k: 'age', ang: -0.6, rad: 64, r: 9, x: 0, y: 0 },
                  { k: 'ind', ang: 1.5, rad: 82, r: 9, x: 0, y: 0 },
                  { k: 'dilemma', ang: 3.0, rad: 72, r: 9, x: 0, y: 0 }];
      Object.keys(doneChips).forEach(k => doneChips[k] = true);
      root.querySelectorAll('.grav-chip').forEach(c => c.classList.add('done'));
      setFill(100);
      injectBtn.textContent = '✦ 重塑本我';
      hint.textContent = '主星体已凝聚（已恢复上次注入）。';
    }

    this._dispose = () => { loop.stop(); offResize(); };
  },
  unmount() { if (this._dispose) this._dispose(); }
};
