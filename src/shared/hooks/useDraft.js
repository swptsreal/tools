import { useEffect, useRef, useState } from 'react'
import { loadDraft, saveDraft } from '../utils/localDraft.js'

export function useDraft(toolId, fallback = '') {
    const [value, setValue] = useState(() => loadDraft(toolId, fallback))
    const saveRef = useRef(null)

    useEffect(() => {
        clearTimeout(saveRef.current)
        saveRef.current = setTimeout(() => saveDraft(toolId, value), 500)
        return () => clearTimeout(saveRef.current)
    }, [toolId, value])

    return [value, setValue]
}
