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
cogem
```

### 方式 3：下载源码后本地安装

```bash
git clone https://github.com/cogem-dev/cogem-dualflow.git
cd cogem-dualflow
npm install
npm run build
npm link
cogem
```

### 方式 4：下载发布包（.tgz）后安装

```bash
npm install -g ./cogem-dualflow-<version>.tgz
cogem
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

支持代码检索 MCP（按需选择）：

- ContextWeaver（推荐）
- ace-tool / ace-tool-rs

```bash
npx cogem-dualflow
```

进入菜单后选择「配置 MCP」。

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
