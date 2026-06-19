import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Radio } from 'antd'
import { Clipboard, Download, Palette, RotateCcw } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { colorExample } from './example.js'
import './style.css'

const toolId = 'color-converter'

function parseHex(input) {
    const value = input.trim().replace(/^#/, '')
    const normalized = value.length === 3 ? value.split('').map((char) => char + char).join('') : value
    if (!/^[\da-f]{6}$/i.test(normalized)) throw new Error('Enter a 3 or 6 digit HEX color.')
    return {
        red: parseInt(normalized.slice(0, 2), 16),
        green: parseInt(normalized.slice(2, 4), 16),
        blue: parseInt(normalized.slice(4, 6), 16)
    }
}

function rgbToHex({ red, green, blue }) {
    return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

function rgbToHsl({ red, green, blue }) {
    const redRatio = red / 255
    const greenRatio = green / 255
    const blueRatio = blue / 255
    const max = Math.max(redRatio, greenRatio, blueRatio)
    const min = Math.min(redRatio, greenRatio, blueRatio)
    const lightness = (max + min) / 2
    const delta = max - min
    if (delta === 0) return { hue: 0, saturation: 0, lightness: Math.round(lightness * 100) }
    const saturation = delta / (1 - Math.abs(2 * lightness - 1))
    const hueBase = max === redRatio ? ((greenRatio - blueRatio) / delta) % 6 : max === greenRatio ? (blueRatio - redRatio) / delta + 2 : (redRatio - greenRatio) / delta + 4
    return {
        hue: Math.round(hueBase * 60 + (hueBase < 0 ? 360 : 0)),
        saturation: Math.round(saturation * 100),
        lightness: Math.round(lightness * 100)
    }
}

function convertColor(input, outputFormat = 'All') {
    const rgb = parseHex(input)
    const hsl = rgbToHsl(rgb)
    const lines = [
        ['HEX', `HEX: ${rgbToHex(rgb)}`],
        ['RGB', `RGB: rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`],
        ['HSL', `HSL: hsl(${hsl.hue}, ${hsl.saturation}%, ${hsl.lightness}%)`]
    ]
    return lines.filter(([name]) => outputFormat === 'All' || outputFormat === name).map(([, line]) => line).join('\n')
}

export default function ColorConverterTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, colorExample))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [outputFormat, setOutputFormat] = useState('All')

    useEffect(() => saveDraft(toolId, value), [value])

    const run = () => {
        try {
            setResult(convertColor(value, outputFormat))
            setError('')
        } catch (err) {
            setResult('')
            setError(err.message)
        }
    }

    const copy = async () => {
        const copyResult = await copyText(result || value)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const resetExample = () => {
        setValue(colorExample)
        setResult('')
        setError('')
    }

    const actions = useMemo(() => (
        <>
            <Button icon={<Palette size={16} />} type="primary" onClick={run}>Convert Color</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'color-conversion.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
        </>
    ), [outputFormat, result, value])

    useToolActions(actions)

    return (
        <div className="tool-page converter-page">
            <SplitWorkspace
                leftToolbar={(
                    <>
                        <span className="tool-function-label">Output</span>
                        <Radio.Group optionType="button" size="small" value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)} options={[{ label: 'All', value: 'All' }, { label: 'HEX', value: 'HEX' }, { label: 'RGB', value: 'RGB' }, { label: 'HSL', value: 'HSL' }]} />
                    </>
                )}
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="converter-error">{error}</pre> : <FormatterOutput code={result} language="css" />}
            />
        </div>
    )
}
