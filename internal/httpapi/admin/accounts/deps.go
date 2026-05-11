package accounts

import (
	"net/http"

	"ds2api/internal/chathistory"
	"ds2api/internal/config"
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

func reverseAccounts(a []config.Account) { adminshared.ReverseAccounts(a) }
func intFromQuery(r *http.Request, key string, d int) int {
	return adminshared.IntFromQuery(r, key, d)
}
func maskSecretPreview(secret string) string {
	return adminshared.MaskSecretPreview(secret)
}
func toAccount(m map[string]any) config.Account {
	return adminshared.ToAccount(m)
}
func fieldStringOptional(m map[string]any, key string) (string, bool) {
	return adminshared.FieldStringOptional(m, key)
}
func accountMatchesIdentifier(acc config.Account, identifier string) bool {
	return adminshared.AccountMatchesIdentifier(acc, identifier)
}
func findProxyByID(c config.Config, proxyID string) (config.Proxy, bool) {
	return adminshared.FindProxyByID(c, proxyID)
}
func findAccountByIdentifier(store adminshared.ConfigStore, identifier string) (config.Account, bool) {
	return adminshared.FindAccountByIdentifier(store, identifier)
}
func newRequestError(detail string) error { return adminshared.NewRequestError(detail) }
func requestErrorDetail(err error) (string, bool) {
	return adminshared.RequestErrorDetail(err)
}
