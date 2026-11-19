# Deepseek2API Context

## 项目定位

这是一个将 DeepSeek Web 对话能力转换为 OpenAI、Claude、Gemini 等兼容 API 的服务端项目。核心后端使用 Go，WebUI 管理台位于 `webui/`。

README 中仍保留上游 `CJackHwang/Deepseek2API` 信息，本地 origin 是 `zengtao227/Deepseek2API`，因此处理时要把它当作有上游来源的个人 fork 或派生项目。

## 关键结构

- `cmd/`: Go 程序入口。
- `internal/`: 核心服务、协议适配和共享业务逻辑。
- `api/`: API 相关定义。
- `webui/`: React 管理台。
- `docs/`: 架构、部署、测试和兼容性文档。
- `scripts/`: 辅助脚本。
- `AGENTS.md`: 本仓库强制开发规则。
- `go.mod`: Go 依赖声明。

## 工作规则

- 修改前先读 `AGENTS.md`，协议适配层必须保持共享业务逻辑与协议渲染边界清晰。
- OpenAI Chat、Responses、Claude、Gemini 等接口差异应在 adapter/rendering 边界处理，不要复制共享业务逻辑。
- 这是兼容 API 网关项目，行为变更通常需要同步文档。
- 因为它是上游派生项目，改动时尽量保持上游兼容，避免无关格式化或大范围重排。

## 常用验证

```bash
./scripts/lint.sh
./tests/scripts/check-refactor-line-gate.sh
./tests/scripts/run-unit-all.sh
npm run build --prefix webui
```

## 验证要求

- Go 修改后运行 `gofmt -w` 于改动文件，并跑相关单元测试。
- WebUI 修改后运行 `npm run build --prefix webui`。
- 协议、消息归一化、工具调用、文件引用、空输出重试等行为修改后，同步 `docs/prompt-compatibility.md` 或对应文档。
