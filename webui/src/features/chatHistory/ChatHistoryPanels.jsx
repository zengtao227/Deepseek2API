import { ArrowUp, Loader2, MessageSquareText, Trash2, X } from 'lucide-react'
import clsx from 'clsx'

import DetailConversation from './ChatHistoryDetail'
import { ListModeIcon, MergeModeIcon } from './HistoryModeIcons'
import { formatDateTime, previewText, statusTone } from './chatHistoryUtils'

function ViewModeToggle({ t, viewMode, setViewMode, mobile = false }) {
    const size = mobile ? 'h-9 w-10' : 'h-9 w-12'
    return (
        <div className="inline-flex items-center rounded-xl border border-border bg-background p-1">
            <button
                type="button"
                onClick={() => setViewMode('list')}
                className={clsx(
                    size,
                    'rounded-lg flex items-center justify-center transition-colors',
                    viewMode === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
                title={t('chatHistory.viewModeList')}
            >
                <ListModeIcon />
            </button>
            <button
                type="button"
                onClick={() => setViewMode('merged')}
                className={clsx(
                    size,
                    'rounded-lg flex items-center justify-center transition-colors',
                    viewMode === 'merged' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
                title={t('chatHistory.viewModeMerged')}
            >
                <MergeModeIcon />
            </button>
        </div>
    )
}

export function ChatHistoryListPane({ items, selectedItem, deletingId, t, lang, onSelectItem, onDeleteItem }) {
    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm min-h-0 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="text-sm font-semibold">{t('chatHistory.listTitle')}</div>
                <div className="text-xs text-muted-foreground">{items.length}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {!items.length && (
                    <div className="h-full rounded-xl border border-dashed border-border/80 bg-background/50 flex flex-col items-center justify-center gap-2 text-center px-6">
                        <MessageSquareText className="w-8 h-8 text-muted-foreground/50" />
                        <div className="text-sm font-medium text-foreground">{t('chatHistory.emptyTitle')}</div>
                        <div className="text-xs text-muted-foreground leading-6">{t('chatHistory.emptyDesc')}</div>
                    </div>
                )}

                {items.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={(event) => onSelectItem(item.id, event)}
                        className={clsx(
                            'w-full text-left rounded-xl border px-4 py-3 transition-colors',
                            selectedItem?.id === item.id ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-secondary/40'
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-foreground truncate">
                                    {item.user_input || t('chatHistory.untitled')}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1 truncate">
                                    {[item.surface, item.model].filter(Boolean).join(' · ') || '-'}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={clsx('px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide', statusTone(item.status))}>
                                    {t(`chatHistory.status.${item.status || 'streaming'}`)}
                                </span>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onDeleteItem(item.id)
                                    }}
                                    disabled={deletingId === item.id}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-3 line-clamp-2 whitespace-pre-wrap break-words">
                            {previewText(item) || t('chatHistory.noPreview')}
                        </div>
                        <div className="text-[11px] text-muted-foreground/80 mt-3">
                            {formatDateTime(item.completed_at || item.updated_at || item.created_at, lang)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

export function DesktopDetailPane({ selectedSummary, selectedItem, t, lang, viewMode, setViewMode, detailScrollRef, assistantStartRef, onMessage }) {
    return (
        <div className="hidden lg:flex rounded-2xl border border-border bg-card shadow-sm min-h-0 overflow-hidden flex-col relative">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-foreground">{t('chatHistory.detailTitle')}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {selectedSummary ? formatDateTime(selectedSummary.completed_at || selectedSummary.updated_at || selectedSummary.created_at, lang) : t('chatHistory.selectPrompt')}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ViewModeToggle t={t} viewMode={viewMode} setViewMode={setViewMode} />
                    <button
                        type="button"
                        onClick={() => detailScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="h-8 w-8 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex items-center justify-center"
                        title={t('chatHistory.backToTop')}
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                    {selectedSummary && (
                        <span className={clsx('px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wide', statusTone(selectedSummary.status))}>
                            {t(`chatHistory.status.${selectedSummary.status || 'streaming'}`)}
                        </span>
                    )}
                </div>
            </div>

            <div ref={detailScrollRef} className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6">
                {!selectedItem && (
                    <div className="h-full rounded-xl border border-dashed border-border/80 bg-background/50 flex items-center justify-center text-sm text-muted-foreground">
                        {t('chatHistory.selectPrompt')}
                    </div>
                )}

                {selectedItem && (
                    <DetailConversation
                        selectedItem={selectedItem}
                        t={t}
                        viewMode={viewMode}
                        detailScrollRef={detailScrollRef}
                        assistantStartRef={assistantStartRef}
                        bottomButtonClassName="absolute right-5 bottom-5"
                        onMessage={onMessage}
                    />
                )}
            </div>
        </div>
    )
}

export function MobileDetailModal({ open, visible, origin, selectedItem, t, lang, viewMode, setViewMode, detailScrollRef, assistantStartRef, onClose }) {
    if (!open || !selectedItem) return null

    return (
        <div
            className={clsx(
                'fixed inset-0 z-50 flex items-center justify-center px-3 py-4 bg-background/65 backdrop-blur-sm transition-opacity duration-200',
                visible ? 'opacity-100' : 'opacity-0'
            )}
            onClick={onClose}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                className={clsx(
                    'w-full h-full rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col transition-transform duration-200 ease-out',
                    visible ? 'scale-100' : 'scale-90'
                )}
                style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
            >
                <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-foreground">{t('chatHistory.detailTitle')}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(selectedItem.completed_at || selectedItem.updated_at || selectedItem.created_at, lang)}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ViewModeToggle t={t} viewMode={viewMode} setViewMode={setViewMode} mobile />
                        <button
                            type="button"
                            onClick={() => detailScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="h-9 w-9 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex items-center justify-center"
                            title={t('chatHistory.backToTop')}
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 w-9 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex items-center justify-center"
                            title={t('actions.cancel')}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div ref={detailScrollRef} className="flex-1 overflow-y-auto p-5 space-y-6">
                    <DetailConversation
                        selectedItem={selectedItem}
                        t={t}
                        viewMode={viewMode}
                        detailScrollRef={detailScrollRef}
                        assistantStartRef={assistantStartRef}
                        bottomButtonClassName="fixed right-5 bottom-5"
                    />
                </div>
            </div>
        </div>
    )
}

export function ConfirmClearDialog({ open, t, onCancel, onConfirm }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-[#111214] text-muted-foreground flex items-center justify-center">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-base font-semibold text-foreground">{t('chatHistory.confirmClearTitle')}</div>
                            <div className="text-sm text-muted-foreground mt-1">{t('chatHistory.confirmClearDesc')}</div>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="h-10 px-4 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/60">
                        {t('actions.cancel')}
                    </button>
                    <button type="button" onClick={onConfirm} className="h-10 px-4 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        {t('chatHistory.confirmClearAction')}
                    </button>
                </div>
            </div>
        </div>
    )
}
