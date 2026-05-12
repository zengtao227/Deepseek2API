package settings

import (
	"Deepseek2API/internal/chathistory"
	"Deepseek2API/internal/config"
	adminshared "Deepseek2API/internal/httpapi/admin/shared"
)

type Handler struct {
	Store       adminshared.ConfigStore
	Pool        adminshared.PoolController
	DS          adminshared.DeepSeekCaller
	OpenAI      adminshared.OpenAIChatCaller
	ChatHistory *chathistory.Store
}

var writeJSON = adminshared.WriteJSON
var intFrom = adminshared.IntFrom

func fieldString(m map[string]any, key string) string {
	return adminshared.FieldString(m, key)
}
func validateRuntimeSettings(runtime config.RuntimeConfig) error {
	return adminshared.ValidateRuntimeSettings(runtime)
}

func (h *Handler) computeSyncHash() string {
	return adminshared.ComputeSyncHash(h.Store)
}
