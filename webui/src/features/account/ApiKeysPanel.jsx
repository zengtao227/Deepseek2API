import { useState } from 'react'
import { Check, ChevronDown, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import clsx from 'clsx'

import { maskSecret } from '../../utils/maskSecret'

function fallbackCopyText(text) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    let copied = false
    try {
        copied = document.execCommand('copy')
    } finally {
        document.body.removeChild(textArea)
    }

    if (!copied) {
        throw new Error('copy failed')
    }
}

export default function ApiKeysPanel({
    t,
    config,
    keysExpanded,
    setKeysExpanded,
    onAddKey,
    onEditKey,
    copiedKey,
    setCopiedKey,
    onDeleteKey,
}) {
    const [failedKey, setFailedKey] = useState(null)
    const apiKeys = Array.isArray(config?.api_keys) && config.api_keys.length > 0
        ? config.api_keys
        : (config?.keys || []).map(key => ({ key, name: '', remark: '' }))

    const handleCopyKey = async (key) => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(key)
            } else {
                fallbackCopyText(key)
            }
            setCopiedKey(key)
            setFailedKey(null)
            setTimeout(() => setCopiedKey(null), 2000)
        } catch {
            try {
                fallbackCopyText(key)
                setCopiedKey(key)
                setFailedKey(null)
                setTimeout(() => setCopiedKey(null), 2000)
            } catch {
                setFailedKey(key)
                setTimeout(() => setFailedKey(null), 2500)
            }
        }
    }

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                onClick={() => setKeysExpanded(!keysExpanded)}
            >
                <div className="flex items-center gap-3">
                    <ChevronDown className={clsx(
                        "w-5 h-5 text-muted-foreground transition-transform duration-200",
                        keysExpanded ? "rotate-0" : "-rotate-90"
                    )} />
                    <div>
                        <h2 className="text-lg font-semibold">{t('accountManager.apiKeysTitle')}</h2>
                        <p className="text-sm text-muted-foreground">{t('accountManager.apiKeysDesc')} ({apiKeys.length || 0})</p>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onAddKey() }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    {t('accountManager.addKey')}
                </button>
            </div>

            {keysExpanded && (
                <div className="divide-y divide-border border-t border-border">
                    {apiKeys.length > 0 ? (
                        apiKeys.map((item, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                                    <div className="text-sm">{item.name || '-'}</div>
                                    <button
                                        onClick={() => handleCopyKey(item.key)}
                                        className="font-mono text-sm bg-muted/50 px-3 py-1 rounded inline-block hover:bg-muted transition-colors"
                                        title={t('accountManager.copyKeyTitle')}
                                    >
                                        {maskSecret(item.key)}
                                    </button>
                                    <div className="text-sm text-muted-foreground truncate">{item.remark || '-'}</div>
                                    {copiedKey === item.key && (
                                        <span className="text-xs text-green-500 animate-pulse">{t('accountManager.copied')}</span>
                                    )}
                                    {failedKey === item.key && (
                                        <span className="text-xs text-destructive">{t('accountManager.copyFailed')}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEditKey(item)}
                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                        title={t('accountManager.editKeyTitle')}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleCopyKey(item.key)}
                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                        title={t('accountManager.copyKeyTitle')}
                                    >
                                        {copiedKey === item.key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => onDeleteKey(item.key)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                        title={t('accountManager.deleteKeyTitle')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">{t('accountManager.noApiKeys')}</div>
                    )}
                </div>
            )}
        </div>
    )
}
