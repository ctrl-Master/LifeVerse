// 模块4：退休时钟（渐进式延迟退休真实算法）
import { el } from '../utils/dom.js';
import { computeRetirement } from '../engines/retirement.js';
import { Sound } from '../engines/audio.js';
import { getState, update } from '../store.js';

export const retirement = {
  id: 'retirement',
  title: '退休时钟',
  subtitle: '基于渐进式延迟退休政策的真实算法：延迟档位 / 弹性钳制 / 最低缴费年限 / 计发月数',
  mount(root) {
    const st = getState();
    const defaultBirthYear = Math.max(1950, new Date().getFullYear() - (st.profile.age || 30));

    const birth = el('input', { type: 'month', id: 'rt_birth', value: defaultBirthYear + '-06' });
    const type = el('select', { id: 'rt_type' }, [
      el('option', { value: 'male', text: '男职工（原 60）' }),
      el('option', { value: 'female55', text: '女干部/女性灵活就业（原 55）' }),
      el('option', { value: 'female50', text: '女工人（原 50）' })
    ]);
    const start = el('input', { type: 'number', id: 'rt_startYear', value: String(defaultBirthYear + 22), min: '1970', max: '2035' });
    const flex = el('input', { type: 'range', id: 'rt_flex', min: '-36', max: '36', value: '0' });
    const flexVal = el('span', { id: 'rt_flexVal', text: '法定退休' });
    const calcBtn = el('button', { class: 'btn primary', id: 'rt_calc', text: '计算退休时钟' });

    const dialEl = el('div', { class: 'clock-dial', id: 'rt_dial' });
    const g1El = el('div', { class: 'gauge', id: 'rt_g1' });
    const g2El = el('div', { class: 'gauge', id: 'rt_g2' });
    const noteEl = el('details', { class: 'clock-note', id: 'rt_note' }, [
      el('summary', { text: '政策时钟解读（点击展开）' })
    ]);

    const narrate = (t) => { if (window.LTApp) window.LTApp.narrate(t); };
    const CUR_Y = new Date().getFullYear();
    const magBlock = (txt, data, cls) => el('div', { class: 'mag-block' + (cls ? ' ' + cls : ''), draggable: 'true', text: txt, 'data-drag': data });
    const gBlocks = [{ label: '男职工', val: 'male' }, { label: '女干部/灵活就业', val: 'female55' }, { label: '女工人', val: 'female50' }]
      .map(g => magBlock(g.label, JSON.stringify({ type: 'gender', val: g.val })));
    const pBlocks = [15, 20, 25, 30].map(y => magBlock(y + ' 年缴费', JSON.stringify({ type: 'pay', val: y }), 'pay'));
    const slotType = el('div', { class: 'drop-slot', id: 'slotType', text: '拖入参保身份' });
    const slotStart = el('div', { class: 'drop-slot', id: 'slotStart', text: '拖入缴费年限' });
    const magnet = el('div', { class: 'retire-magnet' }, [
      el('h4', { text: '🧲 磁块拖拽（也可直接填上方表单）' }),
      el('div', { class: 'mag-row' }, gBlocks),
      el('div', { class: 'mag-row' }, pBlocks),
      el('div', { class: 'drop-slots' }, [slotType, slotStart])
    ]);
    [].concat(gBlocks, pBlocks).forEach(b => b.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', b.getAttribute('data-drag')); e.dataTransfer.effectAllowed = 'copy';
    }));
    [slotType, slotStart].forEach(slot => {
      slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('over'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('over'));
      slot.addEventListener('drop', e => {
        e.preventDefault(); slot.classList.remove('over');
        const data = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        if (data.type === 'gender') type.value = data.val;
        else if (data.type === 'pay') start.value = String(CUR_Y - data.val);
        calc(); Sound.gravity();
        narrate('磁块已吸附：' + (data.type === 'gender' ? '参保身份=' + data.val : '预计缴费=' + data.val + ' 年'));
      });
    });

    const stage = el('div', { class: 'retire-stage' }, [
      el('div', { class: 'retire-form' }, [
        el('label', { text: '出生年月' }), birth,
        el('label', { text: '参保身份' }), type,
        el('label', { text: '开始缴费年份' }), start,
        el('label', { text: '弹性档位' }), el('div', { class: 'flex-row' }, [flex, flexVal]),
        calcBtn
      ]),
      el('div', { class: 'retire-result' }, [
        dialEl,
        el('div', { class: 'gauge-row' }, [g1El, g2El]),
        noteEl
      ]),
      magnet
    ]);
    root.appendChild(stage);

    // ===== 表盘 / 仪表 SVG 生成 =====
    function polar(cx, cy, R, deg) {
      const a = (deg - 90) * Math.PI / 180;
      return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    }
    function arc(cx, cy, R, d0, d1) {
      const x0 = polar(cx, cy, R, d0), x1 = polar(cx, cy, R, d1);
      const large = (d1 - d0) > 180 ? 1 : 0;
      return 'M' + x0[0].toFixed(1) + ' ' + x0[1].toFixed(1) + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + x1[0].toFixed(1) + ' ' + x1[1].toFixed(1);
    }
    function gPt(cx, cy, R, f) {
      const rad = f * Math.PI;
      return [cx - R * Math.cos(rad), cy - R * Math.sin(rad)];
    }
    function gaugeHTML(cx, cy, R, f, val, cap, color) {
      f = Math.max(0, Math.min(1, f));
      const p = gPt(cx, cy, R, f);
      const large = f > 0.5 ? 1 : 0;
      return '<svg viewBox="0 0 160 92" aria-label="' + cap + '">' +
        '<path d="M' + (cx - R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 0 0 ' + (cx + R) + ' ' + cy + '" fill="none" stroke="#eef0f6" stroke-width="14" stroke-linecap="round"/>' +
        '<path d="M' + (cx - R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 ' + large + ' 0 ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + '" fill="none" stroke="' + color + '" stroke-width="14" stroke-linecap="round"/>' +
        '</svg>' +
        '<div class="g-val" style="color:' + color + '">' + val + '</div>' +
        '<div class="g-cap">' + cap + '</div>';
    }
    function calc() {
      const parts = birth.value.split('-');
      if (parts.length < 2) return;
      const by = parseInt(parts[0], 10), bm = parseInt(parts[1], 10);
      const t = type.value;
      const flexV = parseInt(flex.value, 10);
      const r = computeRetirement({ birthYear: by, birthMonth: bm, type: t, startYear: parseInt(start.value, 10), flex: flexV });
      const LIFE = 85;
      const curAge = Math.max(0, CUR_Y - by);
      const retAge = r.actualAge.y + (r.actualAge.m || 0) / 12;
      const aLived = Math.min(LIFE, curAge), aRet = Math.min(LIFE, retAge);
      const retired = curAge >= retAge;
      const cx = 150, cy = 150, R = 108, sw = 18;
      const segs = [
        { d0: 0, d1: aLived / LIFE * 360, c: '#4f46e5' },
        { d0: aLived / LIFE * 360, d1: aRet / LIFE * 360, c: '#d97706' },
        { d0: aRet / LIFE * 360, d1: 360, c: '#059669' }
      ];
      let arcs = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#eef0f6" stroke-width="' + sw + '"/>';
      segs.forEach(function (s) {
        if (s.d1 <= s.d0) return;
        arcs += '<path d="' + arc(cx, cy, R, s.d0, s.d1) + '" fill="none" stroke="' + s.c + '" stroke-width="' + sw + '" stroke-linecap="round"/>';
      });
      const m = polar(cx, cy, R, aRet / LIFE * 360);
      const tip = polar(cx, cy, R - 18, curAge / LIFE * 360);
      arcs += '<circle cx="' + m[0].toFixed(1) + '" cy="' + m[1].toFixed(1) + '" r="7" fill="#e11d48" stroke="#fff" stroke-width="2"/>';
      arcs += '<line x1="' + cx + '" y1="' + cy + '" x2="' + tip[0].toFixed(1) + '" y2="' + tip[1].toFixed(1) + '" stroke="#1a1d2e" stroke-width="3"/>';
      arcs += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#1a1d2e"/>';
      const cdTxt = retired ? '已退休' : r.countdownYears.toFixed(1);
      dialEl.innerHTML = '<svg viewBox="0 0 300 300" role="img" aria-label="退休时钟表盘">' + arcs +
        '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="40" font-weight="800" fill="#4f46e5">' + cdTxt + '</text>' +
        '<text x="' + cx + '" y="' + (cy + 22) + '" text-anchor="middle" font-size="14" fill="#6b7280">' + (retired ? '' : '年 · 距退休') + '</text>' +
        '<text x="' + cx + '" y="' + (cy + 46) + '" text-anchor="middle" font-size="14" fill="#1a1d2e">预计 ' + r.date.year + '.' + String(r.date.month).padStart(2, '0') + ' 退休</text>' +
        '</svg>';
      const g1f = retired ? 0 : Math.max(0, Math.min(1, r.countdownYears / 40));
      g1El.innerHTML = gaugeHTML(80, 70, 62, g1f, retired ? '已退休' : r.countdownYears.toFixed(1) + ' 年', '距法定退休', '#4f46e5');
      const g2f = Math.max(0, Math.min(1, r.payYears / r.minPayYears));
      g2El.innerHTML = gaugeHTML(80, 70, 62, g2f, r.payYears + ' 年', '缴费年限 / 需 ' + r.minPayYears, '#059669');
      let html = '<strong>政策时钟解读</strong><br/>';
      html += '按渐进式延迟退休政策，延迟档位 <strong>+' + r.delayMonths + ' 个月</strong>，法定退休年龄 ' +
        r.statutoryAge.y + '岁' + (r.statutoryAge.m ? r.statutoryAge.m + '个月' : '') + '。';
      flexVal.textContent = flexV === 0 ? '法定退休' : (flexV > 0 ? '延迟 ' + Math.abs(flexV) + ' 个月' : '提前 ' + Math.abs(flexV) + ' 个月');
      if (r.clamped) html += '<span style="color:#e11d48">弹性档位超出合法区间，已自动钳制（提前不得低于原法定年龄，延迟最多 3 年）。</span>';
      html += r.payYears >= r.minPayYears
        ? '预计缴费 ' + r.payYears + ' 年，<strong style="color:#059669">满足</strong>最低 ' + r.minPayYears + ' 年要求。'
        : '预计缴费 ' + r.payYears + ' 年，<strong style="color:#e11d48">不足</strong>最低 ' + r.minPayYears + ' 年，需延长缴费或补足。';
      html += '弹性提前退休会同步减少缴费年限与个人账户积累，星图「家庭现金流」节点将联动重算。';
      noteEl.innerHTML = '<summary>政策时钟解读（点击展开）</summary>' + html;
      update('retirement', r);
    }
    [birth, type, start, flex].forEach(inp => {
      inp.addEventListener('change', calc);
      inp.addEventListener('input', calc);
    });
    calcBtn.addEventListener('click', calc);
    calc();
    this._dispose = () => {};
  },
  unmount() { if (this._dispose) this._dispose(); }
};
