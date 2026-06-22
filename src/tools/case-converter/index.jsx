import { useMemo, useState } from 'react'
import { Button, Input, message, Select, Upload } from 'antd'
import { Clipboard, Download, FileUp, LetterText } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { useDraft } from '../../shared/hooks/useDraft.js'
import { caseConverterExample } from './example.js'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'case-converter'
const modes = ['Lower Case', 'Upper Case', 'Title Case', 'Sentence Case', 'Camel Case', 'Pascal Case', 'Snake Case', 'Kebab Case']

function words(value) { return value.match(/[A-Za-z0-9]+/g) ?? [] }
function cap(word) { return word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '' }
function convertCase(value, mode) {
    if (mode === 'Lower Case') return value.toLowerCase()
    if (mode === 'Upper Case') return value.toUpperCase()
    if (mode === 'Title Case') return words(value).map(cap).join(' ')
    if (mode === 'Sentence Case') return value.toLowerCase().replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) => match.toUpperCase())
    const parts = words(value).map((word) => word.toLowerCase())
    if (mode === 'Camel Case') return parts.map((word, index) => index === 0 ? word : cap(word)).join('')
    if (mode === 'Pascal Case') return parts.map(cap).join('')
    if (mode === 'Snake Case') return parts.join('_')
    if (mode === 'Kebab Case') return parts.join('-')
    return value
}

export default function CaseConverterTool() {
    const [value, setValue] = useDraft(toolId, caseConverterExample)
    const [result, setResult] = useState('')
    const [mode, setMode] = useState('Lower Case')
    const run = () => setResult(convertCase(value, mode))
    const openFile = async (file) => { setValue(await readTextFile(file)); setResult(''); message.success('Da mo file.'); return false }
    const copy = async () => { const copyResult = await copyText(result || value); message[copyResult.ok ? 'success' : 'warning'](copyResult.message) }
    const actions = useMemo(() => <><Upload beforeUpload={openFile} showUploadList={false} accept=".txt,.md,.log"><Button icon={<FileUp size={16} />}>Open</Button></Upload><Button icon={<LetterText size={16} />} type="primary" onClick={run}>Convert</Button><Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button><Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'converted-case.txt')}>Download</Button><RevertExample onClick={() => { setValue(caseConverterExample); setResult('') }} /></>, [result, value, mode])
    useToolActions(actions)
    return <div className="tool-page text-tool-page"><SplitWorkspace leftToolbar={<><label className="tool-function-label" htmlFor="case-mode">Mode</label><Select id="case-mode" aria-label="Mode" size="small" value={mode} onChange={setMode} options={modes.map((item) => ({ label: item, value: item }))} style={{ minWidth: 160 }} /></>} left={<FormatterInput language="text" className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />} right={<FormatterOutput code={result} language="text" />} /></div>
}
