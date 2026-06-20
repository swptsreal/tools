import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message } from 'antd'
import { Clipboard, Download, GitCompareArrows, RotateCcw, Shuffle } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { leftJsonExample, rightJsonExample } from './example.js'
import './style.css'

const leftDraftId = 'json-compare-left'
const rightDraftId = 'json-compare-right'

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function pathJoin(base, key) {
    if (typeof key === 'number') return `${base}[${key}]`
    return base ? `${base}.${key}` : key
}

function valuePreview(value) {
    return JSON.stringify(value, null, 2)
}

function diffValues(left, right, path = '') {
    if (Array.isArray(left) && Array.isArray(right)) {
        const max = Math.max(left.length, right.length)
        return Array.from({ length: max }).flatMap((_, index) => {
            const itemPath = pathJoin(path, index)
            if (index >= left.length) return [{ type: 'added', path: itemPath, right: right[index] }]
            if (index >= right.length) return [{ type: 'removed', path: itemPath, left: left[index] }]
            return diffValues(left[index], right[index], itemPath)
        })
    }

    if (isObject(left) && isObject(right)) {
        const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort()
        return keys.flatMap((key) => {
            const itemPath = pathJoin(path, key)
            if (!(key in left)) return [{ type: 'added', path: itemPath, right: right[key] }]
            if (!(key in right)) return [{ type: 'removed', path: itemPath, left: left[key] }]
            return diffValues(left[key], right[key], itemPath)
        })
    }

    if (JSON.stringify(left) !== JSON.stringify(right)) {
        return [{ type: 'changed', path: path || '(root)', left, right }]
    }

    return []
}

function groupDiffs(diffs) {
    return {
        added: diffs.filter((item) => item.type === 'added'),
        removed: diffs.filter((item) => item.type === 'removed'),
        changed: diffs.filter((item) => item.type === 'changed')
    }
}

function serializeDiffs(groups) {
    return ['Added', ...groups.added.map((item) => `+ ${item.path}: ${valuePreview(item.right)}`), '', 'Removed', ...groups.removed.map((item) => `- ${item.path}: ${valuePreview(item.left)}`), '', 'Changed', ...groups.changed.map((item) => `~ ${item.path}: ${valuePreview(item.left)} -> ${valuePreview(item.right)}`)].join('\n')
}

function DiffGroup({ title, items }) {
    return (
        <section className="json-compare-group">
            <h2>{title}</h2>
            {items.length ? (
                <ul className="json-compare-list">
                    {items.map((item) => (
                        <li className="json-compare-item" key={`${item.type}-${item.path}`}>
                            <div className="json-compare-path">{item.path}</div>
                            {item.type === 'added' ? <div className="json-compare-value">Added: {valuePreview(item.right)}</div> : null}
                            {item.type === 'removed' ? <div className="json-compare-value">Removed: {valuePreview(item.left)}</div> : null}
                            {item.type === 'changed' ? <div className="json-compare-value">Before: {valuePreview(item.left)}\nAfter: {valuePreview(item.right)}</div> : null}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="json-compare-summary">No fields.</p>
            )}
        </section>
    )
}

export default function JsonCompareTool() {
    const [leftValue, setLeftValue] = useState(() => loadDraft(leftDraftId, leftJsonExample))
    const [rightValue, setRightValue] = useState(() => loadDraft(rightDraftId, rightJsonExample))
    const [groups, setGroups] = useState(() => groupDiffs([]))
    const [error, setError] = useState('')

    useEffect(() => {
        saveDraft(leftDraftId, leftValue)
    }, [leftValue])

    useEffect(() => {
        saveDraft(rightDraftId, rightValue)
    }, [rightValue])

    const compare = () => {
        try {
            let leftParsed
            let rightParsed
            try {
                leftParsed = JSON.parse(leftValue)
            } catch (err) {
                throw new Error(`Invalid original JSON: ${err.message}`)
            }
            try {
                rightParsed = JSON.parse(rightValue)
            } catch (err) {
                throw new Error(`Invalid changed JSON: ${err.message}`)
            }
            setGroups(groupDiffs(diffValues(leftParsed, rightParsed)))
            setError('')
        } catch (err) {
            setGroups(groupDiffs([]))
            setError(err.message)
        }
    }

    const swap = () => {
        setLeftValue(rightValue)
        setRightValue(leftValue)
        setGroups(groupDiffs([]))
        setError('')
    }

    const copy = async () => {
        const copyResult = await copyText(serializeDiffs(groups))
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const resetExample = () => {
        setLeftValue(leftJsonExample)
        setRightValue(rightJsonExample)
        setGroups(groupDiffs([]))
        setError('')
    }

    const resultText = serializeDiffs(groups)

    const actions = useMemo(
        () => (
            <>
                <Button icon={<GitCompareArrows size={16} />} type="primary" onClick={compare}>Compare</Button>
                <Button icon={<Shuffle size={16} />} onClick={swap}>Swap</Button>
                <Button icon={<Clipboard size={16} />} onClick={copy}>Copy Result</Button>
                <Button icon={<Download size={16} />} onClick={() => downloadTextFile(resultText, 'json-compare.txt', 'text/plain')}>Download</Button>
                <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
            </>
        ),
        [leftValue, resultText, rightValue]
    )

    useToolActions(actions)

    const total = groups.added.length + groups.removed.length + groups.changed.length

    return (
        <div className="tool-page json-compare-page">
            <SplitWorkspace
                left={
                    <div className="json-compare-editors">
                        <label className="json-compare-editor-panel">
                            <span className="json-compare-label">Original JSON</span>
                            <Input.TextArea className="tool-editor" value={leftValue} onChange={(event) => setLeftValue(event.target.value)} spellCheck={false} />
                        </label>
                        <label className="json-compare-editor-panel">
                            <span className="json-compare-label">Changed JSON</span>
                            <Input.TextArea className="tool-editor" value={rightValue} onChange={(event) => setRightValue(event.target.value)} spellCheck={false} />
                        </label>
                    </div>
                }
                right={error ? (
                    <pre className="formatter-error">{error}</pre>
                ) : (
                    <div className="json-compare-results">
                        <p className="json-compare-summary">{total === 0 ? 'No differences yet. Click Compare to inspect JSON.' : `${total} difference(s) found.`}</p>
                        <DiffGroup title="Added" items={groups.added} />
                        <DiffGroup title="Removed" items={groups.removed} />
                        <DiffGroup title="Changed" items={groups.changed} />
                    </div>
                )}
            />
        </div>
    )
}
