package configmgmt

import (
	"net/http"
	"strings"

	"ds2api/internal/config"
)

func (h *Handler) getConfig(w http.ResponseWriter, _ *http.Request) {
	snap := h.Store.Snapshot()
	safe := map[string]any{
		"keys":                  snap.Keys,
		"api_keys":              snap.APIKeys,
		"accounts":              []map[string]any{},
		"proxies":               []map[string]any{},
		"env_backed":            h.Store.IsEnvBacked(),
		"env_source_present":    h.Store.HasEnvConfigSource(),
		"env_writeback_enabled": h.Store.IsEnvWritebackEnabled(),
		"config_path":           h.Store.ConfigPath(),
		"model_aliases":         snap.ModelAliases,
		"vercel": map[string]any{
			"has_token":     strings.TrimSpace(snap.Vercel.Token) != "",
			"token_preview": maskSecretPreview(snap.Vercel.Token),
			"project_id":    snap.Vercel.ProjectID,
			"team_id":       snap.Vercel.TeamID,
		},
	}
	accounts := make([]map[string]any, 0, len(snap.Accounts))
	for _, acc := range snap.Accounts {
		token := strings.TrimSpace(acc.Token)
		accounts = append(accounts, map[string]any{
			"identifier":    acc.Identifier(),
			"name":          acc.Name,
			"remark":        acc.Remark,
			"email":         acc.Email,
			"mobile":        acc.Mobile,
			"proxy_id":      acc.ProxyID,
			"has_password":  strings.TrimSpace(acc.Password) != "",
			"has_token":     token != "",
			"token_preview": maskSecretPreview(token),
		})
	}
	safe["accounts"] = accounts
	proxies := make([]map[string]any, 0, len(snap.Proxies))
	for _, proxy := range snap.Proxies {
		proxy = config.NormalizeProxy(proxy)
		proxies = append(proxies, map[string]any{
			"id":           proxy.ID,
			"name":         proxy.Name,
			"type":         proxy.Type,
			"host":         proxy.Host,
			"port":         proxy.Port,
			"username":     proxy.Username,
			"has_password": strings.TrimSpace(proxy.Password) != "",
		})
	}
	safe["proxies"] = proxies
	writeJSON(w, http.StatusOK, safe)
}

func (h *Handler) exportConfig(w http.ResponseWriter, _ *http.Request) {
	h.configExport(w, nil)
}

func (h *Handler) configExport(w http.ResponseWriter, _ *http.Request) {
	snap := h.Store.Snapshot()
	jsonStr, b64, err := h.Store.ExportJSONAndBase64()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"config":  snap,
		"json":    jsonStr,
		"base64":  b64,
	})
}
