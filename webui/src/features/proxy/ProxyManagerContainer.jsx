import { useState } from 'react'
import { Pencil, Play, Plus, Shield, Trash2, X } from 'lucide-react'
import clsx from 'clsx'

import { useI18n } from '../../i18n'

async function readApiResponse(res, nonJsonMessage) {
    const contentType = String(res.headers.get('content-type') || '').toLowerCase()
    const raw = await res.text()
    const trimmed = raw.trim()

    if (!trimmed) {
        return {}
    }

    if (contentType.includes('application/json')) {
        try {
            return JSON.parse(trimmed)
        } catch (_err) {
            if (!res.ok) {
                return { detail: trimmed }
            }
            throw new Error(nonJsonMessage)
        }
    }

    if (!res.ok) {
        return { detail: trimmed }
    }

    throw new Error(nonJsonMessage)
}

const EMPTY_FORM = {
    name: '',
    type: 'socks5h',
    host: '',
    port: 1080,
    username: '',
    password: '',
}

function createEmptyProxyForm() {
    return { ...EMPTY_FORM }
}

function ProxyStatusBadge({ t, result, testing = false }) {
    if (testing) {
        return (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                {t('proxyManager.testing')}
            </span>
        )
    }
    if (!result) {
        return (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/20 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                {t('proxyManager.untested')}
            </span>
        )
    }
    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-medium',
                result.success
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                    : 'border-destructive/20 bg-destructive/10 text-destructive'
            )}
        >
            {result.success
                ? t('proxyManager.testSuccessShort', { time: result.response_time ?? 0 })
                : t('proxyManager.testFailedShort')}
        </span>
    )
}

function ProxiesTable({
    t,
    proxies,
    testing,
    testResults,
    onCreate,
    onTest,
    onEdit,
    onDelete,
}) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">{t('proxyManager.title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('proxyManager.desc')}</p>
                </div>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    {t('proxyManager.addProxy')}
                </button>
            </div>

            {proxies.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">{t('proxyManager.noProxies')}</div>
            ) : (
                <div className="divide-y divide-border">
                    {proxies.map((proxy) => {
                        const result = testResults[proxy.id]
                        return (
                            <div key={proxy.id} className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-muted/40 transition-colors">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="font-medium text-foreground">{proxy.name || `${proxy.host}:${proxy.port}`}</div>
                                        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-primary">
                                            {proxy.type}
                                        </span>
                                        {proxy.username && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/20 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                                                <Shield className="w-3 h-3" />
                                                {proxy.username}
                                            </span>
                                        )}
                                        <ProxyStatusBadge t={t} result={result} testing={testing[proxy.id]} />
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-mono bg-muted/30 px-2 py-1 rounded border border-border">
                                            {proxy.host}:{proxy.port}
                                        </span>
                                        {proxy.has_password && (
                                            <span className="rounded-full border border-border bg-muted/20 px-2 py-1 text-[10px]">
                                                {t('proxyManager.authEnabled')}
                                            </span>
                                        )}
                                        {result?.message && (
                                            <span className="truncate max-w-full">{result.message}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start lg:self-auto">
                                    <button
                                        onClick={() => onTest(proxy)}
                                        disabled={testing[proxy.id]}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border hover:bg-secondary transition-colors text-xs font-medium disabled:opacity-50"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        {t('proxyManager.testAction')}
                                    </button>
                                    <button
                                        onClick={() => onEdit(proxy)}
                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                        title={t('proxyManager.editProxy')}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(proxy)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                        title={t('proxyManager.deleteProxy')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function ProxyFormModal({
    show,
    t,
    form,
    setForm,
    editingProxy,
    loading,
    onClose,
    onSubmit,
}) {
    if (!show) {
        return null
    }

    const isEditing = Boolean(editingProxy?.id)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold">
                            {isEditing ? t('proxyManager.modalEditTitle') : t('proxyManager.modalAddTitle')}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('proxyManager.modalDesc')}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('proxyManager.nameLabel')}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('proxyManager.namePlaceholder')}
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('proxyManager.typeLabel')}</label>
                            <select
                                className="input-field"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="socks5">socks5</option>
                                <option value="socks5h">socks5h</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-[1fr_128px] gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('proxyManager.hostLabel')}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('proxyManager.hostPlaceholder')}
                                value={form.host}
                                onChange={e => setForm({ ...form, host: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('proxyManager.portLabel')}</label>
                            <input
                                type="number"
                                min="1"
                                max="65535"
                                className="input-field"
                                value={form.port}
                                onChange={e => setForm({ ...form, port: Number(e.target.value) || '' })}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('proxyManager.usernameLabel')}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('proxyManager.usernamePlaceholder')}
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('proxyManager.passwordLabel')}</label>
                            <input
                                type="password"
                                className="input-field bg-[#09090b]"
                                placeholder={t('proxyManager.passwordPlaceholder')}
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                            />
                            {isEditing && (
                                <p className="mt-1 text-[11px] text-muted-foreground">{t('proxyManager.passwordKeepHint')}</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                        {t('proxyManager.typeHelp')}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium"
                        >
                            {t('actions.cancel')}
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {loading
                                ? t('proxyManager.saving')
                                : (isEditing ? t('proxyManager.saveEdit') : t('proxyManager.saveAdd'))}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ProxyManagerContainer({ config, onRefresh, onMessage, authFetch }) {
    const { t } = useI18n()
    const apiFetch = authFetch || fetch

    const [showModal, setShowModal] = useState(false)
    const [editingProxy, setEditingProxy] = useState(null)
    const [form, setForm] = useState(createEmptyProxyForm())
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState({})
    const [testResults, setTestResults] = useState({})

    const proxies = config?.proxies || []

    const openCreate = () => {
        setEditingProxy(null)
        setForm(createEmptyProxyForm())
        setShowModal(true)
    }

    const openEdit = (proxy) => {
        setEditingProxy(proxy)
        setForm({
            name: proxy.name || '',
            type: proxy.type || 'socks5h',
            host: proxy.host || '',
            port: proxy.port || 1080,
            username: proxy.username || '',
            password: '',
        })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingProxy(null)
        setForm(createEmptyProxyForm())
    }

    const saveProxy = async () => {
        if (!form.host || !form.port) {
            onMessage('error', t('proxyManager.requiredFields'))
            return
        }
        setSaving(true)
        try {
            const url = editingProxy?.id
                ? `/admin/proxies/${encodeURIComponent(editingProxy.id)}`
                : '/admin/proxies'
            const method = editingProxy?.id ? 'PUT' : 'POST'
            const res = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    type: form.type,
                    host: form.host,
                    port: Number(form.port),
                    username: form.username,
                    password: form.password,
                }),
            })
            const data = await readApiResponse(res, t('settings.nonJsonResponse', { status: res.status }))
            if (!res.ok) {
                onMessage('error', data.detail || t('messages.requestFailed'))
                return
            }
            await onRefresh?.()
            onMessage('success', editingProxy?.id ? t('proxyManager.updateSuccess') : t('proxyManager.addSuccess'))
            closeModal()
        } catch (err) {
            onMessage('error', err?.message || t('messages.networkError'))
        } finally {
            setSaving(false)
        }
    }

    const deleteProxy = async (proxy) => {
        if (!confirm(t('proxyManager.deleteConfirm', { name: proxy.name || `${proxy.host}:${proxy.port}` }))) return
        try {
            const res = await apiFetch(`/admin/proxies/${encodeURIComponent(proxy.id)}`, { method: 'DELETE' })
            const data = await readApiResponse(res, t('settings.nonJsonResponse', { status: res.status }))
            if (!res.ok) {
                onMessage('error', data.detail || t('messages.deleteFailed'))
                return
            }
            await onRefresh?.()
            onMessage('success', t('messages.deleted'))
            setTestResults(prev => {
                const next = { ...prev }
                delete next[proxy.id]
                return next
            })
        } catch (err) {
            onMessage('error', err?.message || t('messages.networkError'))
        }
    }

    const testProxy = async (proxy) => {
        setTesting(prev => ({ ...prev, [proxy.id]: true }))
        try {
            const res = await apiFetch('/admin/proxies/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proxy_id: proxy.id }),
            })
            const data = await readApiResponse(res, t('settings.nonJsonResponse', { status: res.status }))
            setTestResults(prev => ({ ...prev, [proxy.id]: data }))
            onMessage(data.success ? 'success' : 'error', data.message || t('messages.requestFailed'))
        } catch (err) {
            onMessage('error', err?.message || t('messages.networkError'))
        } finally {
            setTesting(prev => ({ ...prev, [proxy.id]: false }))
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('proxyManager.totalProxies')}</div>
                    <div className="mt-2 text-2xl font-bold">{proxies.length}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('proxyManager.socks5hCount')}</div>
                    <div className="mt-2 text-2xl font-bold">{proxies.filter(proxy => proxy.type === 'socks5h').length}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('proxyManager.authProxyCount')}</div>
                    <div className="mt-2 text-2xl font-bold">{proxies.filter(proxy => proxy.username || proxy.has_password).length}</div>
                </div>
            </div>

            <ProxiesTable
                t={t}
                proxies={proxies}
                testing={testing}
                testResults={testResults}
                onCreate={openCreate}
                onTest={testProxy}
                onEdit={openEdit}
                onDelete={deleteProxy}
            />

            <ProxyFormModal
                show={showModal}
                t={t}
                form={form}
                setForm={setForm}
                editingProxy={editingProxy}
                loading={saving}
                onClose={closeModal}
                onSubmit={saveProxy}
            />
        </div>
    )
}
