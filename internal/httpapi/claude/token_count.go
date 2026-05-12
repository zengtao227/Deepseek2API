package claude

import (
	"strings"

	"Deepseek2API/internal/promptcompat"
	"Deepseek2API/internal/util"
)

func countClaudeInputTokens(stdReq promptcompat.StandardRequest) int {
	promptText := stdReq.PromptTokenText
	if strings.TrimSpace(promptText) == "" {
		promptText = stdReq.FinalPrompt
	}
	return countClaudeInputTokensFromText(promptText, stdReq.ResolvedModel)
}

func countClaudeInputTokensFromText(promptText, model string) int {
	return util.CountPromptTokens(promptText, model)
}
