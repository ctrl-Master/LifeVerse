# 星衍 LifeVerse · 交互优化建议与规格说明 v1.0

> 基于 PRD v2.1 / 技术文档 v2.1 / 现有引擎（`starmap.js` · `probe.js` · `retirement.js` · `store.js`）整理。  
> 目标：把产品从「有动画的说明页」升级为「用三根手指玩的人生沙盘」。  
> 角色：设计规格与落地建议，不改动业务算法结论。

---

## 目录

1. [问题诊断](#1-问题诊断)
2. [设计原则与统一手势语言](#2-设计原则与统一手势语言)
3. [可借鉴产品与隐喻映射](#3-可借鉴产品与隐喻映射)
4. [分模块交互方案](#4-分模块交互方案)
5. [全局状态机](#5-全局状态机)
6. [与现有引擎的接口约定](#6-与现有引擎的接口约定)
7. [光阴探针（probe）详细规格](#7-光阴探针probe详细规格)
8. [星图涟漪（starmap）详细规格](#8-星图涟漪starmap详细规格)
9. [三视图切换规格](#9-三视图切换规格)
10. [开放玩法与远期构想](#10-开放玩法与远期构想)
11. [落地优先级与验收标准](#11-落地优先级与验收标准)
12. [文案与信息层级原则](#12-文案与信息层级原则)

---

## 1. 问题诊断

| 现状（来自 standalone / README） | 体验问题 |
|----------------------------------|----------|
| 主路径依赖按钮与卡片展开文字 | 像说明书，不像可推演的宇宙 |
| 仅「混沌星云注入」有明确物理手感 | 用户完成注入后迅速回到「阅读」 |
| 八大模块以 Gallery 文字说明为主 | 信息在，缺少「自己玩一遍」的闭环 |
| 音效已有，空间/触觉反馈弱 | 沉浸停留在装饰层 |
| 数据流 `星云 → 退休 → 星图 → 双生 → 报告` 已通 | 链路对，但每一跳缺少可操纵的交互面 |

**核心机会：** 每个模块对应一种可重复的手势；文字只做结果注解，不当主路径。

---

## 2. 设计原则与统一手势语言

### 2.1 原则

1. **手势先于菜单**：能拖、点、拧解决的，不弹二级页。
2. **形态表达结果**：成功=星变亮；摩擦=红波；共振=光束脉动。文案进抽屉。
3. **同一数据、三种看法**：星图 ⟷ 时间轴 ⟷ 报告，切换不丢状态。
4. **算法不重写**：`computeRetirement` / `castRipple` / 向量矩阵保持现有语义，只加输入出口与表现层。
5. **可逆与可玩**：关键参数（resistance、探针年份、决策强度）用户可拧，并立刻看到引擎输出。

### 2.2 全局三手势（全产品复用）

| 手势 | 桌面 | 触屏 | 语义 |
|------|------|------|------|
| **拖 Drag** | 按住拖动 | 单指拖 | 时间、轨道、微粒、探针、分割线 |
| **点 Tap** | 单击 | 轻触 | 选中星体、触发涟漪、打开扇形决策 |
| **捏/滚轮 Scale** | 滚轮 / Ctrl+拖 | 双指捏合 | 宇宙尺度：个人 → 家庭 → 世代 |

**修饰手势：**

- **长按 Long-press**（≥400ms）：钉住观察 / 调阻尼滑条 / 钉批注  
- **双击 Double-tap**：聚焦该星体的平行宇宙轨道  
- **框选 Marquee**（空拖矩形）：批量选中节点后统一施加决策  

### 2.3 手势冲突优先级

```
探针拖动中 > 星盘平移 > 框选 > 空白处重力井
扇形菜单打开时，点击菜单外 = 关闭，不触发下层涟漪
长按计时开始后，若移动超过 8px，取消长按，转为拖
```

---

## 3. 可借鉴产品与隐喻映射

| 产品 | 交互基因 | 映射到 LifeVerse |
|------|----------|------------------|
| The Sims | 点人 → 扇形动作菜单；需求条涨跌 | 点星体 → 决策扇；关系/稳定性条随涟漪变色 |
| Donut County | 单一手势贯穿体验 | 「探针拖」或「涟漪点」作为主玩法手势 |
| Monument Valley | 旋转结构改变路径 | 旋转星盘切换视角，连线重排 |
| Figma / FigJam | 框选、连线、画布钉评论 | 框选人生阶段；钉「如果当时…」 |
| Strava | 轨迹回放 + 分段高亮 | 探针松手后决策轨迹回放 |
| Apple Watch 呼吸 / 表冠 | 圆环、旋钮、呼吸节奏 | 退休时钟可拧；关系雷达扫描 |
| Osmos | 吸引、质量守恒 | 星云微粒吸附与合并 |
| Linear / Notion | 同一数据多视图 | 星图 / 时间轴 / 报告无缝切 |

---

## 4. 分模块交互方案

### 4.1 模块 01 · 混沌星云注入（nebula）

**现状：** 按钮坍缩 + chip 点击补字段。  

**目标形态：** 可玩的质能表单。

| 交互 | 说明 |
|------|------|
| 拖文件入画布 | PDF/图片/纯文本 drop → 以文件名与体积生成初始质能粒子 |
| 微粒物理吸附 | 缺失字段为逃逸粒子；指针靠近产生引力，再点确认注入 |
| 质量守恒 | 每注入一项，星尘减少、主星半径与亮度增加；进度条可弱化 |
| 完成仪式 | 可选：手绘一笔轨迹作为「签名注入」，写入 store |

**状态：** `idle → condensing → formed → enriching → ready`  
**写入 store：** 与现有画像字段对齐（age / city / job / …），不改 schema。

---

### 4.2 模块 02 / 07 / 08 · 星图宇宙 · 关系引力场 · 阻尼反弹

**目标：** 可操纵星盘，而非示意图。

| 交互 | 行为 | 引擎侧 |
|------|------|--------|
| 点星体 | 选中 + 弹出扇形决策菜单 | 选中态 UI；决策确认后调 `castRipple` |
| 拖星体 | 改变与「我」的距离 → 映射关系强度 | 更新边权重，重绘连线粗细/颜色 |
| 长按连线 | 出现 damping 滑条 | 写边 `resistance`；`resistance≥0.5` 时走现有衰减公式 |
| 框选多星 | 批量打出同一决策 | 对选中集合依次或合并一次 ripple |
| 空白长按 | 临时重力井，小星体被吸引 | 纯表现或轻量位置动画，可不改图结构 |

**扇形决策菜单（Sims 式）建议项：**  
换工作 / 搬家 / 结婚或分手 / 进修 / 生育 / 创业 —— 每项对应 `rulebase` 中一类 rule id。

**反弹表现：**  
当 `nextImpact *= (1 - resistance*0.6)` 生效时，沿边反向绘制红色反弹波，并在日志写「家庭决策摩擦度 +X%」（文案可配置）。

---

### 4.3 模块 03 · 双生时空剪影（twin）

| 交互 | 行为 |
|------|------|
| 拖中缝分割线 | 左现代 / 右古代比例变化 |
| 拖「共振强度」条 | 实时重算结构相似度（调用现有 `vectorMatrix`） |
| 双指捏合两轨 | 重叠区高亮共振事件 |
| 古代侧纵向滑朝代 | 现代侧同步高亮结构相似阶段 |

不强制改向量算法，只暴露「当前相似度 + 匹配朝代」到 UI。

---

### 4.4 模块 04 · 退休时钟（retirement）

| 交互 | 行为 |
|------|------|
| 外环拖 / 旋 | 调出生年、性别、岗档（工人/干部） |
| 内环自动落点 | 调用 `computeRetirement` 显示退休年月 |
| 表冠式弹性 ±3 年 | 在政策允许范围内拧「弹性退休」，超界触觉/颜色警告 |
| 缴费年限沙漏 | 2030 前后 15→20 年过渡用填充动画表达 |

**联动：** 退休时刻在时间轴与星图上钉「终点星」；可从该点回传涟漪到储蓄/家庭节点（可选规则）。

---

### 4.5 模块 05 · 光阴探针 & 平行宇宙（probe）★ 主玩法

见 [第 7 节详细规格](#7-光阴探针probe详细规格)。

要点：

- 拖探针 → 轨道**实时**形变  
- 激进变量拉满 → A/B 撕裂  
- 松手 → 短回放  
- 双探针对比（P1）

---

### 4.6 模块 06 · 个人断代史报告（report）

| 交互 | 行为 |
|------|------|
| 章节卡片拖拽排序 / 隐藏 | 只影响生成物布局，不改底层数据 |
| 关键词探照灯 | 输入词 → 报告段落与星图节点同时高亮 |
| 导出仪式 | 星图收束为「种子」落入信封动画 → 再出长图/PDF |
| 对比叠层 | 两份报告半透明叠加（分享向） |

---

## 5. 全局状态机

### 5.1 App 级

```
boot
  → nebula_required      （无画像时）
  → sandbox_idle         （有画像，默认可玩星图）
  → interacting_*        （探针中 / 涟漪播放中 / 菜单打开）
  → report_preview
  → share_readonly       （只读分享，可选）
```

### 5.2 星图会话（StarMap Session）

```
idle
  ├─ tap_node        → node_selected → fan_open
  │                      ├─ confirm_decision → ripple_playing → idle
  │                      └─ dismiss → idle
  ├─ drag_node       → relinking → idle
  ├─ longpress_edge  → damping_scrub → idle
  ├─ marquee         → multi_selected → batch_decision → ripple_playing → idle
  └─ probe_engage    →（移交 Probe 状态机）
```

### 5.3 探针会话（Probe Session）

```
idle
  → drag_start (指针按下在探针命中区)
  → dragging   (年份随 x 映射；每帧请求轨道形变)
  → drag_end   → playback (可选 1.2s) → idle
  → tear_threshold_reached → dual_universe (A/B 并排) → merge 或 keep_split
```

### 5.4 与 store 的同步点

| 时机 | 写入 |
|------|------|
| 星云 formed / enriching 完成 | `store.profile` |
| 决策确认 | `store.decisions[]` + 触发 ripple 快照 |
| 探针松手 | `store.probeYear` / `store.timelineScrub` |
| 阻尼调整 | `store.edges[id].resistance` |
| 报告导出前 | 聚合只读快照，不覆盖实时态 |

刷新不丢：继续全部走现有 `localStorage` 方案。

---

## 6. 与现有引擎的接口约定

以下为**建议的适配层 API**（可放在 `js/adapters/` 或直接在 view 层薄封装）。不要求改算法内部公式，只统一输入输出，便于 UI 对接。

### 6.1 starmap.js

**现有能力（README）：**  
`castRipple` BFS，`DECAY=[1,0.7,0.4,0.15]`，`resistance≥0.5` 时 `nextImpact *= (1 - resistance*0.6)`。

**建议对外接口：**

```ts
// 只读图结构
getGraph(): { nodes: Node[]; edges: Edge[] }

// 选中
setSelected(nodeIds: string[]): void
getSelected(): string[]

// 关系强度（拖星体距离映射后写入）
setEdgeWeight(edgeId: string, weight: number): void

// 阻尼（长按连线滑条）
setEdgeResistance(edgeId: string, resistance: number): void  // 0~1

// 触发涟漪（决策确认后）
castRipple(sourceId: string, impact: number, ruleId?: string): RippleResult

// 订阅一帧表现数据（供 canvas 绘波）
onRippleFrame(cb: (frame: RippleFrame) => void): unsubscribe
```

**RippleResult（建议字段）：**

```ts
{
  visited: { nodeId: string; depth: number; impact: number }[];
  echoes: { edgeId: string; impact: number }[];  // 反弹
  logLines: string[];  // 已有文案规则产出
}
```

**UI 约定：**

- `impact` 初始值由扇形菜单项配置（如「换工作」0.8，「进修」0.4）。  
- 反弹波：对 `echoes` 中每条边播红色反向动画，时长与 depth 相关。  
- 不要在 UI 里重写 DECAY；只消费 `RippleResult`。

### 6.2 probe.js

**现有能力：** 年份拖动轨道扩张 + A/B 双轨对比。

**建议对外接口：**

```ts
// 年份范围与当前值
getYearRange(): { min: number; max: number }  // 如 2026–2036
getYear(): number
setYear(year: number): void   // 拖动中高频调用；内部节流/采样由引擎决定

// 轨道形变数据（每帧）
getOrbitState(year?: number): OrbitState

// 激进变量 0~1，满阈值触发撕裂
setAggression(v: number): void
getAggression(): number
isTorn(): boolean

// A/B 快照
getBranchA(): OrbitState
getBranchB(): OrbitState
mergeBranches(): void
keepSplit(): void

// 回放
playScrubHistory(durationMs: number): Promise<void>
```

**OrbitState（建议）：**

```ts
{
  year: number;
  nodes: { id: string; x: number; y: number; scale: number }[];
  edges: { id: string; strength: number }[];
  // 可选：与退休点、关键决策年的标记
  markers: { year: number; type: 'retirement' | 'decision' | 'tear' }[];
}
```

**UI 约定：**

- 拖动中：每 `pointermove` 将像素 x 映射为 year → `setYear` → 读 `getOrbitState` 重绘。  
- 达到撕裂阈值：监听 `isTorn()` 或引擎事件，切换双画布布局。  
- 松手：调用 `playScrubHistory(1200)`，期间禁用拖动。

### 6.3 retirement.js

```ts
// 保持现有
computeRetirement(input: RetirementInput): RetirementResult
// UI 圆环只负责改 input 字段并重新调用
```

输入字段与 PRD 一致：性别、岗档、出生年、弹性意向等。UI 不复制封顶逻辑（男 63 / 女 58 / 女 55 等）。

### 6.4 rulebase.js / vectorMatrix.js / store.js

- 扇形菜单的 `ruleId` → `rulebase` 查效应文案与推荐 impact。  
- 双生模块继续调向量相似度；UI 只展示返回的朝代与分数。  
- 所有持久化仍经 `store.js`，适配层不直接碰 `localStorage`。

### 6.5 音频（audio.js）

沿用现有：`connect` / `ripple` / `echo` + 静音持久化。  
新增建议事件钩子（可选）：`tear`（撕裂）、`fanOpen`、`probeTick`（拖动时低频滴答，注意节流）。

---

## 7. 光阴探针（probe）详细规格

### 7.1 布局

- 主画布：星轨 / 星图随年份形变。  
- 底部固定：**探针轨道**（时间轴），高度约 56–72px。  
- 探针头：可拖圆点 + 当前年份标签。  
- 可选第二探针（P1）：对比色，差值带。

### 7.2 映射

```
year = minYear + (pointerX - trackLeft) / trackWidth * (maxYear - minYear)
year 取整或 0.5 年步进；拖动时允许子像素平滑，松手吸附到步进
```

### 7.3 状态与时序

| 阶段 | 用户 | 系统 |
|------|------|------|
| 命中 | 指针按下在探针热区 | `drag_start`；记录起点 year |
| 拖动 | move | `setYear`；请求 `OrbitState`；星轨插值移动；可选 `probeTick` 音效（≥80ms 间隔） |
| 撕裂 | aggression≥阈值 或 特殊手势 | 中缝粒子裂缝；左右 A/B；`isTorn=true` |
| 松手 | pointerup | `drag_end` → `playScrubHistory(1200)` → 写 store |
| 回放中 | 忽略拖动 | 探针头自动走历史轨迹；关键决策年闪白 |

### 7.4 平行宇宙撕裂

- **触发：** `aggression >= 0.92` 持续 200ms，或探针双击。  
- **表现：** 画布从中线撕开；A 保持当前决策链，B 应用「激进默认集」或用户上次分支。  
- **退出：** 按钮「合并到 A/B」或再次捏合；调用 `mergeBranches` / `keepSplit`。

### 7.5 与星图联动

- 探针年份落在某决策年时，对应节点 pulse。  
- 退休年：显示终点星标记（数据来自 `computeRetirement`）。  
- 涟漪播放中进入探针：涟漪暂停或降为半透明，避免两套动画抢焦点。

---

## 8. 星图涟漪（starmap）详细规格

### 8.1 点选与扇形菜单

```
tap node
  → setSelected([id])
  → 在节点锚点外侧展开扇形（6±2 项，避免挡节点）
  → 项 hover 预览 impact 数值（不写图）
  → 项 click → castRipple(id, impact, ruleId) → 关闭扇形
  → 扇形外 click → dismiss
```

**扇形布局：** 第一项朝上，顺时针均分；触屏热区 ≥44px。

### 8.2 拖星体改关系

```
drag node
  → 仅允许在「可编辑关系模式」下（工具栏切换或长按节点进入）
  → 距离 d 映射 weight = clamp(1 - d/dMax, 0.05, 1)
  → setEdgeWeight
  → 连线粗细/颜色即时更新
```

### 8.3 阻尼长按

```
longpress edge
  → 沿边中点弹出竖向滑条 resistance 0~1
  → 滑动 setEdgeResistance
  → ≥0.5 时滑条变红，提示「将产生反弹」
  → 下一次经过该边的 ripple 必走衰减与 echo 绘制
```

### 8.4 涟漪播放帧

UI 根据 `onRippleFrame`：

- depth 0：源点爆闪  
- depth 1–3：按 DECAY 透明度波纹沿 BFS 扩散  
- echoes：反向红波 + 短锯齿音 `Sound.echo`  
- 结束：日志抽屉追加 `logLines`（默认折叠）

### 8.5 框选批量

```
marquee → multi_selected
  → 扇形项变为「对 N 个节点施加」
  → 以选中集合中「我」或重心为源，或对每个源依次 cast（需限流，建议合并为一次中等 impact）
```

---

## 9. 三视图切换规格

| 视图 | 主操作 | 数据 |
|------|--------|------|
| **星图** | 点/拖/涟漪 | graph + 实时 ripple |
| **时间轴** | 探针、决策钉 | 同一 decisions + retirement 标记 |
| **报告** | 章节编排、探照灯、导出 | 聚合只读快照 |

**切换动画：** 共享元素过渡（同一节点从星图位移动到时间轴钉位置）；时长 280–360ms。  
**状态保持：** `selected` / `probeYear` / `aggression` 跨视图保留。  
**路由建议：** 同页内 `view=map|timeline|report`，不整页刷新。

---

## 10. 开放玩法与远期构想

1. **人生卡牌桌：** 决策卡拖到星图打出 → 走 rulebase（利于 200→2000 规则可视化）。  
2. **旁观模式：** 只读链接 + 假设滑条，不改作者 store。  
3. **每日一澜：** 冷启动微动画展示「昨夜关系场变化」。  
4. **语音一句注入：** ASR → 结构化微粒（移动端）。  
5. **冲突剧场：** 反弹触发时 5 秒立场选择，再回星图。  
6. **AR 桌面星盘：** 与「沙盘」叙事一致，远期。

---

## 11. 落地优先级与验收标准

### P0（体感提升最大，建议 1–2 周）

| 项 | 验收 |
|----|------|
| 探针拖动实时形变 + 松手回放 | 拖动时轨道连续变形；松手 1.2s 内回放可取消 |
| 点星体 → 扇形决策 → 真 `castRipple` | 波纹与日志与现引擎一致；反弹在 resistance≥0.5 可见 |
| 三视图切换不跳页 | 切换 <400ms；选中与年份不丢 |

### P1

| 项 | 验收 |
|----|------|
| 星云拖文件 / 微粒吸附 | 无文件时仍可用 chip；有文件时粒子数与主星变化可感知 |
| 连线长按调 damping | 滑条改值后下一次 ripple 衰减可观测 |
| 退休可拧圆环 | 与 `computeRetirement` 结果一致；越界有反馈 |

### P2

| 项 | 验收 |
|----|------|
| A/B 撕裂动画 | 阈值触发稳定；可合并/保留 |
| 报告探照灯 + 导出仪式 | 关键词同时点亮报告与星图；导出前有 2s 内动画 |
| 只读分享 | 他人无法写 store |

### P3

统一三手势 10 秒无字教程、卡牌桌、语音/AR 按资源选做。

---

## 12. 文案与信息层级原则

1. **默认零说明**：进模块即可拖；`?` 才出 ≤10 字提示。  
2. **结果形态化**：优先亮度、波色、裂缝、钉标；句子放日志。  
3. **日志默认折叠**：涟漪结束出现「详情」入口，不挡画布。  
4. **避免政策口号：** 退休与规则结果用中性表述，与现引擎文案风格一致。  
5. **无障碍：** 扇形项与探针提供键盘替代（方向键调年、Enter 确认决策）；尊重 `prefers-reduced-motion`（关闭非必要粒子，保留位置过渡）。

---

## 附录 A · 扇形菜单项与 ruleId 示例映射

| 菜单文案 | 建议 ruleId | 默认 impact |
|----------|-------------|-------------|
| 换工作 | `career.switch` | 0.75 |
| 搬家 | `life.relocate` | 0.6 |
| 结婚/分手 | `family.bond` | 0.8 |
| 进修 | `career.study` | 0.45 |
| 生育 | `family.child` | 0.85 |
| 创业 | `career.found` | 0.9 |

具体以 `rulebase.js` 现有 SAMPLE_RULES 为准，上表仅示意。

---

## 附录 B · 指针命中与性能

- 探针热区：垂直扩展到轨道上下各 12px，避免「点不中」。  
- 涟漪播放期间节点命中可保留，但决策确认排队到播放结束（或允许打断并 clear 动画）。  
- `setYear` 与重绘：建议 rAF 合并；节点数约 11 时全量重算可接受，若规则扩到大量节点再做脏矩形。  
- 触屏：`touches` 分支已在工程预留，探针与扇形优先保证单指；捏合仅用于缩放与双轨捏合。

---

## 附录 C · 文档修订

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-07-28 | 首版：优化建议 + 手势/状态机 + starmap/probe 接口约定 + 优先级 |

---

**一句话方向（备忘）：**  
拖时间、点决策、拧关系；文字只在玩完之后，轻轻说一句——「所以你的涟漪停在了这里」。
