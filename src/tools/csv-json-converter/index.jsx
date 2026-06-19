import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio, Upload } from 'antd'
import { Clipboard, Download, FileSpreadsheet, FileUp, RotateCcw } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { csvJsonExample } from './example.js'
import './style.css'

const toolId = 'csv-json-converter'

function parseCsvLine(line, delimiter = ',') {
    const cells = []
    let current = ''
    let quoted = false
    for (let index = 0; index < line.length; index++) {
        const char = line[index]
        const next = line[index + 1]
        if (char === '"' && quoted && next === '"') {
            current += '"'
            index++
        } else if (char === '"') {
            quoted = !quoted
        } else if (char === delimiter && !quoted) {
            cells.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    cells.push(current.trim())
    return cells
}

function parseCsv(input, delimiter = ',') {
    const rows = input.trim().split(/\r?\n/).map((line) => parseCsvLine(line, delimiter))
    const headers = rows.shift()
    if (!headers?.length) throw new Error('CSV header row is required.')
    return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
}

function escapeCsvCell(value) {
    const text = String(value ?? '')
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(input) {
    const rows = JSON.parse(input)
    if (!Array.isArray(rows)) throw new Error('JSON must be an array of objects.')
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    return [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(','))].join('\n')
}

export default function CsvJsonConverterTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, csvJsonExample))
    const [result, setResult] = useState('')
    const [language, setLanguage] = useState('json')
    const [error, setError] = useState('')
    const [direction, setDirection] = useState('CSV to JSON')
    const [delimiter, setDelimiter] = useState(',')

    useEffect(() => saveDraft(toolId, value), [value])

    const convertCsvToJson = () => {
        try {
            setResult(JSON.stringify(parseCsv(value, (delimiter || ',') === ',' && value.split(/\r?\n/)[0]?.includes(';') ? ';' : (delimiter || ',')), null, 4))
            setLanguage('json')
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid CSV: ${err.message}`)
        }
    }

    const convertJsonToCsv = () => {
        try {
            setResult(toCsv(value))
            setLanguage('csv')
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid JSON: ${err.message}`)
        }
    }

    const convert = () => {
        if (direction === 'JSON to CSV') {
            convertJsonToCsv()
            return
        }
        convertCsvToJson()
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
        setValue(csvJsonExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".csv,.json,.txt">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<FileSpreadsheet size={16} />} type="primary" onClick={convert}>Convert</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, language === 'json' ? 'converted.json' : 'converted.csv')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
        </>
    ), [delimiter, direction, result, value, language])

    useToolActions(actions)

    return (
        <div className="tool-page converter-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Direction</span>
                        <Radio.Group optionType="button" size="small" value={direction} onChange={(event) => setDirection(event.target.value)} options={[{ label: 'CSV to JSON', value: 'CSV to JSON' }, { label: 'JSON to CSV', value: 'JSON to CSV' }]} />
                        <Input aria-label="Delimiter" size="small" value={delimiter} onChange={(event) => setDelimiter(event.target.value.slice(-1) || ',')} style={{ width: 54 }} />
                    </>
                )}
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="converter-error">{error}</pre> : <FormatterOutput code={result} language={language} />}
            />
        </div>
    )
}
