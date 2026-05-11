package testsuite

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

func (r *Runner) caseAdminLoginVerify(ctx context.Context, cc *caseContext) error {
	loginResp, err := cc.request(ctx, requestSpec{
		Method:    http.MethodPost,
		Path:      "/admin/login",
		Body:      map[string]any{"admin_key": r.adminKey, "expire_hours": 24},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("login_status_200", loginResp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", loginResp.StatusCode))
	var payload map[string]any
	_ = json.Unmarshal(loginResp.Body, &payload)
	token := asString(payload["token"])
	cc.assert("token_exists", token != "", fmt.Sprintf("body=%s", string(loginResp.Body)))
	if token == "" {
		return nil
	}
	verifyResp, err := cc.request(ctx, requestSpec{
		Method: http.MethodGet,
		Path:   "/admin/verify",
		Headers: map[string]string{
			"Authorization": "Bearer " + token,
		},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("verify_status_200", verifyResp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", verifyResp.StatusCode))
	var v map[string]any
	_ = json.Unmarshal(verifyResp.Body, &v)
	valid, _ := v["valid"].(bool)
	cc.assert("verify_valid_true", valid, fmt.Sprintf("body=%s", string(verifyResp.Body)))
	return nil
}

func (r *Runner) caseAdminQueueStatus(ctx context.Context, cc *caseContext) error {
	resp, err := cc.request(ctx, requestSpec{
		Method: http.MethodGet,
		Path:   "/admin/queue/status",
		Headers: map[string]string{
			"Authorization": "Bearer " + r.adminJWT,
		},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("status_200", resp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", resp.StatusCode))
	var m map[string]any
	_ = json.Unmarshal(resp.Body, &m)
	_, hasRec := m["recommended_concurrency"]
	_, hasQueue := m["max_queue_size"]
	cc.assert("has_recommended_concurrency", hasRec, fmt.Sprintf("body=%s", string(resp.Body)))
	cc.assert("has_max_queue_size", hasQueue, fmt.Sprintf("body=%s", string(resp.Body)))
	return nil
}
func (r *Runner) caseAdminAccountTest(ctx context.Context, cc *caseContext) error {
	if strings.TrimSpace(r.accountID) == "" {
		cc.assert("account_present", false, "no account in config")
		return nil
	}
	resp, err := cc.request(ctx, requestSpec{
		Method: http.MethodPost,
		Path:   "/admin/accounts/test",
		Headers: map[string]string{
			"Authorization": "Bearer " + r.adminJWT,
		},
		Body: map[string]any{
			"identifier": r.accountID,
			"model":      "deepseek-v4-flash",
			"message":    "ping",
		},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("status_200", resp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", resp.StatusCode))
	var m map[string]any
	_ = json.Unmarshal(resp.Body, &m)
	ok, _ := m["success"].(bool)
	cc.assert("success_true", ok, fmt.Sprintf("body=%s", string(resp.Body)))
	return nil
}
func (r *Runner) caseConfigWriteIsolated(ctx context.Context, cc *caseContext) error {
	k := "testsuite-temp-" + sanitizeID(r.runID)
	add, err := cc.request(ctx, requestSpec{
		Method: http.MethodPost,
		Path:   "/admin/keys",
		Headers: map[string]string{
			"Authorization": "Bearer " + r.adminJWT,
		},
		Body:      map[string]any{"key": k},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("add_key_status_200", add.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", add.StatusCode))

	cfg1, err := cc.request(ctx, requestSpec{
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
	containsAdded := strings.Contains(string(cfg1.Body), k)
	cc.assert("key_present_in_isolated_config", containsAdded, "added key not found in isolated config")

	delPath := "/admin/keys/" + url.PathEscape(k)
	del, err := cc.request(ctx, requestSpec{
		Method: http.MethodDelete,
		Path:   delPath,
		Headers: map[string]string{
			"Authorization": "Bearer " + r.adminJWT,
		},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("delete_key_status_200", del.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", del.StatusCode))

	cfg2, err := cc.request(ctx, requestSpec{
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
	cc.assert("key_removed_in_isolated_config", !strings.Contains(string(cfg2.Body), k), "temporary key still present")

	if err := r.ensureOriginalConfigUntouched(); err != nil {
		cc.assert("original_config_unchanged", false, err.Error())
	} else {
		cc.assert("original_config_unchanged", true, "")
	}
	return nil
}
