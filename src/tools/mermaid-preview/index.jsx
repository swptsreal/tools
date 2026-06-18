import { useEffect, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp, RotateCcw } from 'lucide-react'
import { ToolHeader } from '../../shared/components/ToolHeader.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { mermaidExample } from './example.js'
import { MermaidPreview } from './Preview.jsx'
import './style.css'

const toolId = 'mermaid-preview'

export default function MermaidPreviewTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, mermaidExample))

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
                title="Mermaid Preview"
                description="Write and preview Mermaid diagrams offline."
                actions={
                    <>
                        <Upload beforeUpload={openFile} showUploadList={false} accept=".mmd,.txt,.md">
                            <Button icon={<FileUp size={16} />}>Open</Button>
                        </Upload>
                        <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
                        <Button icon={<Download size={16} />} onClick={() => downloadTextFile(value, 'diagram.mmd')}>Download</Button>
                        <Button icon={<RotateCcw size={16} />} onClick={() => setValue(mermaidExample)}>Example</Button>
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
                right={<MermaidPreview value={value} />}
            />
        </div>
    )
}
