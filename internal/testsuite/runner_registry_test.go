package testsuite

import (
	"sort"
	"testing"
)

func TestRunnerCasesRegistryExactSet(t *testing.T) {
	r := &Runner{}
	got := r.cases()
	wantIDs := []string{
		"healthz_ok",
		"readyz_ok",
		"models_openai",
		"model_openai_by_id",
		"models_claude",
		"admin_login_verify",
		"admin_queue_status",
		"chat_nonstream_basic",
		"chat_stream_basic",
		"responses_nonstream_basic",
		"responses_stream_basic",
		"embeddings_contract",
		"reasoner_stream",
		"toolcall_nonstream",
		"toolcall_stream",
		"anthropic_messages_nonstream",
		"anthropic_messages_stream",
		"anthropic_count_tokens",
		"admin_account_test_single",
		"concurrency_burst",
		"concurrency_threshold_limit",
		"stream_abort_release",
		"toolcall_stream_mixed",
		"sse_json_integrity",
		"error_contract_invalid_model",
		"error_contract_missing_messages",
		"admin_unauthorized_contract",
		"config_write_isolated",
		"token_refresh_managed_account",
		"error_contract_invalid_key",
	}

	if len(got) != len(wantIDs) {
		t.Fatalf("unexpected case count: got=%d want=%d", len(got), len(wantIDs))
	}

	wantSet := map[string]struct{}{}
	for _, id := range wantIDs {
		wantSet[id] = struct{}{}
	}

	gotSet := map[string]struct{}{}
	for i, cs := range got {
		if cs.ID == "" {
			t.Fatalf("case[%d] has empty ID", i)
		}
		if cs.Run == nil {
			t.Fatalf("case[%d] (%s) has nil Run", i, cs.ID)
		}
		if _, exists := gotSet[cs.ID]; exists {
			t.Fatalf("duplicate case ID: %s", cs.ID)
		}
		gotSet[cs.ID] = struct{}{}
	}

	var missing []string
	for id := range wantSet {
		if _, ok := gotSet[id]; !ok {
			missing = append(missing, id)
		}
	}
	var extra []string
	for id := range gotSet {
		if _, ok := wantSet[id]; !ok {
			extra = append(extra, id)
		}
	}
	sort.Strings(missing)
	sort.Strings(extra)

	if len(missing) > 0 || len(extra) > 0 {
		t.Fatalf("registry mismatch: missing=%v extra=%v", missing, extra)
	}
}
