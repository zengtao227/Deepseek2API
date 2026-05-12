package configmgmt

import (
	"testing"

	"Deepseek2API/internal/account"
	"Deepseek2API/internal/config"
)

func newAdminTestHandler(t *testing.T, raw string) *Handler {
	t.Helper()
	t.Setenv("Deepseek2API_CONFIG_JSON", raw)
	store := config.LoadStore()
	return &Handler{
		Store: store,
		Pool:  account.NewPool(store),
	}
}
