import { useMemo, useState } from 'react'
import { Button, message } from 'antd'
import { Clipboard, Download, GitCompare, RotateCcw } from 'lucide-react'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import './style.css'

const originalExample = 'alpha\nbeta\ngamma'
const changedExample = 'alpha\nbeta changed\ngamma\ndelta'

function diffLines(original, changed) {
    const a = original.split('\n')
    const b = changed.split('\n')
    const rows = []
    const max = Math.max(a.length, b.length)
    for (let i = 0; i < max; i++) {
        if (a[i] === b[i]) rows.push({ type: 'same', text: a[i] ?? '' })
        else {
            if (a[i] !== undefined) rows.push({ type: 'removed', text: a[i] })
            if (b[i] !== undefined) rows.push({ type: 'added', text: b[i] })
        }
    }
    return rows
}

function serializeRows(rows) {
    return rows.map((row) => `${row.type === 'added' ? '+ ' : row.type === 'removed' ? '- ' : '  '}${row.text}`).join('\n')
}

export default function TextDiffTool() {
    const [original, setOriginal] = useState(originalExample)
    const [changed, setChanged] = useState(changedExample)
    const [rows, setRows] = useState(() => diffLines(originalExample, changedExample))
    const output = serializeRows(rows)
    const compare = () => setRows(diffLines(original, changed))
    const reset = () => {
        setOriginal(originalExample)
        setChanged(changedExample)
        setRows(diffLines(originalExample, changedExample))
    }
    const copy = async () => {
        const result = await copyText(output)
        message[result.ok ? 'success' : 'warning'](result.message)
    }
    const actions = useMemo(() => <><Button icon={<GitCompare size={16} />} type="primary" onClick={compare}>Compare</Button><Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button><Button icon={<Download size={16} />} onClick={() => downloadTextFile(output, 'text-diff.txt')}>Download</Button><Button icon={<RotateCcw size={16} />} onClick={reset}>Example</Button></>, [original, changed, output])
    useToolActions(actions)

    return (
        <div className="tool-page text-tool-page text-diff-page">
            <div className="text-diff-workspace">
                <section className="text-diff-input-panel" aria-label="Text inputs">
                    <div className="text-diff-field">
                        <label htmlFor="text-diff-original">Original</label>
                        <FormatterInput language="text" id="text-diff-original" className="tool-editor" value={original} onChange={(event) => setOriginal(event.target.value)} spellCheck={false} />
                    </div>
                    <div className="text-diff-field">
                        <label htmlFor="text-diff-changed">Changed</label>
                        <FormatterInput language="text" id="text-diff-changed" className="tool-editor" value={changed} onChange={(event) => setChanged(event.target.value)} spellCheck={false} />
                    </div>
                </section>
                <section className="text-diff-result-panel" aria-label="Diff result">
                    <pre className="text-diff-result">
                        {rows.map((row, index) => <div key={`${row.type}-${index}`} className={`text-diff-row diff-row-${row.type}`}>{row.type === 'added' ? '+ ' : row.type === 'removed' ? '- ' : '  '}{row.text}</div>)}
                    </pre>
                </section>
            </div>
        </div>
    )
}
