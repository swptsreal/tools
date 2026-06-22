import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio, Upload } from 'antd'
import { Clipboard, CodeXml, Download, FileUp } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { htmlExample } from './example.js'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'html-formatter'

export default function HtmlFormatterTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, htmlExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [indentSize, setIndentSize] = useState(2)

    useEffect(() => {
        saveDraft(toolId, value)
    }, [value])

    const formatHtml = async () => {
        try {
            const beautify = await import('js-beautify')
            setResult(beautify.html(value, { indent_size: indentSize, wrap_line_length: 120 }))
            setError('')
        } catch (err) {
            setResult('')
            setError(`Error: ${err.message}`)
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
        setValue(htmlExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(
        () => (
            <>
                <Upload beforeUpload={openFile} showUploadList={false} accept=".html,.htm,.txt">
                    <Button icon={<FileUp size={16} />}>Open</Button>
                </Upload>
                <Button icon={<CodeXml size={16} />} type="primary" onClick={formatHtml}>Format</Button>
                <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
                <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'formatted.html', 'text/html')}>Download</Button>
                <RevertExample onClick={resetExample} />
            </>
        ),
        [indentSize, result, value]
    )

    useToolActions(actions)

    return (
        <div className="tool-page formatter-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Indent</span>
                        <Radio.Group optionType="button" size="small" value={indentSize} onChange={(event) => setIndentSize(event.target.value)} options={[{ label: '2 spaces', value: 2 }, { label: '4 spaces', value: 4 }]} />
                    </>
                )}
                left={
                    <FormatterInput language="html"
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

