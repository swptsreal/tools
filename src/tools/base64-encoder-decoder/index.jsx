import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio, Upload } from 'antd'
import { Clipboard, Download, FileCode2, FileUp, RotateCcw } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { base64Example } from './example.js'
import './style.css'

const toolId = 'base64-encoder-decoder'

function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text)
    const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')
    return btoa(binary)
}

function decodeBase64(text) {
    const binary = atob(text.replace(/\s+/g, ''))
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0))
    return new TextDecoder().decode(bytes)
}

export default function Base64EncoderDecoderTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, base64Example))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [mode, setMode] = useState('Encode')

    useEffect(() => saveDraft(toolId, value), [value])

    const runEncode = () => {
        setResult(encodeBase64(value))
        setError('')
    }

    const runDecode = () => {
        try {
            setResult(decodeBase64(value))
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid Base64: ${err.message}`)
        }
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
        setValue(base64Example)
        setResult('')
        setError('')
    }

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".txt,.b64">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<FileCode2 size={16} />} type="primary" onClick={run}>Run</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'base64.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
        </>
    ), [mode, result, value])

    useToolActions(actions)

    return (
        <div className="tool-page encoder-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Mode</span>
                        <Radio.Group optionType="button" size="small" value={mode} onChange={(event) => setMode(event.target.value)} options={[{ label: 'Encode', value: 'Encode' }, { label: 'Decode', value: 'Decode' }]} />
                    </>
                )}
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="encoder-error">{error}</pre> : <FormatterOutput code={result} language="text" />}
            />
        </div>
    )
}
