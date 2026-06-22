import { useMemo } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { useDraft } from '../../shared/hooks/useDraft.js'
import { wordCharacterCounterExample } from './example.js'
import RevertExample from '../../shared/components/RevertExample.jsx'
import './style.css'

const toolId = 'word-character-counter'

function countText(value) {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0
    const lines = value.length ? value.split(/\r\n|\r|\n/).length : 0
    const paragraphs = value.trim() ? value.trim().split(/(?:\r\n|\r|\n){2,}/).filter(Boolean).length : 0
    const bytes = new TextEncoder().encode(value).length

    return {
        characters: value.length,
        charactersNoSpaces: value.replace(/\s/g, '').length,
        words,
        lines,
        paragraphs,
        bytes
    }
}

export default function WordCharacterCounterTool() {
    const [value, setValue] = useDraft(toolId, wordCharacterCounterExample)

    const stats = useMemo(() => countText(value), [value])

    const openFile = async (file) => {
        setValue(await readTextFile(file))
        message.success('Da mo file.')
        return false
    }

    const copy = async () => {
        const result = await copyText(value)
        message[result.ok ? 'success' : 'warning'](result.message)
    }

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".txt,.md,.csv,.log">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(value, 'text.txt')}>Download</Button>
            <RevertExample onClick={() => setValue(wordCharacterCounterExample)} />
        </>
    ), [value])

    useToolActions(actions)

    return (
        <div className="tool-page text-tool-page">
            <SplitWorkspace
                left={<FormatterInput language="text" className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={(
                    <div className="text-stats-grid">
                        <div className="stat-card"><strong>Characters</strong><span data-testid="stat-characters">{stats.characters}</span></div>
                        <div className="stat-card"><strong>Characters without spaces</strong><span data-testid="stat-characters-no-spaces">{stats.charactersNoSpaces}</span></div>
                        <div className="stat-card"><strong>Words</strong><span data-testid="stat-words">{stats.words}</span></div>
                        <div className="stat-card"><strong>Lines</strong><span data-testid="stat-lines">{stats.lines}</span></div>
                        <div className="stat-card"><strong>Paragraphs</strong><span data-testid="stat-paragraphs">{stats.paragraphs}</span></div>
                        <div className="stat-card"><strong>Bytes</strong><span data-testid="stat-bytes">{stats.bytes}</span></div>
                    </div>
                )}
            />
        </div>
    )
}
