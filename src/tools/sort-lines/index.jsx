import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, message, Radio, Upload } from 'antd'
import { Clipboard, Download, FileUp, ArrowDownAZ } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { sortLinesExample } from './example.js'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'sort-lines'

function sortLines(value, { direction, trimLines, removeEmpty, caseInsensitive }) {
    const lines = value.split(/\r\n|\r|\n/).map((line) => trimLines ? line.trim() : line).filter((line) => !removeEmpty || line.length > 0)
    lines.sort((a, b) => {
        const left = caseInsensitive ? a.toLowerCase() : a
        const right = caseInsensitive ? b.toLowerCase() : b
        return left.localeCompare(right)
    })
    if (direction === 'Descending') lines.reverse()
    return lines.join('\n')
}

export default function SortLinesTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, sortLinesExample))
    const [result, setResult] = useState('')
    const [direction, setDirection] = useState('Ascending')
    const [trimLines, setTrimLines] = useState(false)
    const [removeEmpty, setRemoveEmpty] = useState(false)
    const [caseInsensitive, setCaseInsensitive] = useState(false)

    useEffect(() => saveDraft(toolId, value), [value])

    const run = () => setResult(sortLines(value, { direction, trimLines, removeEmpty, caseInsensitive }))
    const openFile = async (file) => { setValue(await readTextFile(file)); setResult(''); message.success('Da mo file.'); return false }
    const copy = async () => { const copyResult = await copyText(result || value); message[copyResult.ok ? 'success' : 'warning'](copyResult.message) }

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".txt,.csv,.log"><Button icon={<FileUp size={16} />}>Open</Button></Upload>
            <Button icon={<ArrowDownAZ size={16} />} type="primary" onClick={run}>Sort</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'sorted-lines.txt')}>Download</Button>
            <RevertExample onClick={() => { setValue(sortLinesExample); setResult('') }} />
        </>
    ), [value, result, direction, trimLines, removeEmpty, caseInsensitive])

    useToolActions(actions)

    return <div className="tool-page text-tool-page"><SplitWorkspace leftToolbar={<><span className="tool-function-label">Order</span><Radio.Group optionType="button" size="small" value={direction} onChange={(event) => setDirection(event.target.value)} options={[{ label: 'Ascending', value: 'Ascending' }, { label: 'Descending', value: 'Descending' }]} /><Checkbox checked={trimLines} onChange={(event) => setTrimLines(event.target.checked)}>Trim lines</Checkbox><Checkbox checked={removeEmpty} onChange={(event) => setRemoveEmpty(event.target.checked)}>Remove empty lines</Checkbox><Checkbox checked={caseInsensitive} onChange={(event) => setCaseInsensitive(event.target.checked)}>Case insensitive</Checkbox></>} left={<FormatterInput language="text" className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />} right={<FormatterOutput code={result} language="text" />} /></div>
}
