import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
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

    useEffect(() => saveDraft(toolId, value), [value])

    const runEncode = () => {
        setResult(encodeURIComponent(value))
        setError('')
    }

    const runDecode = () => {
        try {
            setResult(decodeURIComponent(value.replace(/\+/g, ' ')))
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid URL encoding: ${err.message}`)
        }
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
            <Button icon={<FileCode2 size={16} />} type="primary" onClick={runEncode}>Encode</Button>
            <Button icon={<FileCode2 size={16} />} onClick={runDecode}>Decode</Button>
            <Button icon={<FileSearch size={16} />} onClick={prettyQuery}>Pretty Query</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'url.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
        </>
    ), [result, value])

    useToolActions(actions)

    return (
        <div className="tool-page encoder-page">
            <SplitWorkspace
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="encoder-error">{error}</pre> : <FormatterOutput code={result} language="text" />}
            />
        </div>
    )
}
