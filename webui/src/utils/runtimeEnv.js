export function detectRuntimeEnv() {
    const deployTarget = String(import.meta.env.VITE_DEPLOY_TARGET || '').trim().toLowerCase()
    if (deployTarget === 'vercel') {
        return { isVercel: true, source: 'vite_env' }
    }

    const host = typeof window !== 'undefined' ? String(window.location.hostname || '').toLowerCase() : ''
    if (host.includes('vercel.app')) {
        return { isVercel: true, source: 'hostname' }
    }

    return { isVercel: false, source: 'default' }
}
