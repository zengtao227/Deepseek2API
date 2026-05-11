package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"ds2api/internal/config"
)

func TestGetVercelConfigFallsBackToSavedConfig(t *testing.T) {
	t.Setenv("DS2API_CONFIG_JSON", `{"keys":["k1"],"vercel":{"token":"saved-token","project_id":"saved-project","team_id":"saved-team"}}`)
	t.Setenv("VERCEL_TOKEN", "")
	t.Setenv("VERCEL_PROJECT_ID", "")
	t.Setenv("VERCEL_TEAM_ID", "")
	h := &Handler{Store: config.LoadStore()}

	rec := httptest.NewRecorder()
	h.getVercelConfig(rec, httptest.NewRequest(http.MethodGet, "/admin/vercel/config", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["has_token"] != true {
		t.Fatalf("expected saved token to be detected: %#v", payload)
	}
	if payload["token_source"] != "config" || payload["project_id"] != "saved-project" || payload["team_id"] != "saved-team" {
		t.Fatalf("unexpected preconfig payload: %#v", payload)
	}
	if payload["token_preview"] == "saved-token" {
		t.Fatal("token preview leaked the full token")
	}
}
