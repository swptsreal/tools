import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, message, Radio, Upload } from 'antd'
import { Clipboard, Download, FileCode2, FileSearch, FileUp, RotateCcw } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { urlExample } from './example.js'
import './style.css'

const toolId = 'url-encoder-decoder'

export default function UrlEncoderDecoderTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, urlExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [mode, setMode] = useState('Encode')
    const [plusAsSpace, setPlusAsSpace] = useState(true)

    useEffect(() => saveDraft(toolId, value), [value])

    const runEncode = () => {
        setResult(encodeURIComponent(value))
        setError('')
    }

    const runDecode = () => {
        try {
            setResult(decodeURIComponent(plusAsSpace ? value.replace(/\+/g, ' ') : value))
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid URL encoding: ${err.message}`)
        }
    }

    const run = () => {
        if (mode === 'Decode') {
            runDecode()
            return
        }
        if (mode === 'Pretty Query') {
            prettyQuery()
            return
        }
        runEncode()
    }

    const prettyQuery = () => {
        try {
            const url = value.includes('://') ? new URL(value) : new URL(`https://example.test/${value.replace(/^\?/, '?')}`)
            const params = Array.from(url.searchParams.entries())
            setResult(params.map(([key, item]) => `${key}: ${item}`).join('\n'))
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid URL: ${err.message}`)
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
        setValue(urlExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".txt,.url">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<FileCode2 size={16} />} type="primary" onClick={run}>Run</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'url.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
        </>
    ), [mode, plusAsSpace, result, value])

    useToolActions(actions)

    return (
        <div className="tool-page encoder-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Mode</span>
                        <Radio.Group optionType="button" size="small" value={mode} onChange={(event) => setMode(event.target.value)} options={[{ label: 'Encode', value: 'Encode' }, { label: 'Decode', value: 'Decode' }, { label: 'Pretty Query', value: 'Pretty Query' }]} />
                        <Checkbox checked={plusAsSpace} onChange={(event) => setPlusAsSpace(event.target.checked)}>Plus as space</Checkbox>
                    </>
                )}
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="encoder-error">{error}</pre> : <FormatterOutput code={result} language="text" />}
            />
        </div>
    )
}
