// 全局错误边界：捕获未处理异常，防止白屏
// 安装后会在 window 上挂载 error / unhandledrejection 监听

/**
 * 安装全局错误边界
 * @param {object} [opts]
 * @param {function(string): void} [opts.onNarrate] - 错误时的叙事回调
 */
export function installErrorHandler(opts = {}) {
  const { onNarrate } = opts;

  window.addEventListener('error', (e) => {
    console.error('[LifeVerse] 运行时错误:', e.error || e.message);
    if (onNarrate) {
      onNarrate('系统遇到一点扰动，已自动恢复。');
    }
    // 阻止默认的控制台报错刷屏
    if (e.message && e.message.includes('ResizeObserver')) {
      e.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('[LifeVerse] 未捕获的 Promise 异常:', e.reason);
    e.preventDefault();
  });

  // 控制台留个标记
  console.log('%c✦ 星衍 LifeVerse', 'color:#4f46e5;font-size:16px;font-weight:bold', '错误边界已激活');
}
