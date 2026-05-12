#!/bin/bash
#
# Deepseek2API 项目迁移脚本
# 
# 用法: ./scripts/relocate-project.sh
#
# 功能:
# - 将项目复制到目标目录
# - 保留 .git 历史
# - 排除构建产物和敏感文件
# - 验证构建成功

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 目标目录
TARGET_DIR="/Users/zengtao/Doc/My code/DS2api"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      📦 Deepseek2API 项目迁移                     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 获取当前目录
CURRENT_DIR=$(pwd)
echo "📂 当前目录: $CURRENT_DIR"
echo "📂 目标目录: $TARGET_DIR"
echo ""

# 确认操作
read -p "是否继续迁移? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 迁移已取消"
    exit 1
fi

# 创建目标目录（如果不存在）
echo "📁 创建目标目录..."
mkdir -p "$TARGET_DIR"

# 使用 rsync 复制文件
echo "📋 复制文件..."
rsync -av \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='*.log' \
  --exclude='Deepseek2API' \
  --exclude='Deepseek2API-tests' \
  --exclude='static/admin' \
  --exclude='webui/dist' \
  --exclude='.tmp' \
  --exclude='data/' \
  --exclude-from='.gitignore' \
  "$CURRENT_DIR/" \
  "$TARGET_DIR/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 文件复制成功${NC}"
else
    echo -e "${RED}❌ 文件复制失败${NC}"
    exit 1
fi

# 导航到目标目录
cd "$TARGET_DIR"

# 验证 .git 目录存在
echo ""
echo "🔍 验证 Git 历史..."
if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Git 历史已保留${NC}"
else
    echo -e "${RED}❌ Git 历史未找到${NC}"
    exit 1
fi

# 验证构建
echo ""
echo "🔨 验证构建..."
if go build ./cmd/Deepseek2API; then
    echo -e "${GREEN}✅ 构建成功${NC}"
    rm -f Deepseek2API  # 清理构建产物
else
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi

# 运行 lint
echo ""
echo "🔍 运行 lint 检查..."
if [ -f "./scripts/lint.sh" ]; then
    if ./scripts/lint.sh; then
        echo -e "${GREEN}✅ Lint 检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  Lint 检查有警告${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  未找到 lint 脚本${NC}"
fi

# 运行测试
echo ""
echo "🧪 运行单元测试..."
if [ -f "./tests/scripts/run-unit-all.sh" ]; then
    if ./tests/scripts/run-unit-all.sh; then
        echo -e "${GREEN}✅ 单元测试通过${NC}"
    else
        echo -e "${YELLOW}⚠️  单元测试有失败${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  未找到测试脚本${NC}"
fi

# 完成
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      ✅ 迁移完成                            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "新项目位置: $TARGET_DIR"
echo ""
echo "下一步:"
echo "  1. cd \"$TARGET_DIR\""
echo "  2. 验证功能: ./Deepseek2API"
echo "  3. 设置 GitHub 远程: git remote add origin https://github.com/zengtao227/DS2api.git"
echo ""
