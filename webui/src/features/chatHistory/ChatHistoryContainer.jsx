import { Loader2, RefreshCcw, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import { useI18n } from '../../i18n'
import { ChatHistoryListPane, ConfirmClearDialog, DesktopDetailPane, MobileDetailModal } from './ChatHistoryPanels'
import {
    DISABLED_LIMIT,
    LIMIT_OPTIONS,
    VIEW_MODE_KEY,
} from './chatHistoryUtils'

const LIST_REFRESH_MS = 1500
const STREAMING_DETAIL_REFRESH_MS = 750

export default function ChatHistoryContainer({ authFetch, onMessage }) {
    const { t, lang } = useI18n()
    const apiFetch = authFetch || fetch
    const [items, setItems] = useState([])
    const [limit, setLimit] = useState(20)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedId, setSelectedId] = useState('')
    const [selectedDetail, setSelectedDetail] = useState(null)
    const [savingLimit, setSavingLimit] = useState(false)
    const [clearing, setClearing] = useState(false)
    const [deletingId, setDeletingId] = useState('')
    const [detail, setDetail] = useState('')
    const [confirmClearOpen, setConfirmClearOpen] = useState(false)
    const [autoRefreshReady, setAutoRefreshReady] = useState(false)
    const [viewMode, setViewMode] = useState(() => {
        if (typeof localStorage === 'undefined') return 'list'
        const stored = localStorage.getItem(VIEW_MODE_KEY)
        return stored === 'merged' ? 'merged' : 'list'
    })
    const [isMobileView, setIsMobileView] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false)
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
    const [mobileDetailVisible, setMobileDetailVisible] = useState(false)
    const [mobileOrigin, setMobileOrigin] = useState({ x: 50, y: 50 })
    const [pendingJumpToAssistant, setPendingJumpToAssistant] = useState(false)

    const inFlightRef = useRef(false)
    const detailInFlightRef = useRef(false)
    const listETagRef = useRef('')
    const detailETagRef = useRef('')
    const assistantStartRef = useRef(null)
    const detailScrollRef = useRef(null)
    const mobileCloseTimerRef = useRef(null)

    const selectedSummary = items.find(item => item.id === selectedId) || items[0] || null
    const selectedItem = selectedDetail && selectedDetail.id === selectedId ? selectedDetail : null

    const syncItems = (nextItems) => {
        setItems(nextItems)
        setSelectedId(prev => {
            if (!nextItems.length) return ''
            if (prev && nextItems.some(item => item.id === prev)) return prev
            return nextItems[0].id
        })
    }

    const loadList = async ({ mode = 'silent', announceError = false } = {}) => {
        if (inFlightRef.current) return
        inFlightRef.current = true
        if (mode === 'manual') {
            setRefreshing(true)
        } else if (mode === 'initial') {
            setLoading(true)
        }
        if (announceError) {
            setDetail('')
        }
        try {
            const headers = {}
            if (listETagRef.current) {
                headers['If-None-Match'] = listETagRef.current
            }
            const res = await apiFetch('/admin/chat-history', { headers })
            if (res.status === 304) {
                return
            }
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.detail || t('chatHistory.loadFailed'))
            }
            listETagRef.current = res.headers.get('ETag') || ''
            setLimit(typeof data.limit === 'number' ? data.limit : 20)
            syncItems(Array.isArray(data.items) ? data.items : [])
        } catch (error) {
            setDetail(error.message || t('chatHistory.loadFailed'))
            if (announceError) {
                onMessage?.('error', error.message || t('chatHistory.loadFailed'))
            }
        } finally {
            if (mode === 'initial') {
                setLoading(false)
            }
            if (mode === 'manual') {
                setRefreshing(false)
            }
            inFlightRef.current = false
        }
    }

    const loadDetail = async (id, { announceError = false } = {}) => {
        if (!id || detailInFlightRef.current) return
        detailInFlightRef.current = true
        try {
            const headers = {}
            if (detailETagRef.current) {
                headers['If-None-Match'] = detailETagRef.current
            }
            const res = await apiFetch(`/admin/chat-history/${encodeURIComponent(id)}`, { headers })
            if (res.status === 304) {
                return
            }
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.detail || t('chatHistory.loadFailed'))
            }
            detailETagRef.current = res.headers.get('ETag') || ''
            setSelectedDetail(data.item || null)
        } catch (error) {
            if (announceError) {
                onMessage?.('error', error.message || t('chatHistory.loadFailed'))
            }
        } finally {
            detailInFlightRef.current = false
        }
    }

    useEffect(() => {
        loadList({ mode: 'initial', announceError: true }).finally(() => {
            setAutoRefreshReady(true)
        })
    }, [])

    useEffect(() => {
        if (!autoRefreshReady || limit === DISABLED_LIMIT) return undefined
        const timer = window.setInterval(() => {
            loadList({ mode: 'silent', announceError: false })
        }, LIST_REFRESH_MS)
        return () => window.clearInterval(timer)
    }, [autoRefreshReady, limit])

    useEffect(() => {
        if (!autoRefreshReady || !selectedId || selectedSummary?.status !== 'streaming') return undefined
        const timer = window.setInterval(() => {
            loadDetail(selectedId, { announceError: false })
        }, STREAMING_DETAIL_REFRESH_MS)
        return () => window.clearInterval(timer)
    }, [autoRefreshReady, selectedId, selectedSummary?.status])

    useEffect(() => {
        if (!selectedId) return undefined
        detailETagRef.current = ''
        setSelectedDetail(null)
        loadDetail(selectedId, { announceError: false })
    }, [selectedId, mobileDetailOpen])

    useEffect(() => {
        if (!pendingJumpToAssistant || !selectedItem || selectedItem.id !== selectedId) return undefined
        const frame = window.requestAnimationFrame(() => {
            assistantStartRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
            setPendingJumpToAssistant(false)
        })
        return () => window.cancelAnimationFrame(frame)
    }, [pendingJumpToAssistant, selectedId, selectedItem?.id, selectedItem?.revision, mobileDetailOpen, viewMode])

    useEffect(() => {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(VIEW_MODE_KEY, viewMode)
    }, [viewMode])

    useEffect(() => {
        if (typeof window === 'undefined') return undefined
        const handleResize = () => setIsMobileView(window.innerWidth < 1024)
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (!isMobileView) {
            setMobileDetailOpen(false)
            setMobileDetailVisible(false)
        }
    }, [isMobileView])

    useEffect(() => {
        return () => {
            if (mobileCloseTimerRef.current) {
                window.clearTimeout(mobileCloseTimerRef.current)
            }
        }
    }, [])

    const handleRefresh = async ({ manual = true } = {}) => {
        await loadList({ mode: manual ? 'manual' : 'silent', announceError: manual })
        if (selectedId) {
            detailETagRef.current = ''
            await loadDetail(selectedId, { announceError: manual })
        }
    }

    const handleLimitChange = async (nextLimit) => {
        if (nextLimit === limit || savingLimit) return
        setSavingLimit(true)
        try {
            const res = await apiFetch('/admin/chat-history/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: nextLimit }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.detail || t('chatHistory.updateLimitFailed'))
            }
            const resolvedLimit = typeof data.limit === 'number' ? data.limit : nextLimit
            setLimit(resolvedLimit)
            listETagRef.current = ''
            syncItems(Array.isArray(data.items) ? data.items : [])
            onMessage?.(
                'success',
                resolvedLimit === DISABLED_LIMIT
                    ? t('chatHistory.disabledSuccess')
                    : t('chatHistory.limitUpdated', { limit: resolvedLimit })
            )
        } catch (error) {
            onMessage?.('error', error.message || t('chatHistory.updateLimitFailed'))
        } finally {
            setSavingLimit(false)
        }
    }

    const handleDeleteItem = async (id) => {
        if (!id || deletingId) return
        setDeletingId(id)
        try {
            const res = await apiFetch(`/admin/chat-history/${encodeURIComponent(id)}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.detail || t('chatHistory.deleteFailed'))
            }
            if (selectedId === id) {
                detailETagRef.current = ''
                setSelectedDetail(null)
            }
            syncItems(items.filter(item => item.id !== id))
            onMessage?.('success', t('chatHistory.deleteSuccess'))
        } catch (error) {
            onMessage?.('error', error.message || t('chatHistory.deleteFailed'))
        } finally {
            setDeletingId('')
        }
    }

    const handleClear = async () => {
        if (clearing || !items.length) return
        setClearing(true)
        try {
            const res = await apiFetch('/admin/chat-history', { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.detail || t('chatHistory.clearFailed'))
            }
            listETagRef.current = ''
            detailETagRef.current = ''
            setSelectedDetail(null)
            syncItems([])
            onMessage?.('success', t('chatHistory.clearSuccess'))
        } catch (error) {
            onMessage?.('error', error.message || t('chatHistory.clearFailed'))
        } finally {
            setClearing(false)
        }
    }

    const openMobileDetail = (itemId, event) => {
        const x = typeof window !== 'undefined' && event?.clientX ? (event.clientX / window.innerWidth) * 100 : 50
        const y = typeof window !== 'undefined' && event?.clientY ? (event.clientY / window.innerHeight) * 100 : 50
        setMobileOrigin({ x, y })
        setPendingJumpToAssistant(true)
        setSelectedId(itemId)
        setMobileDetailOpen(true)
        setMobileDetailVisible(false)
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => setMobileDetailVisible(true))
        })
    }

    const closeMobileDetail = () => {
        setMobileDetailVisible(false)
        if (mobileCloseTimerRef.current) {
            window.clearTimeout(mobileCloseTimerRef.current)
        }
        mobileCloseTimerRef.current = window.setTimeout(() => {
            setMobileDetailOpen(false)
        }, 180)
    }

    const handleSelectItem = (itemId, event) => {
        if (isMobileView) {
            openMobileDetail(itemId, event)
            return
        }
        if (itemId === selectedId) {
            detailETagRef.current = ''
            setSelectedDetail(null)
            loadDetail(itemId, { announceError: false })
            return
        }
        setPendingJumpToAssistant(true)
        setSelectedId(itemId)
    }

    if (loading) {
        return (
            <div className="h-[calc(100vh-140px)] rounded-2xl border border-border bg-card shadow-sm flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('chatHistory.loading')}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm p-4 lg:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="text-sm font-semibold text-foreground">{t('chatHistory.retentionTitle')}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t('chatHistory.retentionDesc')}</div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {LIMIT_OPTIONS.map(option => (
                        <button
                            key={option}
                            type="button"
                            disabled={savingLimit}
                            onClick={() => handleLimitChange(option)}
                            className={clsx(
                                'h-9 px-3 rounded-lg border text-sm transition-colors',
                                option === limit
                                    ? (option === DISABLED_LIMIT
                                        ? 'border-destructive bg-destructive text-destructive-foreground'
                                        : 'border-primary bg-primary text-primary-foreground')
                                    : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                            )}
                        >
                            {option === DISABLED_LIMIT ? t('chatHistory.off') : option}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => handleRefresh({ manual: true })}
                        disabled={refreshing}
                        className={clsx(
                            'h-9 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex items-center',
                            isMobileView ? 'w-9 justify-center px-0' : 'gap-2 px-3'
                        )}
                    >
                        {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        {!isMobileView && t('chatHistory.refresh')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmClearOpen(true)}
                        disabled={clearing || !items.length}
                        className="h-10 w-10 rounded-xl border border-border bg-[#111214] text-muted-foreground hover:text-destructive hover:bg-[#181a1d] disabled:opacity-50 flex items-center justify-center"
                        title={t('chatHistory.clearAll')}
                    >
                        {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {detail && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 text-destructive px-4 py-3 text-sm">
                    {detail}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[340px,minmax(0,1fr)] gap-6 h-[calc(100vh-240px)] min-h-[520px]">
                <ChatHistoryListPane
                    items={items}
                    selectedItem={selectedItem}
                    deletingId={deletingId}
                    t={t}
                    lang={lang}
                    onSelectItem={handleSelectItem}
                    onDeleteItem={handleDeleteItem}
                />

                <DesktopDetailPane
                    selectedSummary={selectedSummary}
                    selectedItem={selectedItem}
                    t={t}
                    lang={lang}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    detailScrollRef={detailScrollRef}
                    assistantStartRef={assistantStartRef}
                    onMessage={onMessage}
                />
            </div>

            <MobileDetailModal
                open={isMobileView && mobileDetailOpen}
                visible={mobileDetailVisible}
                origin={mobileOrigin}
                selectedItem={selectedItem}
                t={t}
                lang={lang}
                viewMode={viewMode}
                setViewMode={setViewMode}
                detailScrollRef={detailScrollRef}
                assistantStartRef={assistantStartRef}
                onClose={closeMobileDetail}
            />

            <ConfirmClearDialog
                open={confirmClearOpen}
                t={t}
                onCancel={() => setConfirmClearOpen(false)}
                onConfirm={async () => {
                    setConfirmClearOpen(false)
                    await handleClear()
                }}
            />
        </div>
    )
}
