package testsuite

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

func (r *Runner) caseInvalidModel(ctx context.Context, cc *caseContext) error {
	resp, err := cc.requestOnce(ctx, requestSpec{
		Method: http.MethodPost,
		Path:   "/v1/chat/completions",
		Headers: map[string]string{
			"Authorization": "Bearer " + r.apiKey,
		},
		Body: map[string]any{
			"model": "deepseek-not-exists",
			"messages": []map[string]any{
				{"role": "user", "content": "hi"},
			},
			"stream": false,
		},
		Retryable: false,
	}, 1)
	if err != nil {
		return err
	}
	cc.assert("status_503", resp.StatusCode == http.StatusServiceUnavailable, fmt.Sprintf("status=%d", resp.StatusCode))
	var m map[string]any
	_ = json.Unmarshal(resp.Body, &m)
	e, _ := m["error"].(map[string]any)
	cc.assert("error_type_service_unavailable", asString(e["type"]) == "service_unavailable_error", fmt.Sprintf("body=%s", string(resp.Body)))
	return nil
}

func (r *Runner) caseMissingMessages(ctx context.Context, cc *caseContext) error {
	resp, err := cc.request(ctx, requestSpec{
		Method: http.MethodPost,
		Path:   "/v1/chat/completions",
		Headers: map[string]string{
			"Authorization": "Bearer " + r.apiKey,
		},
		Body: map[string]any{
			"model":  "deepseek-v4-flash",
			"stream": false,
		},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("status_400", resp.StatusCode == http.StatusBadRequest, fmt.Sprintf("status=%d", resp.StatusCode))
	var m map[string]any
	_ = json.Unmarshal(resp.Body, &m)
	e, _ := m["error"].(map[string]any)
	cc.assert("error_type_invalid_request", asString(e["type"]) == "invalid_request_error", fmt.Sprintf("body=%s", string(resp.Body)))
	return nil
}

func (r *Runner) caseAdminUnauthorized(ctx context.Context, cc *caseContext) error {
	resp, err := cc.request(ctx, requestSpec{
		Method:    http.MethodGet,
		Path:      "/admin/config",
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("status_401", resp.StatusCode == http.StatusUnauthorized, fmt.Sprintf("status=%d", resp.StatusCode))
	return nil
}

func (r *Runner) caseTokenRefreshManagedAccount(ctx context.Context, cc *caseContext) error {
	if len(r.configRaw.Accounts) == 0 {
		cc.assert("account_present", false, "no account in config")
		return nil
	}
	acc := r.configRaw.Accounts[0]
	id := strings.TrimSpace(acc.Email)
	if id == "" {
		id = strings.TrimSpace(acc.Mobile)
	}
	if id == "" {
		cc.assert("account_identifier", false, "first account has no identifier")
		return nil
	}
	if strings.TrimSpace(acc.Password) == "" {
		r.warnings = append(r.warnings, "token refresh edge case skipped strict check: first account password empty")
		cc.assert("account_password_present", true, "skipped strict refresh check due empty password")
		return nil
	}
	invalidToken := "invalid-testsuite-refresh-token-" + sanitizeID(r.runID)
	update := map[string]any{
		"keys": r.configRaw.Keys,
		"accounts": []map[string]any{
			{
				"email":    acc.Email,
				"mobile":   acc.Mobile,
				"password": acc.Password,
				"token":    invalidToken,
			},
		},
	}
	updResp, err := cc.request(ctx, requestSpec{
		Method: http.MethodPost,
		Path:   "/admin/config",
		Headers: map[string]string{
			"Authorization": "Bearer " + r.adminJWT,
		},
		Body:      update,
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("update_config_status_200", updResp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", updResp.StatusCode))

	chatResp, err := cc.request(ctx, requestSpec{
		Method: http.MethodPost,
		Path:   "/v1/chat/completions",
		Headers: map[string]string{
			"Authorization":        "Bearer " + r.apiKey,
			"X-Ds2-Target-Account": id,
		},
		Body: map[string]any{
			"model": "deepseek-v4-flash",
			"messages": []map[string]any{
				{"role": "user", "content": "token refresh test"},
			},
			"stream": false,
		},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("chat_status_200", chatResp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d body=%s", chatResp.StatusCode, string(chatResp.Body)))

	cfgResp, err := cc.request(ctx, requestSpec{
		Method: http.MethodGet,
		Path:   "/admin/config",
		Headers: map[string]string{
			"Authorization": "Bearer " + r.adminJWT,
		},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	var cfg map[string]any
	_ = json.Unmarshal(cfgResp.Body, &cfg)
	accounts, _ := cfg["accounts"].([]any)
	preview := ""
	hasToken := false
	for _, item := range accounts {
		m, _ := item.(map[string]any)
		e := asString(m["email"])
		mo := asString(m["mobile"])
		if e == acc.Email && mo == acc.Mobile {
			preview = asString(m["token_preview"])
			hasToken, _ = m["has_token"].(bool)
			break
		}
	}
	cc.assert("has_token_after_refresh", hasToken, fmt.Sprintf("config=%s", string(cfgResp.Body)))
	maskedInvalid := invalidToken
	if len(maskedInvalid) <= 4 {
		maskedInvalid = strings.Repeat("*", len(maskedInvalid))
	} else {
		maskedInvalid = maskedInvalid[:2] + "****" + maskedInvalid[len(maskedInvalid)-2:]
	}
	cc.assert("token_preview_changed_from_invalid", preview != maskedInvalid, fmt.Sprintf("preview=%s invalid_mask=%s", preview, maskedInvalid))
	return nil
}
