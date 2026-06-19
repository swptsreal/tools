# Tool Function Bars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-tool function bars inside `split-left` so each tool exposes input-specific options without crowding the global header actions.

**Architecture:** `SplitWorkspace` owns the shared left-panel function bar slot via `leftToolbar`. Each tool opts in by passing small AntD controls for options that change processing behavior; header actions stay for file/open/copy/download/example/run commands. Options stay local in each tool component until at least two tools need shared state.

**Tech Stack:** React 19, Vite, Ant Design 6, Playwright E2E, existing offline utilities in `src/shared/utils`.

---

## Current Audit

- `mermaid-preview`: live preview only; no toolbar yet. Useful options: theme, zoom/fit, diagram direction helper.
- `markdown-preview`: live preview only. Useful options: GitHub-style line breaks, sanitize/raw HTML preview toggle, word wrap.
- `json-formatter`: fixed 2/4-space buttons in header. Move indentation into bar; add sort keys and mode `Format/Minify`.
- `sql-formatter`: fixed uppercase keyword formatting. Add keyword case, SQL dialect, indent width.
- `html-formatter`: fixed beautify behavior. Add indent width, wrap line length, preserve newlines toggle.
- `css-formatter`: fixed beautify behavior. Add indent width, newline between rules toggle, output mode `Expanded/Compact`.
- `json-yaml-converter`: currently conversion action driven by header. Add source/target format, YAML indent, JSON spacing.
- `csv-json-converter`: currently two header actions. Add direction, delimiter, header row toggle, JSON spacing.
- `timestamp-converter`: currently two header actions. Add direction, seconds/milliseconds, timezone display `Local/UTC`.
- `color-converter`: currently outputs multiple formats. Add output format selector `All/HEX/RGB/HSL`, alpha handling.
- `base64-encoder-decoder`: currently header buttons encode/decode. Add mode `Encode/Decode`, URL-safe alphabet, padding toggle.
- `url-encoder-decoder`: currently header buttons encode/decode/pretty query. Add mode, plus-as-space toggle, component/full URL scope.
- `html-entity-encoder-decoder`: currently header buttons encode/decode. Add mode, named/numeric entities, encode non-ASCII toggle.
- `jwt-decoder`: decode only. Add section filters `Header/Payload/Signature`, pretty/compact JSON, seconds-to-date toggle.
- `hash-generator`: toolbar exists. It currently selects one SHA algorithm and generates only that digest.

## Files

- Modify: `src/shared/components/SplitWorkspace.jsx` — keep `leftToolbar` slot and accessible toolbar wrapper.
- Modify: `src/shared/components/shared.css` — keep shared toolbar layout responsive and non-overlapping.
- Modify: `src/tools/*/index.jsx` — add tool-specific option state and pass `leftToolbar`.
- Modify: `tests/e2e/app.spec.js` — add one visible-behavior test per tool option.
- Modify: `README.md` — mention per-tool options when behavior becomes user-visible across multiple tools.

---

### Task 1: Shared Toolbar Contract

**Files:**
- Modify: `src/shared/components/SplitWorkspace.jsx`
- Modify: `src/shared/components/shared.css`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write the failing toolbar placement test**

```js
test('split left shows a tool-specific function bar above the editor', async ({ page }) => {
    await page.goto('/tools/hash-generator')

    const leftPanel = page.locator('.split-left')
    const functionBar = leftPanel.getByRole('toolbar', { name: 'Input options' })
    await expect(functionBar).toBeVisible()
    await expect(functionBar.getByText('Hash algorithm')).toBeVisible()
    await expect(functionBar.getByText('SHA-256')).toBeVisible()

    const positions = await page.evaluate(() => {
        const bar = document.querySelector('.split-left .tool-function-bar')?.getBoundingClientRect()
        const editor = document.querySelector('.split-left .tool-editor')?.getBoundingClientRect()
        return { barBottom: bar?.bottom ?? 0, editorTop: editor?.top ?? 0 }
    })

    expect(positions.barBottom).toBeLessThanOrEqual(positions.editorTop)
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test:e2e -- --grep "split left shows a tool-specific function bar"`
Expected: FAIL because `.split-left` does not contain a toolbar named `Input options`.

- [ ] **Step 3: Add the shared slot**

Change `SplitWorkspace` to accept `leftToolbar` and render it before the input area:

```jsx
export function SplitWorkspace({ left, leftToolbar, right }) {
    const isVertical = useVerticalSplitter()

    return (
        <Splitter
            className="split-workspace"
            orientation={isVertical ? 'vertical' : 'horizontal'}
        >
            <Splitter.Panel
                className="split-panel split-left"
                defaultSize={isVertical ? '45%' : '42%'}
                min={isVertical ? 220 : 280}
            >
                {leftToolbar ? (
                    <div className="tool-function-bar" role="toolbar" aria-label="Input options">
                        {leftToolbar}
                    </div>
                ) : null}
                <div className="tool-input-area">{left}</div>
            </Splitter.Panel>
            <Splitter.Panel className="split-panel split-right" min={240}>
                {right}
            </Splitter.Panel>
        </Splitter>
    )
}
```

- [ ] **Step 4: Add shared CSS**

Add these rules to `src/shared/components/shared.css`:

```css
.split-left {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e5e7eb;
    background: #ffffff;
}

.tool-function-bar {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;
}

.tool-function-label {
    color: #4b5563;
    font-size: 13px;
    font-weight: 600;
}

.tool-input-area {
    flex: 1 1 auto;
    min-height: 0;
}
```

- [ ] **Step 5: Run test to verify pass**

Run: `npm run test:e2e -- --grep "split left shows a tool-specific function bar"`
Expected: PASS.

### Task 2: Hash Generator Options

**Files:**
- Modify: `src/tools/hash-generator/index.jsx`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write the failing selected-hash test**

```js
test('generates only the selected SHA digest offline', async ({ page }) => {
    await page.goto('/tools/hash-generator')

    await page.locator('textarea').fill('Useful Tools')
    await page.getByText('SHA-512').click()
    await page.getByRole('button', { name: 'Generate Hashes' }).click()

    await expect(page.locator('.fo-output')).toContainText('SHA-512')
    await expect(page.locator('.fo-output')).not.toContainText('SHA-256')
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test:e2e -- --grep "selected SHA digest"`
Expected: FAIL because all SHA digests are generated or no algorithm control exists.

- [ ] **Step 3: Add selected algorithm state**

```jsx
import { Button, Input, message, Radio, Upload } from 'antd'

const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

async function generateHashes(text, selectedAlgorithms = algorithms) {
    const bytes = new TextEncoder().encode(text)
    const entries = await Promise.all(selectedAlgorithms.map(async (algorithm) => {
        const digest = await crypto.subtle.digest(algorithm, bytes)
        return [algorithm, toHex(digest)]
    }))

    return entries.map(([algorithm, digest]) => `${algorithm}\n${digest}`).join('\n\n')
}
```

- [ ] **Step 4: Render the toolbar**

```jsx
const [algorithm, setAlgorithm] = useState('SHA-256')

const runGenerate = async () => {
    try {
        setResult(await generateHashes(value, [algorithm]))
        setError('')
    } catch (err) {
        setResult('')
        setError(`Hash failed: ${err.message}`)
    }
}

<SplitWorkspace
    leftToolbar={(
        <>
            <span className="tool-function-label">Hash algorithm</span>
            <Radio.Group
                optionType="button"
                size="small"
                value={algorithm}
                onChange={(event) => setAlgorithm(event.target.value)}
                options={algorithms.map((item) => ({ label: item, value: item }))}
            />
        </>
    )}
    left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
    right={error ? <pre className="encoder-error">{error}</pre> : <FormatterOutput code={result} language="text" />}
/>
```

- [ ] **Step 5: Run hash tests**

Run: `npm run test:e2e -- --grep "Hash Generator|SHA digest|function bar"`
Expected: PASS.

### Task 3: Encoder/Decoder Mode Bars

**Files:**
- Modify: `src/tools/base64-encoder-decoder/index.jsx`
- Modify: `src/tools/url-encoder-decoder/index.jsx`
- Modify: `src/tools/html-entity-encoder-decoder/index.jsx`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: Add Base64 test**

```js
test('base64 options choose decode mode from the function bar', async ({ page }) => {
    await page.goto('/tools/base64-encoder-decoder')
    await page.locator('textarea').fill('VXNlZnVsIFRvb2xz')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Decode').click()
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.locator('.fo-output')).toContainText('Useful Tools')
})
```

- [ ] **Step 2: Implement Base64 toolbar**

Use `Radio.Group` values `Encode` and `Decode`, keep `URL safe` and `Padding` for a later task, and replace header `Encode/Decode` buttons with one `Run` button.

- [ ] **Step 3: Add URL test**

```js
test('url options decode plus signs as spaces when enabled', async ({ page }) => {
    await page.goto('/tools/url-encoder-decoder')
    await page.locator('textarea').fill('Useful+Tools')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Decode').click()
    await page.getByLabel('Plus as space').check()
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.locator('.fo-output')).toContainText('Useful Tools')
})
```

- [ ] **Step 4: Implement URL toolbar**

Use mode values `Encode`, `Decode`, `Pretty Query`; add `Checkbox` labelled `Plus as space` and pass it into decode logic.

- [ ] **Step 5: Add HTML Entity test**

```js
test('html entity options choose numeric entity encoding', async ({ page }) => {
    await page.goto('/tools/html-entity-encoder-decoder')
    await page.locator('textarea').fill('<div>Useful</div>')
    await page.getByText('Numeric').click()
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.locator('.fo-output')).toContainText('&#60;div&#62;Useful&#60;/div&#62;')
})
```

- [ ] **Step 6: Implement HTML Entity toolbar**

Use mode `Encode/Decode`; add entity style `Named/Numeric`; keep all conversion offline with local mapping.

### Task 4: Formatter Bars

**Files:**
- Modify: `src/tools/json-formatter/index.jsx`
- Modify: `src/tools/sql-formatter/index.jsx`
- Modify: `src/tools/html-formatter/index.jsx`
- Modify: `src/tools/css-formatter/index.jsx`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: JSON spacing and sort test**

```js
test('json formatter options sort keys and use selected spacing', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"b":1,"a":2}')
    await page.getByLabel('Sort keys').check()
    await page.getByText('2 spaces').click()
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.locator('.fo-output')).toContainText('"a": 2')
})
```

- [ ] **Step 2: SQL keyword case test**

```js
test('sql formatter options change keyword case', async ({ page }) => {
    await page.goto('/tools/sql-formatter')
    await page.locator('textarea').fill('select * from users')
    await page.getByText('lowercase').click()
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.locator('.fo-output')).toContainText('select')
    await expect(page.locator('.fo-output')).not.toContainText('SELECT')
})
```

- [ ] **Step 3: HTML/CSS indent tests**

Add one test per tool selecting `4 spaces`, then assert the formatted output contains a child line with four leading spaces.

- [ ] **Step 4: Implement formatter toolbars**

Use `Radio.Group` for spacing options `2 spaces/4 spaces`, `Checkbox` for JSON `Sort keys`, and `Radio.Group` for SQL keyword case `upper/lower/preserve`.

### Task 5: Converter Bars

**Files:**
- Modify: `src/tools/json-yaml-converter/index.jsx`
- Modify: `src/tools/csv-json-converter/index.jsx`
- Modify: `src/tools/timestamp-converter/index.jsx`
- Modify: `src/tools/color-converter/index.jsx`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: JSON/YAML test**

```js
test('json yaml converter options choose yaml to json', async ({ page }) => {
    await page.goto('/tools/json-yaml-converter')
    await page.locator('textarea').fill('name: Useful Tools')
    await page.getByText('YAML to JSON').click()
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('"name": "Useful Tools"')
})
```

- [ ] **Step 2: CSV/JSON test**

```js
test('csv json converter options use semicolon delimiter', async ({ page }) => {
    await page.goto('/tools/csv-json-converter')
    await page.locator('textarea').fill('name;type\nUseful Tools;offline')
    await page.getByText('CSV to JSON').click()
    await page.getByLabel('Delimiter').fill(';')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('"type": "offline"')
})
```

- [ ] **Step 3: Timestamp test**

```js
test('timestamp converter options read milliseconds', async ({ page }) => {
    await page.goto('/tools/timestamp-converter')
    await page.locator('textarea').fill('1766100000000')
    await page.getByText('Milliseconds').click()
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('2025')
})
```

- [ ] **Step 4: Color test**

```js
test('color converter options output only hsl', async ({ page }) => {
    await page.goto('/tools/color-converter')
    await page.locator('textarea').fill('#336699')
    await page.getByText('HSL').click()
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('.fo-output')).toContainText('hsl')
    await expect(page.locator('.fo-output')).not.toContainText('RGB:')
})
```

- [ ] **Step 5: Implement converter toolbars**

Use direction selectors for paired converters, a one-character delimiter input for CSV, timestamp unit and timezone selectors, and color output format selector.

### Task 6: Preview And JWT Bars

**Files:**
- Modify: `src/tools/mermaid-preview/index.jsx`
- Modify: `src/tools/markdown-preview/index.jsx`
- Modify: `src/tools/jwt-decoder/index.jsx`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: Mermaid theme test**

```js
test('mermaid preview options switch theme', async ({ page }) => {
    await page.goto('/tools/mermaid-preview')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Dark').click()
    await expect(page.getByRole('toolbar', { name: 'Input options' }).getByText('Dark')).toBeVisible()
})
```

- [ ] **Step 2: Markdown line break test**

```js
test('markdown preview options enable line breaks', async ({ page }) => {
    await page.goto('/tools/markdown-preview')
    await page.locator('textarea').fill('Useful\nTools')
    await page.getByLabel('Line breaks').check()
    await expect(page.locator('.markdown-preview')).toContainText('Useful')
    await expect(page.locator('.markdown-preview')).toContainText('Tools')
})
```

- [ ] **Step 3: JWT filter test**

```js
test('jwt decoder options show payload only', async ({ page }) => {
    await page.goto('/tools/jwt-decoder')
    await page.getByText('Payload only').click()
    await page.locator('textarea').fill('eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjMifQ.')
    await page.getByRole('button', { name: 'Decode' }).click()
    await expect(page.locator('.fo-output')).toContainText('"sub": "123"')
    await expect(page.locator('.fo-output')).not.toContainText('"alg": "none"')
})
```

- [ ] **Step 4: Implement preview and JWT toolbars**

Mermaid uses a theme selector passed into render config. Markdown uses checkboxes for line breaks and raw HTML mode. JWT uses a section filter and pretty/compact selector.

### Task 7: Final Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README**

Add one sentence to the tool overview: `Tools with split editors can expose input-specific options in the left-panel function bar; all processing remains local in the browser.`

- [ ] **Step 2: Run focused e2e tests**

Run: `npm run test:e2e -- --grep "function bar|options|selected SHA|formatter options|converter options"`
Expected: PASS.

- [ ] **Step 3: Run full verification**

Run: `npm run build`
Expected: Vite build exits with code 0.

Run: `npm run test:e2e`
Expected: Playwright exits with code 0.
