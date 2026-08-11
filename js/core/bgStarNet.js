// 背景星网动画：白色主视觉粒子网络
// 独立模块，无外部依赖

/**
 * 初始化背景星网动画
 * @param {HTMLCanvasElement} canvas - 画布元素
 */
export function initBgStarNet(canvas) {
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
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.8
      });
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
