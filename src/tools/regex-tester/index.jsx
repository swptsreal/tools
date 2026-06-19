import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message } from 'antd'
import { Clipboard, Download, Regex, RotateCcw } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { regexTesterExample } from './example.js'
import './style.css'

const toolId = 'regex-tester'
function escapeHtml(text) { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function runRegex(pattern, flags, text, replacement) {
    try {
        const safeFlags = flags.includes('g') ? flags : `${flags}g`
        const re = new RegExp(pattern, safeFlags)
        const matches = [...text.matchAll(re)]
        let cursor = 0
        let html = ''
        for (const match of matches) {
            html += escapeHtml(text.slice(cursor, match.index))
            html += `<mark>${escapeHtml(match[0])}</mark>`
            cursor = match.index + match[0].length
        }
        html += escapeHtml(text.slice(cursor))
        return { matches, html, replaced: replacement ? text.replace(re, replacement) : '', error: '' }
    } catch (error) {
        return { matches: [], html: '', replaced: '', error: error.message }
    }
}
export default function RegexTesterTool() {
    const [pattern, setPattern] = useState(() => loadDraft(`${toolId}-pattern`, '(user)@(example)\\.com'))
    const [flags, setFlags] = useState(() => loadDraft(`${toolId}-flags`, 'gi'))
    const [replacement, setReplacement] = useState(() => loadDraft(`${toolId}-replacement`, '$1@test.dev'))
    const [value, setValue] = useState(() => loadDraft(toolId, regexTesterExample))
    const [result, setResult] = useState(() => runRegex(pattern, flags, value, replacement))
    useEffect(() => saveDraft(`${toolId}-pattern`, pattern), [pattern])
    useEffect(() => saveDraft(`${toolId}-flags`, flags), [flags])
    useEffect(() => saveDraft(`${toolId}-replacement`, replacement), [replacement])
    useEffect(() => saveDraft(toolId, value), [value])
    const run = () => setResult(runRegex(pattern, flags, value, replacement))
    const output = `${result.matches.length} matches\n${result.replaced}`
    const copy = async () => { const res = await copyText(output); message[res.ok ? 'success' : 'warning'](res.message) }
    const reset = () => { setPattern('(user)@(example)\\.com'); setFlags('gi'); setReplacement('$1@test.dev'); setValue(regexTesterExample); setResult(runRegex('(user)@(example)\\.com', 'gi', regexTesterExample, '$1@test.dev')) }
    const actions = useMemo(() => <><Button icon={<Regex size={16} />} type="primary" onClick={run}>Test Regex</Button><Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button><Button icon={<Download size={16} />} onClick={() => downloadTextFile(output, 'regex-result.txt')}>Download</Button><Button icon={<RotateCcw size={16} />} onClick={reset}>Example</Button></>, [pattern, flags, value, replacement, result])
    useToolActions(actions)
    return <div className="tool-page developer-tool-page"><SplitWorkspace leftToolbar={<><label className="tool-function-label" htmlFor="regex-pattern">Pattern</label><Input id="regex-pattern" aria-label="Pattern" size="small" value={pattern} onChange={(event) => setPattern(event.target.value)} style={{ width: 220 }} /><label className="tool-function-label" htmlFor="regex-flags">Flags</label><Input id="regex-flags" aria-label="Flags" size="small" value={flags} onChange={(event) => setFlags(event.target.value)} style={{ width: 80 }} /><label className="tool-function-label" htmlFor="regex-replacement">Replacement</label><Input id="regex-replacement" aria-label="Replacement" size="small" value={replacement} onChange={(event) => setReplacement(event.target.value)} style={{ width: 180 }} /></>} left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />} right={<div className="dev-result"><div className="dev-card"><h3>{result.error ? 'Error' : `${result.matches.length} matches`}</h3>{result.error ? <p>{result.error}</p> : <div className="dev-mono" dangerouslySetInnerHTML={{ __html: result.html }} />}</div><div className="dev-card"><h3>Groups</h3><ul className="dev-list">{result.matches.flatMap((match, index) => match.slice(1).map((group, groupIndex) => <li key={`${index}-${groupIndex}`}>Group {groupIndex + 1}: {group}</li>))}</ul></div><div className="dev-card"><h3>Replace Preview</h3><div className="dev-mono">{result.replaced}</div></div></div>} /></div>
}
