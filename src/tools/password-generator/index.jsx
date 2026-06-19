import { useMemo, useState } from 'react'
import { Button, Checkbox, InputNumber, message } from 'antd'
import { Clipboard, Download, RotateCcw, ShieldCheck } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { passwordDefaults } from './example.js'
import './style.css'

const groups = {
    includeUppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    includeLowercase: 'abcdefghijklmnopqrstuvwxyz',
    includeNumbers: '0123456789',
    includeSymbols: '!@#$%^&*()_+-=[]{};\':"\\|,.<>/?'
}

function randomIndex(max) {
    const bytes = new Uint32Array(1)
    crypto.getRandomValues(bytes)
    return bytes[0] % max
}

function shuffle(chars) {
    const copy = [...chars]
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = randomIndex(index + 1)
        ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
    }
    return copy.join('')
}

function generatePassword(options) {
    const selectedGroups = Object.entries(groups).filter(([key]) => options[key]).map(([, value]) => value)
    const fallbackGroups = selectedGroups.length ? selectedGroups : [groups.includeLowercase]
    const pool = fallbackGroups.join('')
    const required = fallbackGroups.map((group) => group[randomIndex(group.length)])
    const remainingLength = Math.max(options.length, required.length) - required.length
    const remaining = Array.from({ length: remainingLength }, () => pool[randomIndex(pool.length)])
    return shuffle([...required, ...remaining])
}

export default function PasswordGeneratorTool() {
    const [options, setOptions] = useState(passwordDefaults)
    const [result, setResult] = useState('')

    const updateOption = (key, value) => setOptions((current) => ({ ...current, [key]: value }))
    const generate = () => setResult(generatePassword(options))

    const copy = async () => {
        const copyResult = await copyText(result)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const reset = () => {
        setOptions(passwordDefaults)
        setResult('')
    }

    const actions = useMemo(() => (
        <>
            <Button icon={<ShieldCheck size={16} />} type="primary" onClick={generate}>Generate Password</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result, 'password.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={reset}>Reset</Button>
        </>
    ), [options, result])

    useToolActions(actions)

    return (
        <div className="tool-page generator-page">
            <SplitWorkspace
                left={(
                    <div className="generator-form">
                        <label className="generator-field">
                            <span>Length</span>
                            <InputNumber min={8} max={128} value={options.length} onChange={(value) => updateOption('length', value ?? 20)} />
                        </label>
                        <Checkbox checked={options.includeUppercase} onChange={(event) => updateOption('includeUppercase', event.target.checked)}>Include uppercase</Checkbox>
                        <Checkbox checked={options.includeLowercase} onChange={(event) => updateOption('includeLowercase', event.target.checked)}>Include lowercase</Checkbox>
                        <Checkbox checked={options.includeNumbers} onChange={(event) => updateOption('includeNumbers', event.target.checked)}>Include numbers</Checkbox>
                        <Checkbox checked={options.includeSymbols} onChange={(event) => updateOption('includeSymbols', event.target.checked)}>Include symbols</Checkbox>
                        <Button type="primary" icon={<ShieldCheck size={16} />} onClick={generate}>Generate Password</Button>
                    </div>
                )}
                right={<FormatterOutput code={result} language="text" />}
            />
        </div>
    )
}
