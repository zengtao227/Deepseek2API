export default function BehaviorSection({ t, form, setForm }) {
    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">{t('settings.behaviorTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm space-y-2">
                    <span className="text-muted-foreground">{t('settings.responsesTTL')}</span>
                    <input
                        type="number"
                        min={30}
                        value={form.responses.store_ttl_seconds}
                        onChange={(e) => setForm((prev) => ({
                            ...prev,
                            responses: { ...prev.responses, store_ttl_seconds: Number(e.target.value || 30) },
                        }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2"
                    />
                </label>
                <label className="text-sm space-y-2">
                    <span className="text-muted-foreground">{t('settings.embeddingsProvider')}</span>
                    <input
                        type="text"
                        value={form.embeddings.provider}
                        onChange={(e) => setForm((prev) => ({
                            ...prev,
                            embeddings: { ...prev.embeddings, provider: e.target.value },
                        }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2"
                    />
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-4">
                    <input
                        type="checkbox"
                        checked={Boolean(form.thinking_injection?.enabled ?? true)}
                        onChange={(e) => setForm((prev) => ({
                            ...prev,
                            thinking_injection: {
                                ...prev.thinking_injection,
                                enabled: e.target.checked,
                            },
                        }))}
                        className="mt-1 h-4 w-4 rounded border-border"
                    />
                    <div className="space-y-1">
                        <span className="text-sm font-medium block">{t('settings.thinkingInjectionEnabled')}</span>
                        <span className="text-xs text-muted-foreground block">{t('settings.thinkingInjectionDesc')}</span>
                    </div>
                </label>
                <label className="text-sm space-y-2 md:col-span-2">
                    <span className="text-muted-foreground">{t('settings.thinkingInjectionPrompt')}</span>
                    <textarea
                        rows={5}
                        value={form.thinking_injection?.prompt || ''}
                        placeholder={form.thinking_injection?.default_prompt || ''}
                        onChange={(e) => setForm((prev) => ({
                            ...prev,
                            thinking_injection: {
                                ...prev.thinking_injection,
                                prompt: e.target.value,
                            },
                        }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 resize-y min-h-32"
                    />
                    <p className="text-xs text-muted-foreground">{t('settings.thinkingInjectionPromptHelp')}</p>
                </label>
            </div>
        </div>
    )
}
