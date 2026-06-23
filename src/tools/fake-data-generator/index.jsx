import { useMemo, useState } from 'react'
import { Button, InputNumber, Select, message } from 'antd'
import {
    Clipboard,
    Database,
    Download,
    Plus,
    RotateCcw,
    Trash2,
    ChevronUp,
    ChevronDown
} from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { fakeDataDefaults, FIELD_TYPES } from './example.js'
import './style.css'
import RevertExample from '../../shared/components/RevertExample.jsx'

const firstNames = [
    'Ava',
    'Mina',
    'Noah',
    'Kai',
    'Linh',
    'An',
    'Minh',
    'Huy',
    'Lan',
    'Tuan',
    'Nhung',
    'Duc',
    'Bao',
    'Quynh',
    'Hoa',
    'Trang',
    'Long',
    'Phuong',
    'Son',
    'Thao'
]
const lastNames = [
    'Nguyen',
    'Tran',
    'Pham',
    'Le',
    'Hoang',
    'Vu',
    'Vo',
    'Do',
    'Huynh',
    'Bui',
    'Dang',
    'Ngo',
    'Duong',
    'Ly',
    'Dinh'
]
const domains = [
    'example.com',
    'local.test',
    'demo.dev',
    'mail.test',
    'test.io'
]
const companies = [
    'Tech Corp',
    'Data Inc',
    'CloudSoft',
    'GreenField',
    'AlphaTech',
    'NexGen',
    'Quantix',
    'Bamboo'
]
const streets = [
    'Le Loi',
    'Nguyen Hue',
    'Tran Hung Dao',
    'Hai Ba Trung',
    'Ly Thuong Kiet',
    'Pham Ngu Lao',
    'Dien Bien Phu',
    'Cach Mang Thang Tam'
]
const cities = [
    'Ho Chi Minh City',
    'Hanoi',
    'Da Nang',
    'Hai Phong',
    'Can Tho',
    'Nha Trang',
    'Hue',
    'Da Lat'
]
const countries = [
    'Vietnam',
    'Japan',
    'South Korea',
    'Singapore',
    'Germany',
    'USA',
    'France',
    'Australia'
]
const words = [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua'
]

function randomIndex(max) {
    const bytes = new Uint32Array(1)
    crypto.getRandomValues(bytes)
    return bytes[0] % max
}

function randomFrom(arr) {
    return arr[randomIndex(arr.length)]
}

function randomInt(min, max) {
    return min + randomIndex(max - min + 1)
}

function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '.')
}

function generateFieldValue(type, index) {
    const firstName = randomFrom(firstNames)
    const lastName = randomFrom(lastNames)

    switch (type) {
        case 'uuid':
            return crypto.randomUUID()
        case 'firstName':
            return firstName
        case 'lastName':
            return lastName
        case 'fullName':
            return `${firstName} ${lastName}`
        case 'email': {
            const domain = randomFrom(domains)
            return `${slug(firstName)}.${slug(lastName)}${index + 1}@${domain}`
        }
        case 'phone':
            return `09${Array.from({ length: 8 }, () => randomInt(0, 9)).join('')}`
        case 'number':
            return randomInt(1, 100)
        case 'boolean':
            return randomInt(0, 1) === 1
        case 'date': {
            const start = new Date('2020-01-01')
            const end = new Date()
            const d = new Date(
                start.getTime() + randomIndex(end.getTime() - start.getTime())
            )
            return d.toISOString().split('T')[0]
        }
        case 'company':
            return randomFrom(companies)
        case 'streetAddress':
            return `${randomInt(1, 999)} ${randomFrom(streets)}`
        case 'city':
            return randomFrom(cities)
        case 'country':
            return randomFrom(countries)
        case 'zipCode':
            return `${randomInt(10000, 99999)}`
        case 'text':
            return Array.from({ length: randomInt(2, 5) }, () =>
                randomFrom(words)
            ).join(' ')
        default:
            return ''
    }
}

function generateRecords(fields, count) {
    return Array.from({ length: count }, (_, index) => {
        const record = {}
        for (const field of fields) {
            record[field.label] = generateFieldValue(field.type, index)
        }
        return record
    })
}

function toCsv(records) {
    if (!records.length) return ''
    const headers = Object.keys(records[0])
    const lines = records.map((r) =>
        headers
            .map((h) => {
                const s = r[h] == null ? '' : String(r[h])
                return s.includes(',') || s.includes('"') || s.includes('\n')
                    ? `"${s.replace(/"/g, '""')}"`
                    : s
            })
            .join(',')
    )
    return [headers.join(','), ...lines].join('\n')
}

export default function FakeDataGeneratorTool() {
    const [fields, setFields] = useState(() =>
        fakeDataDefaults.fields.map((f) => ({ ...f, id: crypto.randomUUID() }))
    )
    const [count, setCount] = useState(fakeDataDefaults.count)
    const [result, setResult] = useState('')
    const [format, setFormat] = useState('json')

    const addField = () => {
        setFields((prev) => [
            ...prev,
            { id: crypto.randomUUID(), label: '', type: 'text' }
        ])
    }

    const removeField = (id) => {
        setFields((prev) => prev.filter((f) => f.id !== id))
    }

    const moveField = (id, direction) => {
        setFields((prev) => {
            const idx = prev.findIndex((f) => f.id === id)
            if (idx === -1) return prev
            const target = idx + direction
            if (target < 0 || target >= prev.length) return prev
            const next = [...prev]
            ;[next[idx], next[target]] = [next[target], next[idx]]
            return next
        })
    }

    const updateField = (id, key, value) => {
        setFields((prev) =>
            prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
        )
    }

    const generate = () => {
        const validFields = fields.filter((f) => f.label.trim())
        if (!validFields.length) {
            message.warning('Please add at least one field with a label.')
            return
        }
        const safeCount = Math.min(Math.max(Number(count) || 1, 1), 100)
        const records = generateRecords(validFields, safeCount)
        setResult(
            format === 'json'
                ? JSON.stringify(records, null, 2)
                : toCsv(records)
        )
    }

    const copy = async () => {
        const copyResult = await copyText(result)
        message[copyResult.ok ? 'success' : 'warning'](copyResult.message)
    }

    const reset = () => {
        setFields(
            fakeDataDefaults.fields.map((f) => ({
                ...f,
                id: crypto.randomUUID()
            }))
        )
        setCount(fakeDataDefaults.count)
        setResult('')
        setFormat('json')
    }

    const actions = useMemo(
        () => (
            <>
                <Button
                    icon={<Database size={16} />}
                    type="primary"
                    onClick={generate}
                >
                    Generate
                </Button>
                <Button icon={<Clipboard size={16} />} onClick={copy}>
                    Copy
                </Button>
                <Button
                    icon={<Download size={16} />}
                    onClick={() =>
                        downloadTextFile(
                            result,
                            `fake-data.${format === 'json' ? 'json' : 'csv'}`,
                            format === 'json' ? 'application/json' : 'text/csv'
                        )
                    }
                >
                    Download
                </Button>
                <RevertExample onClick={reset} />
            </>
        ),
        [result, format]
    )

    useToolActions(actions)

    return (
        <div className="tool-page fake-gen-page">
            <div className="fake-gen-workspace">
                <div className="fake-gen-form-panel">
                    <div className="fake-gen-controls">
                        <label className="generator-field">
                            <span>Records</span>
                            <InputNumber
                                min={1}
                                max={100}
                                value={count}
                                onChange={(value) => setCount(value ?? 5)}
                            />
                        </label>
                        <div className="fake-gen-format">
                            <span>Format</span>
                            <div className="fake-gen-format-btns">
                                <Button
                                    size="small"
                                    type={format === 'json' ? 'primary' : 'default'}
                                    onClick={() => setFormat('json')}
                                >
                                    JSON
                                </Button>
                                <Button
                                    size="small"
                                    type={format === 'csv' ? 'primary' : 'default'}
                                    onClick={() => setFormat('csv')}
                                >
                                    CSV
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="fake-gen-fields">
                        <div className="fake-gen-fields-header">
                            <span>Fields</span>
                            <Button size="small" icon={<Plus size={14} />} onClick={addField}>
                                Add
                            </Button>
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="fake-gen-field-row">
                                <div className="fake-gen-field-order">
                                    <button
                                        className="fake-gen-order-btn"
                                        onClick={() => moveField(field.id, -1)}
                                        disabled={index === 0}
                                        aria-label="Move up"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        className="fake-gen-order-btn"
                                        onClick={() => moveField(field.id, 1)}
                                        disabled={index === fields.length - 1}
                                        aria-label="Move down"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                                <input
                                    className="fake-gen-field-label"
                                    placeholder="Field name"
                                    value={field.label}
                                    onChange={(e) => updateField(field.id, 'label', e.target.value)}
                                />
                                <Select
                                    className="fake-gen-field-type"
                                    size="small"
                                    value={field.type}
                                    onChange={(value) => updateField(field.id, 'type', value)}
                                    options={FIELD_TYPES}
                                />
                                <button
                                    className="fake-gen-field-remove"
                                    onClick={() => removeField(field.id)}
                                    aria-label="Remove field"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <Button type="primary" icon={<Database size={16} />} onClick={generate}>
                        Generate
                    </Button>
                </div>
                <div className="fake-gen-output-panel">
                    <FormatterOutput code={result} language={format === 'json' ? 'json' : 'text'} />
                </div>
            </div>
        </div>
    )
}
