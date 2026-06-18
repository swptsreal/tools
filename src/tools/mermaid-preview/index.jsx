import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp, RotateCcw } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue.js'
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
                <Upload beforeUpload={openFile} showUploadList={false} accept=".mmd,.txt,.md">
                    <Button icon={<FileUp size={16} />}>Open</Button>
                </Upload>
                <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
                <Button icon={<Download size={16} />} onClick={() => downloadTextFile(value, 'diagram.mmd')}>Download</Button>
                <Button icon={<RotateCcw size={16} />} onClick={() => setValue(mermaidExample)}>Example</Button>
            </>
        ),
        [value]
    )

    useToolActions(actions)

    return (
        <div className="tool-page">
            <SplitWorkspace
                left={
                    <Input.TextArea
                        className="tool-editor"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        spellCheck={false}
                    />
                }
                right={<MermaidPreview value={debouncedValue} />}
            />
        </div>
    )
}
