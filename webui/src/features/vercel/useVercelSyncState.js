import { useCallback, useEffect, useState } from 'react'

const MAX_POLL_FAILURES = 3

function pollDelayMs(attempt) {
    if (attempt <= 0) return 15000
    if (attempt === 1) return 30000
    return 60000
}

export function useVercelSyncState({ apiFetch, onMessage, t, isVercel = false }) {
    const [vercelToken, setVercelToken] = useState('')
    const [projectId, setProjectId] = useState('')
    const [teamId, setTeamId] = useState('')
    const [saveCredentials, setSaveCredentials] = useState(true)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [preconfig, setPreconfig] = useState(null)
    const [syncStatus, setSyncStatus] = useState(null)
    const [pollPaused, setPollPaused] = useState(false)
    const [pollFailures, setPollFailures] = useState(0)
    const [nextRetryAt, setNextRetryAt] = useState(null)

    const fetchSyncStatus = useCallback(async ({ manual = false } = {}) => {
        try {
            const res = await apiFetch('/admin/vercel/status')
            if (!res.ok) {
                throw new Error(`status ${res.status}`)
            }
            const data = await res.json()
            setSyncStatus(data)
            setPollFailures(0)
            setPollPaused(false)
            setNextRetryAt(null)
        } catch (e) {
            setPollFailures((prev) => {
                const next = prev + 1
                if (isVercel) {
                    if (next >= MAX_POLL_FAILURES) {
                        setPollPaused(true)
                        setNextRetryAt(null)
                    } else {
                        setNextRetryAt(Date.now() + pollDelayMs(next))
                    }
                }
                return next
            })
            if (manual) {
                onMessage('error', t('vercel.networkError'))
            }
            // eslint-disable-next-line no-console
            console.error('Failed to fetch sync status:', e)
        }
    }, [apiFetch, isVercel, onMessage, t])

    useEffect(() => {
        const loadPreconfig = async () => {
            try {
                const res = await apiFetch('/admin/vercel/config')
                if (res.ok) {
                    const data = await res.json()
                    setPreconfig(data)
                    if (data.project_id) setProjectId(data.project_id)
                    if (data.team_id) setTeamId(data.team_id)
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to load preconfig:', e)
            }
        }
        loadPreconfig()
        fetchSyncStatus()
    }, [apiFetch, fetchSyncStatus])

    useEffect(() => {
        if (!isVercel) {
            const interval = setInterval(() => {
                fetchSyncStatus()
            }, 15000)
            return () => clearInterval(interval)
        }
        if (pollPaused) {
            return undefined
        }
        const delay = nextRetryAt && nextRetryAt > Date.now() ? nextRetryAt - Date.now() : pollDelayMs(pollFailures)
        const timer = setTimeout(() => {
            fetchSyncStatus()
        }, Math.max(1000, delay))
        return () => clearTimeout(timer)
    }, [fetchSyncStatus, isVercel, nextRetryAt, pollFailures, pollPaused])

    const handleManualRefresh = useCallback(() => {
        setPollPaused(false)
        setPollFailures(0)
        setNextRetryAt(null)
        fetchSyncStatus({ manual: true })
    }, [fetchSyncStatus])

    const handleSync = useCallback(async () => {
        const tokenToUse = preconfig?.has_token && !vercelToken ? '__USE_PRECONFIG__' : vercelToken

        if (!tokenToUse && !preconfig?.has_token) {
            onMessage('error', t('vercel.tokenRequired'))
            return
        }
        if (!projectId) {
            onMessage('error', t('vercel.projectRequired'))
            return
        }

        setLoading(true)
        setResult(null)
        try {
            const res = await apiFetch('/admin/vercel/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vercel_token: tokenToUse,
                    project_id: projectId,
                    team_id: teamId || undefined,
                    save_credentials: saveCredentials,
                }),
            })
            const data = await res.json()
            if (res.ok) {
                setResult({ ...data, success: true })
                onMessage('success', data.message)
                fetchSyncStatus()
            } else {
                setResult({ ...data, success: false })
                onMessage('error', data.detail || t('vercel.syncFailed'))
            }
        } catch (_e) {
            onMessage('error', t('vercel.networkError'))
        } finally {
            setLoading(false)
        }
    }, [apiFetch, fetchSyncStatus, onMessage, preconfig?.has_token, projectId, saveCredentials, t, teamId, vercelToken])

    return {
        vercelToken,
        setVercelToken,
        projectId,
        setProjectId,
        teamId,
        setTeamId,
        saveCredentials,
        setSaveCredentials,
        loading,
        result,
        preconfig,
        syncStatus,
        pollPaused,
        pollFailures,
        handleManualRefresh,
        handleSync,
    }
}
