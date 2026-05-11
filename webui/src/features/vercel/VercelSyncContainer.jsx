import { useI18n } from '../../i18n'
import { useVercelSyncState } from './useVercelSyncState'
import VercelSyncForm from './VercelSyncForm'
import VercelSyncStatus from './VercelSyncStatus'
import VercelGuide from './VercelGuide'

export default function VercelSyncContainer({ onMessage, authFetch, isVercel = false, config = null }) {
    const { t } = useI18n()
    const apiFetch = authFetch || fetch

    const {
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
    } = useVercelSyncState({
        apiFetch,
        onMessage,
        t,
        isVercel,
        config,
    })

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto h-[calc(100vh-140px)]">
            <VercelSyncForm
                t={t}
                syncStatus={syncStatus}
                pollPaused={pollPaused}
                pollFailures={pollFailures}
                onManualRefresh={handleManualRefresh}
                preconfig={preconfig}
                vercelToken={vercelToken}
                setVercelToken={setVercelToken}
                projectId={projectId}
                setProjectId={setProjectId}
                teamId={teamId}
                setTeamId={setTeamId}
                saveCredentials={saveCredentials}
                setSaveCredentials={setSaveCredentials}
                loading={loading}
                onSync={handleSync}
            />

            <div className="space-y-6">
                <VercelSyncStatus t={t} result={result} />
                <VercelGuide t={t} />
            </div>
        </div>
    )
}
