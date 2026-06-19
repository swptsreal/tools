# Converter Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Converter tool cluster: JSON ↔ YAML, CSV ↔ JSON, Timestamp Converter, and Color Converter.

**Architecture:** Follow the current offline-first pattern: one tool folder under `src/tools`, registered in `src/tools/registry.js`, rendered through existing lazy routes and sidebar grouping. Reuse `SplitWorkspace`, `useToolActions`, draft storage, copy, download, upload, and `FormatterOutput`; keep parser/serializer helpers browser-only with no backend calls.

**Tech Stack:** React 19, Vite, Ant Design, lucide-react, Playwright E2E, localStorage drafts, browser FileReader/Blob APIs.

---

## Current Project Notes

- Existing tools live in `src/tools/<tool-id>/index.jsx`, optional `example.js`, and `style.css`.
- `src/tools/registry.js` is the only tool registration point; routes and sidebar derive from it.
- User-visible tests live in `tests/e2e/app.spec.js`; responsive coverage loops through hard-coded tool paths.
- Shared utilities already cover drafts, file reading, clipboard, download, and split editor/output layout.
- Do not add dependencies unless necessary; implement lightweight converters locally first.

---

### Task 1: Converter Registry and Responsive Coverage

**Files:**
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing registry/navigation test**

Add this test near the existing navigation tests in `tests/e2e/app.spec.js`:

```js
test('shows converter tools in sidebar navigation', async ({ page }) => {
    await page.goto('/tools/json-yaml-converter')

    await expect(page.locator('.desktop-sidebar').getByText('Converter')).toBeVisible()
    await expect(page.getByRole('link', { name: /JSON YAML Converter/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /CSV JSON Converter/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Timestamp Converter/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Color Converter/ })).toBeVisible()
})
```

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e -- --grep "converter tools in sidebar"`

Expected: FAIL because `/tools/json-yaml-converter` and registry entries do not exist.

- [ ] **Step 3: Register converter tools**

Update `src/tools/registry.js` imports:

```js
import {
    Braces,
    CalendarClock,
    CodeXml,
    Database,
    FileJson,
    FileSpreadsheet,
    FileText,
    Palette,
    Workflow
} from 'lucide-react'
```

Append these entries after the Formatter group:

```js
{
    id: 'json-yaml-converter',
    name: 'JSON YAML Converter',
    group: 'Converter',
    description: 'Convert JSON and YAML offline.',
    icon: FileJson,
    Component: lazy(() => import('./json-yaml-converter/index.jsx'))
},
{
    id: 'csv-json-converter',
    name: 'CSV JSON Converter',
    group: 'Converter',
    description: 'Convert CSV and JSON arrays offline.',
    icon: FileSpreadsheet,
    Component: lazy(() => import('./csv-json-converter/index.jsx'))
},
{
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    group: 'Converter',
    description: 'Convert Unix timestamps and dates offline.',
    icon: CalendarClock,
    Component: lazy(() => import('./timestamp-converter/index.jsx'))
},
{
    id: 'color-converter',
    name: 'Color Converter',
    group: 'Converter',
    description: 'Convert HEX, RGB, HSL, and HSV colors offline.',
    icon: Palette,
    Component: lazy(() => import('./color-converter/index.jsx'))
}
```

- [ ] **Step 4: Add converter paths to responsive loop**

In `tests/e2e/app.spec.js`, extend the existing responsive path array:

```js
'/tools/json-yaml-converter',
'/tools/csv-json-converter',
'/tools/timestamp-converter',
'/tools/color-converter'
```

- [ ] **Step 5: Run registry test**

Run: `npm run test:e2e -- --grep "converter tools in sidebar"`

Expected: still FAIL until tool components are added; navigation entries are now present once chunks load.

---

### Task 2: JSON YAML Converter

**Files:**
- Create: `src/tools/json-yaml-converter/index.jsx`
- Create: `src/tools/json-yaml-converter/example.js`
- Create: `src/tools/json-yaml-converter/style.css`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing E2E tests**

Add focused user-visible tests:

```js
test('converts JSON to YAML offline', async ({ page }) => {
    await page.goto('/tools/json-yaml-converter')
    await page.locator('textarea').fill('{"name":"Useful Tools","tags":["offline","converter"],"enabled":true}')
    await page.getByRole('button', { name: 'JSON to YAML' }).click()
    await expect(page.locator('.fo-output')).toContainText('name: Useful Tools')
    await expect(page.locator('.fo-output')).toContainText('- offline')
})

test('converts YAML to JSON offline', async ({ page }) => {
    await page.goto('/tools/json-yaml-converter')
    await page.locator('textarea').fill('name: Useful Tools\nenabled: true\ncount: 3')
    await page.getByRole('button', { name: 'YAML to JSON' }).click()
    await expect(page.locator('.fo-output')).toContainText('"enabled": true')
    await expect(page.locator('.fo-output')).toContainText('"count": 3')
})
```

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e -- --grep "JSON to YAML|YAML to JSON"`

Expected: FAIL because the route/component does not exist.

- [ ] **Step 3: Add examples**

Create `src/tools/json-yaml-converter/example.js`:

```js
export const jsonYamlExample = `{
    "name": "Useful Tools",
    "offline": true,
    "tags": ["converter", "local"],
    "limits": {
        "upload": false,
        "draft": true
    }
}`
```

- [ ] **Step 4: Implement converter component**

Create `src/tools/json-yaml-converter/index.jsx` with local helpers:

```jsx
import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileJson, FileUp, RotateCcw } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { jsonYamlExample } from './example.js'
import './style.css'

const toolId = 'json-yaml-converter'

function scalarToYaml(value) {
    if (value === null) return 'null'
    if (typeof value === 'string') return /^[A-Za-z0-9 _.-]+$/.test(value) ? value : JSON.stringify(value)
    return String(value)
}

function toYaml(value, indent = 0) {
    const pad = ' '.repeat(indent)
    if (Array.isArray(value)) {
        return value.map((item) => {
            if (item && typeof item === 'object') return `${pad}-\n${toYaml(item, indent + 2)}`
            return `${pad}- ${scalarToYaml(item)}`
        }).join('\n')
    }
    if (value && typeof value === 'object') {
        return Object.entries(value).map(([key, item]) => {
            if (item && typeof item === 'object') return `${pad}${key}:\n${toYaml(item, indent + 2)}`
            return `${pad}${key}: ${scalarToYaml(item)}`
        }).join('\n')
    }
    return `${pad}${scalarToYaml(value)}`
}

function parseYamlScalar(value) {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null') return null
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1)
    return value
}

function fromSimpleYaml(input) {
    const result = {}
    for (const rawLine of input.split('\n')) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const match = line.match(/^([^:]+):\s*(.*)$/)
        if (!match) throw new Error(`Unsupported YAML line: ${line}`)
        result[match[1].trim()] = parseYamlScalar(match[2].trim())
    }
    return result
}

export default function JsonYamlConverterTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, jsonYamlExample))
    const [result, setResult] = useState('')
    const [language, setLanguage] = useState('yaml')
    const [error, setError] = useState('')

    useEffect(() => saveDraft(toolId, value), [value])

    const convertJsonToYaml = () => {
        try {
            setResult(toYaml(JSON.parse(value)))
            setLanguage('yaml')
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid JSON: ${err.message}`)
        }
    }

    const convertYamlToJson = () => {
        try {
            setResult(JSON.stringify(fromSimpleYaml(value), null, 4))
            setLanguage('json')
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid YAML: ${err.message}`)
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

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".json,.yaml,.yml,.txt"><Button icon={<FileUp size={16} />}>Open</Button></Upload>
            <Button icon={<FileJson size={16} />} type="primary" onClick={convertJsonToYaml}>JSON to YAML</Button>
            <Button icon={<FileJson size={16} />} onClick={convertYamlToJson}>YAML to JSON</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, language === 'json' ? 'converted.json' : 'converted.yaml')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={() => { setValue(jsonYamlExample); setResult(''); setError('') }}>Example</Button>
        </>
    ), [result, value, language])

    useToolActions(actions)

    return <div className="tool-page converter-page"><SplitWorkspace left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />} right={error ? <pre className="converter-error">{error}</pre> : <FormatterOutput code={result} language={language} />} /></div>
}
```

- [ ] **Step 5: Add shared converter CSS**

Create `src/tools/json-yaml-converter/style.css`:

```css
.converter-page {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.converter-error {
    height: 100%;
    margin: 0;
    padding: 16px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: Consolas, monospace;
    font-size: 14px;
    color: #991b1b;
    background: #fef2f2;
}
```

- [ ] **Step 6: Run GREEN**

Run: `npm run test:e2e -- --grep "JSON to YAML|YAML to JSON"`

Expected: PASS.

---

### Task 3: CSV JSON Converter

**Files:**
- Create: `src/tools/csv-json-converter/index.jsx`
- Create: `src/tools/csv-json-converter/example.js`
- Create: `src/tools/csv-json-converter/style.css`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing E2E tests**

```js
test('converts CSV to JSON offline', async ({ page }) => {
    await page.goto('/tools/csv-json-converter')
    await page.locator('textarea').fill('name,count\nUseful Tools,4\nOffline,1')
    await page.getByRole('button', { name: 'CSV to JSON' }).click()
    await expect(page.locator('.fo-output')).toContainText('"name": "Useful Tools"')
    await expect(page.locator('.fo-output')).toContainText('"count": "4"')
})

test('converts JSON array to CSV offline', async ({ page }) => {
    await page.goto('/tools/csv-json-converter')
    await page.locator('textarea').fill('[{"name":"Useful Tools","count":4},{"name":"Offline","count":1}]')
    await page.getByRole('button', { name: 'JSON to CSV' }).click()
    await expect(page.locator('.fo-output')).toContainText('name,count')
    await expect(page.locator('.fo-output')).toContainText('Useful Tools,4')
})
```

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e -- --grep "CSV to JSON|JSON array to CSV"`

Expected: FAIL because the route/component does not exist.

- [ ] **Step 3: Implement CSV helpers and component**

Create `src/tools/csv-json-converter/example.js`:

```js
export const csvJsonExample = `name,count,local
Useful Tools,4,true
Offline,1,true`
```

Create `src/tools/csv-json-converter/index.jsx` by copying the JSON YAML tool shell and replacing conversion helpers with:

```js
function parseCsv(input) {
    const rows = input.trim().split(/\r?\n/).map((line) => line.split(',').map((cell) => cell.trim()))
    const headers = rows.shift()
    if (!headers?.length) throw new Error('CSV header row is required.')
    return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
}

function escapeCsvCell(value) {
    const text = String(value ?? '')
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(input) {
    const rows = JSON.parse(input)
    if (!Array.isArray(rows)) throw new Error('JSON must be an array of objects.')
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    return [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(','))].join('\n')
}
```

Use buttons named exactly `CSV to JSON` and `JSON to CSV`, `FormatterOutput language="json"` for JSON result and `language="csv"` for CSV result, draft id `csv-json-converter`, download names `converted.json` and `converted.csv`.

- [ ] **Step 4: Add CSS**

Create `src/tools/csv-json-converter/style.css` with the same `.converter-page` and `.converter-error` CSS from Task 2.

- [ ] **Step 5: Run GREEN**

Run: `npm run test:e2e -- --grep "CSV to JSON|JSON array to CSV"`

Expected: PASS.

---

### Task 4: Timestamp Converter

**Files:**
- Create: `src/tools/timestamp-converter/index.jsx`
- Create: `src/tools/timestamp-converter/example.js`
- Create: `src/tools/timestamp-converter/style.css`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing E2E tests**

```js
test('converts unix seconds to ISO date offline', async ({ page }) => {
    await page.goto('/tools/timestamp-converter')
    await page.locator('textarea').fill('1704067200')
    await page.getByRole('button', { name: 'Timestamp to Date' }).click()
    await expect(page.locator('.fo-output')).toContainText('2024-01-01T00:00:00.000Z')
})

test('converts ISO date to unix timestamps offline', async ({ page }) => {
    await page.goto('/tools/timestamp-converter')
    await page.locator('textarea').fill('2024-01-01T00:00:00.000Z')
    await page.getByRole('button', { name: 'Date to Timestamp' }).click()
    await expect(page.locator('.fo-output')).toContainText('Seconds: 1704067200')
    await expect(page.locator('.fo-output')).toContainText('Milliseconds: 1704067200000')
})
```

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e -- --grep "unix seconds|ISO date"`

Expected: FAIL because the route/component does not exist.

- [ ] **Step 3: Implement converter**

Create `src/tools/timestamp-converter/example.js`:

```js
export const timestampExample = '1704067200'
```

Create `src/tools/timestamp-converter/index.jsx` with the existing tool shell and helpers:

```js
function timestampToDate(value) {
    const numeric = Number(value.trim())
    if (!Number.isFinite(numeric)) throw new Error('Timestamp must be a number.')
    const milliseconds = Math.abs(numeric) < 100000000000 ? numeric * 1000 : numeric
    const date = new Date(milliseconds)
    if (Number.isNaN(date.getTime())) throw new Error('Timestamp is out of range.')
    return [`ISO: ${date.toISOString()}`, `UTC: ${date.toUTCString()}`, `Local: ${date.toString()}`].join('\n')
}

function dateToTimestamp(value) {
    const date = new Date(value.trim())
    if (Number.isNaN(date.getTime())) throw new Error('Date is invalid.')
    return [`Seconds: ${Math.floor(date.getTime() / 1000)}`, `Milliseconds: ${date.getTime()}`, `ISO: ${date.toISOString()}`].join('\n')
}
```

Use buttons named exactly `Timestamp to Date`, `Date to Timestamp`, `Now`, `Copy`, `Download`, and `Example`. `Now` fills the textarea with `String(Math.floor(Date.now() / 1000))` and clears output/error.

- [ ] **Step 4: Add CSS**

Create `src/tools/timestamp-converter/style.css` with the same `.converter-page` and `.converter-error` CSS from Task 2.

- [ ] **Step 5: Run GREEN**

Run: `npm run test:e2e -- --grep "unix seconds|ISO date"`

Expected: PASS.

---

### Task 5: Color Converter

**Files:**
- Create: `src/tools/color-converter/index.jsx`
- Create: `src/tools/color-converter/example.js`
- Create: `src/tools/color-converter/style.css`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing E2E tests**

```js
test('converts hex color to rgb and hsl offline', async ({ page }) => {
    await page.goto('/tools/color-converter')
    await page.locator('textarea').fill('#336699')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('.fo-output')).toContainText('HEX: #336699')
    await expect(page.locator('.fo-output')).toContainText('RGB: rgb(51, 102, 153)')
    await expect(page.locator('.fo-output')).toContainText('HSL: hsl(210, 50%, 40%)')
})
```

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e -- --grep "hex color"`

Expected: FAIL because the route/component does not exist.

- [ ] **Step 3: Implement color helpers**

Create `src/tools/color-converter/example.js`:

```js
export const colorExample = '#336699'
```

Create `src/tools/color-converter/index.jsx` with the existing tool shell and helpers:

```js
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
    const r = red / 255
    const g = green / 255
    const b = blue / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const lightness = (max + min) / 2
    const delta = max - min
    if (delta === 0) return { hue: 0, saturation: 0, lightness: Math.round(lightness * 100) }
    const saturation = delta / (1 - Math.abs(2 * lightness - 1))
    const hueBase = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
    return { hue: Math.round(hueBase * 60 + (hueBase < 0 ? 360 : 0)), saturation: Math.round(saturation * 100), lightness: Math.round(lightness * 100) }
}

function convertColor(input) {
    const rgb = parseHex(input)
    const hsl = rgbToHsl(rgb)
    return [`HEX: ${rgbToHex(rgb)}`, `RGB: rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`, `HSL: hsl(${hsl.hue}, ${hsl.saturation}%, ${hsl.lightness}%)`].join('\n')
}
```

Use button named exactly `Convert Color`, draft id `color-converter`, and output language `css`.

- [ ] **Step 4: Add color preview CSS**

Create `src/tools/color-converter/style.css`:

```css
.converter-page {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.converter-error {
    height: 100%;
    margin: 0;
    padding: 16px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: Consolas, monospace;
    font-size: 14px;
    color: #991b1b;
    background: #fef2f2;
}
```

- [ ] **Step 5: Run GREEN**

Run: `npm run test:e2e -- --grep "hex color"`

Expected: PASS.

---

### Task 6: README and Final Verification

**Files:**
- Modify: `README.md`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Move converter tools from planned to current**

In `README.md`, add under `## Tools Hiện Có`:

```md
### Converter

- JSON YAML Converter: đổi JSON sang YAML và YAML đơn giản sang JSON.
- CSV JSON Converter: đổi CSV sang JSON array và JSON array sang CSV.
- Timestamp Converter: đổi Unix timestamp sang ngày giờ và ngược lại.
- Color Converter: đổi HEX sang RGB và HSL.
```

Remove these items from `## Tools Sẽ Có` → `### Converter`:

```md
- JSON ↔ YAML
- CSV ↔ JSON
- Timestamp Converter
- Color Converter
```

- [ ] **Step 2: Run converter test subset**

Run: `npm run test:e2e -- --grep "converter|JSON to YAML|YAML to JSON|CSV to JSON|JSON array to CSV|unix seconds|ISO date|hex color"`

Expected: PASS.

- [ ] **Step 3: Run full E2E**

Run: `npm run test:e2e`

Expected: PASS across mobile `390x844`, tablet `768x1024`, and desktop `1280x800`.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS; converter tools are lazy-loaded chunks and no external network calls are introduced.

---

## Self-Review

- Spec coverage: all README planned converter items are covered by Tasks 2–5.
- Offline-first: all conversion logic runs in browser JavaScript; no API calls or upload services.
- Project pattern: each converter has its own folder, example, CSS, registry entry, draft id, copy/download actions, and E2E coverage.
- TDD: every behavior task starts with a failing Playwright test and a specific RED/GREEN command.
- Responsive: Task 1 extends the existing breakpoint loop for all converter routes.
- Risk: YAML and CSV helpers are intentionally lightweight; they cover common flat/nested JSON-to-YAML output and simple YAML input, plus simple CSV with quoted output. Add a dependency only if broader YAML/CSV compatibility becomes a confirmed requirement.
