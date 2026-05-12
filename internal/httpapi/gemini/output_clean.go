package gemini

import textclean "Deepseek2API/internal/textclean"

//nolint:unused // retained for native Gemini output post-processing path.
func cleanVisibleOutput(text string, stripReferenceMarkers bool) string {
	if text == "" {
		return text
	}
	if stripReferenceMarkers {
		text = textclean.StripReferenceMarkers(text)
	}
	return text
}
