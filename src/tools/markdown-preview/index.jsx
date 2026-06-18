import { useEffect, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp, RotateCcw } from 'lucide-react'
import { ToolHeader } from '../../shared/components/ToolHeader.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
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

    return (
        <div className="tool-page">
            <ToolHeader
                title="Markdown Preview"
                description="Write Markdown and preview output offline."
                actions={
                    <>
                        <Upload beforeUpload={openFile} showUploadList={false} accept=".md,.txt">
                            <Button icon={<FileUp size={16} />}>Open</Button>
                        </Upload>
                        <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
                        <Button icon={<Download size={16} />} onClick={() => downloadTextFile(value, 'document.md', 'text/markdown')}>Download</Button>
                        <Button icon={<RotateCcw size={16} />} onClick={() => setValue(markdownExample)}>Example</Button>
                    </>
                }
            />
            <SplitWorkspace
                left={
                    <Input.TextArea
                        className="tool-editor"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        spellCheck={false}
                    />
                }
                right={<MarkdownPreview value={value} />}
            />
        </div>
    )
}
