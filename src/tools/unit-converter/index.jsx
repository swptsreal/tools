import { useMemo, useState } from 'react'
import { Button, Input, Select } from 'antd'
import { Ruler } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import './style.css'

const units = {
    Length: {
        Meter: 1,
        Kilometer: 1000,
        Centimeter: 0.01,
        Mile: 1609.344,
        Foot: 0.3048
    },
    Weight: { Gram: 1, Kilogram: 1000, Pound: 453.59237, Ounce: 28.349523125 },
    Storage: {
        Byte: 1,
        Kilobyte: 1024,
        Megabyte: 1048576,
        Gigabyte: 1073741824
    },
    Temperature: { Celsius: 'c', Fahrenheit: 'f', Kelvin: 'k' }
}

function convert(v, c, f, t) {
    const n = Number(v)
    if (!Number.isFinite(n)) return ''
    if (c === 'Temperature') {
        let cel =
            f === 'Celsius'
                ? n
                : f === 'Fahrenheit'
                  ? ((n - 32) * 5) / 9
                  : n - 273.15
        let out =
            t === 'Celsius'
                ? cel
                : t === 'Fahrenheit'
                  ? (cel * 9) / 5 + 32
                  : cel + 273.15
        return `${Number(out.toFixed(6))} ${t}`
    }
    return `${Number(((n * units[c][f]) / units[c][t]).toFixed(6))} ${t}`
}
export default function UnitConverterTool() {
    const [value, setValue] = useState('1000')
    const [category, setCategory] = useState('Length')
    const names = Object.keys(units[category])
    const [from, setFrom] = useState('Meter')
    const [to, setTo] = useState('Kilometer')
    const [result, setResult] = useState('')
    const run = () => setResult(convert(value, category, from, to))
    useToolActions(
        useMemo(
            () => (
                <Button icon={<Ruler size={16} />} type="primary" onClick={run}>
                    Convert
                </Button>
            ),
            [value, category, from, to]
        )
    )
    const changeCat = (c) => {
        setCategory(c)
        const ns = Object.keys(units[c])
        setFrom(ns[0])
        setTo(ns[1] || ns[0])
        setResult('')
    }
    return (
        <div className="tool-page developer-tool-page">
            <SplitWorkspace
                leftToolbar={
                    <>
                        <label
                            className="tool-function-label"
                            htmlFor="unit-value"
                        >
                            Value
                        </label>
                        <Input
                            id="unit-value"
                            aria-label="Value"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            style={{ width: 120 }}
                        />
                        <label
                            className="tool-function-label"
                            htmlFor="unit-category"
                        >
                            Category
                        </label>
                        <Select
                            id="unit-category"
                            aria-label="Category"
                            size="small"
                            value={category}
                            onChange={changeCat}
                            options={Object.keys(units).map((x) => ({
                                value: x,
                                label: x
                            }))}
                            style={{ width: 140 }}
                        />
                        <label
                            className="tool-function-label"
                            htmlFor="unit-from"
                        >
                            From unit
                        </label>
                        <Select
                            id="unit-from"
                            aria-label="From unit"
                            size="small"
                            value={from}
                            onChange={setFrom}
                            options={names.map((x) => ({ value: x, label: x }))}
                            style={{ width: 140 }}
                        />
                        <label
                            className="tool-function-label"
                            htmlFor="unit-to"
                        >
                            To unit
                        </label>
                        <Select
                            id="unit-to"
                            aria-label="To unit"
                            size="small"
                            value={to}
                            onChange={setTo}
                            options={names.map((x) => ({ value: x, label: x }))}
                            style={{ width: 140 }}
                        />
                    </>
                }
                left={
                    <div className="dev-result">
                        <div className="dev-card">
                            Convert common units offline.
                        </div>
                    </div>
                }
                right={
                    <div className="dev-result">
                        <div className="dev-card">
                            <h3>Result</h3>
                            <p className="dev-mono">{result}</p>
                        </div>
                    </div>
                }
            />
        </div>
    )
}
