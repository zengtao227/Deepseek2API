export function getAttachedFileAccountIds(attachedFiles = []) {
    const ids = []
    const seen = new Set()

    for (const file of attachedFiles || []) {
        const raw = file?.account_id ?? file?.accountId ?? file?.owner_account_id ?? file?.ownerAccountId ?? ''
        const id = String(raw).trim()
        if (!id || seen.has(id)) continue
        seen.add(id)
        ids.push(id)
    }

    return ids
}

export function getAttachedFileAccountId(attachedFiles = []) {
    const ids = getAttachedFileAccountIds(attachedFiles)
    return ids.length > 0 ? ids[0] : ''
}
