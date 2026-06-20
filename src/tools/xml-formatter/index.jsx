import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio, Upload } from 'antd'
import { Clipboard, CodeXml, Download, FileUp, RotateCcw, Shrink } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { xmlExample } from './example.js'
import './style.css'

const toolId = 'xml-formatter'

function validateXml(value) {
    const doc = new DOMParser().parseFromString(value, 'application/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
        throw new Error(parserError.textContent.trim().split('\n')[0])
    }
}

function minifyXml(value) {
    validateXml(value)
    return value.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
}

function formatXml(value, indentSize) {
    const compact = minifyXml(value)
    const tokens = compact.replace(/(>)(<)(\/?)/g, '$1\n$2$3').split('\n')
    let depth = 0

    return tokens.map((token) => {
        const trimmed = token.trim()
        if (/^<\//.test(trimmed)) depth = Math.max(depth - 1, 0)
        const line = `${' '.repeat(depth * indentSize)}${trimmed}`
        if (/^<[^!?/][^>]*[^/]>/.test(trimmed) && !/^<([^\s>]+)[^>]*>.*<\/\1>$/.test(trimmed)) depth += 1
        return line
    }).join('\n')
}

export default function XmlFormatterTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, xmlExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [indentSize, setIndentSize] = useState(2)

    useEffect(() => {
        saveDraft(toolId, value)
    }, [value])

    const run = (mode = 'format') => {
        try {
            const nextResult = mode === 'minify' ? minifyXml(value) : formatXml(value, indentSize)
            setResult(nextResult)
            setError('')
            if (mode === 'validate') message.success('XML hop le.')
        } catch (err) {
            setResult('')
            setError(`Invalid XML: ${err.message}`)
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
        setValue(xmlExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(
        () => (
            <>
                <Upload beforeUpload={openFile} showUploadList={false} accept=".xml,.svg,.txt">
                    <Button icon={<FileUp size={16} />}>Open</Button>
                </Upload>
                <Button icon={<CodeXml size={16} />} type="primary" onClick={() => run('format')}>Format</Button>
                <Button icon={<Shrink size={16} />} onClick={() => run('minify')}>Minify</Button>
                <Button onClick={() => run('validate')}>Validate</Button>
                <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
                <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'formatted.xml', 'application/xml')}>Download</Button>
                <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
            </>
        ),
        [indentSize, result, value]
    )

    useToolActions(actions)

    return (
        <div className="tool-page formatter-page xml-formatter-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Indent</span>
                        <Radio.Group optionType="button" size="small" value={indentSize} onChange={(event) => setIndentSize(event.target.value)} options={[{ label: '2 spaces', value: 2 }, { label: '4 spaces', value: 4 }]} />
                    </>
                )}
                left={
                    <Input.TextArea
                        className="tool-editor"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        spellCheck={false}
                    />
                }
                right={error ? <pre className="formatter-error">{error}</pre> : <FormatterOutput code={result} language="html" />}
            />
        </div>
    )
}
