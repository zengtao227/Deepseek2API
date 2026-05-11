import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

import { useI18n } from '../../i18n'
import { useApiTesterState } from './useApiTesterState'
import { useChatStreamClient } from './useChatStreamClient'
import ConfigPanel from './ConfigPanel'
import ChatPanel from './ChatPanel'

function describeModel(t, modelID) {
    const noThinking = modelID.endsWith('-nothinking')

    let description = t('apiTester.models.generic')
    if (modelID.includes('vision')) {
        description = t('apiTester.models.vision')
    } else if (modelID.includes('pro-search')) {
        description = t('apiTester.models.proSearch')
    } else if (modelID.includes('pro')) {
        description = t('apiTester.models.pro')
    } else if (modelID.includes('flash-search')) {
        description = t('apiTester.models.flashSearch')
    } else if (modelID.includes('flash')) {
        description = t('apiTester.models.flash')
    }

    if (noThinking) {
        return `${description} · ${t('apiTester.models.noThinking')}`
    }
    return description
}

function decorateModel(t, modelID) {
    const isVision = modelID.includes('vision')
    const isSearch = modelID.includes('search')
    const isPro = modelID.includes('pro')

    if (isVision && isSearch) {
        return {
            id: modelID,
            name: modelID,
            icon: 'ImageIcon',
            desc: describeModel(t, modelID),
            color: 'text-fuchsia-600',
        }
    }
    if (isVision) {
        return {
            id: modelID,
            name: modelID,
            icon: 'ImageIcon',
            desc: describeModel(t, modelID),
            color: 'text-violet-500',
        }
    }
    if (isSearch) {
        return {
            id: modelID,
            name: modelID,
            icon: 'SearchIcon',
            desc: describeModel(t, modelID),
            color: isPro ? 'text-cyan-600' : 'text-cyan-500',
        }
    }
    return {
        id: modelID,
        name: modelID,
        icon: isPro ? 'Cpu' : 'MessageSquare',
        desc: describeModel(t, modelID),
        color: isPro ? 'text-amber-600' : 'text-amber-500',
    }
}

export default function ApiTesterContainer({ config, onMessage, authFetch }) {
    const { t } = useI18n()
    const [availableModelIDs, setAvailableModelIDs] = useState([])
    const [modelsLoaded, setModelsLoaded] = useState(false)

    const {
        model,
        setModel,
        message,
        setMessage,
        attachedFiles,
        setAttachedFiles,
        apiKey,
        setApiKey,
        selectedAccount,
        setSelectedAccount,
        response,
        setResponse,
        loading,
        setLoading,
        streamingContent,
        setStreamingContent,
        streamingThinking,
        setStreamingThinking,
        isStreaming,
        setIsStreaming,
        streamingMode,
        setStreamingMode,
        configExpanded,
        setConfigExpanded,
        abortControllerRef,
    } = useApiTesterState({ t })

    const accounts = config.accounts || []
    const resolveAccountIdentifier = (acc) => {
        if (!acc || typeof acc !== 'object') return ''
        return String(acc.identifier || acc.email || acc.mobile || '').trim()
    }
    const configuredKeys = config.keys || []
    const trimmedApiKey = apiKey.trim()
    const defaultKey = configuredKeys[0] || ''
    const effectiveKey = trimmedApiKey || defaultKey
    const customKeyActive = trimmedApiKey !== ''
    const customKeyManaged = customKeyActive && configuredKeys.includes(trimmedApiKey)

    useEffect(() => {
        let disposed = false

        async function loadModels() {
            try {
                const res = await authFetch('/v1/models')
                if (!res.ok) {
                    throw new Error(`failed to fetch models: ${res.status}`)
                }
                const data = await res.json()
                const modelIDs = Array.isArray(data?.data)
                    ? data.data
                        .map((item) => String(item?.id || '').trim())
                        .filter(Boolean)
                    : []
                if (!disposed) {
                    setAvailableModelIDs(modelIDs)
                }
            } catch (_err) {
                if (!disposed) {
                    setAvailableModelIDs([])
                }
            } finally {
                if (!disposed) {
                    setModelsLoaded(true)
                }
            }
        }

        setModelsLoaded(false)
        loadModels()
        return () => {
            disposed = true
        }
    }, [authFetch])

    const models = useMemo(
        () => availableModelIDs.map((modelID) => decorateModel(t, modelID)),
        [availableModelIDs, t]
    )

    useEffect(() => {
        if (!models.length) {
            if (model) {
                setModel('')
            }
            return
        }
        if (!model || !models.some((item) => item.id === model)) {
            setModel(models[0].id)
        }
    }, [model, models, setModel])

    const { runTest, stopGeneration } = useChatStreamClient({
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
    })

    return (
        <div className={clsx('flex flex-col lg:grid lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-0')}>
            <ConfigPanel
                t={t}
                configExpanded={configExpanded}
                setConfigExpanded={setConfigExpanded}
                models={models}
                model={model}
                setModel={setModel}
                modelsLoaded={modelsLoaded}
                streamingMode={streamingMode}
                setStreamingMode={setStreamingMode}
                selectedAccount={selectedAccount}
                setSelectedAccount={setSelectedAccount}
                accounts={accounts}
                resolveAccountIdentifier={resolveAccountIdentifier}
                apiKey={apiKey}
                setApiKey={setApiKey}
                config={config}
                customKeyActive={customKeyActive}
                customKeyManaged={customKeyManaged}
            />

            <ChatPanel
                t={t}
                message={message}
                setMessage={setMessage}
                attachedFiles={attachedFiles}
                setAttachedFiles={setAttachedFiles}
                setSelectedAccount={setSelectedAccount}
                effectiveKey={effectiveKey}
                selectedAccount={selectedAccount}
                model={model}
                onMessage={onMessage}
                response={response}
                isStreaming={isStreaming}
                loading={loading}
                streamingThinking={streamingThinking}
                streamingContent={streamingContent}
                onRunTest={runTest}
                onStopGeneration={stopGeneration}
                hasAvailableModel={models.length > 0}
            />
        </div>
    )
}
