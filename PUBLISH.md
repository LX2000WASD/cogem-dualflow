# 发布指南（CoGem DualFlow）

本文档用于从本地仓库到 GitHub + npm 的一次完整发布。

## 1) 本地质量检查

```bash
npm run release:check
```

## 2) 初始化并提交（如尚未提交）

```bash
git add .
git commit -m "chore: bootstrap cogem-dualflow"
```

## 3) 创建并绑定 GitHub 仓库

先在 GitHub 创建空仓库：`cogem-dev/cogem-dualflow`（不要勾选 README 初始化）。

```bash
git remote add origin git@github.com:cogem-dev/cogem-dualflow.git
# 或 HTTPS
git remote add origin https://github.com/cogem-dev/cogem-dualflow.git

git push -u origin main
```

## 4) 发布 npm 包

```bash
npm login
npm run release:pack
npm publish --access public
```

## 5) 创建 GitHub Release

```bash
VERSION=$(node -p "require('./package.json').version")
git tag "v$VERSION"
git push origin "v$VERSION"
```

然后在 GitHub 页面创建对应 `vX.Y.Z` Release。

## 6) 用户安装验证

```bash
npx cogem-dualflow
# 或
npm i -g cogem-dualflow && cogem
```

## 备注

- 本项目向 `ccg-workflow` 致敬并基于其思路继续演进。
- 当前双模型职责：Codex（计划/后端）+ Gemini（前端）。
