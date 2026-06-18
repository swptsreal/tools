import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Braces, Clipboard, Download, FileUp, RotateCcw, Shrink } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { jsonExample } from './example.js'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import './style.css'

const toolId = 'json-formatter'

function formatJson(value, spacing) {
    return JSON.stringify(JSON.parse(value), null, spacing)
}

export default function JsonFormatterTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, jsonExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        saveDraft(toolId, value)
    }, [value])

    const run = (spacing) => {
        try {
            setResult(formatJson(value, spacing))
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid JSON: ${err.message}`)
        }
    }

    const openFile = async (file) => {
        setValue(await readTextFile(file))
        setResult('')
        setError('')
        message.success('Da mo file.')
        return false
    }

    const copy = async () => {
        const copyResult = await copyText(result || value)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const resetExample = () => {
        setValue(jsonExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(
        () => (
            <>
                <Upload beforeUpload={openFile} showUploadList={false} accept=".json,.txt">
                    <Button icon={<FileUp size={16} />}>Open</Button>
                </Upload>
                <Button icon={<Braces size={16} />} type="primary" onClick={() => run(4)}>Format</Button>
                <Button icon={<Shrink size={16} />} onClick={() => run(0)}>Minify</Button>
                <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
                <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'formatted.json', 'application/json')}>Download</Button>
                <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
            </>
        ),
        [result, value]
    )

    useToolActions(actions)

    return (
        <div className="tool-page formatter-page">
            <SplitWorkspace
                left={
                    <Input.TextArea
                        className="tool-editor"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        spellCheck={false}
                    />
                }
                right={error ? <pre className="formatter-error">{error}</pre> : <FormatterOutput code={result} language="json" />}
            />
        </div>
    )
}


