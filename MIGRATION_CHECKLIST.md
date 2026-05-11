# Comet Browser Migration Checklist

本清单用于验证 DS2API 项目从 Google Chrome 迁移到 Comet 浏览器的完整性，并确保安全地创建 GitHub 仓库。

## 前置准备

- [ ] 备份当前项目目录
- [ ] 验证 DS2API 服务正在运行
- [ ] 在默认位置安装 Comet 浏览器或设置 COMET_BROWSER_PATH
- [ ] 记录当前 token 捕获工作流程以便对比

## 浏览器配置

- [ ] 验证 Comet 浏览器已安装: `ls -la /Applications/Comet.app/Contents/MacOS/Comet`
- [ ] 如使用自定义位置，设置 COMET_BROWSER_PATH: `export COMET_BROWSER_PATH=/path/to/Comet`
- [ ] 运行验证: `node scripts/capture-tokens-interactive.mjs --validate`
- [ ] 验证通过并显示 ✅ 配置验证通过

## 安全基础设施

- [ ] 验证 .gitignore 包含 config.json: `grep "config.json" .gitignore`
- [ ] 验证 .gitignore 包含 .env: `grep "^\.env$" .gitignore`
- [ ] 验证 .gitignore 包含 token 模式: `grep "token-" .gitignore`
- [ ] 验证 config.example.json 无真实凭证: `grep -i "password" config.example.json`
- [ ] 验证 .env.example 有占位符值: `grep "REPLACE" .env.example`
- [ ] 运行 git status: `git status` (应该不显示敏感文件)

## Token 捕获功能

- [ ] 运行 token 捕获: `node scripts/capture-tokens-interactive.mjs`
- [ ] 验证 Comet 浏览器启动
- [ ] 为每个账户点击登录按钮
- [ ] 验证 token 已捕获: 检查控制台输出的 ✅ 消息
- [ ] 验证 token 已提交: 检查 DS2API 日志
- [ ] 验证结果文件已创建: `ls ~/ds2api/token-capture-results.json`

## 项目迁移

- [ ] 执行迁移: `rsync -av --exclude-from=.gitignore . /Users/zengtao/Doc/My\ code/DS2api/`
- [ ] 导航到新位置: `cd /Users/zengtao/Doc/My\ code/DS2api`
- [ ] 验证 .git 保留: `ls -la .git`
- [ ] 验证构建成功: `go build ./cmd/ds2api`
- [ ] 验证 lint 通过: `./scripts/lint.sh`
- [ ] 验证测试通过: `./tests/scripts/run-unit-all.sh`

## GitHub 仓库设置

- [ ] 创建 GitHub 仓库: https://github.com/zengtao227/DS2api
- [ ] 配置远程: `git remote add origin https://github.com/zengtao227/DS2api.git`
- [ ] 验证无敏感文件暂存: `git diff --cached --name-only`
- [ ] 验证 config.example.json 已暂存: `git diff --cached --name-only | grep config.example.json`
- [ ] 验证 .env.example 已暂存: `git diff --cached --name-only | grep .env.example`
- [ ] 提交: `git commit -m "Initial commit: DS2API with Comet Browser support"`
- [ ] 推送: `git push -u origin main`
- [ ] 验证远程仓库: 访问 GitHub 并检查无敏感文件

## DS2API 功能验证

- [ ] 启动 DS2API: `./ds2api`
- [ ] 验证服务启动: `curl http://localhost:5001/healthz`
- [ ] 测试 OpenAI 端点: `curl http://localhost:5001/v1/models`
- [ ] 使用捕获的 token 测试聊天完成
- [ ] 验证所有现有单元测试通过: `./tests/scripts/run-unit-all.sh`
- [ ] 验证 linting 通过: `./scripts/lint.sh`

## 迁移后

- [ ] 使用 Comet 浏览器说明更新 README
- [ ] 记录 COMET_BROWSER_PATH 配置
- [ ] 归档旧项目目录
- [ ] 更新本地开发环境以使用新位置
- [ ] 通知团队成员新仓库位置

## 故障排除

### Comet 浏览器未找到

```bash
# 检查 Comet 是否已安装
ls -la /Applications/Comet.app/Contents/MacOS/Comet

# 如果在其他位置，设置环境变量
export COMET_BROWSER_PATH=/path/to/your/Comet
```

### DS2API 端点不可达

```bash
# 检查 DS2API 是否正在运行
curl http://localhost:5001/healthz

# 如果未运行，启动服务
./ds2api
```

### Git 显示敏感文件

```bash
# 检查 .gitignore 是否正确
cat .gitignore | grep -E "config.json|\.env|token"

# 如果文件已暂存，取消暂存
git reset HEAD config.json
git reset HEAD .env
```

### 构建失败

```bash
# 确保在正确的目录
pwd

# 检查 Go 版本
go version  # 应该是 1.26+

# 清理并重新构建
rm -f ds2api
go build ./cmd/ds2api
```

## 完成

✅ 所有检查项完成后，迁移成功！

你现在可以：
- 使用 Comet 浏览器进行 token 捕获
- 在新位置 `/Users/zengtao/Doc/My code/DS2api` 开发
- 安全地推送代码到 GitHub，无需担心凭证泄露
