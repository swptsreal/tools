import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp, RotateCcw, Share2 } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue.js'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { markdownExample } from './example.js'
import { MarkdownPreview } from './Preview.jsx'
import './markdown.css'
import './style.css'
import RevertExample from '../../shared/components/RevertExample.jsx'
import { deserializeState, serializeState } from '../../shared/utils/share.js'

const toolId = 'markdown-preview'

const getInitialState = () => {
    if (window.location.hash) {
        const state = deserializeState(window.location.hash)
        if (state && typeof state.code === 'string') {
            return {
                code: state.code,
                lineBreaks:
                    typeof state.lineBreaks === 'boolean'
                        ? state.lineBreaks
                        : false
            }
        }
    }
    const draft = loadDraft(toolId, markdownExample)
    return { code: draft, lineBreaks: false }
}

export default function MarkdownPreviewTool() {
    const [initialState] = useState(() => getInitialState())
    const [value, setValue] = useState(initialState.code)
    const [lineBreaks, setLineBreaks] = useState(initialState.lineBreaks)
    const debouncedValue = useDebouncedValue(value, 300)

    useEffect(() => {
        saveDraft(toolId, value)
    }, [value])

    useEffect(() => {
        if (debouncedValue) {
            const base64url = serializeState({
                code: debouncedValue,
                lineBreaks: lineBreaks
            })
            if (base64url) {
                window.history.replaceState(null, '', `#pako:${base64url}`)
            }
        } else {
            window.history.replaceState(null, '', window.location.pathname)
        }
    }, [debouncedValue, lineBreaks])

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
                    accept=".md,.txt"
                >
                    <Button icon={<FileUp size={16} />}>Open</Button>
                </Upload>
                <Button icon={<Clipboard size={16} />} onClick={copy}>
                    Copy
                </Button>
                <Button
                    icon={<Download size={16} />}
                    onClick={() =>
                        downloadTextFile(value, 'document.md', 'text/markdown')
                    }
                >
                    Download
                </Button>
                <RevertExample onClick={() => setValue(markdownExample)} />
                <Button
                    type="primary"
                    icon={<Share2 size={16} />}
                    onClick={share}
                >
                    Share
                </Button>
            </>
        ),
        [value]
    )

    useToolActions(actions)

    return (
        <div className="tool-page">
            <SplitWorkspace
                leftToolbar={
                    <>
                        <Checkbox
                            checked={lineBreaks}
                            onChange={(event) =>
                                setLineBreaks(event.target.checked)
                            }
                        >
                            Line breaks
                        </Checkbox>
                    </>
                }
                left={
                    <FormatterInput
                        language="markdown"
                        className="tool-editor"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        spellCheck={false}
                    />
                }
                right={
                    <MarkdownPreview
                        value={debouncedValue}
                        lineBreaks={lineBreaks}
                    />
                }
            />
        </div>
    )
}
