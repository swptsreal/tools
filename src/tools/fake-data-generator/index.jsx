import { useMemo, useState } from 'react'
import { Button, InputNumber, message } from 'antd'
import { Clipboard, Database, Download, RotateCcw } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { fakeDataDefaults } from './example.js'
import './style.css'

const firstNames = ['Ava', 'Mina', 'Noah', 'Kai', 'Linh', 'An']
const lastNames = ['Nguyen', 'Tran', 'Pham', 'Le', 'Hoang', 'Vu']
const domains = ['example.com', 'local.test', 'demo.dev']

function randomIndex(max) {
    const bytes = new Uint32Array(1)
    crypto.getRandomValues(bytes)
    return bytes[0] % max
}

function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '.')
}

function createRecord(index) {
    const firstName = firstNames[randomIndex(firstNames.length)]
    const lastName = lastNames[randomIndex(lastNames.length)]
    const domain = domains[randomIndex(domains.length)]
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}-${randomIndex(100000)}`

    return {
        id,
        name: `${firstName} ${lastName}`,
        email: `${slug(firstName)}.${slug(lastName)}${index + 1}@${domain}`,
        active: randomIndex(2) === 1
    }
}

function generateRecords(count) {
    const safeCount = Math.min(Math.max(Number(count) || 1, 1), 100)
    return JSON.stringify(Array.from({ length: safeCount }, (_, index) => createRecord(index)), null, 2)
}

export default function FakeDataGeneratorTool() {
    const [records, setRecords] = useState(fakeDataDefaults.records)
    const [result, setResult] = useState('')

    const generate = () => setResult(generateRecords(records))

    const copy = async () => {
        const copyResult = await copyText(result)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const reset = () => {
        setRecords(fakeDataDefaults.records)
        setResult('')
    }

    const actions = useMemo(() => (
        <>
            <Button icon={<Database size={16} />} type="primary" onClick={generate}>Generate Data</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result, 'fake-data.json', 'application/json')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={reset}>Reset</Button>
        </>
    ), [records, result])

    useToolActions(actions)

    return (
        <div className="tool-page generator-page">
            <SplitWorkspace
                left={(
                    <div className="generator-form">
                        <label className="generator-field">
                            <span>Records</span>
                            <InputNumber min={1} max={100} value={records} onChange={(value) => setRecords(value ?? 5)} />
                        </label>
                        <Button type="primary" icon={<Database size={16} />} onClick={generate}>Generate Data</Button>
                    </div>
                )}
                right={<FormatterOutput code={result} language="json" />}
            />
        </div>
    )
}
