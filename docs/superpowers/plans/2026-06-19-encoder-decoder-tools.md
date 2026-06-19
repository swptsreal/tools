# Encoder Decoder Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline-first Encoder/Decoder tool cluster with Base64, URL, HTML Entity, JWT, and Hash tools.

**Architecture:** Add one focused folder per tool under `src/tools`, matching current formatter/converter patterns: `example.js`, `index.jsx`, and `style.css`. Register each tool in `src/tools/registry.js`, reuse shared chrome/actions, keep all processing browser-local, and verify user-visible behavior with Playwright.

**Tech Stack:** React 19, Vite, Ant Design, lucide-react, Playwright E2E, browser Web APIs (`TextEncoder`, `TextDecoder`, `crypto.subtle`, `btoa`, `atob`, `URLSearchParams`).

---

## File Structure

- Modify: `tests/e2e/app.spec.js` — add focused user-visible tests for each encoder/decoder route and responsive no-overflow coverage.
- Modify: `src/tools/registry.js` — import encoder/decoder icons and register new lazy-loaded tools under group `Encoder / Decoder`.
- Create: `src/tools/base64-encoder-decoder/example.js` — sample Unicode-safe plain text.
- Create: `src/tools/base64-encoder-decoder/index.jsx` — Base64 encode/decode UI, file open, copy, download, draft persistence, errors.
- Create: `src/tools/base64-encoder-decoder/style.css` — scoped error/result layout.
- Create: `src/tools/url-encoder-decoder/example.js` — sample URL with query params and spaces.
- Create: `src/tools/url-encoder-decoder/index.jsx` — URL encode/decode and query-string pretty output.
- Create: `src/tools/url-encoder-decoder/style.css` — scoped error/result layout.
- Create: `src/tools/html-entity-encoder-decoder/example.js` — sample HTML snippet containing `&`, `<`, `>`, quotes, and apostrophes.
- Create: `src/tools/html-entity-encoder-decoder/index.jsx` — HTML entity encode/decode UI.
- Create: `src/tools/html-entity-encoder-decoder/style.css` — scoped error/result layout.
- Create: `src/tools/jwt-decoder/example.js` — unsigned/sample JWT string safe for offline display.
- Create: `src/tools/jwt-decoder/index.jsx` — decode JWT header/payload without verification, show readable warning, copy/download JSON.
- Create: `src/tools/jwt-decoder/style.css` — scoped warning/error layout.
- Create: `src/tools/hash-generator/example.js` — sample text to hash.
- Create: `src/tools/hash-generator/index.jsx` — SHA-1/SHA-256/SHA-384/SHA-512 hashing via `crypto.subtle`.
- Create: `src/tools/hash-generator/style.css` — scoped digest table/result layout.
- Modify: `README.md` — move implemented Encoder/Decoder entries from planned section into available tools.

---

### Task 1: Responsive Route Coverage

**Files:**
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing responsive tests**

Add this responsive test block to `tests/e2e/app.spec.js`:

```js
const encoderDecoderRoutes = [
    { path: '/tools/base64-encoder-decoder', heading: 'Base64 Encoder Decoder' },
    { path: '/tools/url-encoder-decoder', heading: 'URL Encoder Decoder' },
    { path: '/tools/html-entity-encoder-decoder', heading: 'HTML Entity Encoder Decoder' },
    { path: '/tools/jwt-decoder', heading: 'JWT Decoder' },
    { path: '/tools/hash-generator', heading: 'Hash Generator' }
]

for (const route of encoderDecoderRoutes) {
    for (const breakpoint of breakpoints) {
        test(`${route.heading} has no page overflow at ${breakpoint.name}`, async ({ page }) => {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
            await page.goto(route.path)

            await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
            await expectNoPageOverflow(page)
        })
    }
}
```

- [ ] **Step 2: Run responsive tests to verify failure**

Run: `npm run test:e2e -- --grep "Base64 Encoder Decoder|URL Encoder Decoder|HTML Entity Encoder Decoder|JWT Decoder|Hash Generator"`

Expected: FAIL with routes not found or headings missing.

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/e2e/app.spec.js
git commit -m "test: cover encoder decoder tool routes"
```

---

### Task 2: Base64 Encoder Decoder

**Files:**
- Create: `src/tools/base64-encoder-decoder/example.js`
- Create: `src/tools/base64-encoder-decoder/index.jsx`
- Create: `src/tools/base64-encoder-decoder/style.css`
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing Base64 behavior test**

Add to `tests/e2e/app.spec.js`:

```js
test('encodes and decodes Base64 with Unicode text offline', async ({ page }) => {
    await page.goto('/tools/base64-encoder-decoder')

    await expect(page.getByRole('heading', { name: 'Base64 Encoder Decoder' })).toBeVisible()

    await page.locator('textarea').fill('Hello Useful Tools — Xin chào')
    await page.getByRole('button', { name: 'Encode' }).click()

    await expect(page.locator('.fo-output')).toContainText('SGVsbG8gVXNlZnVsIFRvb2xzIOKAlCBYaW4gY2jDoG8=')

    await page.locator('textarea').fill('SGVsbG8gVXNlZnVsIFRvb2xzIOKAlCBYaW4gY2jDoG8=')
    await page.getByRole('button', { name: 'Decode' }).click()

    await expect(page.locator('.fo-output')).toContainText('Hello Useful Tools — Xin chào')
})
```

- [ ] **Step 2: Run Base64 test to verify failure**

Run: `npm run test:e2e -- --grep "Base64"`

Expected: FAIL with route not found or heading missing.

- [ ] **Step 3: Create Base64 example**

Create `src/tools/base64-encoder-decoder/example.js`:

```js
export const base64Example = `Hello Useful Tools — Xin chào

Encode this text to Base64, then decode it back offline.`
```

- [ ] **Step 4: Create Base64 tool implementation**

Create `src/tools/base64-encoder-decoder/index.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileCode2, FileUp, RotateCcw } from 'lucide-react'
import { FormatterOutput } from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { base64Example } from './example.js'
import './style.css'

const toolId = 'base64-encoder-decoder'

function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text)
    const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')
    return btoa(binary)
}

function decodeBase64(text) {
    const binary = atob(text.replace(/\s+/g, ''))
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0))
    return new TextDecoder().decode(bytes)
}

export default function Base64EncoderDecoderTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, base64Example))
    const [result, setResult] = useState('')
    const [error, setError] = useState('')

    useEffect(() => saveDraft(toolId, value), [value])

    const runEncode = () => {
        setResult(encodeBase64(value))
        setError('')
    }

    const runDecode = () => {
        try {
            setResult(decodeBase64(value))
            setError('')
        } catch (err) {
            setResult('')
            setError(`Invalid Base64: ${err.message}`)
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
        setValue(base64Example)
        setResult('')
        setError('')
    }

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".txt,.b64">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<FileCode2 size={16} />} type="primary" onClick={runEncode}>Encode</Button>
            <Button icon={<FileCode2 size={16} />} onClick={runDecode}>Decode</Button>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(result || value, 'base64.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
        </>
    ), [result, value])

    useToolActions(actions)

    return (
        <div className="tool-page encoder-page">
            <SplitWorkspace
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={error ? <pre className="encoder-error">{error}</pre> : <FormatterOutput code={result} language="text" />}
            />
        </div>
    )
}
```

- [ ] **Step 5: Create Base64 CSS**

Create `src/tools/base64-encoder-decoder/style.css`:

```css
.encoder-page {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.encoder-error {
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

- [ ] **Step 6: Register Base64 tool**

Modify `src/tools/registry.js` import line:

```js
import { Binary, Braces, CalendarClock, CodeXml, Database, FileJson, FileSpreadsheet, FileText, Link, Palette, Workflow } from 'lucide-react'
```

Add this object after the existing Converter group:

```js
{
    id: 'base64-encoder-decoder',
    name: 'Base64 Encoder Decoder',
    group: 'Encoder / Decoder',
    description: 'Encode and decode Base64 text offline.',
    icon: Binary,
    Component: lazy(() => import('./base64-encoder-decoder/index.jsx'))
}
```

- [ ] **Step 7: Run Base64 test to verify pass**

Run: `npm run test:e2e -- --grep "Base64"`

Expected: PASS.

- [ ] **Step 8: Commit Base64 tool**

```bash
git add tests/e2e/app.spec.js src/tools/registry.js src/tools/base64-encoder-decoder
git commit -m "feat: add base64 encoder decoder"
```

---

### Task 3: URL Encoder Decoder

**Files:**
- Create: `src/tools/url-encoder-decoder/example.js`
- Create: `src/tools/url-encoder-decoder/index.jsx`
- Create: `src/tools/url-encoder-decoder/style.css`
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing URL behavior test**

Add to `tests/e2e/app.spec.js`:

```js
test('encodes and decodes URL components offline', async ({ page }) => {
    await page.goto('/tools/url-encoder-decoder')

    await expect(page.getByRole('heading', { name: 'URL Encoder Decoder' })).toBeVisible()

    await page.locator('textarea').fill('https://example.test/search?q=hello tools&lang=vi')
    await page.getByRole('button', { name: 'Encode' }).click()

    await expect(page.locator('.fo-output')).toContainText('https%3A%2F%2Fexample.test%2Fsearch%3Fq%3Dhello%20tools%26lang%3Dvi')

    await page.locator('textarea').fill('https%3A%2F%2Fexample.test%2Fsearch%3Fq%3Dhello%20tools%26lang%3Dvi')
    await page.getByRole('button', { name: 'Decode' }).click()

    await expect(page.locator('.fo-output')).toContainText('https://example.test/search?q=hello tools&lang=vi')
})
```

- [ ] **Step 2: Run URL test to verify failure**

Run: `npm run test:e2e -- --grep "URL Encoder Decoder|URL components"`

Expected: FAIL with route not found or heading missing.

- [ ] **Step 3: Create URL example**

Create `src/tools/url-encoder-decoder/example.js`:

```js
export const urlExample = 'https://example.test/search?q=hello tools&lang=vi'
```

- [ ] **Step 4: Create URL tool implementation**

Create `src/tools/url-encoder-decoder/index.jsx` by copying the imports, state, draft persistence, file open, copy, reset, `useToolActions`, and `SplitWorkspace` structure from `src/tools/base64-encoder-decoder/index.jsx`, then set `toolId`, example import, labels, accepted file extensions, and handlers to these exact values:

```jsx
const toolId = 'url-encoder-decoder'

const runEncode = () => {
    setResult(encodeURIComponent(value))
    setError('')
}

const runDecode = () => {
    try {
        setResult(decodeURIComponent(value.replace(/\+/g, ' ')))
        setError('')
    } catch (err) {
        setResult('')
        setError(`Invalid URL encoding: ${err.message}`)
    }
}

const prettyQuery = () => {
    try {
        const url = value.includes('://') ? new URL(value) : new URL(`https://example.test/${value.replace(/^\?/, '?')}`)
        const params = Array.from(url.searchParams.entries())
        setResult(params.map(([key, item]) => `${key}: ${item}`).join('\n'))
        setError('')
    } catch (err) {
        setResult('')
        setError(`Invalid URL: ${err.message}`)
    }
}
```

Use actions: `Open`, `Encode`, `Decode`, `Pretty Query`, `Copy`, `Download`, `Example`. Use `FormatterOutput` with `language="text"`. Use `urlExample` as draft fallback.

- [ ] **Step 5: Create URL CSS**

Create `src/tools/url-encoder-decoder/style.css` with the same `.encoder-page` and `.encoder-error` rules from Task 2.

- [ ] **Step 6: Register URL tool**

Add to `src/tools/registry.js` after Base64:

```js
{
    id: 'url-encoder-decoder',
    name: 'URL Encoder Decoder',
    group: 'Encoder / Decoder',
    description: 'Encode, decode, and inspect URL query strings offline.',
    icon: Link,
    Component: lazy(() => import('./url-encoder-decoder/index.jsx'))
}
```

- [ ] **Step 7: Run URL test to verify pass**

Run: `npm run test:e2e -- --grep "URL Encoder Decoder|URL components"`

Expected: PASS.

- [ ] **Step 8: Commit URL tool**

```bash
git add tests/e2e/app.spec.js src/tools/registry.js src/tools/url-encoder-decoder
git commit -m "feat: add url encoder decoder"
```

---

### Task 4: HTML Entity Encoder Decoder

**Files:**
- Create: `src/tools/html-entity-encoder-decoder/example.js`
- Create: `src/tools/html-entity-encoder-decoder/index.jsx`
- Create: `src/tools/html-entity-encoder-decoder/style.css`
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing HTML entity behavior test**

Add to `tests/e2e/app.spec.js`:

```js
test('encodes and decodes HTML entities offline', async ({ page }) => {
    await page.goto('/tools/html-entity-encoder-decoder')

    await expect(page.getByRole('heading', { name: 'HTML Entity Encoder Decoder' })).toBeVisible()

    await page.locator('textarea').fill('<p title="Useful & calm">Xin chào</p>')
    await page.getByRole('button', { name: 'Encode' }).click()

    await expect(page.locator('.fo-output')).toContainText('&lt;p title=&quot;Useful &amp; calm&quot;&gt;Xin chào&lt;/p&gt;')

    await page.locator('textarea').fill('&lt;p&gt;Useful &amp; offline&lt;/p&gt;')
    await page.getByRole('button', { name: 'Decode' }).click()

    await expect(page.locator('.fo-output')).toContainText('<p>Useful & offline</p>')
})
```

- [ ] **Step 2: Run HTML entity test to verify failure**

Run: `npm run test:e2e -- --grep "HTML Entity"`

Expected: FAIL with route not found or heading missing.

- [ ] **Step 3: Create HTML entity example**

Create `src/tools/html-entity-encoder-decoder/example.js`:

```js
export const htmlEntityExample = '<p title="Useful & calm">Encode <strong>HTML</strong> safely.</p>'
```

- [ ] **Step 4: Create HTML entity tool implementation**

Create `src/tools/html-entity-encoder-decoder/index.jsx` by copying the imports, state, draft persistence, file open, copy, reset, `useToolActions`, and `SplitWorkspace` structure from `src/tools/base64-encoder-decoder/index.jsx`, then set `toolId`, example import, labels, accepted file extensions, and helpers to these exact values:

```jsx
const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}

function encodeEntities(text) {
    return text.replace(/[&<>"']/g, (char) => entityMap[char])
}

function decodeEntities(text) {
    const parser = new DOMParser()
    const document = parser.parseFromString(`<!doctype html><body>${text}`, 'text/html')
    return document.body.textContent || ''
}
```

Use actions: `Open`, `Encode`, `Decode`, `Copy`, `Download`, `Example`. Use `FormatterOutput` with `language="html"`. Use `htmlEntityExample` as draft fallback.

- [ ] **Step 5: Create HTML entity CSS**

Create `src/tools/html-entity-encoder-decoder/style.css` with the same `.encoder-page` and `.encoder-error` rules from Task 2.

- [ ] **Step 6: Register HTML entity tool**

Add `FileCode2` to the `lucide-react` import if not already present, then add:

```js
{
    id: 'html-entity-encoder-decoder',
    name: 'HTML Entity Encoder Decoder',
    group: 'Encoder / Decoder',
    description: 'Encode and decode HTML entities offline.',
    icon: FileCode2,
    Component: lazy(() => import('./html-entity-encoder-decoder/index.jsx'))
}
```

- [ ] **Step 7: Run HTML entity test to verify pass**

Run: `npm run test:e2e -- --grep "HTML Entity"`

Expected: PASS.

- [ ] **Step 8: Commit HTML entity tool**

```bash
git add tests/e2e/app.spec.js src/tools/registry.js src/tools/html-entity-encoder-decoder
git commit -m "feat: add html entity encoder decoder"
```

---

### Task 5: JWT Decoder

**Files:**
- Create: `src/tools/jwt-decoder/example.js`
- Create: `src/tools/jwt-decoder/index.jsx`
- Create: `src/tools/jwt-decoder/style.css`
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing JWT behavior test**

Add to `tests/e2e/app.spec.js`:

```js
test('decodes JWT header and payload without verifying signatures', async ({ page }) => {
    await page.goto('/tools/jwt-decoder')

    await expect(page.getByRole('heading', { name: 'JWT Decoder' })).toBeVisible()

    await page.locator('textarea').fill('eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjMiLCJuYW1lIjoiVXNlZnVsIFRvb2xzIiwiaWF0IjoxNzY2MTAwMDAwfQ.')
    await page.getByRole('button', { name: 'Decode' }).click()

    await expect(page.locator('.fo-output')).toContainText('"alg": "none"')
    await expect(page.locator('.fo-output')).toContainText('"name": "Useful Tools"')
    await expect(page.getByText('Signature is decoded, not verified.')).toBeVisible()
})
```

- [ ] **Step 2: Run JWT test to verify failure**

Run: `npm run test:e2e -- --grep "JWT"`

Expected: FAIL with route not found or heading missing.

- [ ] **Step 3: Create JWT example**

Create `src/tools/jwt-decoder/example.js`:

```js
export const jwtExample = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjMiLCJuYW1lIjoiVXNlZnVsIFRvb2xzIiwiaWF0IjoxNzY2MTAwMDAwfQ.'
```

- [ ] **Step 4: Create JWT decoder implementation**

Create `src/tools/jwt-decoder/index.jsx` by copying the imports, state, draft persistence, file open, copy, reset, `useToolActions`, and `SplitWorkspace` structure from `src/tools/base64-encoder-decoder/index.jsx`, then set `toolId`, example import, labels, accepted file extensions, and helpers to these exact values:

```jsx
const toolId = 'jwt-decoder'

function decodeBase64Url(part) {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - part.length % 4) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0))
    return new TextDecoder().decode(bytes)
}

function decodeJwt(token) {
    const [headerPart, payloadPart, signaturePart = ''] = token.trim().split('.')
    if (!headerPart || !payloadPart) throw new Error('JWT must contain header and payload segments')

    return JSON.stringify({
        header: JSON.parse(decodeBase64Url(headerPart)),
        payload: JSON.parse(decodeBase64Url(payloadPart)),
        signature: signaturePart
    }, null, 4)
}
```

Use actions: `Open`, `Decode`, `Copy`, `Download`, `Example`. Render warning text above output:

```jsx
<p className="jwt-warning">Signature is decoded, not verified.</p>
```

Use `FormatterOutput` with `language="json"`. Use `jwtExample` as draft fallback.

- [ ] **Step 5: Create JWT CSS**

Create `src/tools/jwt-decoder/style.css`:

```css
.encoder-page {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.encoder-error {
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

.jwt-result {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.jwt-warning {
    margin: 0;
    padding: 10px 12px;
    color: #92400e;
    background: #fffbeb;
    border-bottom: 1px solid #fde68a;
}
```

- [ ] **Step 6: Register JWT tool**

Add `KeyRound` to the `lucide-react` import, then add:

```js
{
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    group: 'Encoder / Decoder',
    description: 'Decode JWT headers and payloads offline without signature verification.',
    icon: KeyRound,
    Component: lazy(() => import('./jwt-decoder/index.jsx'))
}
```

- [ ] **Step 7: Run JWT test to verify pass**

Run: `npm run test:e2e -- --grep "JWT"`

Expected: PASS.

- [ ] **Step 8: Commit JWT tool**

```bash
git add tests/e2e/app.spec.js src/tools/registry.js src/tools/jwt-decoder
git commit -m "feat: add jwt decoder"
```

---

### Task 6: Hash Generator

**Files:**
- Create: `src/tools/hash-generator/example.js`
- Create: `src/tools/hash-generator/index.jsx`
- Create: `src/tools/hash-generator/style.css`
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing hash behavior test**

Add to `tests/e2e/app.spec.js`:

```js
test('generates SHA digests offline', async ({ page }) => {
    await page.goto('/tools/hash-generator')

    await expect(page.getByRole('heading', { name: 'Hash Generator' })).toBeVisible()

    await page.locator('textarea').fill('Useful Tools')
    await page.getByRole('button', { name: 'Generate Hashes' }).click()

    await expect(page.locator('.fo-output')).toContainText('SHA-256')
    await expect(page.locator('.fo-output')).toContainText('1210fce6359c2ff42b445c358f4cb31abadfffb069cd9940b7e19a1ae5aeb3d1')
})
```


- [ ] **Step 2: Run hash test to verify failure**

Run: `npm run test:e2e -- --grep "Hash Generator|SHA digests"`

Expected: FAIL with route not found or heading missing.

- [ ] **Step 3: Create hash example**

Create `src/tools/hash-generator/example.js`:

```js
export const hashExample = 'Useful Tools'
```

- [ ] **Step 4: Create hash generator implementation**

Create `src/tools/hash-generator/index.jsx` by copying the imports, state, draft persistence, file open, copy, reset, `useToolActions`, and `SplitWorkspace` structure from `src/tools/base64-encoder-decoder/index.jsx`, then set `toolId`, example import, labels, accepted file extensions, and helpers to these exact values:

```jsx
const toolId = 'hash-generator'
const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

function toHex(buffer) {
    return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function generateHashes(text) {
    const bytes = new TextEncoder().encode(text)
    const entries = await Promise.all(algorithms.map(async (algorithm) => {
        const digest = await crypto.subtle.digest(algorithm, bytes)
        return [algorithm, toHex(digest)]
    }))

    return entries.map(([algorithm, digest]) => `${algorithm}\n${digest}`).join('\n\n')
}
```

Use `runGenerate` async handler that sets `result` to `await generateHashes(value)`. Use actions: `Open`, `Generate Hashes`, `Copy`, `Download`, `Example`. Use `FormatterOutput` with `language="text"`. Use `hashExample` as draft fallback.

- [ ] **Step 5: Create hash CSS**

Create `src/tools/hash-generator/style.css` with the same `.encoder-page` and `.encoder-error` rules from Task 2.

- [ ] **Step 6: Register hash tool**

Add `Fingerprint` to the `lucide-react` import, then add:

```js
{
    id: 'hash-generator',
    name: 'Hash Generator',
    group: 'Encoder / Decoder',
    description: 'Generate SHA hashes for text offline.',
    icon: Fingerprint,
    Component: lazy(() => import('./hash-generator/index.jsx'))
}
```

- [ ] **Step 7: Run hash test to verify pass**

Run: `npm run test:e2e -- --grep "Hash Generator|SHA digests"`

Expected: PASS.

- [ ] **Step 8: Commit hash tool**

```bash
git add tests/e2e/app.spec.js src/tools/registry.js src/tools/hash-generator
git commit -m "feat: add hash generator"
```

---

### Task 7: README And Final Verification

**Files:**
- Modify: `README.md`
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Update README available tools**

Add under the implemented tools list:

```md
### Encoder / Decoder

- Base64 Encoder Decoder: mã hóa và giải mã Base64, hỗ trợ Unicode.
- URL Encoder Decoder: mã hóa, giải mã URL và xem nhanh query string.
- HTML Entity Encoder Decoder: mã hóa và giải mã HTML entities.
- JWT Decoder: đọc header/payload JWT offline, không xác minh chữ ký.
- Hash Generator: tạo SHA-1, SHA-256, SHA-384 và SHA-512 từ text.
```

Remove these items from the planned/future Encoder/Decoder section:

```md
- Base64 Encoder/Decoder
- URL Encoder/Decoder
- HTML Entity Encoder/Decoder
- JWT Decoder
- Hash Generator
```

- [ ] **Step 2: Run encoder decoder test subset**

Run: `npm run test:e2e -- --grep "Base64|URL Encoder Decoder|HTML Entity|JWT|Hash Generator|SHA digests"`

Expected: PASS.

- [ ] **Step 3: Run full E2E**

Run: `npm run test:e2e`

Expected: PASS across mobile `390x844`, tablet `768x1024`, and desktop `1280x800`.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS; all new tools are lazy-loaded chunks and no external network calls are introduced.

- [ ] **Step 5: Commit docs and verification fixes**

```bash
git add README.md tests/e2e/app.spec.js
git commit -m "docs: list encoder decoder tools"
```

---

## Self-Review

- Spec coverage: Base64, URL, HTML Entity, JWT, and Hash tools each have route, UI, behavior test, registry entry, README entry, and offline implementation path.
- Offline-first: all implementations use browser-native APIs and do not call upload APIs or external services.
- Project pattern: each tool follows one folder under `src/tools`, lazy-loaded registry entry, draft persistence, file open, copy/download, and split editor/result layout.
- TDD: every feature task starts with a Playwright test and explicit RED/GREEN commands.
- Responsive: Task 1 covers mobile `390x844`, tablet `768x1024`, and desktop `1280x800` for all new routes.
- Risk: JWT decoding explicitly does not verify signatures; the UI warning and test make this visible.
