import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message } from 'antd'
import { Clipboard, Download, GitCompareArrows, RotateCcw } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { textDiffChangedExample, textDiffOriginalExample } from './example.js'
import './style.css'

const originalId = 'text-diff-original'
const changedId = 'text-diff-changed'

function buildLineDiff(original, changed) {
    const a = original.split(/\r\n|\r|\n/)
    const b = changed.split(/\r\n|\r|\n/)
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
        }
    }
    const rows = []
    let i = 0
    let j = 0
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { rows.push({ type: 'same', text: a[i] }); i++; j++ }
        else if (dp[i + 1][j] >= dp[i][j + 1]) { rows.push({ type: 'removed', text: a[i] }); i++ }
        else { rows.push({ type: 'added', text: b[j] }); j++ }
    }
    while (i < a.length) rows.push({ type: 'removed', text: a[i++] })
    while (j < b.length) rows.push({ type: 'added', text: b[j++] })
    return rows
}

function serialize(rows) {
    return rows.map((row) => `${row.type === 'added' ? '+ ' : row.type === 'removed' ? '- ' : '  '}${row.text}`).join('\n')
}

export default function TextDiffTool() {
    const [original, setOriginal] = useState(() => loadDraft(originalId, textDiffOriginalExample))
    const [changed, setChanged] = useState(() => loadDraft(changedId, textDiffChangedExample))
    const [rows, setRows] = useState([])
    useEffect(() => saveDraft(originalId, original), [original])
    useEffect(() => saveDraft(changedId, changed), [changed])
    const output = useMemo(() => serialize(rows), [rows])
    const compare = () => setRows(buildLineDiff(original, changed))
    const copy = async () => { const copyResult = await copyText(output); message[copyResult.ok ? 'success' : 'warning'](copyResult.message) }
    const reset = () => { setOriginal(textDiffOriginalExample); setChanged(textDiffChangedExample); setRows([]) }
    const actions = useMemo(() => <><Button icon={<GitCompareArrows size={16} />} type="primary" onClick={compare}>Compare</Button><Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button><Button icon={<Download size={16} />} onClick={() => downloadTextFile(output, 'text-diff.txt')}>Download</Button><Button icon={<RotateCcw size={16} />} onClick={reset}>Example</Button></>, [original, changed, output])
    useToolActions(actions)
    return <div className="tool-page text-tool-page"><SplitWorkspace left={<div className="text-diff-inputs"><div className="text-diff-field"><label htmlFor="text-diff-original">Original</label><Input.TextArea id="text-diff-original" className="tool-editor" value={original} onChange={(event) => setOriginal(event.target.value)} spellCheck={false} /></div><div className="text-diff-field"><label htmlFor="text-diff-changed">Changed</label><Input.TextArea id="text-diff-changed" className="tool-editor" value={changed} onChange={(event) => setChanged(event.target.value)} spellCheck={false} /></div></div>} right={<pre className="text-diff-result">{rows.map((row, index) => <div key={`${row.type}-${index}`} className={`text-diff-row diff-row-${row.type}`}>{row.type === 'added' ? '+ ' : row.type === 'removed' ? '- ' : '  '}{row.text}</div>)}</pre>} /></div>
}
