import { useEffect, useMemo, useState } from 'react'
import { Button, message, Popover, Radio, Upload } from 'antd'
import { Clipboard, Download, FileUp, RotateCcw, Share2 } from 'lucide-react'
import pako from 'pako'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue.js'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { mermaidExample } from './example.js'
import { MermaidPreview } from './Preview.jsx'
import './style.css'
import RevertExample from '../../shared/components/RevertExample.jsx'

const toolId = 'mermaid-preview'

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

const serializeState = (code, theme) => {
    try {
        const state = {
            code: code,
            mermaid: JSON.stringify({ theme: theme.toLowerCase() }),
            autoSync: true
        }
        const jsonStr = JSON.stringify(state)
        const compressed = pako.deflate(jsonStr, { level: 9 })
        return uint8ArrayToBase64Url(compressed)
    } catch (e) {
        console.error('Failed to serialize state:', e)
        return ''
    }
}

const deserializeState = (hash) => {
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

const getInitialState = () => {
    if (window.location.hash) {
        const state = deserializeState(window.location.hash)
        if (state && typeof state.code === 'string') {
            let parsedTheme = 'Default'
            if (state.mermaid) {
                try {
                    let mermaidConfig = state.mermaid
                    if (typeof mermaidConfig === 'string') {
                        const normalized = mermaidConfig.replace(/'/g, '"')
                        mermaidConfig = JSON.parse(normalized)
                    }
                    if (mermaidConfig && mermaidConfig.theme === 'dark') {
                        parsedTheme = 'Dark'
                    }
                } catch (e) {
                    console.error('Failed to parse theme from hash:', e)
                }
            }
            return { code: state.code, theme: parsedTheme }
        }
    }
    const draft = loadDraft(toolId, mermaidExample)
    return { code: draft, theme: 'Default' }
}

export default function MermaidPreviewTool() {
    const [initialState] = useState(() => getInitialState())
    const [value, setValue] = useState(initialState.code)
    const [theme, setTheme] = useState(initialState.theme)
    const debouncedValue = useDebouncedValue(value, 300)

    useEffect(() => {
        saveDraft(toolId, value)
    }, [value])

    useEffect(() => {
        if (debouncedValue) {
            const base64url = serializeState(debouncedValue, theme)
            if (base64url) {
                window.history.replaceState(null, '', `#pako:${base64url}`)
            }
        } else {
            window.history.replaceState(null, '', window.location.pathname)
        }
    }, [debouncedValue, theme])

    const openFile = async (file) => {
        setValue(await readTextFile(file))
        message.success('Đã mở file.')
        return false
    }

    const copy = async () => {
        const result = await copyText(value)
        message[result.ok ? 'success' : 'warning'](result.message)
    }

    const share = async () => {
        const result = await copyText(window.location.href)
        message[result.ok ? 'success' : 'warning'](
            result.ok ? 'Đã sao chép liên kết chia sẻ.' : result.message
        )
    }

    const actions = useMemo(
        () => (
            <>
                <Upload
                    beforeUpload={openFile}
                    showUploadList={false}
                    accept=".mmd,.txt,.md"
                >
                    <Button icon={<FileUp size={16} />}>Open</Button>
                </Upload>
                <Button icon={<Clipboard size={16} />} onClick={copy}>
                    Copy
                </Button>
                <Button
                    icon={<Download size={16} />}
                    onClick={() => downloadTextFile(value, 'diagram.mmd')}
                >
                    Download
                </Button>
                <RevertExample onClick={() => setValue(mermaidExample)} />
                <Button
                    type="primary"
                    icon={<Share2 size={16} />}
                    onClick={share}
                >
                    Share
                </Button>
            </>
        ),
        [value, theme]
    )

    useToolActions(actions)

    return (
        <div className="tool-page">
            <SplitWorkspace
                leftToolbar={
                    <>
                        <span className="tool-function-label">Theme</span>
                        <Radio.Group
                            optionType="button"
                            size="small"
                            value={theme}
                            onChange={(event) => setTheme(event.target.value)}
                            options={[
                                { label: 'Default', value: 'Default' },
                                { label: 'Dark', value: 'Dark' }
                            ]}
                        />
                    </>
                }
                left={
                    <FormatterInput
                        language="text"
                        className="tool-editor"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        spellCheck={false}
                    />
                }
                right={<MermaidPreview value={debouncedValue} theme={theme} />}
            />
        </div>
    )
}
