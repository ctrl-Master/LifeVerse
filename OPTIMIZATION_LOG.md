# 星衍 LifeVerse · 工程化优化日志

> 记录每个阶段的改动内容、已解决问题和待办事项，方便后续迭代时快速定位。

---

## Phase 1：基建筑底（已完成）

### 已完成的改动

#### 1. Vitest 单元测试
- 新增 `tests/unit/retirement.test.js` — 退休算法全覆盖（延迟月数/缴费年限/弹性钳制/计发月数）
- 新增 `tests/unit/starmap.test.js` — BFS 涟漪传导（节点/连线/衰减/阻尼/自定义 links）
- 新增 `tests/unit/vectorMatrix.test.js` — 余弦相似度（正交/同向/零向量/历史参照构造）
- 新增 `tests/unit/rulebase.test.js` — 规则库（查表/效应文案/反弹故事句/五域完整性）
- 新增 `tests/unit/store.test.js` — 状态管理（读/写/深层路径/订阅/持久化/重置）
- 新增 `tests/unit/utils.test.js` — 工具函数（clamp/lerp/dist/fmt1）
- 覆盖目标：5 个引擎模块 + 工具层 ≥ 80%

#### 2. Vite 构建工具
- 新增 `vite.config.js` — 替代手写打包脚本，支持 HMR + 生产构建
- 保留 `server.js` 作为零依赖 fallback
- 引擎模块单独分块（manualChunks）

#### 3. Vitest 配置
- 新增 `vitest.config.js` — jsdom 环境，覆盖率阈值 80%
- 覆盖范围排除 UI 模块（modules/）和入口文件（main.js）

#### 4. ESLint + Prettier
- 新增 `eslint.config.js` — Flat Config，ES2023 + ES Module 规则集
- 规则：no-unused-vars / no-var / prefer-const / eqeqeq / no-console(warn)
- 新增 `.prettierrc` — 单引号 + 分号 + 2 空格缩进
- 测试文件单独规则（允许 console，注入 vitest globals）

#### 5. Husky + lint-staged
- 新增 `.husky/pre-commit` — 提交前自动 lint + format
- package.json 中配置 lint-staged 规则

#### 6. 构建脚本重写
- 新增 `scripts/build-standalone.mjs` — 替代旧版 `build_standalone.cjs`
- **关键修复**：消除硬编码路径 `D:/Users/user/Desktop/...`，改用 `__dirname` 自动定位
- 旧文件 `build_standalone.cjs` 保留但已废弃，后续可删除

#### 7. package.json 升级
- 版本号 2.1.0 → 3.0.0
- 新增 scripts：dev / build / build:standalone / test / test:watch / test:coverage / lint / lint:fix / format
- 新增 devDependencies：vite / vitest / eslint / prettier / husky / lint-staged / jsdom
- 新增 engines 字段（node >= 18）
- 新增 lint-staged 配置

### 已解决的问题

| # | 问题 | 严重度 | 解决方式 |
|---|------|--------|---------|
| 1 | 构建脚本硬编码绝对路径，换机器即报错 | P0 致命 | 重写为 `__dirname` 相对路径 |
| 2 | 5 个引擎模块零测试覆盖 | P0 | 新增 6 个测试文件，覆盖率目标 ≥ 80% |
| 3 | 无代码规范工具 | P1 | ESLint + Prettier + Husky 全链路 |
| 4 | package.json 缺少 devDeps 和 scripts | P1 | 完整升级 |
| 5 | Node 路径硬编码 | P0 | 新脚本使用运行时 Node，不指定路径 |

---

## Phase 2：架构升级（已完成）

### 已完成的改动

#### 1. main.js 拆分（286 行 → 41 行）
将单体入口文件拆分为 `js/core/` 下 6 个职责清晰的模块：

| 文件 | 职责 | 行数 |
|------|------|------|
| `core/router.js` | 模块注册表、路由切换、侧栏导航构建 | ~55 |
| `core/hud.js` | HUD 徽章、人生完整度环、侧栏状态点 | ~50 |
| `core/narrator.js` | 叙事条、时代广播、内心独白 | ~45 |
| `core/bgStarNet.js` | 背景星网粒子动画 | ~65 |
| `core/interactions.js` | 音效面板、全局快捷键、语音指令 | ~95 |
| `core/errorBoundary.js` | 全局错误捕获（error + unhandledrejection） | ~25 |
| `main.js`（新） | 薄入口，组装各子系统并启动 | 41 |

#### 2. 全局错误边界
- 新增 `core/errorBoundary.js`
- 捕获 `window.error` 和 `unhandledrejection`
- 过滤 ResizeObserver 噪声
- 错误时通过叙事条提示用户（非白屏）

#### 3. store.js schema 校验
- 新增 `isValid()` 函数：校验顶层字段完整性
- 新增 `deepMerge()` 函数：深度合并 DEFAULT 与持久化数据
- 旧用户 localStorage 数据自动补齐新增字段（向前兼容）
- 损坏数据自动回退到默认值 + 控制台警告

#### 4. JSDoc 类型注释
为以下文件的公开函数添加 `@param` / `@returns`：
- `js/engines/retirement.js` — `computeRetirement`（Phase 1 已有）
- `js/engines/starmap.js` — `castRipple`（Phase 1 已有）
- `js/engines/vectorMatrix.js` — `cosine` / `buildReferences` / `similarity`（新增）
- `js/utils/math.js` — `clamp` / `lerp` / `dist` / `fmt1`（新增）
- `js/store.js` — `getState` / `setState` / `update` / `subscribe` / `reset`（新增）

#### 5. Barrel Exports
- 新增 `js/engines/index.js` — 统一导出 5 个引擎模块
- 新增 `js/modules/index.js` — 统一导出 6 个 UI 模块
- 新增 `js/utils/index.js` — 统一导出 3 个工具模块
- 外部引用可 `import { computeRetirement, castRipple } from './engines/index.js'`

#### 6. 仓库目录重构
- `星衍LifeVerse/` 子目录下所有文件移到根目录
- `人生推测演示程序/` 改名 `docs/`
- 合并两个 `.gitignore`
- README 更新项目结构说明，去掉 `cd` 步骤

### 已解决的问题

| # | 问题 | 严重度 | 解决方式 |
|---|------|--------|---------|
| 1 | main.js 286 行单体文件，职责混杂 | P2 | 拆分为 6 个 core/ 模块 |
| 2 | 无全局错误处理，异常导致白屏 | P2 | errorBoundary.js 捕获 + 叙事提示 |
| 3 | store.js 无 schema 校验，脏数据导致崩溃 | P2 | isValid + deepMerge + 自动回退 |
| 4 | 引擎/模块/工具无统一导出入口 | P2 | 3 个 barrel index.js |
| 5 | 仓库目录嵌套，clone 后需 cd | P2 | 重构为根目录 + docs/ |
| 6 | 关键函数缺类型注释 | P3 | JSDoc @param/@returns |

### 评分变化

| 维度 | Phase 1 后 | Phase 2 后 | 变化 |
|------|-----------|-----------|------|
| 项目结构与模块化 | 7 | 9 | +2（core/ 拆分 + barrel exports） |
| 测试体系 | 7 | 7 | — |
| 构建工具链 | 7 | 7 | — |
| 代码规范与静态检查 | 8 | 8 | — |
| 类型安全 | 0 | 4 | +4（JSDoc 注释覆盖核心函数） |
| CI/CD 自动化 | 0 | 0 | —（Phase 3） |
| 错误处理与健壮性 | 3 | 7 | +4（errorBoundary + store schema 校验） |
| 性能优化 | 4 | 4 | —（Phase 3） |
| 安全防护 | 3 | 3 | —（Phase 3） |
| 文档与工程规范 | 6 | 7 | +1（JSDoc + 目录重构） |
| 业务逻辑质量 | 7 | 7 | — |
| **加权总分** | **50** | **63** | **+13** |

---

## 未优化项详情（后续阶段处理）

### Phase 3：质量保障

本阶段已完成：XSS 转义（sanitize.js + escapeHtml）、server.js CSP 头、背景动画 visibilitychange 暂停、ARIA 标签与 :focus-visible、window.LTApp 改为 core/app.js 单例、GitHub Actions CI 流水线。模块懒加载与 Pages 部署留作后续。

| # | 问题 | 严重度 | 详情 | 影响 |
|---|------|--------|------|------|
| 1 | report.js innerHTML XSS 风险 | **P1 高危** | `report.js` 用字符串拼接 + innerHTML 渲染文案，含用户可影响的决策名/年份。 | 已通过 `escapeHtml` 转义动态文本消除 |
| 2 | starmapView.js innerHTML 拼接 | **P1 高危** | 涟漪日志用 innerHTML 拼接 effect 文案。 | 已用 `escapeHtml` 转义动态文本 |
| 3 | 无 GitHub Actions CI/CD | **P1** | 无自动化测试/构建流水线。 | 已新增 `.github/workflows/ci.yml`（lint + test + build） |
| 4 | server.js 无 CSP header | **P2** | 零依赖服务器未设置 CSP 响应头。 | 已添加 `Content-Security-Policy`（同源策略） |
| 5 | 背景星网动画始终运行 | **P2** | `bgStarNet.js` 的 rAF 循环在标签页隐藏时仍在运行。 | 已加 `visibilitychange` 监听，隐藏即暂停 |
| 6 | 无模块懒加载 | **P2** | 6 个 UI 模块首屏全量加载。 | 待做：router 改为动态 import() |
| 7 | 无 ARIA 标签 | **P2** | 交互元素缺少 ARIA 属性。 | 已加 `role`/`aria-label`/`aria-live` + `:focus-visible` 样式（canvas 键盘操作待补） |
| 8 | :focus-visible 样式缺失 | **P3** | 键盘导航无焦点高亮。 | 已加 `css/a11y.css` |

### Phase 4：工程规范（待执行）

| # | 问题 | 严重度 | 详情 | 影响 |
|---|------|--------|------|------|
| 9 | 无 CONTRIBUTING.md | **P3** | 无贡献者指南。 | 协作门槛高 |
| 10 | 无 CHANGELOG.md | **P3** | 无版本变更记录。 | 版本追溯困难 |
| 11 | 无 ARCHITECTURE.md | **P3** | 无架构文档。 | 上手成本高 |
| 12 | 无 .env.example | **P3** | 无环境变量示例文件。 | 配置不透明 |
| 13 | 无 .editorconfig | **P3** | 无编辑器配置统一文件。 | 代码风格不一致 |
| 14 | 无 .nvmrc | **P3** | 无 Node 版本锁定文件。 | 环境不一致 |
| 15 | 无 commitlint | **P3** | 无 Conventional Commits 校验。 | Git 历史混乱 |
| 16 | CSS 变量未提取到独立文件 | **P3** | styles.css 中 :root 变量与组件样式混在一起。 | 样式维护困难 |
| 17 | 无 TypeScript 定义 | **P3** | 仅有 JSDoc 注释，无 .d.ts。 | 类型安全不足 |
| 18 | ~~旧文件 build_standalone.cjs 未删除~~ | ~~P3~~ | ~~已被 build-standalone.mjs 替代。~~ | **已解决** — Phase 2 已删除 |

### Phase 5：卓越打磨（待执行）

| # | 问题 | 严重度 | 详情 | 影响 |
|---|------|--------|------|------|
| 19 | 无 E2E 测试 | **P3** | 无 Playwright 端到端测试。 | 回归风险高 |
| 20 | 无 PerformanceObserver | **P3** | 无性能监控埋点。 | 性能黑盒 |
| 21 | 无 PWA 支持 | **P3** | 无 manifest.json 和 Service Worker。 | 移动端体验差 |
| 22 | 测试覆盖率未到 90% | **P3** | UI 模块（modules/）未覆盖。 | 测试盲区 |
| 23 | window.LTApp 全局污染 | **P2** | 原挂到 window 的全局句柄。 | **已解决** — 改为 `core/app.js` ES Module 单例 |
| 24 | 无错误上报 | **P3** | errorBoundary 仅本地 console.error。 | 线上错误不可见 |

---

## 各阶段评分汇总

| 阶段 | 总分 | 关键提升 |
|------|------|---------|
| 初始状态 | 30 | — |
| Phase 1 完成 | 50 | +20（测试 + 构建 + 规范） |
| Phase 2 完成 | 63 | +13（架构拆分 + 错误处理 + schema 校验） |
| Phase 3 完成 | 75 | +12（XSS 转义 + CSP + 背景暂停 + ARIA/focus-visible + 单例 + CI） |
| Phase 4 目标 | 85 | +10（文档体系 + 工程规范 + 类型定义） |
| Phase 5 目标 | 90+ | +5（E2E + PWA + 监控 + 覆盖率） |

---

## Phase 3：质量保障（本阶段进展）

- [x] utils/sanitize.js XSS 防护（escapeHtml + textNode）
- [x] 修复 report.js / starmapView.js innerHTML → escapeHtml 转义
- [x] GitHub Actions CI/CD（ci.yml: lint + test + build）
- [x] server.js 添加 CSP header
- [x] 背景星网 document.hidden 暂停
- [ ] 模块懒加载（动态 import()）
- [x] ARIA 标签 + :focus-visible（canvas 键盘操作待补）
- [x] 消除 window.LTApp 全局状态（改为 core/app.js 单例）
- [ ] GitHub Pages 部署（deploy.yml）

## Phase 4：工程规范（待执行）

- [x] README 重写（架构图 + 截图 + 工程化说明）— Phase 2 已完成
- [ ] CONTRIBUTING.md
- [ ] CHANGELOG.md
- [ ] ARCHITECTURE.md
- [ ] .env.example + .editorconfig + .nvmrc
- [ ] commitlint + commitizen
- [ ] CSS 变量提取到 variables.css
- [ ] types/index.d.ts 类型定义
- [x] 删除旧 build_standalone.cjs — Phase 2 已完成

## Phase 5：卓越打磨（待执行）

- [ ] Playwright E2E 测试
- [ ] PerformanceObserver 监控
- [ ] PWA manifest + Service Worker
- [ ] 测试覆盖率提升到 90%+
- [ ] 错误上报机制（Sentry / 自建）
