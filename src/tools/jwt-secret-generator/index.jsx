import { useMemo, useState } from 'react'
import { Button, InputNumber, message } from 'antd'
import { Clipboard, Download, KeyRound, RotateCcw } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { jwtSecretDefaults } from './example.js'
import './style.css'

function toBase64Url(bytes) {
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function generateSecret(byteLength) {
    const bytes = new Uint8Array(Math.min(Math.max(Number(byteLength) || 32, 16), 128))
    crypto.getRandomValues(bytes)
    return toBase64Url(bytes)
}

export default function JwtSecretGeneratorTool() {
    const [bytes, setBytes] = useState(jwtSecretDefaults.bytes)
    const [result, setResult] = useState('')

    const generate = () => setResult(generateSecret(bytes))

    const copy = async () => {
        const copyResult = await copyText(result)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const reset = () => {
        setBytes(jwtSecretDefaults.bytes)
        setResult('')
    }

    const actions = useMemo(() => (
        <>
            <Button icon={<KeyRound size={16} />} type="primary" onClick={generate}>Generate Secret</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result, 'jwt-secret.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={reset}>Reset</Button>
        </>
    ), [bytes, result])

    useToolActions(actions)

    return (
        <div className="tool-page generator-page">
            <SplitWorkspace
                left={(
                    <div className="generator-form">
                        <label className="generator-field">
                            <span>Bytes</span>
                            <InputNumber min={16} max={128} value={bytes} onChange={(value) => setBytes(value ?? 32)} />
                        </label>
                        <Button type="primary" icon={<KeyRound size={16} />} onClick={generate}>Generate Secret</Button>
                    </div>
                )}
                right={<FormatterOutput code={result} language="text" />}
            />
        </div>
    )
}
