// 应用单例：替代 window.LTApp 全局挂载，消除全局污染
// 各模块直接 import 此单例，不再依赖 window
export const LTApp = {
  route: null,
  narrate: null,
  reset: null,
  Sound: null,
  starmapRipple: null
};
