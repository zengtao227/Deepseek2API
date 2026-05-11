package claude

import (
	"ds2api/internal/claudeconv"
)

const defaultClaudeModel = "claude-sonnet-4-6"

func convertClaudeToDeepSeek(claudeReq map[string]any, store ConfigReader) map[string]any {
	return claudeconv.ConvertClaudeToDeepSeek(claudeReq, store, defaultClaudeModel)
}
