import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio, Upload } from 'antd'
import { Clipboard, Download, FileJson, FileUp } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { jsonYamlExample } from './example.js'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'json-yaml-converter'

function scalarToYaml(value) {
    if (value === null) return 'null'
    if (typeof value === 'string') return /^[A-Za-z0-9 _.-]+$/.test(value) ? value : JSON.stringify(value)
    return String(value)
}

function toYaml(value, indent = 0) {
    const pad = ' '.repeat(indent)
    if (Array.isArray(value)) {
        return value.map((item) => {
            if (item && typeof item === 'object') return `${pad}-\n${toYaml(item, indent + 2)}`
            return `${pad}- ${scalarToYaml(item)}`
        }).join('\n')
    }
    if (value && typeof value === 'object') {
        return Object.entries(value).map(([key, item]) => {
            if (item && typeof item === 'object') return `${pad}${key}:\n${toYaml(item, indent + 2)}`
            return `${pad}${key}: ${scalarToYaml(item)}`
        }).join('\n')
    }
    return `${pad}${scalarToYaml(value)}`
}

function parseYamlScalar(value) {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null') return null
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1)
    return value
}

function fromSimpleYaml(input) {
    const result = {}
    for (const rawLine of input.split('\n')) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const match = line.match(/^([^:]+):\s*(.*)$/)
        if (!match) throw new Error(`Unsupported YAML line: ${line}`)
        result[match[1].trim()] = parseYamlScalar(match[2].trim())
    }
    return result
}

export default function JsonYamlConverterTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, jsonYamlExample))
    const [result, setResult] = useState('')
    const [language, setLanguage] = useState('yaml')
    const [error, setError] = useState('')
    const [direction, setDirection] = useState('JSON to YAML')

    useEffect(() => saveDraft(toolId, value), [value])

    const convertJsonToYaml = () => {
        try {
            setResult(toYaml(JSON.parse(value)))
            setLanguage('yaml')
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid JSON: ${err.message}`)
        }
    }

    const convertYamlToJson = () => {
        try {
            setResult(JSON.stringify(fromSimpleYaml(value), null, 4))
            setLanguage('json')
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid YAML: ${err.message}`)
        }
    }

    const convert = () => {
        if (direction === 'YAML to JSON') {
            convertYamlToJson()
            return
        }
        convertJsonToYaml()
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
        setValue(jsonYamlExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".json,.yaml,.yml,.txt">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<FileJson size={16} />} type="primary" onClick={convert}>Convert</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, language === 'json' ? 'converted.json' : 'converted.yaml')}>Download</Button>
            <RevertExample onClick={resetExample} />
        </>
    ), [direction, result, value, language])

    useToolActions(actions)

    return (
        <div className="tool-page converter-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Direction</span>
                        <Radio.Group optionType="button" size="small" value={direction} onChange={(event) => setDirection(event.target.value)} options={[{ label: 'JSON to YAML', value: 'JSON to YAML' }, { label: 'YAML to JSON', value: 'YAML to JSON' }]} />
                    </>
                )}
                left={<FormatterInput language="json" className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="converter-error">{error}</pre> : <FormatterOutput code={result} language={language} />}
            />
        </div>
    )
}
