---
description: '发布自动化：创建 GitHub 仓库、推送 main、打 tag、发布 npm（支持 GitHub MCP + 本地 Git）'
---

# Publish - 仓库创建与发布自动化

用于把当前项目发布为一个新仓库，并完成 push / tag / npm 发布前检查。

## 使用方法

```bash
/publish [repo-name]
```

## 适用场景

- 当前目录已经是可发布项目
- 希望自动完成：创建远端仓库 + 绑定 origin + 推送 + 打标签
- 已配置 GitHub MCP（推荐）或可回退使用 `gh` CLI

---

## 前置检查

`[模式：检查]`

1. 校验当前目录是否为 Git 仓库
2. 校验工作区是否干净（若不干净，先提示用户确认是否继续）
3. 读取 `package.json` 中 `name` / `version`
4. 运行发布前检查：

```bash
npm run release:check
```

---

## 自动化流程

`[模式：发布]`

### 阶段 1：创建 GitHub 仓库

优先使用 GitHub MCP：

- 若会话中存在 `mcp__github__*` 工具：
  - 创建新仓库（默认私有，用户确认后可改 public）
  - 读取仓库 clone URL

若 GitHub MCP 不可用，则回退到 `gh` CLI：

```bash
gh repo create <owner>/<repo-name> --source=. --private --push=false
```

### 阶段 2：绑定并推送 main

```bash
git remote add origin <repo-url>
git push -u origin main
```

若已存在 `origin`：

- 比较现有 URL 与目标 URL
- 不一致时提示用户确认后执行：

```bash
git remote set-url origin <repo-url>
```

### 阶段 3：创建版本标签

```bash
VERSION=$(node -p "require('./package.json').version")
git tag "v$VERSION"
git push origin "v$VERSION"
```

### 阶段 4：npm 发布（可选）

在用户确认后执行：

```bash
npm run release:pack
npm publish --access public
```

---

## 交互参数（建议向用户确认）

- `repo-name`：仓库名（默认取 `package.json.name`）
- `owner`：组织或用户名
- `visibility`：`private` / `public`
- `publishToNpm`：是否立即发布 npm

---

## 输出格式

1. **发布计划**：owner/repo、可见性、将执行命令
2. **执行日志**：每一步成功/失败
3. **最终结果**：
   - GitHub 仓库 URL
   - 默认分支 URL
   - Release 标签
   - npm 包名与版本

---

## 关键规则

1. 任何会修改远端状态的操作都要先征求用户确认
2. 如果 `npm publish` 失败，不回滚 Git 推送，仅输出修复建议
3. 如遇权限错误，优先提示补全 Token scope / `gh auth login`
4. 优先 MCP，缺失时自动回退 `gh` CLI
