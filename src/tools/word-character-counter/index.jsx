import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp, RotateCcw } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { wordCharacterCounterExample } from './example.js'
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
    const [value, setValue] = useState(() => loadDraft(toolId, wordCharacterCounterExample))

    useEffect(() => saveDraft(toolId, value), [value])

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
            <Button icon={<RotateCcw size={16} />} onClick={() => setValue(wordCharacterCounterExample)}>Example</Button>
        </>
    ), [value])

    useToolActions(actions)

    return (
        <div className="tool-page text-tool-page">
            <SplitWorkspace
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={(
                    <div className="text-stats-grid">
                        <Card><strong>Characters</strong><span data-testid="stat-characters">{stats.characters}</span></Card>
                        <Card><strong>Characters without spaces</strong><span data-testid="stat-characters-no-spaces">{stats.charactersNoSpaces}</span></Card>
                        <Card><strong>Words</strong><span data-testid="stat-words">{stats.words}</span></Card>
                        <Card><strong>Lines</strong><span data-testid="stat-lines">{stats.lines}</span></Card>
                        <Card><strong>Paragraphs</strong><span data-testid="stat-paragraphs">{stats.paragraphs}</span></Card>
                        <Card><strong>Bytes</strong><span data-testid="stat-bytes">{stats.bytes}</span></Card>
                    </div>
                )}
            />
        </div>
    )
}
