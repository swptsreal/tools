import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp, RotateCcw } from 'lucide-react'
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

const toolId = 'markdown-preview'

export default function MarkdownPreviewTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, markdownExample))
    const [lineBreaks, setLineBreaks] = useState(false)
    const debouncedValue = useDebouncedValue(value, 300)

    useEffect(() => {
        saveDraft(toolId, value)
    }, [value])

    const openFile = async (file) => {
        setValue(await readTextFile(file))
        message.success('Đã mở file.')
        return false
    }

    const copy = async () => {
        const result = await copyText(value)
        message[result.ok ? 'success' : 'warning'](result.message)
    }

    const actions = useMemo(
        () => (
            <>
                <Upload beforeUpload={openFile} showUploadList={false} accept=".md,.txt">
                    <Button icon={<FileUp size={16} />}>Open</Button>
                </Upload>
                <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
                <Button icon={<Download size={16} />} onClick={() => downloadTextFile(value, 'document.md', 'text/markdown')}>Download</Button>
                <Button icon={<RotateCcw size={16} />} onClick={() => setValue(markdownExample)}>Example</Button>
            </>
        ),
        [value]
    )

    useToolActions(actions)

    return (
        <div className="tool-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <Checkbox checked={lineBreaks} onChange={(event) => setLineBreaks(event.target.checked)}>Line breaks</Checkbox>
                    </>
                )}
                left={
                    <FormatterInput language="markdown"
                        className="tool-editor"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        spellCheck={false}
                    />
                }
                right={<MarkdownPreview value={debouncedValue} />}
            />
        </div>
    )
}
