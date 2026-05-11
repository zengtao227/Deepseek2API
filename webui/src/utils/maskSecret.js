export function maskSecret(secret) {
    const value = String(secret ?? '')
    if (!value) {
        return ''
    }
    if (value.length <= 4) {
        return '*'.repeat(value.length)
    }
    return `${value.slice(0, 2)}****${value.slice(-2)}`
}
