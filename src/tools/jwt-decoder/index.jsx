import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileCode2, FileUp, RotateCcw } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { jwtExample } from './example.js'
import './style.css'

const toolId = 'jwt-decoder'

function decodeBase64Url(part) {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - part.length % 4) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0))
    return new TextDecoder().decode(bytes)
}

function decodeJwt(token) {
    const [headerPart, payloadPart, signaturePart = ''] = token.trim().split('.')
    if (!headerPart || !payloadPart) throw new Error('JWT must contain header and payload segments')

    return JSON.stringify({
        header: JSON.parse(decodeBase64Url(headerPart)),
        payload: JSON.parse(decodeBase64Url(payloadPart)),
        signature: signaturePart
    }, null, 4)
}

export default function JwtDecoderTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, jwtExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')

    useEffect(() => saveDraft(toolId, value), [value])

    const runDecode = () => {
        try {
            setResult(decodeJwt(value))
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid JWT: ${err.message}`)
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
        setValue(jwtExample)
        setResult('')
        setError('')
    }

    const output = error ? (
        <pre className="encoder-error">{error}</pre>
    ) : (
        <div className="jwt-result">
            <p className="jwt-warning">Signature is decoded, not verified.</p>
            <FormatterOutput code={result} language="json" />
        </div>
    )

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".jwt,.txt">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<FileCode2 size={16} />} type="primary" onClick={runDecode}>Decode</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'jwt.json')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
        </>
    ), [result, value])

    useToolActions(actions)

    return (
        <div className="tool-page encoder-page">
            <SplitWorkspace
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={output}
            />
        </div>
    )
}
