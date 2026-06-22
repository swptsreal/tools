import { useEffect, useMemo, useState } from 'react'
import { Button, message, Radio, Upload } from 'antd'
import {
    Clipboard,
    Download,
    FileCode2,
    FileUp,
    RotateCcw,
    Shrink,
    Wand2
} from 'lucide-react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { parseDocument } from 'yaml'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import FormatterInput from '../../shared/components/FormatterInput.jsx'
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue.js'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { yamlPreviewExample } from './example.js'
import './style.css'
import RevertExample from '../../shared/components/RevertExample.jsx'

const toolId = 'yaml-preview'

function parseYaml(value) {
    const doc = parseDocument(value, { prettyErrors: false })
    if (doc.errors.length > 0) throw new Error(doc.errors[0].message)
    return doc
}

function parseYamlValue(value) {
    return parseYaml(value).toJSON()
}

function formatYaml(value, indent) {
    return parseYaml(value).toString({ indent }).trimEnd()
}

function minifyYaml(value) {
    return parseYaml(value)
        .toString({ indent: 1 })
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line, index, lines) => line.trim() || lines[index - 1]?.trim())
        .join('\n')
        .trim()
}

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isOpenApi(value) {
    return (
        isObject(value) &&
        Boolean((value.openapi || value.swagger) && value.paths)
    )
}

function scalarText(value) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return value
    return String(value)
}

function TreeNode({ name, value }) {
    const complex = isObject(value) || Array.isArray(value)
    if (!complex) {
        return (
            <div className="yaml-tree-row yaml-tree-leaf">
                {name !== undefined ? (
                    <span className="yaml-tree-key">{name}: </span>
                ) : null}
                <span className="yaml-tree-value">{scalarText(value)}</span>
            </div>
        )
    }

    const entries = Array.isArray(value)
        ? value.map((item, index) => [index, item])
        : Object.entries(value)
    const label = Array.isArray(value)
        ? `Array(${value.length})`
        : `Object(${entries.length})`

    return (
        <details className="yaml-tree-node" open>
            <summary>
                {name !== undefined ? (
                    <span className="yaml-tree-key">{name}</span>
                ) : (
                    'root'
                )}{' '}
                <span className="yaml-muted">{label}</span>
            </summary>
            <div className="yaml-tree-children">
                {entries.length ? (
                    entries.map(([key, item]) => (
                        <TreeNode key={key} name={key} value={item} />
                    ))
                ) : (
                    <span className="yaml-muted">empty</span>
                )}
            </div>
        </details>
    )
}

function YamlPreviewContent({ state }) {
    if (state.error) {
        return (
            <pre className="formatter-error">Invalid YAML: {state.error}</pre>
        )
    }

    if (isOpenApi(state.data)) {
        return (
            <div className="yaml-swagger-preview">
                <SwaggerUI
                    spec={state.data}
                    docExpansion="full"
                    defaultModelsExpandDepth={1}
                />
            </div>
        )
    }

    return (
        <div className="yaml-tree-preview">
            <TreeNode value={state.data} />
        </div>
    )
}

export default function YamlPreviewTool() {
    const [value, setValue] = useState(() =>
        loadDraft(toolId, yamlPreviewExample)
    )
    const [previewValue, setPreviewValue] = useState(value)
    const [indentSize, setIndentSize] = useState(2)
    const [autoPreview, setAutoPreview] = useState(true)
    const debouncedValue = useDebouncedValue(value, 250)

    useEffect(() => {
        saveDraft(toolId, value)
    }, [value])

    useEffect(() => {
        if (autoPreview) setPreviewValue(debouncedValue)
    }, [autoPreview, debouncedValue])

    const previewState = useMemo(() => {
        try {
            return { data: parseYamlValue(previewValue), error: '' }
        } catch (err) {
            return { data: null, error: err.message }
        }
    }, [previewValue])

    const updateYaml = (nextValue) => {
        setValue(nextValue)
        if (autoPreview) setPreviewValue(nextValue)
    }

    const runTransform = (mode) => {
        try {
            const nextValue =
                mode === 'minify'
                    ? minifyYaml(value)
                    : formatYaml(value, indentSize)
            updateYaml(nextValue)
            message.success(
                mode === 'minify' ? 'YAML minified' : 'YAML formatted'
            )
        } catch (err) {
            setPreviewValue(value)
            message.error(`Invalid YAML: ${err.message}`)
        }
    }

    const validate = () => {
        try {
            parseYaml(value)
            message.success('Valid YAML')
            setPreviewValue(value)
        } catch (err) {
            message.error(`Invalid YAML: ${err.message}`)
            setPreviewValue(value)
        }
    }

    const openFile = async (file) => {
        const nextValue = await readTextFile(file)
        updateYaml(nextValue)
        message.success('File opened')
        return false
    }

    const copy = async () => {
        const copyResult = await copyText(value)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const resetExample = () => updateYaml(yamlPreviewExample)

    const actions = useMemo(
        () => (
            <>
                <Upload
                    beforeUpload={openFile}
                    showUploadList={false}
                    accept=".yaml,.yml,.txt"
                >
                    <Button icon={<FileUp size={16} />}>Open</Button>
                </Upload>
                <Button
                    icon={<Wand2 size={16} />}
                    type="primary"
                    onClick={() => setPreviewValue(value)}
                >
                    Preview
                </Button>
                <Button
                    icon={<FileCode2 size={16} />}
                    onClick={() => runTransform('format')}
                >
                    Format
                </Button>
                <Button
                    icon={<Shrink size={16} />}
                    onClick={() => runTransform('minify')}
                >
                    Minify
                </Button>
                <Button onClick={validate}>Validate</Button>
                <Button icon={<Clipboard size={16} />} onClick={copy}>
                    Copy
                </Button>
                <Button
                    icon={<Download size={16} />}
                    onClick={() =>
                        downloadTextFile(
                            value,
                            'preview.yaml',
                            'application/yaml'
                        )
                    }
                >
                    Download
                </Button>
                <RevertExample onClick={resetExample} />
                <label className="yaml-auto-preview-toggle">
                    <input
                        type="checkbox"
                        checked={autoPreview}
                        onChange={(event) =>
                            setAutoPreview(event.target.checked)
                        }
                    />
                    <span>Auto preview</span>
                </label>
            </>
        ),
        [autoPreview, indentSize, value]
    )

    useToolActions(actions)

    return (
        <div className="tool-page yaml-preview-page">
            <div className="yaml-preview-layout">
                <section className="yaml-editor-panel" aria-label="YAML editor">
                    <div
                        className="tool-function-bar"
                        role="toolbar"
                        aria-label="Input options"
                    >
                        <span className="tool-function-label">Indent</span>
                        <Radio.Group
                            optionType="button"
                            size="small"
                            value={indentSize}
                            onChange={(event) =>
                                setIndentSize(event.target.value)
                            }
                            options={[
                                { label: '2 spaces', value: 2 },
                                { label: '4 spaces', value: 4 }
                            ]}
                        />
                    </div>
                    <FormatterInput
                        language="yaml"
                        className="tool-editor"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        spellCheck={false}
                    />
                </section>
                <section
                    className="yaml-preview-output"
                    aria-label="YAML preview"
                >
                    <YamlPreviewContent state={previewState} />
                </section>
            </div>
        </div>
    )
}
