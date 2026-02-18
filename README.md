# CoGem DualFlow

<div align="center">

[![npm version](https://img.shields.io/npm/v/cogem-dualflow.svg)](https://www.npmjs.com/package/cogem-dualflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

</div>

CoGem DualFlow 是一个 **不依赖 Claude** 的多模型协作工作流：

- **Codex**：计划制定、后端实现、最终交付整合
- **Gemini**：前端 UI/UX、交互与可访问性优化

默认分工：**Codex 负责计划 + 后端，Gemini 负责前端**。

## 快速开始（可直接下载使用）

### 方式 1：直接运行（推荐）

```bash
npx cogem-dualflow
```

### 方式 2：全局安装

```bash
npm install -g cogem-dualflow
cogem --version
cogem-dualflow --version
```

如果提示 `cogem: not found`，请检查全局 bin 路径是否在 `PATH` 中：

```bash
npm config get prefix
npm bin -g
```


### 方式 3：下载源码后本地安装

```bash
git clone https://github.com/LX2000WASD/cogem-dualflow.git
cd cogem-dualflow
npm install
npm run build
npm link
cogem
```

### 方式 4：直接下载发布包（.tgz）后安装

```bash
# 方案 A：从 npm tarball 下载
curl -L https://registry.npmjs.org/cogem-dualflow/-/cogem-dualflow-<version>.tgz -o cogem-dualflow.tgz
npm install -g ./cogem-dualflow.tgz
cogem

# 方案 B：从 GitHub Releases 下载（替换为实际发布链接）
# curl -L https://github.com/LX2000WASD/cogem-dualflow/releases/download/v<version>/cogem-dualflow-<version>.tgz -o cogem-dualflow.tgz
```

## 环境要求

- Node.js 20+
- Codex CLI
- Gemini CLI（用于前端协作）

## 核心命令（Slash 模板）

| 命令 | 说明 |
|------|------|
| `/cogem:workflow` | 6 阶段完整工作流 |
| `/cogem:plan` | 多模型协作规划（Phase 1-2） |
| `/cogem:execute` | 多模型协作执行（Phase 3-5） |
| `/cogem:frontend` | 前端任务（Gemini） |
| `/cogem:backend` | 后端任务（Codex） |
| `/cogem:review` | 双模型代码审查 |
| `/cogem:publish` | 创建仓库 + 推送 + 发版自动化（优先 GitHub MCP） |
| `/cogem:init` | 初始化项目 `AGENTS.md` 上下文 |

## 目录结构

```text
~/.cogem/
├── commands/cogem/
├── agents/cogem/
├── bin/codeagent-wrapper
└── config/
    ├── config.toml
    └── prompts/{codex,gemini}/
```

## MCP 配置

支持代码检索 / 发布自动化 MCP（按需选择）：

- ContextWeaver（推荐）
- ace-tool / ace-tool-rs
- GitHub MCP（仓库 / Issue / PR 自动化）

```bash
npx cogem-dualflow
```

进入菜单后选择「配置 MCP」。

也支持非交互快速配置 GitHub MCP：

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=<your_token>
npx cogem-dualflow setup-github-mcp
```

## 更新与卸载

```bash
# 更新
npx cogem-dualflow@latest
npm install -g cogem-dualflow@latest

# 卸载
npm uninstall -g cogem-dualflow
```

## 发布（维护者）

```bash
# 1) 先完成质量检查
npm run release:check

# 2) 打包检查
npm run release:pack

# 3) 发布到 npm
npm publish --access public
```

GitHub 发布建议：

```bash
git tag v<version>
git push origin main --tags
```

## 致敬与灵感来源

本项目向原始多模型协作工作流项目 **ccg-workflow** 致敬。

我们在其思路基础上做了“去 Claude 化”二次演进，聚焦于：

- 更清晰的双模型职责边界（Codex 后端 / Gemini 前端）
- 更低使用门槛（直接下载即用）
- 更稳定的发布与验证流程

## 相关文档

- 项目规范：`AGENTS.md`
- 设计蓝图：`docs/COGEM_BLUEPRINT.md`
- 发布清单：`docs/COGEM_RELEASE_CHECKLIST.md`

## 许可

MIT

## 常见问题（GUI 与命令入口）

### 1) 我们有独立 GUI 客户端吗？

没有独立桌面 GUI（例如 Electron/Tauri 应用）。
你看到的是 **终端内交互菜单（TUI）**，由 CLI 在命令行中渲染。

### 2) 为什么第一次能看到界面，之后输入 `cogem` 却提示 not found？

通常是因为你用的是：

```bash
npx cogem-dualflow
```

`npx` 是“一次性运行”，不会默认把 `cogem` 安装为全局命令。

要长期使用 `cogem`，请执行：

```bash
npm install -g cogem-dualflow
cogem --help
```

### 3) `cogem` 与 `/cogem:*` 是什么关系？

- `cogem` / `cogem-dualflow`：终端命令（Shell CLI）
- `/cogem:plan`、`/cogem:execute` 等：安装到 `~/.cogem/commands/cogem/` 的协作模板文件，不是 shell 命令
- 默认情况下 Codex CLI 不会自动注册这些模板；可运行 `npx cogem-dualflow setup-codex` 安装 bridge skill，再用 `npx cogem-dualflow codex` 启动一体化环境

### 4) 已全局安装但仍提示 `cogem: not found` 怎么办？

```bash
npm config get prefix
npm bin -g
```

确保全局 bin 目录在 `PATH` 中；然后重开终端再试：

```bash
cogem --version
cogem-dualflow --version
```

## Codex 适配与一体化入口

如果你希望在 Codex 里也能用 `/cogem:*` 触发语义（而不是手动找模板），请先安装适配层：

```bash
npx cogem-dualflow setup-codex
```

然后通过 CoGem Workbench 启动 Codex（会自动使用统一目录 `~/.cogem/codex-home`，并加载 bridge skill）：

```bash
npx cogem-dualflow codex
# 或全局安装后
cogem codex
```

这样可以把会话记录/缓存/技能等集中到 CoGem 目录，减少双目录来回排查。
