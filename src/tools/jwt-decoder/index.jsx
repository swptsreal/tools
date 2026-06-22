import { useMemo, useState } from 'react'
import { Button, message, Radio, Upload } from 'antd'
import { Clipboard, Download, FileCode2, FileUp } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { useDraft } from '../../shared/hooks/useDraft.js'
import { jwtExample } from './example.js'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'jwt-decoder'

function decodeBase64Url(part) {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - part.length % 4) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0))
    return new TextDecoder().decode(bytes)
}

function decodeJwt(token, section = 'All') {
    const [headerPart, payloadPart, signaturePart = ''] = token.trim().split('.')
    if (!headerPart || !payloadPart) throw new Error('JWT must contain header and payload segments')

    const decoded = {
        header: JSON.parse(decodeBase64Url(headerPart)),
        payload: JSON.parse(decodeBase64Url(payloadPart)),
        signature: signaturePart
    }
    if (section === 'Payload only') return JSON.stringify(decoded.payload, null, 4)
    if (section === 'Header only') return JSON.stringify(decoded.header, null, 4)
    return JSON.stringify(decoded, null, 4)
}

export default function JwtDecoderTool() {
    const [value, setValue] = useDraft(toolId, jwtExample)
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [section, setSection] = useState('All')

    const runDecode = () => {
        try {
            setResult(decodeJwt(value, section))
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
            <RevertExample onClick={resetExample} />
        </>
    ), [result, section, value])

    useToolActions(actions)

    return (
        <div className="tool-page encoder-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Section</span>
                        <Radio.Group optionType="button" size="small" value={section} onChange={(event) => setSection(event.target.value)} options={[{ label: 'All', value: 'All' }, { label: 'Header only', value: 'Header only' }, { label: 'Payload only', value: 'Payload only' }]} />
                    </>
                )}
                left={<FormatterInput language="text" className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={output}
            />
        </div>
    )
}
