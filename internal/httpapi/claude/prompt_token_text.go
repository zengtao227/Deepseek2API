package claude

import "Deepseek2API/internal/prompt"

func buildClaudePromptTokenText(messages []any, thinkingEnabled bool) string {
	return prompt.MessagesPrepareWithThinking(toMessageMaps(messages), thinkingEnabled)
}
