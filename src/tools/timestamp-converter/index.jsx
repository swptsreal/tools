import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message } from 'antd'
import { CalendarClock, Clipboard, Download, RotateCcw, TimerReset } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { timestampExample } from './example.js'
import './style.css'

const toolId = 'timestamp-converter'

function timestampToDate(value) {
    const numeric = Number(value.trim())
    if (!Number.isFinite(numeric)) throw new Error('Timestamp must be a number.')
    const milliseconds = Math.abs(numeric) < 100000000000 ? numeric * 1000 : numeric
    const date = new Date(milliseconds)
    if (Number.isNaN(date.getTime())) throw new Error('Timestamp is out of range.')
    return [`ISO: ${date.toISOString()}`, `UTC: ${date.toUTCString()}`, `Local: ${date.toString()}`].join('\n')
}

function dateToTimestamp(value) {
    const date = new Date(value.trim())
    if (Number.isNaN(date.getTime())) throw new Error('Date is invalid.')
    return [`Seconds: ${Math.floor(date.getTime() / 1000)}`, `Milliseconds: ${date.getTime()}`, `ISO: ${date.toISOString()}`].join('\n')
}

export default function TimestampConverterTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, timestampExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')

    useEffect(() => saveDraft(toolId, value), [value])

    const run = (converter) => {
        try {
            setResult(converter(value))
            setError('')
        } catch (err) {
            setResult('')
            setError(err.message)
        }
    }

    const fillNow = () => {
        setValue(String(Math.floor(Date.now() / 1000)))
        setResult('')
        setError('')
    }

    const copy = async () => {
        const copyResult = await copyText(result || value)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const resetExample = () => {
        setValue(timestampExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(() => (
        <>
            <Button icon={<CalendarClock size={16} />} type="primary" onClick={() => run(timestampToDate)}>Timestamp to Date</Button>
            <Button icon={<CalendarClock size={16} />} onClick={() => run(dateToTimestamp)}>Date to Timestamp</Button>
            <Button icon={<TimerReset size={16} />} onClick={fillNow}>Now</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'timestamp-conversion.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
        </>
    ), [result, value])

    useToolActions(actions)

    return (
        <div className="tool-page converter-page">
            <SplitWorkspace
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="converter-error">{error}</pre> : <FormatterOutput code={result} language="plain" />}
            />
        </div>
    )
}
