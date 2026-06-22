import pako from 'pako'

export const serializeState = (state) => {
    try {
        const jsonStr = JSON.stringify(state)
        const compressed = pako.deflate(jsonStr, { level: 9 })
        return uint8ArrayToBase64Url(compressed)
    } catch (e) {
        console.error('Failed to serialize state:', e)
        return ''
    }
}

export const deserializeState = (hash) => {
    try {
        let cleanHash = hash
        if (cleanHash.startsWith('#')) {
            cleanHash = cleanHash.substring(1)
        }
        if (cleanHash.startsWith('pako:')) {
            cleanHash = cleanHash.substring(5)
        }
        if (!cleanHash) return null

        const bytes = base64UrlToUint8Array(cleanHash)
        const decompressed = pako.inflate(bytes, { to: 'string' })
        return JSON.parse(decompressed)
    } catch (e) {
        console.error('Failed to deserialize state:', e)
        return null
    }
}

function uint8ArrayToBase64Url(uint8Array) {
    let binString = ''
    const len = uint8Array.length
    for (let i = 0; i < len; i++) {
        binString += String.fromCharCode(uint8Array[i])
    }
    return btoa(binString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

function base64UrlToUint8Array(base64url) {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
        base64 += '='
    }
    const binString = atob(base64)
    const len = binString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binString.charCodeAt(i)
    }
    return bytes
}
