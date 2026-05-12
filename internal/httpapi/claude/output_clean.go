package claude

import textclean "Deepseek2API/internal/textclean"

func cleanVisibleOutput(text string, stripReferenceMarkers bool) string {
	if text == "" {
		return text
	}
	if stripReferenceMarkers {
		text = textclean.StripReferenceMarkers(text)
	}
	return text
}
