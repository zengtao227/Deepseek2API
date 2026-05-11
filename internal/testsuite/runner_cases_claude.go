package testsuite

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

func (r *Runner) caseModelsClaude(ctx context.Context, cc *caseContext) error {
	resp, err := cc.request(ctx, requestSpec{Method: http.MethodGet, Path: "/anthropic/v1/models", Retryable: true})
	if err != nil {
		return err
	}
	cc.assert("status_200", resp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", resp.StatusCode))
	ids := extractModelIDs(resp.Body)
	cc.assert("non_empty", len(ids) > 0, fmt.Sprintf("models=%v", ids))
	return nil
}
func (r *Runner) caseAnthropicNonstream(ctx context.Context, cc *caseContext) error {
	resp, err := cc.request(ctx, requestSpec{
		Method: http.MethodPost,
		Path:   "/anthropic/v1/messages",
		Headers: map[string]string{
			"Authorization":     "Bearer " + r.apiKey,
			"anthropic-version": "2023-06-01",
			"content-type":      "application/json",
		},
		Body: map[string]any{
			"model": "claude-sonnet-4-5",
			"messages": []map[string]any{
				{"role": "user", "content": "hello"},
			},
			"stream": false,
		},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("status_200", resp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", resp.StatusCode))
	var m map[string]any
	_ = json.Unmarshal(resp.Body, &m)
	cc.assert("type_message", asString(m["type"]) == "message", fmt.Sprintf("body=%s", string(resp.Body)))
	return nil
}

func (r *Runner) caseAnthropicStream(ctx context.Context, cc *caseContext) error {
	resp, err := cc.request(ctx, requestSpec{
		Method: http.MethodPost,
		Path:   "/anthropic/v1/messages",
		Headers: map[string]string{
			"Authorization":     "Bearer " + r.apiKey,
			"anthropic-version": "2023-06-01",
			"content-type":      "application/json",
		},
		Body: map[string]any{
			"model": "claude-sonnet-4-5",
			"messages": []map[string]any{
				{"role": "user", "content": "stream hello"},
			},
			"stream": true,
		},
		Stream:    true,
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("status_200", resp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", resp.StatusCode))
	events := parseClaudeStreamEvents(resp.Body)
	cc.assert("has_message_start", contains(events, "message_start"), fmt.Sprintf("events=%v", events))
	cc.assert("has_message_stop", contains(events, "message_stop"), fmt.Sprintf("events=%v", events))
	return nil
}

func (r *Runner) caseAnthropicCountTokens(ctx context.Context, cc *caseContext) error {
	resp, err := cc.request(ctx, requestSpec{
		Method: http.MethodPost,
		Path:   "/anthropic/v1/messages/count_tokens",
		Headers: map[string]string{
			"Authorization":     "Bearer " + r.apiKey,
			"anthropic-version": "2023-06-01",
			"content-type":      "application/json",
		},
		Body: map[string]any{
			"model": "claude-sonnet-4-5",
			"messages": []map[string]any{
				{"role": "user", "content": "count me"},
			},
		},
		Retryable: true,
	})
	if err != nil {
		return err
	}
	cc.assert("status_200", resp.StatusCode == http.StatusOK, fmt.Sprintf("status=%d", resp.StatusCode))
	var m map[string]any
	_ = json.Unmarshal(resp.Body, &m)
	v := toInt(m["input_tokens"])
	cc.assert("input_tokens_gt_zero", v > 0, fmt.Sprintf("body=%s", string(resp.Body)))
	return nil
}
