package claude

import "ds2api/internal/prompt"

func buildClaudePromptTokenText(messages []any, thinkingEnabled bool) string {
	return prompt.MessagesPrepareWithThinking(toMessageMaps(messages), thinkingEnabled)
}
