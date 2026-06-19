import { useMemo, useState } from 'react'
import { Button, InputNumber, message } from 'antd'
import { BadgePlus, Clipboard, Download, RotateCcw } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { uuidExample } from './example.js'
import './style.css'

function generateUuid() {
    if (crypto.randomUUID) {
        return crypto.randomUUID()
    }

    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}

export default function UuidGeneratorTool() {
    const [count, setCount] = useState(Number(uuidExample))
    const [result, setResult] = useState('')

    const generate = () => {
        const safeCount = Math.min(Math.max(Number(count) || 1, 1), 100)
        setResult(Array.from({ length: safeCount }, generateUuid).join('\n'))
    }

    const copy = async () => {
        const copyResult = await copyText(result)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const reset = () => {
        setCount(Number(uuidExample))
        setResult('')
    }

    const actions = useMemo(() => (
        <>
            <Button icon={<BadgePlus size={16} />} type="primary" onClick={generate}>Generate UUIDs</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result, 'uuids.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={reset}>Reset</Button>
        </>
    ), [count, result])

    useToolActions(actions)

    return (
        <div className="tool-page generator-page">
            <SplitWorkspace
                left={(
                    <div className="generator-form">
                        <label className="generator-field">
                            <span>Count</span>
                            <InputNumber min={1} max={100} value={count} onChange={(value) => setCount(value ?? 1)} />
                        </label>
                        <Button type="primary" icon={<BadgePlus size={16} />} onClick={generate}>Generate UUIDs</Button>
                    </div>
                )}
                right={<FormatterOutput code={result} language="text" />}
            />
        </div>
    )
}
