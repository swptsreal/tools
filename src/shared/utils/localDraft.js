const prefix = 'useful-tools:draft:'

export function loadDraft(toolId, fallback = '') {
    return localStorage.getItem(`${prefix}${toolId}`) || fallback
}

export function saveDraft(toolId, value) {
    localStorage.setItem(`${prefix}${toolId}`, value)
}

export function clearDraft(toolId) {
    localStorage.removeItem(`${prefix}${toolId}`)
}
