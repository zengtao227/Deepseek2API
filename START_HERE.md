# 开始提取 Token

## ⚠️ 重要：先进入项目目录

```bash
cd /Users/zengtao/ds2api
```

## 第一次设置（只需一次）

```bash
# 1. 进入项目目录
cd /Users/zengtao/ds2api

# 2. 确保脚本有执行权限
chmod +x scripts/extract-token-simple.sh
chmod +x scripts/submit-token.sh

# 3. 检查脚本是否存在
ls -la scripts/extract-token-simple.sh
```

## 提取 Token（每个账户）

### 完整命令（复制粘贴）

```bash
# 进入项目目录
cd /Users/zengtao/ds2api

# 账户 1
./scripts/extract-token-simple.sh zengtao227@gmail.com

# 账户 2（先在浏览器中切换账户）
./scripts/extract-token-simple.sh zengtao227.de@gmail.com

# 账户 3
./scripts/extract-token-simple.sh zengtao227.ch@gmail.com

# 账户 4
./scripts/extract-token-simple.sh zengtao227.us@gmail.com

# 账户 5
./scripts/extract-token-simple.sh zengtao227.sg@gmail.com

# 账户 6
./scripts/extract-token-simple.sh zengqhxf@gmail.com

# 账户 7
./scripts/extract-token-simple.sh liyue828@gmail.com

# 账户 8
./scripts/extract-token-simple.sh liyue828.de@gmail.com

# 账户 9
./scripts/extract-token-simple.sh mia.rhzeng@gmail.com

# 账户 10
./scripts/extract-token-simple.sh 9pgyxsfby5@privaterelay.appleid.com

# 账户 11
./scripts/extract-token-simple.sh yqrt7tjg85@privaterelay.appleid.com

# 账户 12
./scripts/extract-token-simple.sh xhg4h79pph@privaterelay.appleid.com

# 账户 13
./scripts/extract-token-simple.sh n6vst2bmsc@privaterelay.appleid.com
```

## 工作流程

对于每个账户：

1. **在 Comet 浏览器中**：
   - 访问 https://chat.deepseek.com
   - 登录该账户

2. **在终端中**：
   - 运行：`./scripts/extract-token-simple.sh 邮箱地址`

3. **重复**：
   - 在浏览器中退出登录
   - 登录下一个账户
   - 运行下一个命令

## 如果脚本不工作

使用手动方式：

1. 在 Comet 浏览器中登录 DeepSeek
2. 按 `F12` 打开开发者工具
3. 切换到 Console 标签
4. 运行：`localStorage.getItem('token')`
5. 复制 token
6. 运行：`./scripts/submit-token.sh "邮箱" "token"`

## 检查结果

```bash
# 查看 config.json 中的账户
cat config.json | grep -A 3 "accounts"

# 或者用 jq（如果安装了）
cat config.json | jq '.accounts[] | {email, token: .token[:20]}'
```

## 完成后

```bash
# 重启 DS2API 以加载新 token
pkill ds2api
./ds2api
```

## 需要帮助？

- 快速指南：[QUICK_TOKEN_GUIDE.md](QUICK_TOKEN_GUIDE.md)
- 手动指南：[MANUAL_TOKEN_EXTRACTION.md](MANUAL_TOKEN_EXTRACTION.md)
- 主文档：[README.MD](README.MD)
