#!/bin/bash
#
# Deepseek2API GitHub 仓库设置脚本
#
# 用法: ./scripts/setup-github.sh
#
# 功能:
# - 验证无敏感文件被暂存
# - 配置 GitHub 远程
# - 创建安全的初始提交
# - 推送到 GitHub

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# GitHub 仓库信息
GITHUB_USER="zengtao227"
REPO_NAME="Deepseek2API"
REPO_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      🚀 GitHub 仓库设置                     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 检查是否在 Git 仓库中
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ 错误: 当前目录不是 Git 仓库${NC}"
    echo "请先运行: git init"
    exit 1
fi

# 敏感文件模式
SENSITIVE_PATTERNS=(
    "config.json"
    ".env"
    ".env.local"
    "*token*.json"
    "*credentials*.json"
    "*secrets*.json"
    "*.key"
    "*.pem"
)

# 检查暂存的文件
echo "🔍 检查暂存文件..."
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")

if [ -z "$STAGED_FILES" ]; then
    echo -e "${YELLOW}⚠️  没有暂存的文件${NC}"
    echo ""
    echo "建议暂存以下文件:"
    echo "  git add .gitignore"
    echo "  git add config.example.json"
    echo "  git add .env.example"
    echo "  git add README.MD"
    echo "  git add scripts/"
    echo "  git add cmd/"
    echo "  git add internal/"
    echo "  git add ..."
    echo ""
    read -p "是否自动暂存所有文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        STAGED_FILES=$(git diff --cached --name-only)
    else
        echo "❌ 已取消"
        exit 1
    fi
fi

# 验证敏感文件
echo ""
echo "🔒 验证敏感文件..."
HAS_SENSITIVE=false

for file in $STAGED_FILES; do
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if [[ "$file" == $pattern ]]; then
            echo -e "${RED}❌ 错误: 敏感文件已暂存: $file${NC}"
            echo "   此文件不应提交到版本控制"
            echo ""
            echo "修复方法:"
            echo "  git reset HEAD $file"
            echo "  确保 $file 在 .gitignore 中"
            HAS_SENSITIVE=true
        fi
    done
done

if [ "$HAS_SENSITIVE" = true ]; then
    exit 1
fi

echo -e "${GREEN}✅ 无敏感文件${NC}"

# 验证示例文件已包含
echo ""
echo "📋 验证示例文件..."
if echo "$STAGED_FILES" | grep -q "config.example.json"; then
    echo -e "${GREEN}✅ config.example.json 已暂存${NC}"
else
    echo -e "${YELLOW}⚠️  config.example.json 未暂存${NC}"
fi

if echo "$STAGED_FILES" | grep -q ".env.example"; then
    echo -e "${GREEN}✅ .env.example 已暂存${NC}"
else
    echo -e "${YELLOW}⚠️  .env.example 未暂存${NC}"
fi

# 检查远程是否已配置
echo ""
echo "🔗 检查 Git 远程..."
if git remote | grep -q "origin"; then
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "当前远程: $CURRENT_REMOTE"
    
    if [ "$CURRENT_REMOTE" != "$REPO_URL" ]; then
        echo -e "${YELLOW}⚠️  远程 URL 不匹配${NC}"
        read -p "是否更新远程 URL? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git remote set-url origin "$REPO_URL"
            echo -e "${GREEN}✅ 远程 URL 已更新${NC}"
        fi
    else
        echo -e "${GREEN}✅ 远程已配置${NC}"
    fi
else
    echo "配置远程: $REPO_URL"
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✅ 远程已添加${NC}"
fi

# 创建提交
echo ""
echo "📝 创建提交..."
read -p "是否创建初始提交? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "Initial commit: Deepseek2API with Comet Browser support

- Migrate from Google Chrome to Comet Browser for token capture
- Add comprehensive .gitignore for sensitive data protection
- Add configuration validation mode (--validate flag)
- Include example configuration files
- Add migration checklist and documentation"
    
    echo -e "${GREEN}✅ 提交已创建${NC}"
else
    echo "❌ 提交已取消"
    exit 1
fi

# 推送到 GitHub
echo ""
echo "🚀 推送到 GitHub..."
echo "仓库: $REPO_URL"
echo ""
read -p "是否推送到 GitHub? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 检查当前分支
    CURRENT_BRANCH=$(git branch --show-current)
    echo "当前分支: $CURRENT_BRANCH"
    
    # 推送
    if git push -u origin "$CURRENT_BRANCH"; then
        echo -e "${GREEN}✅ 推送成功${NC}"
    else
        echo -e "${RED}❌ 推送失败${NC}"
        echo ""
        echo "可能的原因:"
        echo "  1. GitHub 仓库不存在 - 请先在 GitHub 上创建仓库"
        echo "  2. 认证失败 - 请检查 Git 凭证"
        echo "  3. 网络问题 - 请检查网络连接"
        exit 1
    fi
else
    echo "❌ 推送已取消"
    exit 1
fi

# 完成
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      ✅ GitHub 设置完成                     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "仓库地址: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "下一步:"
echo "  1. 访问 GitHub 验证无敏感文件"
echo "  2. 设置仓库描述和主题"
echo "  3. 配置分支保护规则（可选）"
echo ""
