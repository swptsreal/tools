import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp, ListMinus } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { removeDuplicateLinesExample } from './example.js'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'remove-duplicate-lines'

function removeDuplicateLines(value, { trimLines, ignoreCase, removeEmpty }) {
    const seen = new Set()
    const kept = []
    let removed = 0
    for (const rawLine of value.split(/\r\n|\r|\n/)) {
        const line = trimLines ? rawLine.trim() : rawLine
        if (removeEmpty && line.length === 0) { removed++; continue }
        const key = ignoreCase ? line.toLowerCase() : line
        if (seen.has(key)) { removed++; continue }
        seen.add(key)
        kept.push(line)
    }
    return { text: kept.join('\n'), removed }
}

export default function RemoveDuplicateLinesTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, removeDuplicateLinesExample))
    const [result, setResult] = useState('')
    const [summary, setSummary] = useState('')
    const [trimLines, setTrimLines] = useState(false)
    const [ignoreCase, setIgnoreCase] = useState(false)
    const [removeEmpty, setRemoveEmpty] = useState(false)

    useEffect(() => saveDraft(toolId, value), [value])

    const run = () => { const next = removeDuplicateLines(value, { trimLines, ignoreCase, removeEmpty }); setResult(next.text); setSummary(`Removed ${next.removed} duplicate/empty lines`) }
    const openFile = async (file) => { setValue(await readTextFile(file)); setResult(''); setSummary(''); message.success('Da mo file.'); return false }
    const copy = async () => { const copyResult = await copyText(result || value); message[copyResult.ok ? 'success' : 'warning'](copyResult.message) }

    const actions = useMemo(() => <><Upload beforeUpload={openFile} showUploadList={false} accept=".txt,.csv,.log"><Button icon={<FileUp size={16} />}>Open</Button></Upload><Button icon={<ListMinus size={16} />} type="primary" onClick={run}>Remove Duplicates</Button><Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button><Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'unique-lines.txt')}>Download</Button><RevertExample onClick={() => { setValue(removeDuplicateLinesExample); setResult(''); setSummary('') }} /></>, [value, result, trimLines, ignoreCase, removeEmpty])
    useToolActions(actions)

    return <div className="tool-page text-tool-page"><SplitWorkspace leftToolbar={<><Checkbox checked={trimLines} onChange={(event) => setTrimLines(event.target.checked)}>Trim lines</Checkbox><Checkbox checked={ignoreCase} onChange={(event) => setIgnoreCase(event.target.checked)}>Ignore case</Checkbox><Checkbox checked={removeEmpty} onChange={(event) => setRemoveEmpty(event.target.checked)}>Remove empty lines</Checkbox></>} left={<FormatterInput language="text" className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />} right={<><div className="text-tool-summary">{summary || 'Run Remove Duplicates to see summary.'}</div><FormatterOutput code={result} language="text" /></>} /></div>
}
