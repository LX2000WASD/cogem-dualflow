# CoGem 最小发布清单（MVP）

> 目标：以最低风险发布一个可用、可验证、可回滚的 CoGem 版本。

## 1) 代码一致性

- [ ] 命令命名空间全部为 `/cogem:*`
- [ ] 无 Claude 依赖路径（仅迁移层允许 `~/.claude` 兼容识别）
- [ ] 配置接口主命名为 `CoGem*`（允许历史别名兼容）
- [ ] 初始化文档为 `AGENTS.md` 体系

快速检查：

```bash
rg -n "/ccg:|/cogem:(dev|code|think|bugfix)" templates src README.md docs
rg -n "CLAUDE\.md" templates src README.md docs
```

---

## 2) TypeScript 验证

- [ ] 依赖安装完成
- [ ] 类型检查通过
- [ ] 构建产物生成成功

命令：

```bash
npm install
npm run typecheck
npm run build
```

---

## 3) Go Wrapper 验证

- [ ] Go 单测通过（至少编译级通过）
- [ ] 多平台二进制命名未破坏

命令：

```bash
cd codeagent-wrapper
mkdir -p .gocache
GOCACHE=$(pwd)/.gocache go test ./...
```

如环境权限受限，可先做编译级验证：

```bash
GOCACHE=$(pwd)/.gocache go test ./... -run TestDoesNotExist
```

---

## 4) 关键体验走查

- [ ] `cogem --help` 输出命令与 README 一致
- [ ] `cogem init` 可生成 `~/.cogem` 目录结构
- [ ] 菜单中的帮助信息已改为 `AGENTS.md` 表述
- [ ] README 的安装/升级/卸载命令可直接执行

建议命令：

```bash
npx tsx src/cli.ts --help
npx tsx src/cli.ts init --force --skip-prompt --skip-mcp
```

---

## 5) 发布前元信息

- [ ] `package.json` 的 `name` / `bin` / `version` 正确
- [ ] `CHANGELOG.md` 补充本次关键改动
- [ ] 文档三件套同步：`README.md`、`AGENTS.md`、`docs/COGEM_BLUEPRINT.md`

---

## 6) 回滚预案

- [ ] 保留上一稳定版本 tag
- [ ] 发布失败时可回滚 npm 版本
- [ ] 用户侧可重新执行 `npx cogem-dualflow init --force`

