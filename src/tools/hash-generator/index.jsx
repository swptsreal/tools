import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio, Upload } from 'antd'
import { Clipboard, Download, Fingerprint, FileUp } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { hashExample } from './example.js'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'hash-generator'
const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

function toHex(buffer) {
    return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function generateHashes(text, selectedAlgorithms = algorithms) {
    const bytes = new TextEncoder().encode(text)
    const entries = await Promise.all(selectedAlgorithms.map(async (algorithm) => {
        const digest = await crypto.subtle.digest(algorithm, bytes)
        return [algorithm, toHex(digest)]
    }))

    return entries.map(([algorithm, digest]) => `${algorithm}\n${digest}`).join('\n\n')
}

export default function HashGeneratorTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, hashExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [algorithm, setAlgorithm] = useState('SHA-256')

    useEffect(() => saveDraft(toolId, value), [value])

    const runGenerate = async () => {
        try {
            setResult(await generateHashes(value, [algorithm]))
            setError('')
        } catch (err) {
            setResult('')
            setError(`Hash failed: ${err.message}`)
        }
    }

    const openFile = async (file) => {
        setValue(await readTextFile(file))
        setResult('')
        setError('')
        message.success('Da mo file.')
        return false
    }

    const copy = async () => {
        const copyResult = await copyText(result || value)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const resetExample = () => {
        setValue(hashExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".txt">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<Fingerprint size={16} />} type="primary" onClick={runGenerate}>Generate Hashes</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'hashes.txt')}>Download</Button>
            <RevertExample onClick={resetExample} />
        </>
    ), [algorithm, result, value])

    useToolActions(actions)

    return (
        <div className="tool-page encoder-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Hash algorithm</span>
                        <Radio.Group
                            optionType="button"
                            size="small"
                            value={algorithm}
                            onChange={(event) => setAlgorithm(event.target.value)}
                            options={algorithms.map((item) => ({ label: item, value: item }))}
                        />
                    </>
                )}
                left={<FormatterInput language="text" className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="encoder-error">{error}</pre> : <FormatterOutput code={result} language="text" />}
            />
        </div>
    )
}
