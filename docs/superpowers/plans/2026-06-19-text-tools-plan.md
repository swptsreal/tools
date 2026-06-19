# Text Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 5 separate offline text tools: Text Diff, Sort Lines, Remove Duplicate Lines, Case Converter, and Word/Character Counter.

**Architecture:** Each tool lives in its own folder under `src/tools`, follows existing `index.jsx` + `style.css` + `example.js` pattern, uses `SplitWorkspace`, `FormatterOutput`, `useToolActions`, local draft storage, copy/download/open/example controls, and browser-only processing. Register every tool in `src/tools/registry.js` under new `Text` group with concise descriptions and Lucide icons.

**Tech Stack:** React 19, Vite, Ant Design, Lucide React, Playwright E2E, existing shared utilities in `src/shared`.

---

## Scope

### Tools

1. `text-diff`
   - Compare original text vs changed text.
   - Show line-level diff: added, removed, unchanged.
   - Keep both inputs local.

2. `sort-lines`
   - Sort lines ascending or descending.
   - Options: trim lines, remove empty lines, case-insensitive sort.

3. `remove-duplicate-lines`
   - Remove duplicate lines while preserving first occurrence order.
   - Options: trim lines, ignore case, remove empty lines.
   - Show summary count.

4. `case-converter`
   - Convert input to lower, upper, title, sentence, camel, pascal, snake, kebab.
   - Preserve text locally.

5. `word-character-counter`
   - Count characters, characters without spaces, words, lines, paragraphs, bytes.
   - Update stats live.

### Non-goals

- No backend.
- No external service.
- No new dependency.
- No shared abstraction unless 2+ tools clearly duplicate enough code during implementation.

---

## Implementation Order

1. Word/Character Counter: simplest UI and establishes Text group route/test pattern.
2. Sort Lines: one input/output transformation with options.
3. Remove Duplicate Lines: similar transformation plus summary.
4. Case Converter: richer mode list, still one input/output.
5. Text Diff: two inputs and custom result display.

---

### Task 1: Word Character Counter

**Files:**
- Create: `src/tools/word-character-counter/index.jsx`
- Create: `src/tools/word-character-counter/style.css`
- Create: `src/tools/word-character-counter/example.js`
- Modify: `src/tools/registry.js`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing E2E test**

Add test:

```js
test('word character counter reports live text metrics', async ({ page }) => {
    await page.goto('/tools/word-character-counter')

    await expect(page.getByRole('heading', { name: /word character counter/i })).toBeVisible()

    const editor = page.locator('textarea').first()
    await editor.fill('Hello world\n\nXin chao Useful Tools')

    await expect(page.getByText('Characters')).toBeVisible()
    await expect(page.getByText('33')).toBeVisible()
    await expect(page.getByText('Characters without spaces')).toBeVisible()
    await expect(page.getByText('28')).toBeVisible()
    await expect(page.getByText('Words')).toBeVisible()
    await expect(page.getByText('6')).toBeVisible()
    await expect(page.getByText('Lines')).toBeVisible()
    await expect(page.getByText('3')).toBeVisible()
    await expect(page.getByText('Paragraphs')).toBeVisible()
    await expect(page.getByText('2')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "word character counter"`

Expected: FAIL because `/tools/word-character-counter` not registered.

- [ ] **Step 3: Create tool files**

Create `src/tools/word-character-counter/example.js`:

```js
export const wordCharacterCounterExample = `Hello world

Xin chao Useful Tools`
```

Create `src/tools/word-character-counter/index.jsx` with component named `WordCharacterCounterTool`:

```jsx
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

    const resetExample = () => setValue(wordCharacterCounterExample)

    const actions = useMemo(() => (
        <>
            <Upload beforeUpload={openFile} showUploadList={false} accept=".txt,.md,.csv,.log">
                <Button icon={<FileUp size={16} />}>Open</Button>
            </Upload>
            <Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button>
            <Button icon={<Download size={16} />} onClick={() => downloadTextFile(value, 'text.txt')}>Download</Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetExample}>Example</Button>
        </>
    ), [value])

    useToolActions(actions)

    return (
        <div className="tool-page text-tool-page">
            <SplitWorkspace
                left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />}
                right={(
                    <div className="text-stats-grid">
                        <Card><strong>Characters</strong><span>{stats.characters}</span></Card>
                        <Card><strong>Characters without spaces</strong><span>{stats.charactersNoSpaces}</span></Card>
                        <Card><strong>Words</strong><span>{stats.words}</span></Card>
                        <Card><strong>Lines</strong><span>{stats.lines}</span></Card>
                        <Card><strong>Paragraphs</strong><span>{stats.paragraphs}</span></Card>
                        <Card><strong>Bytes</strong><span>{stats.bytes}</span></Card>
                    </div>
                )}
            />
        </div>
    )
}
```

Create `src/tools/word-character-counter/style.css`:

```css
.text-tool-page {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.text-stats-grid {
    height: 100%;
    overflow: auto;
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    align-content: start;
    gap: 12px;
}

.text-stats-grid strong,
.text-stats-grid span {
    display: block;
}

.text-stats-grid span {
    margin-top: 8px;
    font-size: 28px;
    font-weight: 700;
}
```

- [ ] **Step 4: Register route**

Modify `src/tools/registry.js`:

```js
import { AlignLeft } from 'lucide-react'
```

Add tool object:

```js
{
    id: 'word-character-counter',
    name: 'Word Character Counter',
    group: 'Text',
    description: 'Count words, characters, lines, paragraphs, and bytes offline.',
    icon: AlignLeft,
    Component: lazy(() => import('./word-character-counter/index.jsx'))
}
```

- [ ] **Step 5: Run test to verify pass**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "word character counter"`

Expected: PASS.

---

### Task 2: Sort Lines

**Files:**
- Create: `src/tools/sort-lines/index.jsx`
- Create: `src/tools/sort-lines/style.css`
- Create: `src/tools/sort-lines/example.js`
- Modify: `src/tools/registry.js`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing E2E test**

Add test:

```js
test('sort lines sorts text with options', async ({ page }) => {
    await page.goto('/tools/sort-lines')

    await expect(page.getByRole('heading', { name: /sort lines/i })).toBeVisible()

    const editor = page.locator('textarea').first()
    await editor.fill('banana\nApple\n\ncherry')

    await page.getByLabel('Remove empty lines').check()
    await page.getByLabel('Case insensitive').check()
    await page.getByRole('button', { name: /sort/i }).click()

    const outputText = await page.locator('.fo-code').textContent()
    expect(outputText).toBe('Apple\nbanana\ncherry')
})
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "sort lines"`

Expected: FAIL because route not registered.

- [ ] **Step 3: Create tool files**

Create `src/tools/sort-lines/example.js`:

```js
export const sortLinesExample = `banana
Apple

cherry`
```

Create `src/tools/sort-lines/index.jsx` using:

- State: `value`, `result`, `direction`, `trimLines`, `removeEmpty`, `caseInsensitive`.
- `sortLines(value, options)` splits by newline, optionally trims, optionally removes empty lines, sorts with `localeCompare`, reverses if descending.
- Header actions: `Open`, `Sort`, `Copy`, `Download`, `Example`.
- Left toolbar controls: `Radio.Group` for `Ascending` / `Descending`, `Checkbox` controls for `Trim lines`, `Remove empty lines`, `Case insensitive`.
- Right panel: `<FormatterOutput code={result} language="text" />`.

Create `src/tools/sort-lines/style.css` matching `.text-tool-page` plus compact toolbar spacing if needed.

- [ ] **Step 4: Register route**

Add tool object in `src/tools/registry.js`:

```js
{
    id: 'sort-lines',
    name: 'Sort Lines',
    group: 'Text',
    description: 'Sort text lines ascending or descending offline.',
    icon: ArrowDownAZ,
    Component: lazy(() => import('./sort-lines/index.jsx'))
}
```

Add `ArrowDownAZ` to Lucide imports.

- [ ] **Step 5: Run test to verify pass**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "sort lines"`

Expected: PASS.

---

### Task 3: Remove Duplicate Lines

**Files:**
- Create: `src/tools/remove-duplicate-lines/index.jsx`
- Create: `src/tools/remove-duplicate-lines/style.css`
- Create: `src/tools/remove-duplicate-lines/example.js`
- Modify: `src/tools/registry.js`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing E2E test**

Add test:

```js
test('remove duplicate lines preserves first occurrence and shows summary', async ({ page }) => {
    await page.goto('/tools/remove-duplicate-lines')

    await expect(page.getByRole('heading', { name: /remove duplicate lines/i })).toBeVisible()

    const editor = page.locator('textarea').first()
    await editor.fill('Alpha\nbeta\nalpha\n\nBETA')

    await page.getByLabel('Ignore case').check()
    await page.getByLabel('Remove empty lines').check()
    await page.getByRole('button', { name: /remove duplicates/i }).click()

    const outputText = await page.locator('.fo-code').textContent()
    expect(outputText).toBe('Alpha\nbeta')
    await expect(page.getByText('Removed 3 duplicate/empty lines')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "remove duplicate lines"`

Expected: FAIL because route not registered.

- [ ] **Step 3: Create tool files**

Create `src/tools/remove-duplicate-lines/example.js`:

```js
export const removeDuplicateLinesExample = `Alpha
beta
alpha

BETA`
```

Create `src/tools/remove-duplicate-lines/index.jsx` using:

- State: `value`, `result`, `summary`, `trimLines`, `ignoreCase`, `removeEmpty`.
- `removeDuplicateLines(value, options)` preserves first occurrence.
- Duplicate key uses trimmed and/or lower-cased value based on options.
- Empty lines removed only when `removeEmpty` is true.
- Summary string: `Removed ${removed} duplicate/empty lines`.
- Header actions: `Open`, `Remove duplicates`, `Copy`, `Download`, `Example`.
- Right panel: summary above `<FormatterOutput code={result} language="text" />`.

Create `src/tools/remove-duplicate-lines/style.css` with `.text-tool-page` and `.text-tool-summary`.

- [ ] **Step 4: Register route**

Add tool object in `src/tools/registry.js`:

```js
{
    id: 'remove-duplicate-lines',
    name: 'Remove Duplicate Lines',
    group: 'Text',
    description: 'Remove repeated lines while preserving first occurrence offline.',
    icon: ListMinus,
    Component: lazy(() => import('./remove-duplicate-lines/index.jsx'))
}
```

Add `ListMinus` to Lucide imports.

- [ ] **Step 5: Run test to verify pass**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "remove duplicate lines"`

Expected: PASS.

---

### Task 4: Case Converter

**Files:**
- Create: `src/tools/case-converter/index.jsx`
- Create: `src/tools/case-converter/style.css`
- Create: `src/tools/case-converter/example.js`
- Modify: `src/tools/registry.js`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing E2E test**

Add test:

```js
test('case converter converts text to multiple cases', async ({ page }) => {
    await page.goto('/tools/case-converter')

    await expect(page.getByRole('heading', { name: /case converter/i })).toBeVisible()

    const editor = page.locator('textarea').first()
    await editor.fill('hello useful tools')

    await page.getByLabel('Mode').click()
    await page.getByText('Pascal Case').click()
    await page.getByRole('button', { name: /convert/i }).click()

    await expect(page.locator('.fo-code')).toHaveText('HelloUsefulTools')
})
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "case converter"`

Expected: FAIL because route not registered.

- [ ] **Step 3: Create tool files**

Create `src/tools/case-converter/example.js`:

```js
export const caseConverterExample = `hello useful tools`
```

Create `src/tools/case-converter/index.jsx` using:

- State: `value`, `result`, `mode`.
- Modes: `Lower Case`, `Upper Case`, `Title Case`, `Sentence Case`, `Camel Case`, `Pascal Case`, `Snake Case`, `Kebab Case`.
- Word tokenizer: `value.match(/[A-Za-z0-9]+/g) ?? []` for identifier modes.
- Sentence case lowercases text then uppercases first letter after start or punctuation boundary.
- Header actions: `Open`, `Convert`, `Copy`, `Download`, `Example`.
- Left toolbar: Ant Design `Select` with accessible label `Mode`.
- Right panel: `<FormatterOutput code={result} language="text" />`.

Create `src/tools/case-converter/style.css` matching `.text-tool-page`.

- [ ] **Step 4: Register route**

Add tool object in `src/tools/registry.js`:

```js
{
    id: 'case-converter',
    name: 'Case Converter',
    group: 'Text',
    description: 'Convert text between common letter and identifier cases offline.',
    icon: LetterText,
    Component: lazy(() => import('./case-converter/index.jsx'))
}
```

Add `LetterText` to Lucide imports.

- [ ] **Step 5: Run test to verify pass**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "case converter"`

Expected: PASS.

---

### Task 5: Text Diff

**Files:**
- Create: `src/tools/text-diff/index.jsx`
- Create: `src/tools/text-diff/style.css`
- Create: `src/tools/text-diff/example.js`
- Modify: `src/tools/registry.js`
- Test: `tests/e2e/app.spec.js`

- [ ] **Step 1: Write failing E2E test**

Add test:

```js
test('text diff shows added and removed lines', async ({ page }) => {
    await page.goto('/tools/text-diff')

    await expect(page.getByRole('heading', { name: /text diff/i })).toBeVisible()

    const editors = page.locator('textarea')
    await editors.nth(0).fill('alpha\nbeta\ngamma')
    await editors.nth(1).fill('alpha\nbeta changed\ngamma\ndelta')

    await page.getByRole('button', { name: /compare/i }).click()

    await expect(page.getByText('- beta')).toBeVisible()
    await expect(page.getByText('+ beta changed')).toBeVisible()
    await expect(page.getByText('+ delta')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "text diff"`

Expected: FAIL because route not registered.

- [ ] **Step 3: Create tool files**

Create `src/tools/text-diff/example.js`:

```js
export const textDiffOriginalExample = `alpha
beta
gamma`

export const textDiffChangedExample = `alpha
beta changed
gamma
delta`
```

Create `src/tools/text-diff/index.jsx` using:

- State: `original`, `changed`, `diffRows`.
- Persist drafts separately with keys `text-diff-original` and `text-diff-changed`.
- `buildLineDiff(original, changed)` uses lightweight LCS dynamic programming for line-level diff.
- Row shape: `{ type: 'same' | 'added' | 'removed', text }`.
- Header actions: `Compare`, `Copy`, `Download`, `Example`.
- Left panel: two stacked `Input.TextArea` controls labelled `Original` and `Changed`.
- Right panel: rows with prefixes `  `, `+ `, `- ` and classes `.diff-row-added`, `.diff-row-removed`, `.diff-row-same`.
- Copy/download output should be unified text lines with prefixes.

Create `src/tools/text-diff/style.css`:

- `.text-diff-inputs` vertical stack, no page overflow.
- `.text-diff-result` scrollable monospace block.
- Added rows green-tinted, removed rows red-tinted, same rows neutral.

- [ ] **Step 4: Register route**

Add tool object in `src/tools/registry.js`:

```js
{
    id: 'text-diff',
    name: 'Text Diff',
    group: 'Text',
    description: 'Compare two text blocks and show line differences offline.',
    icon: GitCompareArrows,
    Component: lazy(() => import('./text-diff/index.jsx'))
}
```

Add `GitCompareArrows` to Lucide imports.

- [ ] **Step 5: Run test to verify pass**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "text diff"`

Expected: PASS.

---

### Task 6: Responsive Coverage

**Files:**
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Add responsive test for Text group pages**

Add test:

```js
const textToolRoutes = [
    '/tools/text-diff',
    '/tools/sort-lines',
    '/tools/remove-duplicate-lines',
    '/tools/case-converter',
    '/tools/word-character-counter'
]

for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 }
]) {
    test(`text tools avoid horizontal overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport)

        for (const route of textToolRoutes) {
            await page.goto(route)
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
            expect(overflow).toBe(false)
        }
    })
}
```

- [ ] **Step 2: Run responsive test**

Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "text tools avoid horizontal overflow"`

Expected: PASS at mobile, tablet, desktop.

---

### Task 7: Documentation Update

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Move tools from planned to existing**

Update `README.md`:

- Add `Text` section under `Tools Hiện Có` with:
  - `Text Diff`: so sánh 2 đoạn text và hiển thị dòng thêm/xóa.
  - `Sort Lines`: sắp xếp dòng tăng/giảm, có tùy chọn trim, bỏ dòng rỗng, không phân biệt hoa thường.
  - `Remove Duplicate Lines`: xóa dòng trùng, giữ lần xuất hiện đầu tiên.
  - `Case Converter`: đổi lower/upper/title/sentence/camel/pascal/snake/kebab case.
  - `Word/Character Counter`: đếm ký tự, từ, dòng, đoạn, byte.
- Remove same 5 items from `Tools Sẽ Có > Text Tools`.

- [ ] **Step 2: Check docs render mentally**

Run: no command required.

Expected: README no longer lists completed text tools under planned tools.

---

### Task 8: Full Verification

**Files:**
- None

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: PASS with Vite production build output.

- [ ] **Step 2: Run full E2E suite**

Run: `npm run test:e2e`

Expected: PASS all Playwright tests.

---

## Risks

- Text Diff LCS can be slow for extremely large files. Keep initial implementation line-level and acceptable for typical pasted text; consider max line warning later only if needed.
- Ant Design `Select` accessible label may need explicit `aria-label="Mode"` for stable Playwright lookup.
- Existing route/header layout may determine exact heading locator behavior; if test fails due heading structure, use existing app locator pattern rather than implementation details.

## Self-Review

- Spec coverage: all 5 README planned text tools covered as separate routes.
- Placeholder scan: no `TBD`, `TODO`, or undefined future work remains.
- Type consistency: route ids, folder names, draft keys, registry ids, and test URLs align.
- TDD compliance: every tool starts with failing Playwright test before production files.
- Offline-first: all transformations run in browser, no dependencies or network calls.
