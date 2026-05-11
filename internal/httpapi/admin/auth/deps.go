package auth

import (
	"ds2api/internal/chathistory"
	adminshared "ds2api/internal/httpapi/admin/shared"
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
var maskSecretPreview = adminshared.MaskSecretPreview

func nilIfEmpty(s string) any { return adminshared.NilIfEmpty(s) }
