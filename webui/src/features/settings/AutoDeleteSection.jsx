import { Trash2 } from 'lucide-react'

export default function AutoDeleteSection({ t, form, setForm }) {
    const mode = form.auto_delete?.mode || 'none'
    const descKey = mode === 'single'
        ? 'settings.autoDeleteSingleDesc'
        : mode === 'all'
            ? 'settings.autoDeleteAllDesc'
            : 'settings.autoDeleteNoneDesc'

    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">{t('settings.autoDeleteTitle')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t('settings.autoDeleteDesc')}</p>
            <div className="space-y-1.5">
                <label className="text-sm font-medium leading-6">{t('settings.autoDeleteMode')}</label>
                <select
                    value={mode}
                    onChange={(e) => setForm((prev) => ({
                        ...prev,
                        auto_delete: { ...(prev.auto_delete || {}), mode: e.target.value },
                    }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="none">{t('settings.autoDeleteNone')}</option>
                    <option value="single">{t('settings.autoDeleteSingle')}</option>
                    <option value="all">{t('settings.autoDeleteAll')}</option>
                </select>
            </div>
            <p className={`text-xs ${mode === 'none' ? 'text-muted-foreground' : 'text-amber-500'}`}>
                {t(descKey)}
            </p>
            {mode !== 'none' && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                    {t('settings.autoDeleteWarning')}
                </p>
            )}
        </div>
    )
}
