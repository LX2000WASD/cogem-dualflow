# AGENTS (CoGem Multi-Model Collaboration System)

> 本文件是项目级 AI 协作说明主入口，替代历史 `CLAUDE.md`。

**Last Updated**: 2026-02-18

---

## 项目定位

CoGem 是一个 **不依赖 Claude** 的多模型协作工作流：

- **Codex**：计划制定、后端实现、集成重构、最终交付把关
- **Gemini**：前端 UI/UX、交互体验、可访问性建议

默认协作边界：

- 前端主权：Gemini
- 后端主权：Codex
- 编排与落地主权：Codex（本地写入与最终合并）

---

## 快速入口

### 用户命令

```bash
npx cogem-dualflow
```

### 核心路径

- CLI 入口：`bin/cogem.mjs` → `src/cli.ts`
- 命令注册：`src/cli-setup.ts`
- 初始化：`src/commands/init.ts`
- 更新：`src/commands/update.ts`
- 安装器：`src/utils/installer.ts`
- 工作流配置：`src/utils/config.ts`

---

## 模型分工（固定策略）

### Codex（计划 + 后端 + 最终交付）

- 计划拆解与执行路线设计
- 服务端逻辑、接口、数据模型实现
- 跨模块重构与风险收敛
- 汇总 Gemini 前端建议并统一落地

### Gemini（前端专项）

- 组件结构与交互细节建议
- 响应式/可访问性/设计一致性建议
- 前端性能与可维护性审查

### 安全边界

- 外部模型仅提供建议与 patch 文本
- 真正文件写入由本地执行器完成
- 最终交付由 Codex 编排器统一审定

---

## 命令分层（推荐最小闭环）

最小可用闭环（80% 场景）：

1. `/cogem:plan`：约束澄清 + 计划输出
2. `/cogem:execute`：按计划实施（Codex 主导，Gemini 前端协同）
3. `/cogem:review`：双模型交叉审查

常用专项：

- `/cogem:backend`
- `/cogem:frontend`
- `/cogem:workflow`

项目上下文：

- `/cogem:init`：初始化项目 `AGENTS.md` 体系（根级 + 模块级）

---

## 目录约定

用户侧安装目录：

```text
~/.cogem/
├── commands/cogem/
├── agents/cogem/
├── bin/codeagent-wrapper
└── config/
    ├── config.toml
    └── prompts/{codex,gemini}/
```

兼容迁移：

- 仍支持从 `~/.ccg` 与 `~/.claude/.ccg` 自动迁移到 `~/.cogem/config`

---

## 关键设计原则

1. **职责清晰**：计划/执行/审查三段式
2. **最小闭环优先**：先稳定 `plan → execute → review`
3. **配置统一命名**：`CoGemWorkflowConfig` 为主，保留历史别名兼容
4. **历史兼容保留**：旧路径识别仅留在迁移层，不污染主路径
5. **文档先行**：对外流程与内部实现同步维护

---

## 发布前最小验收

详见：`docs/COGEM_RELEASE_CHECKLIST.md`

最小命令集：

```bash
npm run typecheck
npm run build
(cd codeagent-wrapper && GOCACHE=$(pwd)/.gocache go test ./...)
```

---

## 维护说明

- `CLAUDE.md` 已降级为兼容跳转文件
- 新增/修改协作规范时，优先更新本文件和 `docs/COGEM_BLUEPRINT.md`
- 若命令或模板行为调整，需同步更新：
  - `README.md`
  - `templates/commands/*.md`
  - `templates/prompts/{codex,gemini}/*.md`

