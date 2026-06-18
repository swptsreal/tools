# Formatter Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add offline formatter tools for JSON, SQL, HTML, and CSS while keeping the app fast and local-only.

**Architecture:** Each formatter is a standalone tool under `src/tools/<tool-id>`, registered in `src/tools/registry.js`, and rendered inside the existing `SplitWorkspace` plus app-header actions pattern. JSON uses native browser APIs; SQL and HTML/CSS use lazy-loaded formatter dependencies so the app shell does not eagerly pay their cost.

**Tech Stack:** React 19, Vite, Ant Design, lucide-react, Playwright, native `JSON.parse`/`JSON.stringify`, lazy `sql-formatter`, lazy `js-beautify`.

---

## File Structure

- `tests/e2e/app.spec.js`: add focused E2E tests for each formatter and include formatter routes in responsive overflow coverage.
- `src/tools/json-formatter/index.jsx`: JSON formatter UI, actions, parse errors, format/minify behavior, local draft.
- `src/tools/json-formatter/example.js`: JSON sample input.
- `src/tools/json-formatter/style.css`: formatter output and error styles.
- `src/tools/sql-formatter/index.jsx`: SQL formatter UI with lazy `sql-formatter` import.
- `src/tools/sql-formatter/example.js`: SQL sample input.
- `src/tools/sql-formatter/style.css`: formatter output and error styles.
- `src/tools/html-formatter/index.jsx`: HTML formatter UI with lazy `js-beautify` import.
- `src/tools/html-formatter/example.js`: HTML sample input.
- `src/tools/html-formatter/style.css`: formatter output and error styles.
- `src/tools/css-formatter/index.jsx`: CSS formatter UI with lazy `js-beautify` import.
- `src/tools/css-formatter/example.js`: CSS sample input.
- `src/tools/css-formatter/style.css`: formatter output and error styles.
- `src/tools/registry.js`: import formatter tools and add Formatter group metadata.
- `package.json`, `package-lock.json`: add `sql-formatter` and `js-beautify`.

---

## Phase 1: JSON Formatter, No Dependency

### Task 1: Add JSON Formatter Failing Tests

**Files:**
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Add route behavior test**

```js
test('formats and minifies JSON offline', async ({ page }) => {
    await page.goto('/tools/json-formatter')

    await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible()

    await page.locator('textarea').fill('{"name":"Useful Tools","items":[1,2]}')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.formatter-output')).toContainText('"name": "Useful Tools"')
    await expect(page.locator('.formatter-output')).toContainText('"items": [')

    await page.getByRole('button', { name: 'Minify' }).click()
    await expect(page.locator('.formatter-output')).toHaveText('{"name":"Useful Tools","items":[1,2]}')
})
```

- [ ] **Step 2: Add invalid JSON test**

```js
test('shows a readable JSON formatter error', async ({ page }) => {
    await page.goto('/tools/json-formatter')

    await page.locator('textarea').fill('{"name":}')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.formatter-error')).toContainText('Invalid JSON')
})
```

- [ ] **Step 3: Run RED**

Run: `npm run test:e2e -- --grep "JSON Formatter|JSON formatter"`

Expected: FAIL because `/tools/json-formatter` redirects or heading `JSON Formatter` is missing.

### Task 2: Implement JSON Formatter

**Files:**
- Create: `src/tools/json-formatter/index.jsx`
- Create: `src/tools/json-formatter/example.js`
- Create: `src/tools/json-formatter/style.css`
- Modify: `src/tools/registry.js`

- [ ] **Step 1: Create JSON example**

```js
export const jsonExample = `{"name":"Useful Tools","offline":true,"items":["format","minify","copy"]}`
```

- [ ] **Step 2: Create JSON formatter tool**

Use native `JSON.parse` and `JSON.stringify`. `Format` calls `JSON.stringify(parsed, null, 4)`. `Minify` calls `JSON.stringify(parsed)`. Output renders in `.formatter-output`; parse errors render in `.formatter-error` with prefix `Invalid JSON:`. Actions: Open, Format, Minify, Copy, Download, Example.

- [ ] **Step 3: Register JSON tool**

Add `Braces` import and tool metadata:

```js
{
    id: 'json-formatter',
    name: 'JSON Formatter',
    group: 'Formatter',
    description: 'Format, minify, and validate JSON offline.',
    icon: Braces,
    Component: JsonFormatterTool
}
```

- [ ] **Step 4: Run GREEN**

Run: `npm run test:e2e -- --grep "JSON Formatter|JSON formatter"`

Expected: PASS.

---

## Phase 2: SQL Formatter With Lazy Dependency

### Task 3: Add SQL Formatter Failing Test

**Files:**
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Add SQL behavior test**

```js
test('formats SQL using a lazy formatter dependency', async ({ page }) => {
    await page.goto('/tools/sql-formatter')

    await expect(page.getByRole('heading', { name: 'SQL Formatter' })).toBeVisible()

    await page.locator('textarea').fill('select id,name from users where active=1 order by name')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.formatter-output')).toContainText('SELECT')
    await expect(page.locator('.formatter-output')).toContainText('FROM users')
    await expect(page.locator('.formatter-output')).toContainText('ORDER BY name')
})
```

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e -- --grep "SQL Formatter"`

Expected: FAIL because `/tools/sql-formatter` is not registered.

### Task 4: Implement SQL Formatter

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/tools/sql-formatter/index.jsx`
- Create: `src/tools/sql-formatter/example.js`
- Create: `src/tools/sql-formatter/style.css`
- Modify: `src/tools/registry.js`

- [ ] **Step 1: Install dependency**

Run: `npm install sql-formatter`

Expected: `package.json` and `package-lock.json` include `sql-formatter`.

- [ ] **Step 2: Create SQL tool using lazy import**

Use `const { format } = await import('sql-formatter')` inside the Format handler. Output renders in `.formatter-output`; errors render in `.formatter-error`. Actions: Open, Format, Copy, Download, Example.

- [ ] **Step 3: Register SQL tool**

Add `Database` icon and metadata:

```js
{
    id: 'sql-formatter',
    name: 'SQL Formatter',
    group: 'Formatter',
    description: 'Format SQL queries offline.',
    icon: Database,
    Component: SqlFormatterTool
}
```

- [ ] **Step 4: Run GREEN**

Run: `npm run test:e2e -- --grep "SQL Formatter"`

Expected: PASS.

---

## Phase 3: HTML And CSS Formatters With Lazy Lightweight Dependency

### Task 5: Add HTML/CSS Formatter Failing Tests

**Files:**
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Add HTML behavior test**

```js
test('formats HTML offline', async ({ page }) => {
    await page.goto('/tools/html-formatter')

    await expect(page.getByRole('heading', { name: 'HTML Formatter' })).toBeVisible()
    await page.locator('textarea').fill('<main><h1>Useful Tools</h1><p>Offline</p></main>')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.formatter-output')).toContainText('<main>')
    await expect(page.locator('.formatter-output')).toContainText('  <h1>Useful Tools</h1>')
})
```

- [ ] **Step 2: Add CSS behavior test**

```js
test('formats CSS offline', async ({ page }) => {
    await page.goto('/tools/css-formatter')

    await expect(page.getByRole('heading', { name: 'CSS Formatter' })).toBeVisible()
    await page.locator('textarea').fill('.tool{display:flex;color:#111}.tool button{padding:8px}')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.formatter-output')).toContainText('.tool {')
    await expect(page.locator('.formatter-output')).toContainText('display: flex;')
})
```

- [ ] **Step 3: Run RED**

Run: `npm run test:e2e -- --grep "HTML Formatter|CSS Formatter"`

Expected: FAIL because formatter routes are not registered.

### Task 6: Implement HTML/CSS Formatters

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/tools/html-formatter/index.jsx`, `example.js`, `style.css`
- Create: `src/tools/css-formatter/index.jsx`, `example.js`, `style.css`
- Modify: `src/tools/registry.js`

- [ ] **Step 1: Install dependency**

Run: `npm install js-beautify`

Expected: `package.json` and `package-lock.json` include `js-beautify`.

- [ ] **Step 2: Create HTML formatter using lazy import**

Use `const beautify = await import('js-beautify')` and call `beautify.html(value, { indent_size: 2, wrap_line_length: 120 })`.

- [ ] **Step 3: Create CSS formatter using lazy import**

Use `const beautify = await import('js-beautify')` and call `beautify.css(value, { indent_size: 2 })`.

- [ ] **Step 4: Register tools**

Add `CodeXml` and `Palette` icons with Formatter group metadata for `html-formatter` and `css-formatter`.

- [ ] **Step 5: Run GREEN**

Run: `npm run test:e2e -- --grep "HTML Formatter|CSS Formatter"`

Expected: PASS.

---

## Final Verification

- [ ] **Step 1: Run full E2E**

Run: `npm run test:e2e`

Expected: all tests PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: build PASS. Existing chunk-size warning may remain because Mermaid is already large; formatter dependencies should appear in separate chunks or only inside formatter route code.

- [ ] **Step 3: Confirm no network APIs were added**

Run: `rg "fetch\(|XMLHttpRequest|axios|https://" src README.md package.json`

Expected: no new formatter source match.

## Self-Review

- JSON needs no dependency and covers validation, format, minify.
- SQL uses the proven `sql-formatter` parser rather than ad hoc string rules.
- HTML/CSS use `js-beautify` because it is lighter than Prettier for this project phase.
- Formatter dependencies are called through dynamic `import()` from user actions, preserving app shell speed.
- E2E tests cover user-visible behavior and responsive coverage expands to new formatter routes.

---

## Phase 4: Enhanced Formatter Output — Line Numbers, Code Folding, Search, Syntax Highlight

> **Scope:** Applies to all four formatter tools (JSON, SQL, HTML, CSS). Shared behavior lives in `src/shared/components/FormatterOutput.jsx` and `src/shared/components/FormatterOutput.css`. Individual `style.css` files stay lean.

**Library Decision — Prism.js**

Use `prismjs` for syntax highlighting. Rationale:
- Tiny tree-shakeable core (~8 kB minified). Only load needed language grammars.
- Fully offline — zero network calls, pure JS tokenizer.
- Dynamic import possible: `await import('prismjs')` keeps app-shell cost zero.
- Supports JSON, SQL, HTML, CSS out of the box.
- No WASM, no canvas, no worker required.
- Alternatives ruled out: CodeMirror/Monaco (too heavy for read-only), Shiki (WASM size, offline setup complexity).

Install: `npm install prismjs`

---

### Task 7: Add FormatterOutput Failing Tests

**Files:**
- Modify: `tests/e2e/app.spec.js`

- [ ] **Step 1: Add line-number test**

```js
test('formatter output shows line numbers', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"a":1,"b":2}')
    await page.getByRole('button', { name: 'Format' }).click()
    const lines = page.locator('.fo-line-number')
    await expect(lines.first()).toBeVisible()
    await expect(lines).toHaveCount(await page.locator('.fo-line').count())
})
```

- [ ] **Step 2: Add code-fold toggle test**

```js
test('formatter output collapses and expands blocks', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"a":{"b":1}}')
    await page.getByRole('button', { name: 'Format' }).click()
    const toggle = page.locator('.fo-fold-toggle').first()
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.locator('.fo-folded')).toHaveCount(1)
    await toggle.click()
    await expect(page.locator('.fo-folded')).toHaveCount(0)
})
```

- [ ] **Step 3: Add Ctrl+F search test**

```js
test('formatter output search opens on Ctrl+F and highlights matches', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"name":"Useful Tools","items":[1,2]}')
    await page.getByRole('button', { name: 'Format' }).click()
    await page.locator('.formatter-output-wrap').press('Control+f')
    await expect(page.locator('.fo-search-bar')).toBeVisible()
    await page.locator('.fo-search-input').fill('items')
    await expect(page.locator('.fo-match')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('.fo-search-bar')).not.toBeVisible()
})
```

- [ ] **Step 4: Add syntax-highlight token test**

```js
test('formatter output renders syntax-highlighted tokens', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"key":"value"}')
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.locator('.fo-output .token.string').first()).toBeVisible()
})
```

- [ ] **Step 5: Run RED**

Run: `npm run test:e2e -- --grep "formatter output"`

Expected: FAIL — `.fo-line-number`, `.fo-fold-toggle`, `.fo-search-bar`, `.token.string` do not exist yet.

---

### Task 8: Implement FormatterOutput Shared Component

**Files:**
- Run: `npm install prismjs`
- Create: `src/shared/components/FormatterOutput.jsx`
- Create: `src/shared/components/FormatterOutput.css`
- Modify: `src/tools/json-formatter/index.jsx` — replace `<pre className="formatter-output">` with `<FormatterOutput>`
- Modify: `src/tools/sql-formatter/index.jsx` — same swap
- Modify: `src/tools/html-formatter/index.jsx` — same swap
- Modify: `src/tools/css-formatter/index.jsx` — same swap

- [ ] **Step 1: Install Prism**

Run: `npm install prismjs`

Expected: `package.json` updated, `node_modules/prismjs` present.

- [ ] **Step 2: Build FormatterOutput component**

`FormatterOutput` is a React component with props: `code` (string), `language` (`'json' | 'sql' | 'html' | 'css'`).

Internal behavior:
1. **Syntax highlight** — on `code` change, dynamically import `prismjs` + the relevant grammar (`prism-json`, `prism-sql`, `prism-markup`, `prism-css`), call `Prism.highlight(code, grammar, language)`, store HTML string in state.
2. **Line split** — split highlighted HTML at `\n` boundaries preserving span tags across lines using a line-aware tokenizer (iterate characters, track open `<span>` tags, close/reopen at each newline).
3. **Line numbers** — render a gutter column `.fo-gutter` with `.fo-line-number` spans, one per line. Numbers are `1`-indexed and right-aligned.
4. **Code folding** — detect fold points: lines ending with `{`, `[`, or opening HTML tag (e.g. `<div>`). Render a `.fo-fold-toggle` chevron button inline. Click collapses all lines until the matching closing delimiter; adds `.fo-folded` class to collapsed lines and shows a `…` placeholder. Click again expands.
5. **Ctrl+F search** — `keydown` listener on the wrapper div (`.formatter-output-wrap`, `tabIndex={0}`). On `Control+f` or `Meta+f`: prevent default, show `.fo-search-bar` overlay at top of output. Input `.fo-search-input` filters and wraps matches in `<mark class="fo-match">`. Show match count `n / total`. Arrow buttons or Enter/Shift+Enter cycle through matches (scroll into view). Escape hides bar and clears highlights.
6. **Scroll** — wrapper is `overflow: auto` so large outputs scroll internally without page overflow.

- [ ] **Step 3: Style FormatterOutput**

`FormatterOutput.css` covers:
- `.formatter-output-wrap` — `position: relative; overflow: auto; height: 100%; font-family: monospace; font-size: 13px;`
- `.fo-gutter` — fixed-width left column, muted background, right-aligned numbers, no text select.
- `.fo-line-number` — display block, `min-width: 3ch`, `text-align: right`, `padding-right: 8px`, `color: var(--color-muted)`.
- `.fo-line` — flex row containing gutter + code, `line-height: 1.6`.
- `.fo-fold-toggle` — small inline icon button, no border, cursor pointer, `color: var(--color-muted)`.
- `.fo-folded` — `display: none`.
- `.fo-search-bar` — absolute top bar, `background: var(--color-surface)`, `border-bottom: 1px solid var(--color-border)`, flex row, `z-index: 10`, padding `4px 8px`, gap `8px`.
- `.fo-search-input` — flex-grow input, no border, background transparent, `font-size: 13px`.
- `.fo-match` — `background: #ffe58f`, `border-radius: 2px` (light mode); `background: #7c6200` (dark mode via `@media (prefers-color-scheme: dark)`).
- `.fo-match-current` — stronger highlight: `background: #fa8c16`, `color: #fff`.
- Prism tokens inherit from `prism-tomorrow` or similar theme — import a Prism CSS theme file in `FormatterOutput.jsx`.

- [ ] **Step 4: Swap output in all four formatter tools**

Replace:
```jsx
<pre className="formatter-output">{result}</pre>
```
with:
```jsx
<FormatterOutput code={result} language="json" />  // adjust language per tool
```

SQL → `language="sql"`, HTML → `language="html"`, CSS → `language="css"`.

Keep `.formatter-error` as-is (no highlighting needed for error messages).

- [ ] **Step 5: Run GREEN**

Run: `npm run test:e2e -- --grep "formatter output"`

Expected: all four new tests PASS.

---

### Task 9: Responsive Check and Final Verification

- [ ] **Step 1: Verify no horizontal overflow at mobile**

Run: `npm run test:e2e -- --grep "no horizontal overflow"` (existing responsive test).

Expected: PASS — `.formatter-output-wrap` scrolls internally, does not push page width.

- [ ] **Step 2: Run full E2E**

Run: `npm run test:e2e`

Expected: all tests PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS. `prismjs` grammars appear in lazy formatter chunks, not in app shell.

---

## Phase 4 Self-Review

- Line numbers rendered in non-selectable gutter; do not copy with code text.
- Code folding works by DOM class toggling — no virtual DOM re-render on every fold/unfold.
- Ctrl+F intercepts only when focus is inside `.formatter-output-wrap`; does not break browser search on rest of page.
- Prism loaded lazily per tool action — zero cost to app shell and home page.
- All behavior offline: no CDN, no network request for Prism or themes.
