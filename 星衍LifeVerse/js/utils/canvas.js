// 工具：canvas 适配 + 动画循环
export function fitCanvas(canvas, height) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.parentElement.getBoundingClientRect();
  const W = rect.width;
  const H = height || rect.height || 300;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W, H, dpr };
}

// 自适应：画布高度随父容器（flex 子项）伸缩，消除大屏写死高度导致的留白
export function fitCanvasFlex(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const wrap = canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const W = rect.width;
  const H = Math.max(240, wrap.clientHeight || rect.height || 320);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W, H, dpr };
}

// 返回 { stop } 的 rAF 循环
export function rafLoop(step) {
  let id = 0;
  let running = true;
  function tick() {
    if (!running) return;
    step();
    id = requestAnimationFrame(tick);
  }
  id = requestAnimationFrame(tick);
  return {
    stop() { running = false; cancelAnimationFrame(id); }
  };
}

export function onResize(cb) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}
