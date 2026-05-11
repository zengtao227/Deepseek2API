import { useCallback } from 'react'

import { getAttachedFileAccountIds } from './fileAccountBinding'

export function useChatStreamClient({
    t,
    onMessage,
    model,
    message,
    effectiveKey,
    selectedAccount,
    streamingMode,
    attachedFiles,
    abortControllerRef,
    setLoading,
    setIsStreaming,
    setResponse,
    setStreamingContent,
    setStreamingThinking,
}) {
    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setLoading(false)
        setIsStreaming(false)
    }, [abortControllerRef, setIsStreaming, setLoading])

    const extractErrorMessage = useCallback(async (res) => {
        let raw = ''
        try {
            raw = await res.text()
        } catch {
            return t('apiTester.requestFailed')
        }
        if (!raw) {
            return t('apiTester.requestFailed')
        }
        try {
            const data = JSON.parse(raw)
            const fromErrorObject = data?.error?.message
            const fromErrorString = typeof data?.error === 'string' ? data.error : ''
            const detail = typeof data?.detail === 'string' ? data.detail : ''
            const msg = typeof data?.message === 'string' ? data.message : ''
            return fromErrorObject || fromErrorString || detail || msg || t('apiTester.requestFailed')
        } catch {
            return raw.length > 240 ? `${raw.slice(0, 240)}...` : raw
        }
    }, [t])

    const resolveAttachmentAccount = useCallback(() => {
        const ids = getAttachedFileAccountIds(attachedFiles)
        if (ids.length > 1) {
            return {
                accountId: '',
                error: t('apiTester.fileAccountConflict'),
            }
        }
        return {
            accountId: ids[0] || '',
            error: '',
        }
    }, [attachedFiles, t])

    const extractStreamError = useCallback((json) => {
        const error = json?.error
        if (!error || typeof error !== 'object') {
            return null
        }

        const message = typeof error.message === 'string' && error.message.trim()
            ? error.message.trim()
            : t('apiTester.requestFailed')
        const rawStatus = Number(json?.status_code ?? error.status_code ?? error.http_status)
        const statusCode = Number.isFinite(rawStatus) && rawStatus > 0
            ? rawStatus
            : (error.code === 'content_filter' ? 400 : 429)

        return {
            message,
            statusCode,
            code: typeof error.code === 'string' ? error.code : '',
            type: typeof error.type === 'string' ? error.type : '',
        }
    }, [t])

    const runTest = useCallback(async () => {
        if (!effectiveKey) {
            onMessage('error', t('apiTester.missingApiKey'))
            return
        }

        const startedAt = Date.now()
        setLoading(true)
        setIsStreaming(true)
        setResponse(null)
        setStreamingContent('')
        setStreamingThinking('')

        abortControllerRef.current = new AbortController()

        try {
            const selectedAccountId = String(selectedAccount || '').trim()
            const attachmentBinding = resolveAttachmentAccount()
            if (attachmentBinding.error) {
                setResponse({ success: false, error: attachmentBinding.error })
                onMessage('error', attachmentBinding.error)
                setLoading(false)
                setIsStreaming(false)
                return
            }
            if (attachmentBinding.accountId && selectedAccountId && selectedAccountId !== attachmentBinding.accountId) {
                const errorMsg = t('apiTester.fileAccountMismatch', { account: attachmentBinding.accountId })
                setResponse({ success: false, error: errorMsg })
                onMessage('error', errorMsg)
                setLoading(false)
                setIsStreaming(false)
                return
            }
            const requestAccount = selectedAccountId || attachmentBinding.accountId

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${effectiveKey}`,
            }
            if (requestAccount) {
                headers['X-Ds2-Target-Account'] = requestAccount
            }

            const body = {
                model,
                messages: [{ role: 'user', content: message }],
                stream: streamingMode,
            }
            
            if (attachedFiles && attachedFiles.length > 0) {
                body.file_ids = attachedFiles.map(f => f.id)
            }

            const endpoint = streamingMode ? '/v1/chat/completions' : '/v1/chat/completions?__go=1'
            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: abortControllerRef.current.signal,
            })

            if (!res.ok) {
                const errorMsg = await extractErrorMessage(res)
                setResponse({ success: false, error: errorMsg })
                onMessage('error', errorMsg)
                setLoading(false)
                setIsStreaming(false)
                return
            }

            if (streamingMode) {
                setResponse({ success: true, status_code: res.status })

                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''
                let accumulatedThinking = ''
                let accumulatedContent = ''
                let streamError = null

                streamLoop:
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        const trimmed = line.trim()
                        if (!trimmed || !trimmed.startsWith('data: ')) continue

                        const dataStr = trimmed.slice(6)
                        if (dataStr === '[DONE]') continue

                        try {
                            const json = JSON.parse(dataStr)
                            const errorPayload = extractStreamError(json)
                            if (errorPayload) {
                                streamError = errorPayload
                                break streamLoop
                            }
                            const choice = json.choices?.[0]
                            if (choice?.delta) {
                                const delta = choice.delta
                                if (delta.reasoning_content) {
                                    accumulatedThinking += delta.reasoning_content
                                    setStreamingThinking(prev => prev + delta.reasoning_content)
                                }
                                if (delta.content) {
                                    accumulatedContent += delta.content
                                    setStreamingContent(prev => prev + delta.content)
                                }
                            }
                        } catch (e) {
                            console.error('Invalid JSON hunk:', dataStr, e)
                        }
                    }
                }

                if (streamError) {
                    await reader.cancel().catch(() => {})
                    setStreamingContent('')
                    setStreamingThinking('')
                    setResponse({
                        success: false,
                        status_code: streamError.statusCode,
                        error: streamError.message,
                        code: streamError.code,
                        type: streamError.type,
                    })
                    onMessage('error', streamError.message)
                    setLoading(false)
                    setIsStreaming(false)
                    return
                }

                setResponse({
                    success: true,
                    status_code: res.status,
                    choices: [{
                        finish_reason: 'stop',
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: accumulatedContent,
                            reasoning_content: accumulatedThinking,
                        },
                    }],
                })
                onMessage('success', t('apiTester.requestSuccess', { account: requestAccount || selectedAccountId || 'Auto', time: Math.max(0, Date.now() - startedAt) }))
            } else {
                const data = await res.json()
                setResponse({ success: true, status_code: res.status, ...data })
                const elapsed = Math.max(0, Date.now() - startedAt)
                onMessage('success', t('apiTester.requestSuccess', { account: requestAccount || 'Auto', time: elapsed }))
            }
        } catch (e) {
            if (e.name === 'AbortError') {
                onMessage('info', t('messages.generationStopped'))
            } else {
                onMessage('error', t('apiTester.networkError', { error: e.message }))
                setResponse({ error: e.message, success: false })
            }
        } finally {
            setLoading(false)
            setIsStreaming(false)
            abortControllerRef.current = null
        }
    }, [
        abortControllerRef,
        attachedFiles,
        effectiveKey,
        extractErrorMessage,
        extractStreamError,
        message,
        model,
        onMessage,
        resolveAttachmentAccount,
        selectedAccount,
        setIsStreaming,
        setLoading,
        setResponse,
        setStreamingContent,
        setStreamingThinking,
        streamingMode,
        t,
    ])

    return {
        runTest,
        stopGeneration,
    }
}
