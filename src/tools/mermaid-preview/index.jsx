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
import { deserializeState, serializeState } from '../../shared/utils/share.js'

const toolId = 'mermaid-preview'

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
            const base64url = serializeState({
                code: debouncedValue,
                mermaid: JSON.stringify({ theme: theme.toLowerCase() }),
                autoSync: true
            })
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
