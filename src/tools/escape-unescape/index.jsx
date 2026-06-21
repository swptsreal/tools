import { useMemo, useState } from 'react'
import { Button, Input, Select } from 'antd'
import { Braces } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { escapeUnescapeExample } from './example.js'
import './style.css'
function esc(text, mode) {
    if (mode === 'JSON string') return JSON.stringify(text).slice(1, -1)
    if (mode === 'URL component') return encodeURIComponent(text)
    if (mode === 'Regex') return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
}
function unesc(text, mode) {
    try {
        if (mode === 'JSON string') return JSON.parse(`"${text}"`)
        if (mode === 'URL component') return decodeURIComponent(text)
        if (mode === 'Regex')
            return text.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
        return JSON.parse(`"${text.replace(/"/g, '\\"')}"`)
    } catch (e) {
        return `Error: ${e.message}`
    }
}
export default function EscapeUnescapeTool() {
    const [value, setValue] = useState(escapeUnescapeExample)
    const [mode, setMode] = useState('JSON string')
    const [direction, setDirection] = useState('Escape')
    const [result, setResult] = useState('')
    const run = () =>
        setResult(
            direction === 'Escape' ? esc(value, mode) : unesc(value, mode)
        )
    useToolActions(
        useMemo(
            () => (
                <Button
                    icon={<Braces size={16} />}
                    type="primary"
                    onClick={run}
                >
                    Run Escape
                </Button>
            ),
            [value, mode, direction]
        )
    )
    return (
        <div className="tool-page developer-tool-page">
            <SplitWorkspace
                leftToolbar={
                    <>
                        <label
                            className="tool-function-label"
                            htmlFor="escape-mode"
                        >
                            Mode
                        </label>
                        <Select
                            id="escape-mode"
                            aria-label="Mode"
                            size="small"
                            value={mode}
                            onChange={setMode}
                            options={[
                                'JSON string',
                                'JavaScript string',
                                'Regex',
                                'URL component'
                            ].map((x) => ({ value: x, label: x }))}
                            style={{ width: 180 }}
                        />
                        <label
                            className="tool-function-label"
                            htmlFor="escape-direction"
                        >
                            Direction
                        </label>
                        <Select
                            id="escape-direction"
                            aria-label="Direction"
                            size="small"
                            value={direction}
                            onChange={setDirection}
                            options={['Escape', 'Unescape'].map((x) => ({
                                value: x,
                                label: x
                            }))}
                            style={{ width: 140 }}
                        />
                    </>
                }
                left={
                    <FormatterInput
                        language="javascript"
                        className="tool-editor"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        spellCheck={false}
                    />
                }
                right={<FormatterOutput code={result} language="text" />}
            />
        </div>
    )
}
