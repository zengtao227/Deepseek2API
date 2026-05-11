import { ArrowDown, Bot, ChevronDown, Clock3, Copy, Download, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import {
    MESSAGE_COLLAPSE_AT,
    buildListModeMessages,
    copyTextWithFallback,
    downloadTextFile,
    formatElapsed,
} from './chatHistoryUtils'

function ExpandableText({ text = '', threshold = MESSAGE_COLLAPSE_AT, expandLabel, collapseLabel, buttonClassName = 'text-white hover:text-white/80' }) {
    const shouldCollapse = text.length > threshold
    const [expanded, setExpanded] = useState(false)
    const contentRef = useRef(null)
    const [maxHeight, setMaxHeight] = useState('none')

    useEffect(() => {
        setExpanded(false)
    }, [text])

    const visibleText = shouldCollapse && !expanded ? `${text.slice(0, threshold)}...` : text

    useEffect(() => {
        if (!contentRef.current) return
        setMaxHeight(`${contentRef.current.scrollHeight}px`)
    }, [expanded, visibleText])

    return (
        <div>
            <div className="overflow-hidden transition-[max-height] duration-300 ease-out" style={{ maxHeight }}>
                <div ref={contentRef} className="whitespace-pre-wrap break-words">
                    {visibleText}
                </div>
            </div>
            {shouldCollapse && (
                <button
                    type="button"
                    onClick={() => setExpanded(prev => !prev)}
                    className={clsx('mt-3 inline-flex items-center gap-2 text-xs font-medium transition-colors', buttonClassName)}
                >
                    <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform duration-300', expanded && 'rotate-180')} />
                    {expanded ? collapseLabel : expandLabel}
                </button>
            )}
        </div>
    )
}

function RequestMessages({ item, t, messages }) {
    const requestMessages = Array.isArray(messages) && messages.length > 0
        ? messages
        : [{ role: 'user', content: item?.user_input || t('chatHistory.emptyUserInput') }]

    return (
        <div className="space-y-5 max-w-4xl mx-auto">
            {requestMessages.map((message, index) => {
                const role = message.role || 'user'
                const isUser = role === 'user'
                const isAssistant = role === 'assistant'
                const isTool = role === 'tool'
                const label = isUser
                    ? t('chatHistory.role.user')
                    : (isAssistant ? t('chatHistory.role.assistant') : (isTool ? t('chatHistory.role.tool') : t('chatHistory.role.system')))
                return (
                    <div key={`${role}-${index}`} className={clsx('flex gap-4', isUser && 'flex-row-reverse justify-start')}>
                        <div className={clsx(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border',
                            isUser ? 'bg-secondary' : (isAssistant ? 'bg-muted' : 'bg-background')
                        )}>
                            {isUser ? <UserRound className="w-4 h-4 text-muted-foreground" /> : <Bot className="w-4 h-4 text-foreground" />}
                        </div>
                        <div className="max-w-[88%] lg:max-w-[78%] text-left">
                            <div className={clsx('text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2 px-1', isUser && 'text-right')}>
                                {label}
                            </div>
                            <div className={clsx(
                                'rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm border whitespace-pre-wrap break-words',
                                isUser
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm border-primary/30'
                                    : (isAssistant ? 'bg-secondary/60 text-foreground rounded-tl-sm border-border' : 'bg-background text-foreground rounded-tl-sm border-border')
                            )}>
                                <div className="whitespace-pre-wrap break-words">
                                    {message.content || t('chatHistory.emptyUserInput')}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function PromptTextActions({ text, filename, copyTitle, downloadTitle, t, onMessage, buttonClassName }) {
    const handleCopy = async () => {
        try {
            await copyTextWithFallback(text)
            onMessage?.('success', t('chatHistory.copySuccess'))
        } catch {
            onMessage?.('error', t('chatHistory.copyFailed'))
        }
    }

    const handleDownload = () => {
        try {
            downloadTextFile(filename, text)
            onMessage?.('success', t('chatHistory.downloadSuccess'))
        } catch {
            onMessage?.('error', t('chatHistory.downloadFailed'))
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button type="button" onClick={handleCopy} className={buttonClassName} title={copyTitle}>
                <Copy className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleDownload} className={buttonClassName} title={downloadTitle}>
                <Download className="w-4 h-4" />
            </button>
        </div>
    )
}

function MergedPromptView({ item, t, onMessage }) {
    const merged = item?.final_prompt || ''

    return (
        <div
            className="max-w-4xl mx-auto rounded-2xl border px-5 py-4"
            style={{ backgroundColor: 'rgb(231, 176, 8)', borderColor: 'rgba(231, 176, 8, 0.45)' }}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[#5b4300]">
                    {t('chatHistory.mergedInput')}
                </div>
                <PromptTextActions
                    text={merged}
                    filename={`Merged_${item?.id || 'prompt'}.txt`}
                    copyTitle={t('chatHistory.copyMerged')}
                    downloadTitle={t('chatHistory.downloadMerged')}
                    t={t}
                    onMessage={onMessage}
                    buttonClassName="h-8 w-8 rounded-lg text-[#5b4300] hover:text-black hover:bg-[#fff8db]/45 flex items-center justify-center transition-colors"
                />
            </div>
            <div className="text-sm leading-7 text-[#2f2200] whitespace-pre-wrap break-words font-mono">
                <ExpandableText
                    text={merged || t('chatHistory.emptyMergedPrompt')}
                    expandLabel={t('chatHistory.expand')}
                    collapseLabel={t('chatHistory.collapse')}
                    buttonClassName="text-[#2f2200] hover:text-black"
                />
            </div>
        </div>
    )
}

function HistoryTextView({ item, t, onMessage }) {
    const historyText = (item?.history_text || '').trim()
    if (!historyText) return null

    return (
        <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-background px-5 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground text-left">
                    HISTORY
                </div>
                <PromptTextActions
                    text={historyText}
                    filename={`History_${item?.id || 'history'}.txt`}
                    copyTitle={t('chatHistory.copyHistory')}
                    downloadTitle={t('chatHistory.downloadHistory')}
                    t={t}
                    onMessage={onMessage}
                    buttonClassName="h-8 w-8 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex items-center justify-center"
                />
            </div>
            <div className="text-sm leading-7 text-foreground whitespace-pre-wrap break-words font-mono">
                <ExpandableText
                    text={historyText}
                    threshold={Math.floor(MESSAGE_COLLAPSE_AT / 4)}
                    expandLabel={t('chatHistory.expand')}
                    collapseLabel={t('chatHistory.collapse')}
                    buttonClassName="text-foreground hover:text-muted-foreground"
                />
            </div>
        </div>
    )
}

function MetaGrid({ selectedItem, t }) {
    return (
        <div className="max-w-4xl mx-auto rounded-xl border border-border bg-background/70 p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('chatHistory.metaTitle')}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('chatHistory.metaAccount')}</div>
                    <div className="text-sm font-medium text-foreground">{selectedItem.account_id || t('chatHistory.metaUnknown')}</div>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('chatHistory.metaElapsed')}</div>
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Clock3 className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatElapsed(selectedItem.elapsed_ms, t)}
                    </div>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('chatHistory.metaSurface')}</div>
                    <div className="text-sm font-medium text-foreground break-all">{selectedItem.surface || t('chatHistory.metaUnknown')}</div>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('chatHistory.metaModel')}</div>
                    <div className="text-sm font-medium text-foreground break-all">{selectedItem.model || t('chatHistory.metaUnknown')}</div>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('chatHistory.metaStatusCode')}</div>
                    <div className="text-sm font-medium text-foreground">{selectedItem.status_code || '-'}</div>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('chatHistory.metaStream')}</div>
                    <div className="text-sm font-medium text-foreground">{selectedItem.stream ? t('chatHistory.streamMode') : t('chatHistory.nonStreamMode')}</div>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('chatHistory.metaCaller')}</div>
                    <div className="text-sm font-medium text-foreground break-all">{selectedItem.caller_id || t('chatHistory.metaUnknown')}</div>
                </div>
            </div>
        </div>
    )
}

export default function DetailConversation({ selectedItem, t, viewMode, detailScrollRef, assistantStartRef, bottomButtonClassName, onMessage }) {
    if (!selectedItem) return null
    const listModeState = viewMode === 'list' ? buildListModeMessages(selectedItem, t) : null
    const showHistoryAtTop = viewMode !== 'list' || !listModeState?.historyMerged

    return (
        <>
            {showHistoryAtTop && <HistoryTextView item={selectedItem} t={t} onMessage={onMessage} />}

            {viewMode === 'list'
                ? <RequestMessages item={selectedItem} t={t} messages={listModeState?.messages} />
                : <MergedPromptView item={selectedItem} t={t} onMessage={onMessage} />}

            <div ref={assistantStartRef} className="flex gap-4 max-w-4xl mx-auto">
                <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border',
                    selectedItem.status === 'error' ? 'bg-destructive/10 border-destructive/20' : 'bg-muted'
                )}>
                    <Bot className={clsx('w-4 h-4', selectedItem.status === 'error' ? 'text-destructive' : 'text-foreground')} />
                </div>
                <div className="space-y-4 flex-1 min-w-0">
                    {(selectedItem.reasoning_content || '').trim() && (
                        <div className="text-xs bg-secondary/50 border border-border rounded-lg p-3 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="font-medium">{t('chatHistory.reasoningTrace')}</span>
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground font-mono text-[12px] md:text-[13px] max-h-64 overflow-y-auto custom-scrollbar pl-5 border-l-2 border-border/50 break-words">
                                {selectedItem.reasoning_content}
                            </div>
                        </div>
                    )}

                    <div className="text-sm leading-7 text-foreground whitespace-pre-wrap break-words">
                        {selectedItem.status === 'error'
                            ? <span className="text-destructive font-medium">{selectedItem.error || t('chatHistory.failedOutput')}</span>
                            : (selectedItem.content || t('chatHistory.emptyAssistantOutput'))}
                    </div>
                </div>
            </div>

            <MetaGrid selectedItem={selectedItem} t={t} />

            <button
                type="button"
                onClick={() => detailScrollRef.current?.scrollTo({ top: detailScrollRef.current?.scrollHeight || 0, behavior: 'smooth' })}
                className={clsx('h-12 w-12 rounded-full border border-border bg-card/95 backdrop-blur shadow-lg text-muted-foreground hover:text-foreground hover:bg-secondary/90 flex items-center justify-center', bottomButtonClassName)}
                title={t('chatHistory.backToBottom')}
            >
                <ArrowDown className="w-5 h-5" />
            </button>
        </>
    )
}
