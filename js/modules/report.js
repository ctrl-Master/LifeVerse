// 模块6：个人断代史报告（可视化档案，替代纯文字主交互）
// 四件可视化：① 主体画像雷达 ② 退休生命相位条 ③ 关系涟漪传播图 ④ 双生共振对比条
import { el } from '../utils/dom.js';
import { getState, update } from '../store.js';
import { NODES, LINKS, nodeById, castRipple } from '../engines/starmap.js';
import { buildReferences } from '../engines/vectorMatrix.js';
import { escapeHtml } from '../utils/sanitize.js';
import { LTApp } from '../core/app.js';

// ===== 可视化生成（纯 SVG，零新依赖） =====
function radarSVG(vals, labels) {
  const cx = 140, cy = 132, R = 92, n = vals.length;
  let grid = '';
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      pts.push((cx + R * f * Math.cos(a)).toFixed(1) + ',' + (cy + R * f * Math.sin(a)).toFixed(1));
    }
    grid += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="#e7e9f2" stroke-width="1"/>';
  });
  let axes = '', labs = '', dots = '';
  const proj = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    const ex = cx + R * Math.cos(a), ey = cy + R * Math.sin(a);
    axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + ex.toFixed(1) + '" y2="' + ey.toFixed(1) + '" stroke="#e7e9f2"/>';
    const lx = cx + (R + 18) * Math.cos(a), ly = cy + (R + 18) * Math.sin(a);
    labs += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle" font-size="11" fill="#6b7280">' + escapeHtml(labels[i]) + '</text>';
    const vx = cx + R * (vals[i] / 100) * Math.cos(a), vy = cy + R * (vals[i] / 100) * Math.sin(a);
    proj.push([vx, vy]);
    dots += '<circle cx="' + vx.toFixed(1) + '" cy="' + vy.toFixed(1) + '" r="3" fill="#4f46e5"/>';
  }
  const poly = '<polygon points="' + proj.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') +
    '" fill="rgba(79,70,229,0.20)" stroke="#4f46e5" stroke-width="2" stroke-linejoin="round"/>';
  return '<svg viewBox="0 0 280 264" class="rv-svg rv-radar">' + grid + axes + poly + dots + labs + '</svg>';
}

function retireBarSVG(r) {
  if (!r) return '<p class="muted">（尚未计算，请前往「退休时钟」模块）</p>';
  const retireAge = r.actualAge.y + (r.actualAge.m || 0) / 12;
  const startAge = 22;
  const total = Math.max(1, retireAge - startAge);
  const elapsed = Math.max(0, total - r.countdownYears);
  const frac = Math.max(0, Math.min(1, elapsed / total));
  const W = 620, H = 76, pad = 12, barW = W - pad * 2, x0 = pad, y = 44, bh = 22;
  const fillW = barW * frac;
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="rv-svg" style="max-width:660px;margin:0 auto">' +
    '<text x="' + x0 + '" y="22" font-size="12" fill="#6b7280">22 岁（入职）</text>' +
    '<text x="' + (W - pad) + '" y="22" text-anchor="end" font-size="12" fill="#6b7280">' + r.date.year + ' 年退休</text>' +
    '<rect x="' + x0 + '" y="' + y + '" width="' + barW + '" height="' + bh + '" rx="11" fill="#eef0f6"/>' +
    '<rect x="' + x0 + '" y="' + y + '" width="' + fillW.toFixed(1) + '" height="' + bh + '" rx="11" fill="#4f46e5"/>' +
    '<text x="' + (x0 + barW / 2) + '" y="' + (y + bh / 2 + 4) + '" text-anchor="middle" font-size="11" fill="#fff">工作进度 ' + Math.round(frac * 100) + '% · 距退休 ' + r.countdownYears.toFixed(1) + ' 年</text>' +
    '</svg>';
}

function rippleSVG(lr) {
  if (!lr || !lr.results || !lr.results.length)
    return '<p class="muted">（尚未触发，请前往「星图宇宙」点击星体或选择情景）</p>';
  const cx = 180, cy = 160, R = 120, n = NODES.length;
  const pos = {};
  NODES.forEach((nd, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    pos[nd.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const affected = new Set(lr.results.map(r => r.to));
  const conflict = new Set(lr.results.filter(r => r.resistance >= 0.5).map(r => r.to));
  let lines = '';
  LINKS.forEach(lk => {
    const a = pos[lk[0]], b = pos[lk[1]];
    if (!a || !b) return;
    const hi = lk[3] >= 0.5;
    lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) +
      '" stroke="' + (hi ? 'rgba(225,29,72,0.30)' : 'rgba(79,70,229,0.18)') + '" stroke-width="' + (0.6 + lk[2] * 2).toFixed(2) + '"/>';
  });
  let dots = '';
  NODES.forEach(nd => {
    const p = pos[nd.id];
    let col = '#d97706';
    if (nd.id === 'me' || nd.tier === 0) col = '#4f46e5';
    else if (conflict.has(nd.id)) col = '#e11d48';
    else if (affected.has(nd.id)) col = '#0ea5e9';
    const r = nd.id === 'me' ? 10 : (affected.has(nd.id) ? 8 : 6);
    dots += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '" fill="' + col + '"><title>' + escapeHtml(nd.label) + '</title></circle>';
    dots += '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + r + 11) + '" text-anchor="middle" font-size="10" fill="#475069">' + escapeHtml(nd.label) + '</text>';
  });
  return '<svg viewBox="0 0 360 320" class="rv-svg" style="max-width:440px;margin:0 auto">' + lines + dots + '</svg>';
}

function twinBars(tp) {
  if (!tp || !tp.length) return '<p class="muted">（尚未生成，请前往「双生时空剪影」调节结构向量）</p>';
  return '<div class="twin-bars">' + tp.map(d => {
    const v = Math.round(d.sim * 100);
    return '<div class="tb-row"><span>' + escapeHtml(d.name) + '</span><div class="tb-track"><div class="tb-fill" style="width:' + v + '%"></div></div><span class="tb-val">' + v + '%</span></div>';
  }).join('') + '</div>';
}

export const report = {
  id: 'report',
  title: '个人断代史报告',
  subtitle: '汇总星云注入、退休时钟、星图涟漪、双生共振，生成一页可打印的「人生断代史」可视化档案',
  mount(root) {
    const st = getState();
    const narrate = (t) => { if (LTApp) LTApp.narrate(t); };
    const jumpStarmap = () => {
      LTApp.route('starmap');
      narrate('报告 → 跳转星图，重演关系涟漪。');
      setTimeout(() => { if (LTApp.starmapRipple) LTApp.starmapRipple(); }, 30);
    };
    const sec = (id, title, bodyNode) => el('section', { class: 'report-sec', id: id }, [
      el('h3', { text: title }), bodyNode
    ]);

    // 一、主体画像雷达
    const p = st.profile;
    const ageNum = parseInt(p.age, 10) || 30;
    const indigo = (p.industry && p.industry.indexOf('互联网') >= 0) ? 70 : (p.industry ? 50 : 35);
    const ageCap = ageNum <= 30 ? 82 : ageNum <= 40 ? 72 : ageNum <= 50 ? 58 : 42;
    const anti = (p.features.niche && /可替代/.test(p.features.niche)) ? 32 : 72;
    const radarVals = [
      p.features.hard ? 72 : 30,
      indigo,
      ageCap,
      p.features.life ? 66 : 36,
      anti
    ];
    const radarLabels = ['技能深度', '行业前景', '年龄资本', '生涯确定', '抗替代'];
    const sec1 = sec('s1', '一、主体画像（能力雷达）',
      el('div', { html: radarSVG(radarVals, radarLabels) }));

    // 二、退休生命相位条
    const r = st.retirement;
    const sec2 = sec('s2', '二、退休时钟（生命相位）',
      el('div', { html: retireBarSVG(r) }));

    // 三、关系涟漪传播图（点击跳转星图）
    // 无真实涟漪时，复用真实引擎 castRipple 生成代表性扩散图，避免回退成纯文字占位
    const lrReal = st.lastRipple;
    const lr = (lrReal && lrReal.results && lrReal.results.length)
      ? lrReal
      : { source: 'me', name: '代表性事件 · 职业决策', impact: 0.72, results: castRipple('me', 0.72).results, _sample: true };
    const rippleWrap = el('div', { class: 'rv-ripple', title: '点击重演涟漪' }, [
      el('div', { html: rippleSVG(lr) }),
      el('p', { class: 'rv-cap', text:
        (lr._sample ? '示例 · ' : '触发事件：' + escapeHtml(lr.name) + '（强度 ' + lr.impact.toFixed(2) + '）· ') +
        '点击图区可跳转星图重演' })
    ]);
    rippleWrap.addEventListener('click', jumpStarmap);
    const sec3 = sec('s3', '三、关系涟漪传导（点击跳转星图）', rippleWrap);

    // 四、双生共振对比条
    // 无真实匹配时，用默认结构向量算出历史人物同源度，避免回退成纯文字占位
    const tpReal = st.twinPicks;
    const tp = (tpReal && tpReal.length)
      ? tpReal
      : buildReferences([0.7, 0.8, 0.5]).map(r => ({ name: r.name, sim: r.cosine }));
    const sec4 = sec('s4', '四、历史结构共振（同源度）',
      el('div', {}, [
        el('div', { html: twinBars(tp) }),
        el('p', { class: 'rv-cap', text:
          (tpReal && tpReal.length) ? '由「双生时空剪影」滑块实时匹配'
            : '示例 · 调节双生滑块可替换为你的真实匹配' })
      ]));

    // 五、衍生指标卡（冲突指数 / 被波及人数 / 最强阻力边）
    const decs = st.decisions || [];
    const lastR = st.lastRipple;
    const affectedTotal = (lastR && lastR.results) ? lastR.results.length : 0;
    const conflictIdx = (st.frictionUnresolved || 0) + decs.filter(d => d.rebound).length;
    let strongest = null;
    LINKS.forEach(lk => { if (!strongest || lk[3] > strongest[3]) strongest = lk; });
    const conflictLabel = strongest ? (nodeById(strongest[0]).label + '—' + nodeById(strongest[1]).label) : '—';
    const metricsHTML =
      '<div class="report-cards">' +
        '<div class="rc-card"><div class="rc-k">决策次数</div><div class="rc-v">' + decs.length + '</div></div>' +
        '<div class="rc-card"><div class="rc-k">被波及人数合计</div><div class="rc-v">' + affectedTotal + '</div></div>' +
        '<div class="rc-card"><div class="rc-k">冲突指数</div><div class="rc-v" style="color:var(--echo)">' + conflictIdx + '</div></div>' +
        '<div class="rc-card"><div class="rc-k">最强阻力边</div><div class="rc-v">' + escapeHtml(conflictLabel) + '</div></div>' +
      '</div>';
    const sec5 = sec('s5', '五、推演衍生指标', el('div', { html: metricsHTML }));

    // 六、关键涟漪编年体（年份 · 事件 · 波及 · 是否反弹；可隐藏单条）
    const chronoItems = decs.length
      ? decs.slice().reverse().map((d, k) => {
          const reach = (d.results && d.results.length) ? d.results.length : '—';
          return '<li class="chrono-item" data-i="' + (decs.length - 1 - k) + '">' +
            '<span class="ch-year">' + escapeHtml(d.year || '—') + '</span>' +
            '<span class="ch-evt">' + escapeHtml(d.name) + '</span>' +
            '<span class="ch-reach">波及 ' + reach + '</span>' +
            (d.rebound ? '<span class="ch-flag">反弹</span>' : '<span class="ch-flag ok">顺行</span>') +
            '<button class="ch-hide" title="从导出中隐藏">⊘</button></li>';
        }).join('')
      : '<li class="muted">尚无决策记录。前往「星图宇宙」点击星体抛下决策石子，编年史将在此生长。</li>';
    const chronoList = el('ul', { class: 'chrono-list', html: chronoItems });
    chronoList.addEventListener('click', e => {
      const btn = e.target.closest('.ch-hide');
      if (btn) { const li = btn.closest('.chrono-item'); li.classList.toggle('hidden-out'); narrate('已切换该条编年记录的导出可见性。'); }
    });
    const sec6 = sec('s6', '六、关键涟漪编年体', chronoList);

    // 七、给十年后的信（可编辑末段，存入 store 形成情感闭环）
    const letterTA = el('textarea', { class: 'letter-ta', id: 'letterTA', placeholder: '写一句话给十年后的自己……（将随报告一起保存）' });
    letterTA.value = st.letter || '';
    letterTA.addEventListener('input', () => update('letter', letterTA.value));
    const sec7 = sec('s7', '七、给十年后的信',
      el('div', {}, [letterTA, el('p', { class: 'rv-cap', text: '这一段只属于你，不会出现在任何统计口径中。' })]));

    // 维度筛选 chip（保留联动交互）
    const chips = [['s1', '画像'], ['s2', '退休'], ['s3', '涟漪'], ['s4', '共振'], ['s5', '指标'], ['s6', '编年'], ['s7', '信件']].map(([id, label]) => {
      const c = el('span', { class: 'filter-chip active', 'data-sec': id, text: label });
      c.addEventListener('click', () => {
        const on = c.classList.toggle('active');
        const secEl = document.getElementById(id);
        if (secEl) secEl.classList.toggle('dim', !on);
        narrate('报告维度筛选：' + label + (on ? ' 显示' : ' 隐藏'));
      });
      return c;
    });

    // 导出仪式：2s 收束动画（星图→种子→信封）+ 水印长图
    const exportBtn = el('button', { class: 'btn primary', id: 'exportBtn', text: '✦ 收束为我的断代史' });
    const seal = el('div', { class: 'export-seal', id: 'exportSeal' }, [
      el('div', { class: 'seal-dot' }),
      el('div', { class: 'seal-txt', text: '星图收束为种子……' })
    ]);
    exportBtn.addEventListener('click', () => {
      seal.style.display = 'flex';
      narrate('正在收束你的人生断代史……');
      setTimeout(() => { seal.querySelector('.seal-txt').textContent = '写入信封……'; }, 800);
      setTimeout(() => {
        seal.style.display = 'none';
        const wm = '星衍 LifeVerse · 我的断代史 · 探针年 ' + (st.settings.probeYear || 2026);
        const area = root.querySelector('.report-stage').cloneNode(true);
        area.querySelectorAll('.filter-chips, .report-foot, .export-seal, .ch-hide').forEach(n => n.remove());
        const w = window.open('', '_blank');
        if (w) {
          w.document.write('<html><head><meta charset="utf-8"><title>' + wm + '</title>' +
            '<style>body{font-family:-apple-system,"PingFang SC",sans-serif;padding:32px;color:#1a1d2e}#wm{position:fixed;bottom:8px;right:12px;font-size:11px;color:#9aa0b4}section{margin-bottom:18px;border:1px solid #e7e9f2;border-radius:14px;padding:16px}h3{color:#4f46e5}textarea{display:none}</style></head><body>' +
            area.innerHTML + '<div id="wm">' + wm + '</div></body></html>');
          w.document.close(); w.print();
        } else {
          narrate('浏览器拦截了新窗口，已为你准备打印视图（Ctrl/Cmd+P）。');
          window.print();
        }
      }, 2000);
    });

    const stage = el('div', { class: 'report-stage' }, [
      el('div', { class: 'report-head' }, [
        el('h2', { text: '星衍 LifeVerse · 个人断代史报告' }),
        el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' } }, [
          el('p', { class: 'muted', text: '本报告由前序模块数据自动汇编，仅存于本地浏览器。' }),
          exportBtn
        ]),
        seal
      ]),
      el('div', { class: 'filter-chips' }, chips),
      sec1, sec2, sec3, sec4, sec5, sec6, sec7,
      el('div', { class: 'report-foot', text: '— 报告完 · 星海静默处，亦有你的回声 —' })
    ]);
    root.appendChild(stage);
    this._dispose = () => {};
  },
  unmount() { if (this._dispose) this._dispose(); }
};
