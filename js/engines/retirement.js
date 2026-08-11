// 引擎：渐进式延迟退休真实算法（与 PRD / 技术文档 v2.1 一致，经 Node 复算背书）
// 政策来源：国务院关于渐进式延迟法定退休年龄的办法

export const FAFA = {
  50: 195, 51: 190, 52: 185, 53: 180, 54: 175, 55: 170, 56: 164, 57: 158,
  58: 152, 59: 145, 60: 139, 61: 132, 62: 125, 63: 117, 64: 109, 65: 101, 66: 93
};

function monthsFrom(y0, m0, y1, m1) {
  return (y1 - y0) * 12 + (m1 - m0);
}

// 延迟月数：按政策档位逐月累加并封顶
export function delayMonths(type, by, bm) {
  let elapsed;
  if (type === 'male') {            // 1965-01 起，每 4 个月 +1，封顶 36
    elapsed = monthsFrom(1965, 1, by, bm);
    if (elapsed < 0) return 0;
    return Math.min(36, Math.floor(elapsed / 4) + 1);
  } else if (type === 'female55') { // 1970-01 起，每 4 个月 +1，封顶 36
    elapsed = monthsFrom(1970, 1, by, bm);
    if (elapsed < 0) return 0;
    return Math.min(36, Math.floor(elapsed / 4) + 1);
  } else {                          // female50：1975-01 起，每 2 个月 +1，封顶 60
    elapsed = monthsFrom(1975, 1, by, bm);
    if (elapsed < 0) return 0;
    return Math.min(60, Math.floor(elapsed / 2) + 1);
  }
}

// 最低缴费年限：2029 及以前 15 年；2030 起每年 +0.5，封顶 20
export function minPayYears(retireYear) {
  if (retireYear <= 2029) return 15;
  return Math.min(20, 15 + (retireYear - 2029) * 0.5);
}

function fmtYM(totalMonths) {
  return { y: Math.floor(totalMonths / 12), m: totalMonths % 12 };
}

/**
 * 计算退休时钟
 * @param {object} p
 * @param {number} p.birthYear
 * @param {number} p.birthMonth 1-12
 * @param {string} p.type 'male' | 'female55' | 'female50'
 * @param {number} p.startYear 开始缴费年份
 * @param {number} p.flex 弹性月数（负=提前，正=延迟，合法区间 [-36, +36]，且提前不得低于原法定年龄）
 * @returns 完整结果对象
 */
export function computeRetirement({ birthYear, birthMonth, type, startYear, flex = 0 }) {
  const baseAge = type === 'male' ? 60 : (type === 'female55' ? 55 : 50);
  const dm = delayMonths(type, birthYear, birthMonth);

  const birthIdx = birthYear * 12 + (birthMonth - 1);
  const statutoryIdx = birthIdx + baseAge * 12 + dm;
  const earliestIdx = Math.max(statutoryIdx - 36, birthIdx + baseAge * 12);

  let actualIdx = statutoryIdx + flex;
  let clamped = false;
  if (actualIdx < earliestIdx) { actualIdx = earliestIdx; clamped = true; }
  if (actualIdx > statutoryIdx + 36) { actualIdx = statutoryIdx + 36; clamped = true; }

  const ry = Math.floor(actualIdx / 12);
  const rm = actualIdx % 12 + 1;
  const actualAge = fmtYM(actualIdx - birthIdx);
  const statAge = fmtYM(statutoryIdx - birthIdx);

  const now = new Date();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const remainYears = Math.max(0, actualIdx - nowIdx) / 12;

  const minY = minPayYears(ry);
  const payY = Math.max(0, ry - (startYear || ry));

  const fafaAge = Math.min(66, Math.max(50, Math.round((actualIdx - birthIdx) / 12)));

  return {
    baseAge, delayMonths: dm, flex,
    statutoryAge: statAge, actualAge,
    date: { year: ry, month: rm },
    countdownYears: remainYears,
    minPayYears: minY, payYears: payY,
    fafaMonths: FAFA[fafaAge] || null,
    clamped,
    ageText: `实际退休年龄 ${actualAge.y}岁${actualAge.m ? actualAge.m + '个月' : ''}` +
      `（法定 ${statAge.y}岁${statAge.m ? statAge.m + '个月' : ''}，延迟档位 +${dm} 个月` +
      (flex !== 0 ? `，弹性 ${flex > 0 ? '+' : ''}${flex} 个月` : '') + '）'
  };
}
