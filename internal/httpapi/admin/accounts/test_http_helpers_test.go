package accounts

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"Deepseek2API/internal/account"
	"Deepseek2API/internal/config"
	adminshared "Deepseek2API/internal/httpapi/admin/shared"
)

func newHTTPAdminHarness(t *testing.T, rawConfig string, ds adminshared.DeepSeekCaller) http.Handler {
	t.Helper()
	t.Setenv("Deepseek2API_CONFIG_JSON", rawConfig)
	store := config.LoadStore()
	h := &Handler{
		Store: store,
		Pool:  account.NewPool(store),
		DS:    ds,
	}
	r := chi.NewRouter()
	RegisterRoutes(r, h)
	return r
}

func adminReq(method, path string, body []byte) *http.Request {
	req := httptest.NewRequest(method, path, bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer admin")
	req.Header.Set("Content-Type", "application/json")
	return req
}
