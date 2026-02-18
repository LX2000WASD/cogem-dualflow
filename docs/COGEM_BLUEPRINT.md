# CoGem 蓝图（Codex + Gemini，无 Claude 依赖）

## 1. 目标与定位

CoGem 是一个仅依赖 **Codex + Gemini** 的多模型协作工作流：

- **Codex**：计划制定、后端实现、重构与交付把关
- **Gemini**：前端 UI/UX、交互细节与可用性优化
- **去 Claude 化**：安装路径、命令命名、模板路由、提示词体系均不再依赖 Claude

---

## 2. 核心分工模型

### 2.1 固定路由（默认）

- 前端：`gemini`（primary）
- 后端：`codex`（primary）
- 评审：`codex + gemini` 并行交叉

### 2.2 角色职责

- **Codex 协调器（主控）**
  - 读取上下文 → 生成计划 → 拆分任务
  - 实施后端与跨层重构
  - 汇总 Gemini 前端建议并做最终交付整合

- **Gemini 前端专家**
  - 组件拆分、视觉一致性、交互流畅性
  - 可访问性与前端性能建议
  - 前端代码评审与风险提示

---

## 3. 工作流建议（推荐最小闭环）

1. `/cogem:plan`：双模型并行分析并产出零决策计划
2. `/cogem:execute`：按计划执行（Codex 主导实施 + Gemini 前端建议）
3. `/cogem:review`：双模型交叉审查，收敛 Critical 问题

该闭环可覆盖 80% 实际迭代场景，先确保稳定，再叠加 team/spec 等高级命令。

---

## 4. 已落地的去 Claude 化改造（本轮）

- 项目命名与入口：`cogem-dualflow` / `cogem`
- 安装路径：`~/.cogem`（替代 `~/.claude` / `~/.ccg`）
- 命令命名空间：`/cogem:*`
- 项目上下文初始化：输出 `AGENTS.md`（替代 `CLAUDE.md`）
- 提示词安装：仅保留 `codex` 与 `gemini`
- 模型类型：移除 `claude`
- 菜单逻辑：移除 Claude API 配置与 Claude 安装逻辑
- MCP 配置接口：统一为 CoGem 命名（`CoGemConfig` 等）
- 工作流配置接口：统一为 CoGem 命名（`CoGemWorkflowConfig`，保留 `CcgConfig` 别名兼容）
- 模板路径：`.cogem/*`（替代 `.claude/*`）
- 团队/规范模板文案：去除 Claude 角色与依赖描述
- 项目规范文档：`AGENTS.md` 为主，`CLAUDE.md` 仅保留兼容跳转

> 兼容性保留：迁移逻辑仍支持从历史目录 `~/.ccg` 与 `~/.claude/.ccg` 自动迁移。

---

## 5. 原项目痛点与优化方向

1. **职责边界不清**：规划/执行/审查耦合
   - 优化：明确“计划—执行—审查”三段式，强约束输出格式

2. **模板路径历史包袱重**：`.claude`、`ccg` 混杂
   - 优化：统一到 `.cogem`，仅迁移层保留旧路径识别

3. **默认流程过重**：一次安装命令过多，学习成本高
   - 优化：推荐最小闭环命令集，进阶命令按需启用

4. **运行时配置命名混乱**：MCP/CLI 文案历史遗留
   - 优化：统一 CoGem 术语与命名，减少误解

5. **并行机制依赖特定生态**：部分 team 指令强耦合旧机制
   - 优化：逐步抽象为通用“任务队列 + 后台执行 + 汇总”语义

---

## 6. 下一阶段建议（优先级）

### P0（立刻）

- 完成 TypeScript 构建与类型检查闭环
- 统一 CLI/README/模板中的术语与示例
- 增加“最小闭环”快速上手文档

### P1（近期）

- 增加 `cogem doctor`：环境与依赖自检
- 增加 `cogem route explain`：显示任务路由决策原因
- 为 plan/execute/review 提供结构化输出（JSON + Markdown）

### P2（中期）

- 将 team/spec 命令重构为与特定宿主解耦的执行后端
- 引入任务缓存、上下文摘要与失败重试机制
