package translatorcliproxy

import (
	"bytes"
	"context"
	"encoding/json"
	"strings"

	sdktranslator "github.com/router-for-me/CLIProxyAPI/v6/sdk/translator"
	_ "github.com/router-for-me/CLIProxyAPI/v6/sdk/translator/builtin"
)

func ToOpenAI(from sdktranslator.Format, model string, raw []byte, stream bool) []byte {
	return sdktranslator.TranslateRequest(from, sdktranslator.FormatOpenAI, model, raw, stream)
}

func FromOpenAINonStream(to sdktranslator.Format, model string, originalReq, translatedReq, raw []byte) []byte {
	var param any
	converted := sdktranslator.TranslateNonStream(context.Background(), sdktranslator.FormatOpenAI, to, model, originalReq, translatedReq, raw, &param)
	usage, ok := extractOpenAIUsageFromJSON(raw)
	if !ok {
		return converted
	}
	return injectNonStreamUsageMetadata(converted, to, usage)
}

func FromOpenAIStream(to sdktranslator.Format, model string, originalReq, translatedReq, streamBody []byte) []byte {
	var out bytes.Buffer
	var param any
	for _, line := range bytes.Split(streamBody, []byte("\n")) {
		trimmed := strings.TrimSpace(string(line))
		if trimmed == "" {
			continue
		}
		payload := append([]byte(nil), line...)
		if !bytes.HasPrefix(payload, []byte("data:")) {
			continue
		}
		chunks := sdktranslator.TranslateStream(context.Background(), sdktranslator.FormatOpenAI, to, model, originalReq, translatedReq, payload, &param)
		for i := range chunks {
			out.Write(chunks[i])
			if !bytes.HasSuffix(chunks[i], []byte("\n")) {
				out.WriteByte('\n')
			}
		}
	}
	return out.Bytes()
}

func ParseFormat(name string) sdktranslator.Format {
	switch strings.ToLower(strings.TrimSpace(name)) {
	case "openai", "openai-chat", "chat", "chat-completions":
		return sdktranslator.FormatOpenAI
	case "openai-response", "responses", "openai-responses":
		return sdktranslator.FormatOpenAIResponse
	case "claude", "anthropic":
		return sdktranslator.FormatClaude
	case "gemini", "google":
		return sdktranslator.FormatGemini
	case "gemini-cli", "geminicli":
		return sdktranslator.FormatGeminiCLI
	case "codex", "openai-codex":
		return sdktranslator.FormatCodex
	case "antigravity":
		return sdktranslator.FormatAntigravity
	default:
		return sdktranslator.FromString(name)
	}
}

func ToOpenAIByName(formatName, model string, raw []byte, stream bool) []byte {
	return ToOpenAI(ParseFormat(formatName), model, raw, stream)
}

func extractOpenAIUsageFromJSON(raw []byte) (openAIUsage, bool) {
	payload := map[string]any{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return openAIUsage{}, false
	}
	usageObj, _ := payload["usage"].(map[string]any)
	if usageObj == nil {
		return openAIUsage{}, false
	}
	p := toInt(usageObj["prompt_tokens"])
	c := toInt(usageObj["completion_tokens"])
	t := toInt(usageObj["total_tokens"])
	if p <= 0 {
		p = toInt(usageObj["input_tokens"])
	}
	if c <= 0 {
		c = toInt(usageObj["output_tokens"])
	}
	if t <= 0 {
		t = p + c
	}
	if p <= 0 && c <= 0 && t <= 0 {
		return openAIUsage{}, false
	}
	return openAIUsage{PromptTokens: p, CompletionTokens: c, TotalTokens: t}, true
}

func injectNonStreamUsageMetadata(converted []byte, target sdktranslator.Format, usage openAIUsage) []byte {
	obj := map[string]any{}
	if err := json.Unmarshal(converted, &obj); err != nil {
		return converted
	}
	switch target {
	case sdktranslator.FormatClaude:
		obj["usage"] = map[string]any{
			"input_tokens":  usage.PromptTokens,
			"output_tokens": usage.CompletionTokens,
		}
	case sdktranslator.FormatGemini:
		obj["usageMetadata"] = map[string]any{
			"promptTokenCount":     usage.PromptTokens,
			"candidatesTokenCount": usage.CompletionTokens,
			"totalTokenCount":      usage.TotalTokens,
		}
	default:
		return converted
	}
	out, err := json.Marshal(obj)
	if err != nil {
		return converted
	}
	return out
}
