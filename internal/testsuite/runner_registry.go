package testsuite

import "context"

type caseDef struct {
	ID  string
	Run func(context.Context, *caseContext) error
}

func (r *Runner) cases() []caseDef {
	return []caseDef{
		{ID: "healthz_ok", Run: r.caseHealthz},
		{ID: "readyz_ok", Run: r.caseReadyz},
		{ID: "models_openai", Run: r.caseModelsOpenAI},
		{ID: "model_openai_by_id", Run: r.caseModelOpenAIByID},
		{ID: "models_claude", Run: r.caseModelsClaude},
		{ID: "admin_login_verify", Run: r.caseAdminLoginVerify},
		{ID: "admin_queue_status", Run: r.caseAdminQueueStatus},
		{ID: "chat_nonstream_basic", Run: r.caseChatNonstream},
		{ID: "chat_stream_basic", Run: r.caseChatStream},
		{ID: "responses_nonstream_basic", Run: r.caseResponsesNonstream},
		{ID: "responses_stream_basic", Run: r.caseResponsesStream},
		{ID: "embeddings_contract", Run: r.caseEmbeddings},
		{ID: "reasoner_stream", Run: r.caseReasonerStream},
		{ID: "toolcall_nonstream", Run: r.caseToolcallNonstream},
		{ID: "toolcall_stream", Run: r.caseToolcallStream},
		{ID: "anthropic_messages_nonstream", Run: r.caseAnthropicNonstream},
		{ID: "anthropic_messages_stream", Run: r.caseAnthropicStream},
		{ID: "anthropic_count_tokens", Run: r.caseAnthropicCountTokens},
		{ID: "admin_account_test_single", Run: r.caseAdminAccountTest},
		{ID: "concurrency_burst", Run: r.caseConcurrencyBurst},
		{ID: "concurrency_threshold_limit", Run: r.caseConcurrencyThresholdLimit},
		{ID: "stream_abort_release", Run: r.caseStreamAbortRelease},
		{ID: "toolcall_stream_mixed", Run: r.caseToolcallStreamMixed},
		{ID: "sse_json_integrity", Run: r.caseSSEJSONIntegrity},
		{ID: "error_contract_invalid_model", Run: r.caseInvalidModel},
		{ID: "error_contract_missing_messages", Run: r.caseMissingMessages},
		{ID: "admin_unauthorized_contract", Run: r.caseAdminUnauthorized},
		{ID: "config_write_isolated", Run: r.caseConfigWriteIsolated},
		{ID: "token_refresh_managed_account", Run: r.caseTokenRefreshManagedAccount},
		{ID: "error_contract_invalid_key", Run: r.caseInvalidKey},
	}
}
