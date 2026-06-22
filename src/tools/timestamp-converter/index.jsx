import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio } from 'antd'
import { CalendarClock, Clipboard, Download, TimerReset } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { timestampExample } from './example.js'
import RevertExample from '../../shared/components/RevertExample.jsx'
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
    const [direction, setDirection] = useState('Timestamp to Date')
    const [unit, setUnit] = useState('Seconds')

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

    const convert = () => {
        if (direction === 'Date to Timestamp') {
            run(dateToTimestamp)
            return
        }
        run((input) => timestampToDate(input, unit))
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
            <Button icon={<CalendarClock size={16} />} type="primary" onClick={convert}>Convert</Button>
            <Button icon={<TimerReset size={16} />} onClick={fillNow}>Now</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'timestamp-conversion.txt')}>Download</Button>
            <RevertExample onClick={resetExample} />
        </>
    ), [direction, result, unit, value])

    useToolActions(actions)

    return (
        <div className="tool-page converter-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Direction</span>
                        <Radio.Group optionType="button" size="small" value={direction} onChange={(event) => setDirection(event.target.value)} options={[{ label: 'Timestamp to Date', value: 'Timestamp to Date' }, { label: 'Date to Timestamp', value: 'Date to Timestamp' }]} />
                        <span className="tool-function-label">Unit</span>
                        <Radio.Group optionType="button" size="small" value={unit} onChange={(event) => setUnit(event.target.value)} options={[{ label: 'Seconds', value: 'Seconds' }, { label: 'Milliseconds', value: 'Milliseconds' }]} />
                    </>
                )}
                left={<FormatterInput language="text" className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="converter-error">{error}</pre> : <FormatterOutput code={result} language="plain" />}
            />
        </div>
    )
}
