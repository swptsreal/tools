import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio, Upload } from 'antd'
import { Clipboard, Download, FileCode2, FileUp } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { htmlEntityExample } from './example.js'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'html-entity-encoder-decoder'
const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}

function encodeEntities(text, style = 'Named') {
    if (style === 'Numeric') {
        return text.replace(/[&<>"']/g, (char) => `&#${char.codePointAt(0)};`)
    }
    return text.replace(/[&<>"']/g, (char) => entityMap[char])
}

function decodeEntities(text) {
    const parser = new DOMParser()
    const document = parser.parseFromString(`<!doctype html><body>${text}`, 'text/html')
    return document.body.textContent || ''
}

export default function HtmlEntityEncoderDecoderTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, htmlEntityExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [mode, setMode] = useState('Encode')
    const [entityStyle, setEntityStyle] = useState('Named')

    useEffect(() => saveDraft(toolId, value), [value])

    const runEncode = () => {
        setResult(encodeEntities(value, entityStyle))
        setError('')
    }

    const runDecode = () => {
        setResult(decodeEntities(value))
        setError('')
    }

    const run = () => {
        if (mode === 'Decode') {
            runDecode()
            return
        }
        runEncode()
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
        setValue(htmlEntityExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".html,.txt">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<FileCode2 size={16} />} type="primary" onClick={run}>Run</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'html-entities.txt')}>Download</Button>
            <RevertExample onClick={resetExample} />
        </>
    ), [entityStyle, mode, result, value])

    useToolActions(actions)

    return (
        <div className="tool-page encoder-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Mode</span>
                        <Radio.Group optionType="button" size="small" value={mode} onChange={(event) => setMode(event.target.value)} options={[{ label: 'Encode', value: 'Encode' }, { label: 'Decode', value: 'Decode' }]} />
                        <span className="tool-function-label">Entity style</span>
                        <Radio.Group optionType="button" size="small" value={entityStyle} onChange={(event) => setEntityStyle(event.target.value)} options={[{ label: 'Named', value: 'Named' }, { label: 'Numeric', value: 'Numeric' }]} />
                    </>
                )}
                left={<FormatterInput language="html" className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="encoder-error">{error}</pre> : <FormatterOutput code={result} language="html" />}
            />
        </div>
    )
}
