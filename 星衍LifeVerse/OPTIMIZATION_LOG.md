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

### 未解决的问题（待后续阶段处理）

| # | 问题 | 严重度 | 计划阶段 | 说明 |
|---|------|--------|---------|------|
| 1 | main.js 286 行未拆分 | P2 | Phase 2 | 需拆为 router/hud/narrator/app 4 文件 |
| 2 | 无 JSDoc 类型注释 | P2 | Phase 2 | 需为引擎函数添加 @param/@returns |
| 3 | 无全局错误处理 | P2 | Phase 2 | 需添加 errorBoundary.js |
| 4 | window.LTApp 全局状态污染 | P2 | Phase 2 | 改为 ES Module 单例 |
| 5 | 无 barrel exports | P2 | Phase 2 | engines/modules/utils 各加 index.js |
| 6 | report.js innerHTML XSS 风险 | P1 | Phase 3 | 需用 DOM API 替代字符串拼接 |
| 7 | starmapView.js innerHTML 拼接 | P1 | Phase 3 | 同上 |
| 8 | 无 GitHub Actions CI/CD | P1 | Phase 3 | 需添加 ci.yml + deploy.yml |
| 9 | 背景星网动画始终运行 | P2 | Phase 3 | 需用 document.hidden 暂停 |
| 10 | 无模块懒加载 | P2 | Phase 3 | 动态 import() 按需加载 |
| 11 | 无 ARIA 标签 | P2 | Phase 3 | 可访问性基础 |
| 12 | 无 CONTRIBUTING / CHANGELOG | P3 | Phase 4 | 文档体系补全 |
| 13 | 无 Conventional Commits 规范 | P3 | Phase 4 | commitlint + commitizen |
| 14 | 无 E2E 测试 | P3 | Phase 5 | Playwright |
| 15 | 无 PWA 支持 | P3 | Phase 5 | manifest + Service Worker |
| 16 | 旧文件 build_standalone.cjs 未删除 | P3 | Phase 2 | 确认新脚本稳定后删除 |
| 17 | CSS 变量未提取到独立文件 | P3 | Phase 4 | variables.css |
| 18 | store.js 无 schema 校验 | P2 | Phase 2 | JSON.parse 后需校验结构 |

### 评分变化

| 维度 | Phase 1 前 | Phase 1 后 | 变化 |
|------|-----------|-----------|------|
| 项目结构与模块化 | 6 | 7 | +1（scripts 目录规范化） |
| 测试体系 | 0 | 7 | +7（6 测试文件，覆盖率 ≥ 80%） |
| 构建工具链 | 2 | 7 | +5（Vite 替代自研，消除硬编码） |
| 代码规范与静态检查 | 1 | 8 | +7（ESLint + Prettier + Husky） |
| 类型安全 | 0 | 0 | —（Phase 2 处理） |
| CI/CD 自动化 | 0 | 0 | —（Phase 3 处理） |
| 错误处理与健壮性 | 3 | 3 | —（Phase 2 处理） |
| 性能优化 | 4 | 4 | —（Phase 3 处理） |
| 安全防护 | 3 | 3 | —（Phase 3 处理） |
| 文档与工程规范 | 5 | 6 | +1（本日志 + 配置文件文档） |
| 业务逻辑质量 | 7 | 7 | —（保持） |
| **加权总分** | **30** | **50** | **+20** |

---

## Phase 2：架构升级（待执行）

- [ ] 拆分 main.js → core/router.js + core/hud.js + core/narrator.js + core/app.js
- [ ] 添加 JSDoc 类型注释 + types/index.d.ts
- [ ] 创建 core/errorBoundary.js
- [ ] 消除 window.LTApp 全局状态
- [ ] 添加 barrel exports（engines/modules/utils index.js）
- [ ] store.js 添加 schema 校验
- [ ] 删除旧 build_standalone.cjs

## Phase 3：质量保障（待执行）

- [ ] GitHub Actions CI/CD（ci.yml + deploy.yml）
- [ ] utils/sanitize.js XSS 防护
- [ ] 修复 report.js / starmapView.js innerHTML
- [ ] server.js 添加 CSP header
- [ ] 背景星网 document.hidden 暂停
- [ ] 模块懒加载
- [ ] ARIA 标签 + :focus-visible

## Phase 4：工程规范（待执行）

- [ ] README 重写（badges + 架构图）
- [ ] CONTRIBUTING.md
- [ ] CHANGELOG.md
- [ ] ARCHITECTURE.md
- [ ] .env.example + .editorconfig + .nvmrc
- [ ] commitlint + commitizen

## Phase 5：卓越打磨（待执行）

- [ ] Playwright E2E 测试
- [ ] PerformanceObserver 监控
- [ ] PWA manifest + Service Worker
- [ ] 测试覆盖率提升到 90%+
