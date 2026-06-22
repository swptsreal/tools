import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio, Upload } from 'antd'
import { Clipboard, Download, FileUp, Palette } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { cssExample } from './example.js'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'css-formatter'

export default function CssFormatterTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, cssExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [indentSize, setIndentSize] = useState(2)

    useEffect(() => {
        saveDraft(toolId, value)
    }, [value])

    const formatCss = async () => {
        try {
            const beautify = await import('js-beautify')
            setResult(beautify.css(value, { indent_size: indentSize }))
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
        setValue(cssExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(
        () => (
            <>
                <Upload beforeUpload={openFile} showUploadList={false} accept=".css,.txt">
                    <Button icon={<FileUp size={16} />}>Open</Button>
                </Upload>
                <Button icon={<Palette size={16} />} type="primary" onClick={formatCss}>Format</Button>
                <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
                <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'formatted.css', 'text/css')}>Download</Button>
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
                    <FormatterInput language="css"
                        className="tool-editor"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        spellCheck={false}
                    />
                }
                right={error ? <pre className="formatter-error">{error}</pre> : <FormatterOutput code={result} language="css" />}
            />
        </div>
    )
}

