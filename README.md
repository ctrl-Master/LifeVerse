# 星衍 LifeVerse · 人生轨迹推演空间

> 纯前端可运行 MVP（原生 Vanilla + ES Module，零依赖）。从 PRD v2.2（丰富化）抽取核心引擎，构建为可交互、可持久化、6 大模块端到端联动的真实工程。

## 快速开始

```bash
npm start
# 或： node server.js
```

浏览器打开 `http://localhost:5173`（ES Module 必须经 http 提供，**不能直接双击 index.html**）。

> 也可使用任意静态服务器，例如 `python -m http.server 5173`。

### 离线单文件版（无需服务器）

`星衍LifeVerse-standalone.html` 是一个**自包含单文件**（16 个模块已打包为单 IIFE + 内联 CSS），**可直接双击用浏览器打开离线运行**，适合分享与演示。改完源码后执行 `node build_standalone.cjs` 可重新生成它。

## 模块地图（对应 PRD v2.1）

| 模块 | 文件 | 说明 |
|------|------|------|
| 01 混沌星云注入 | `js/modules/nebula.js` | 简历质能坍缩凝聚主星体，写入用户画像 |
| 02/07/08 星图宇宙·关系引力场 | `js/modules/starmapView.js` | 11 节点 BFS 涟漪传导 + 阻尼反弹波 |
| 03 双生时空剪影 | `js/modules/twin.js` | 跨时空共振光束 + 结构相似度向量矩阵 |
| 04 退休时钟 | `js/modules/retirement.js` | 渐进式延迟退休真实算法 |
| 05 光阴探针 & 平行宇宙撕裂 | `js/modules/probe.js` | 年份拖动轨道扩张 + A/B 双轨对比 |
| 06 个人断代史报告 | `js/modules/report.js` | 聚合前序所有数据，一页可打印报告 |

## 核心引擎（`js/engines/`）

- `retirement.js` —— `delayMonths` / `minPayYears` / `computeRetirement`，经 Node 复算背书，边界与政策一致（男封顶 63 / 女55档 58 / 女50档 55；退休≥2040 最低缴费跃迁 20 年）。
- `starmap.js` —— `castRipple` BFS 引擎，`DECAY=[1,0.7,0.4,0.15]`，**含 v2.2 阻尼真实衰减修复**：`resistance≥0.5` 时 `nextImpact *= (1 - resistance*0.6)`。
- `rulebase.js` —— 传导规则库 Schema（200→2000 条规划）+ 效应文案。
- `vectorMatrix.js` —— 三维结构向量余弦相似度，实时匹配唐/宋/明历史周期。
- `audio.js` —— Web Audio 音效引擎（连接/涟漪/反弹）+ 一键静音，localStorage 持久化。

## 数据流

`星云注入 → 退休预填 → 星图涟漪 → 双生共振 → 断代史报告`，全程经 `js/store.js`（localStorage）联动，刷新不丢失。

## 项目结构

```
/
├── index.html              # 入口
├── js/                     # 源码（engines + modules + utils）
├── css/                    # 样式
├── tests/                  # 单元测试（Vitest）
├── scripts/                # 构建脚本
├── docs/                   # PRD 与技术文档
│   ├── life-trajectory-prd/
│   └── lta-tech-doc/
├── 星衍LifeVerse-standalone.html  # 离线单文件版
└── package.json
```

## 已知工程化缺口（v2.2 待办）

1. 阻尼能量损耗：原型仅视觉/日志层反弹，已通过 `starmap.js` 的 `nextImpact *= (1 - resistance*0.6)` 修复真实衰减。
2. 规则库：`SAMPLE_RULES` 为内联常量，生产化需改为查表 + 触发模糊匹配 + 置信度加权（200→2000 条）。
3. 多端：当前为桌面优先，已含移动端基础响应式，触屏拖拽事件已预留 `touches` 分支。

## 许可与版权

个人作品集 / 技术演示项目（Portfolio Demo），非商业产品。保留所有权利，未经书面授权不得用于商业目的。
