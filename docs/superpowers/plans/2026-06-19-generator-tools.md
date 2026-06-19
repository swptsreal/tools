# Generator Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Generator tool group for local value generation and move Hash Generator from Encoder / Decoder into this group.

**Architecture:** Keep the existing one-tool-per-folder pattern under `src/tools`. Generator tools use browser-native APIs only, share existing split workspace/output utilities, and stay registered through `src/tools/registry.js` so sidebar grouping works without layout changes.

**Tech Stack:** React, Vite, Ant Design, lucide-react, Playwright, browser `crypto.getRandomValues`, browser `crypto.subtle`.

---

### Task 1: Generator Group Routing

**Files:**
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`
- Modify: `README.md`

- [ ] **Step 1: Write failing sidebar grouping test**

Add this test near the route/navigation tests in `tests/e2e/app.spec.js`:

```js
test('groups generator tools together in the sidebar', async ({ page }) => {
    await page.goto('/tools/hash-generator')

    const generatorGroup = page.getByRole('heading', { name: 'Generator' })
    await expect(generatorGroup).toBeVisible()

    const sidebar = page.locator('.app-sidebar')
    await expect(sidebar.getByRole('link', { name: 'Hash Generator' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'UUID Generator' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Password Generator' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'JWT Secret Generator' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Fake Data Generator' })).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:e2e -- --grep "groups generator tools"`

Expected: FAIL because `Hash Generator` is still under `Encoder / Decoder` and the new generator tools are not registered.

- [ ] **Step 3: Move Hash Generator registry group**

In `src/tools/registry.js`, change only the existing Hash Generator entry group:

```js
{
    id: 'hash-generator',
    name: 'Hash Generator',
    group: 'Generator',
    description: 'Generate SHA hashes for text offline.',
    icon: Fingerprint,
    Component: lazy(() => import('./hash-generator/index.jsx'))
}
```

- [ ] **Step 4: Update README group ownership**

Move this line from `### Encoder / Decoder` to `### Generator` in `README.md`:

```md
- Hash Generator: tạo SHA-1, SHA-256, SHA-384 và SHA-512 từ text.
```

Change the planned Generator list to this current-tool list:

```md
### Generator

- Hash Generator: tạo SHA-1, SHA-256, SHA-384 và SHA-512 từ text.
```

- [ ] **Step 5: Run moved hash route check**

Run: `npm run test:e2e -- --grep "Hash Generator|groups generator tools"`

Expected: FAIL only because UUID, Password, JWT Secret, and Fake Data Generator routes are still missing.

- [ ] **Step 6: Commit hash regrouping**

```bash
git add src/tools/registry.js README.md tests/e2e/app.spec.js
git commit -m "refactor: move hash generator to generator group"
```

---

### Task 2: UUID Generator

**Files:**
- Create: `src/tools/uuid-generator/index.jsx`
- Create: `src/tools/uuid-generator/style.css`
- Create: `src/tools/uuid-generator/example.js`
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`
- Modify: `README.md`

- [ ] **Step 1: Write failing UUID behavior test**

Add this test to `tests/e2e/app.spec.js`:

```js
test('generates UUID values offline', async ({ page }) => {
    await page.goto('/tools/uuid-generator')

    await expect(page.getByRole('heading', { name: 'UUID Generator' })).toBeVisible()
    await page.getByLabel('Count').fill('3')
    await page.getByRole('button', { name: 'Generate UUIDs' }).click()

    const output = page.locator('.fo-output')
    await expect(output).toContainText(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)

    const uuids = (await output.textContent()).trim().split('\n').filter(Boolean)
    expect(uuids).toHaveLength(3)
    expect(new Set(uuids).size).toBe(3)
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:e2e -- --grep "generates UUID values"`

Expected: FAIL with route/sidebar entry missing.

- [ ] **Step 3: Create UUID example**

Create `src/tools/uuid-generator/example.js`:

```js
export const uuidExample = '3'
```

- [ ] **Step 4: Create UUID implementation**

Create `src/tools/uuid-generator/index.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { Button, InputNumber, message } from 'antd'
import { Clipboard, Download, RotateCcw, Sparkles } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadText } from '../../shared/utils/download.js'
import { uuidExample } from './example.js'
import './style.css'

const toolId = 'uuid-generator'

function generateUuid() {
    if (crypto.randomUUID) {
        return crypto.randomUUID()
    }

    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}

export default function UuidGeneratorTool() {
    const [count, setCount] = useState(Number(uuidExample))
    const [result, setResult] = useState('')

    const generate = () => {
        const safeCount = Math.min(Math.max(Number(count) || 1, 1), 100)
        setResult(Array.from({ length: safeCount }, generateUuid).join('\n'))
    }

    const reset = () => {
        setCount(Number(uuidExample))
        setResult('')
    }

    const actions = useMemo(() => [
        { key: 'generate', label: 'Generate UUIDs', icon: Sparkles, primary: true, onClick: generate },
        { key: 'copy', label: 'Copy', icon: Clipboard, onClick: () => copyText(result).then(() => message.success('Copied UUIDs')), disabled: !result },
        { key: 'download', label: 'Download', icon: Download, onClick: () => downloadText('uuids.txt', result), disabled: !result },
        { key: 'reset', label: 'Reset', icon: RotateCcw, onClick: reset }
    ], [count, result])

    useToolActions(toolId, actions)

    return (
        <SplitWorkspace
            toolId={toolId}
            title="UUID Generator"
            description="Generate random UUID v4 values locally in your browser."
            left={
                <div className="generator-form">
                    <label className="generator-field">
                        <span>Count</span>
                        <InputNumber min={1} max={100} value={count} onChange={(value) => setCount(value ?? 1)} />
                    </label>
                    <Button type="primary" icon={<Sparkles size={16} />} onClick={generate}>Generate UUIDs</Button>
                </div>
            }
            right={<FormatterOutput value={result} language="text" placeholder="Generated UUIDs appear here." />}
        />
    )
}
```

- [ ] **Step 5: Create UUID CSS**

Create `src/tools/uuid-generator/style.css`:

```css
.generator-form {
    display: grid;
    gap: 16px;
    align-content: start;
    height: 100%;
}

.generator-field {
    display: grid;
    gap: 8px;
    color: #1f2937;
    font-weight: 600;
}
```

- [ ] **Step 6: Register UUID Generator**

Add `BadgePlus` to the `lucide-react` import in `src/tools/registry.js`, then add this entry after Hash Generator:

```js
{
    id: 'uuid-generator',
    name: 'UUID Generator',
    group: 'Generator',
    description: 'Generate UUID v4 values offline.',
    icon: BadgePlus,
    Component: lazy(() => import('./uuid-generator/index.jsx'))
}
```

- [ ] **Step 7: Update README UUID entry**

Add under `### Generator` in `README.md`:

```md
- UUID Generator: tạo một hoặc nhiều UUID v4 ngẫu nhiên offline.
```

- [ ] **Step 8: Run UUID test to verify GREEN**

Run: `npm run test:e2e -- --grep "generates UUID values"`

Expected: PASS.

- [ ] **Step 9: Commit UUID Generator**

```bash
git add tests/e2e/app.spec.js src/tools/registry.js src/tools/uuid-generator README.md
git commit -m "feat: add uuid generator"
```

---

### Task 3: Password Generator

**Files:**
- Create: `src/tools/password-generator/index.jsx`
- Create: `src/tools/password-generator/style.css`
- Create: `src/tools/password-generator/example.js`
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`
- Modify: `README.md`

- [ ] **Step 1: Write failing password behavior test**

Add this test to `tests/e2e/app.spec.js`:

```js
test('generates configurable passwords offline', async ({ page }) => {
    await page.goto('/tools/password-generator')

    await expect(page.getByRole('heading', { name: 'Password Generator' })).toBeVisible()
    await page.getByLabel('Length').fill('24')
    await page.getByLabel('Include symbols').check()
    await page.getByRole('button', { name: 'Generate Password' }).click()

    const password = (await page.locator('.fo-output').textContent()).trim()
    expect(password).toHaveLength(24)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/)
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:e2e -- --grep "configurable passwords"`

Expected: FAIL with route/sidebar entry missing.

- [ ] **Step 3: Create password example**

Create `src/tools/password-generator/example.js`:

```js
export const passwordDefaults = {
    length: 20,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false
}
```

- [ ] **Step 4: Create password implementation**

Create `src/tools/password-generator/index.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { Button, Checkbox, InputNumber, message } from 'antd'
import { Clipboard, Download, KeyRound, RotateCcw } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadText } from '../../shared/utils/download.js'
import { passwordDefaults } from './example.js'
import './style.css'

const toolId = 'password-generator'
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
    const reset = () => {
        setOptions(passwordDefaults)
        setResult('')
    }

    const actions = useMemo(() => [
        { key: 'generate', label: 'Generate Password', icon: KeyRound, primary: true, onClick: generate },
        { key: 'copy', label: 'Copy', icon: Clipboard, onClick: () => copyText(result).then(() => message.success('Copied password')), disabled: !result },
        { key: 'download', label: 'Download', icon: Download, onClick: () => downloadText('password.txt', result), disabled: !result },
        { key: 'reset', label: 'Reset', icon: RotateCcw, onClick: reset }
    ], [options, result])

    useToolActions(toolId, actions)

    return (
        <SplitWorkspace
            toolId={toolId}
            title="Password Generator"
            description="Generate browser-local passwords with configurable character groups."
            left={
                <div className="generator-form">
                    <label className="generator-field">
                        <span>Length</span>
                        <InputNumber min={8} max={128} value={options.length} onChange={(value) => updateOption('length', value ?? 20)} />
                    </label>
                    <Checkbox checked={options.includeUppercase} onChange={(event) => updateOption('includeUppercase', event.target.checked)}>Include uppercase</Checkbox>
                    <Checkbox checked={options.includeLowercase} onChange={(event) => updateOption('includeLowercase', event.target.checked)}>Include lowercase</Checkbox>
                    <Checkbox checked={options.includeNumbers} onChange={(event) => updateOption('includeNumbers', event.target.checked)}>Include numbers</Checkbox>
                    <Checkbox checked={options.includeSymbols} onChange={(event) => updateOption('includeSymbols', event.target.checked)}>Include symbols</Checkbox>
                    <Button type="primary" icon={<KeyRound size={16} />} onClick={generate}>Generate Password</Button>
                </div>
            }
            right={<FormatterOutput value={result} language="text" placeholder="Generated password appears here." />}
        />
    )
}
```

- [ ] **Step 5: Create password CSS**

Create `src/tools/password-generator/style.css`:

```css
.generator-form {
    display: grid;
    gap: 16px;
    align-content: start;
    height: 100%;
}

.generator-field {
    display: grid;
    gap: 8px;
    color: #1f2937;
    font-weight: 600;
}
```

- [ ] **Step 6: Register Password Generator**

Add `ShieldCheck` to the `lucide-react` import in `src/tools/registry.js`, then add:

```js
{
    id: 'password-generator',
    name: 'Password Generator',
    group: 'Generator',
    description: 'Generate configurable passwords offline.',
    icon: ShieldCheck,
    Component: lazy(() => import('./password-generator/index.jsx'))
}
```

- [ ] **Step 7: Update README password entry**

Add under `### Generator` in `README.md`:

```md
- Password Generator: tạo mật khẩu theo độ dài và nhóm ký tự đã chọn.
```

- [ ] **Step 8: Run password test to verify GREEN**

Run: `npm run test:e2e -- --grep "configurable passwords"`

Expected: PASS.

- [ ] **Step 9: Commit Password Generator**

```bash
git add tests/e2e/app.spec.js src/tools/registry.js src/tools/password-generator README.md
git commit -m "feat: add password generator"
```

---

### Task 4: JWT Secret Generator

**Files:**
- Create: `src/tools/jwt-secret-generator/index.jsx`
- Create: `src/tools/jwt-secret-generator/style.css`
- Create: `src/tools/jwt-secret-generator/example.js`
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`
- Modify: `README.md`

- [ ] **Step 1: Write failing JWT secret test**

Add this test to `tests/e2e/app.spec.js`:

```js
test('generates JWT secrets offline', async ({ page }) => {
    await page.goto('/tools/jwt-secret-generator')

    await expect(page.getByRole('heading', { name: 'JWT Secret Generator' })).toBeVisible()
    await page.getByLabel('Bytes').fill('48')
    await page.getByRole('button', { name: 'Generate Secret' }).click()

    const secret = (await page.locator('.fo-output').textContent()).trim()
    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(secret.length).toBeGreaterThanOrEqual(64)
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:e2e -- --grep "JWT secrets"`

Expected: FAIL with route/sidebar entry missing.

- [ ] **Step 3: Create JWT secret example**

Create `src/tools/jwt-secret-generator/example.js`:

```js
export const jwtSecretDefaults = {
    bytes: 32
}
```

- [ ] **Step 4: Create JWT secret implementation**

Create `src/tools/jwt-secret-generator/index.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { Button, InputNumber, message } from 'antd'
import { Clipboard, Download, KeyRound, RotateCcw } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadText } from '../../shared/utils/download.js'
import { jwtSecretDefaults } from './example.js'
import './style.css'

const toolId = 'jwt-secret-generator'

function toBase64Url(bytes) {
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function generateSecret(byteLength) {
    const bytes = new Uint8Array(Math.min(Math.max(Number(byteLength) || 32, 16), 128))
    crypto.getRandomValues(bytes)
    return toBase64Url(bytes)
}

export default function JwtSecretGeneratorTool() {
    const [bytes, setBytes] = useState(jwtSecretDefaults.bytes)
    const [result, setResult] = useState('')

    const generate = () => setResult(generateSecret(bytes))
    const reset = () => {
        setBytes(jwtSecretDefaults.bytes)
        setResult('')
    }

    const actions = useMemo(() => [
        { key: 'generate', label: 'Generate Secret', icon: KeyRound, primary: true, onClick: generate },
        { key: 'copy', label: 'Copy', icon: Clipboard, onClick: () => copyText(result).then(() => message.success('Copied secret')), disabled: !result },
        { key: 'download', label: 'Download', icon: Download, onClick: () => downloadText('jwt-secret.txt', result), disabled: !result },
        { key: 'reset', label: 'Reset', icon: RotateCcw, onClick: reset }
    ], [bytes, result])

    useToolActions(toolId, actions)

    return (
        <SplitWorkspace
            toolId={toolId}
            title="JWT Secret Generator"
            description="Generate base64url JWT signing secrets locally."
            left={
                <div className="generator-form">
                    <label className="generator-field">
                        <span>Bytes</span>
                        <InputNumber min={16} max={128} value={bytes} onChange={(value) => setBytes(value ?? 32)} />
                    </label>
                    <Button type="primary" icon={<KeyRound size={16} />} onClick={generate}>Generate Secret</Button>
                </div>
            }
            right={<FormatterOutput value={result} language="text" placeholder="Generated JWT secret appears here." />}
        />
    )
}
```

- [ ] **Step 5: Create JWT secret CSS**

Create `src/tools/jwt-secret-generator/style.css`:

```css
.generator-form {
    display: grid;
    gap: 16px;
    align-content: start;
    height: 100%;
}

.generator-field {
    display: grid;
    gap: 8px;
    color: #1f2937;
    font-weight: 600;
}
```

- [ ] **Step 6: Register JWT Secret Generator**

Add this registry entry with the existing `KeyRound` icon:

```js
{
    id: 'jwt-secret-generator',
    name: 'JWT Secret Generator',
    group: 'Generator',
    description: 'Generate base64url JWT secrets offline.',
    icon: KeyRound,
    Component: lazy(() => import('./jwt-secret-generator/index.jsx'))
}
```

- [ ] **Step 7: Update README JWT secret entry**

Add under `### Generator` in `README.md`:

```md
- JWT Secret Generator: tạo secret base64url để dùng cho JWT signing.
```

- [ ] **Step 8: Run JWT secret test to verify GREEN**

Run: `npm run test:e2e -- --grep "JWT secrets"`

Expected: PASS.

- [ ] **Step 9: Commit JWT Secret Generator**

```bash
git add tests/e2e/app.spec.js src/tools/registry.js src/tools/jwt-secret-generator README.md
git commit -m "feat: add jwt secret generator"
```

---

### Task 5: Fake Data Generator

**Files:**
- Create: `src/tools/fake-data-generator/index.jsx`
- Create: `src/tools/fake-data-generator/style.css`
- Create: `src/tools/fake-data-generator/example.js`
- Modify: `src/tools/registry.js`
- Modify: `tests/e2e/app.spec.js`
- Modify: `README.md`

- [ ] **Step 1: Write failing fake data test**

Add this test to `tests/e2e/app.spec.js`:

```js
test('generates fake data records offline', async ({ page }) => {
    await page.goto('/tools/fake-data-generator')

    await expect(page.getByRole('heading', { name: 'Fake Data Generator' })).toBeVisible()
    await page.getByLabel('Records').fill('2')
    await page.getByRole('button', { name: 'Generate Data' }).click()

    const output = page.locator('.fo-output')
    await expect(output).toContainText('"id"')
    await expect(output).toContainText('"name"')
    await expect(output).toContainText('"email"')

    const records = JSON.parse(await output.textContent())
    expect(records).toHaveLength(2)
    expect(records[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String), email: expect.any(String) }))
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:e2e -- --grep "fake data records"`

Expected: FAIL with route/sidebar entry missing.

- [ ] **Step 3: Create fake data example**

Create `src/tools/fake-data-generator/example.js`:

```js
export const fakeDataDefaults = {
    records: 5
}
```

- [ ] **Step 4: Create fake data implementation**

Create `src/tools/fake-data-generator/index.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { Button, InputNumber, message } from 'antd'
import { Clipboard, Database, Download, RotateCcw } from 'lucide-react'
import FormatterOutput from '../../shared/components/FormatterOutput.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadText } from '../../shared/utils/download.js'
import { fakeDataDefaults } from './example.js'
import './style.css'

const toolId = 'fake-data-generator'
const firstNames = ['Ava', 'Mina', 'Noah', 'Kai', 'Linh', 'An']
const lastNames = ['Nguyen', 'Tran', 'Pham', 'Le', 'Hoang', 'Vu']
const domains = ['example.com', 'local.test', 'demo.dev']

function randomIndex(max) {
    const bytes = new Uint32Array(1)
    crypto.getRandomValues(bytes)
    return bytes[0] % max
}

function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '.')
}

function createRecord(index) {
    const firstName = firstNames[randomIndex(firstNames.length)]
    const lastName = lastNames[randomIndex(lastNames.length)]
    const domain = domains[randomIndex(domains.length)]
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}-${randomIndex(100000)}`

    return {
        id,
        name: `${firstName} ${lastName}`,
        email: `${slug(firstName)}.${slug(lastName)}${index + 1}@${domain}`,
        active: randomIndex(2) === 1
    }
}

function generateRecords(count) {
    const safeCount = Math.min(Math.max(Number(count) || 1, 1), 100)
    return JSON.stringify(Array.from({ length: safeCount }, (_, index) => createRecord(index)), null, 2)
}

export default function FakeDataGeneratorTool() {
    const [records, setRecords] = useState(fakeDataDefaults.records)
    const [result, setResult] = useState('')

    const generate = () => setResult(generateRecords(records))
    const reset = () => {
        setRecords(fakeDataDefaults.records)
        setResult('')
    }

    const actions = useMemo(() => [
        { key: 'generate', label: 'Generate Data', icon: Database, primary: true, onClick: generate },
        { key: 'copy', label: 'Copy', icon: Clipboard, onClick: () => copyText(result).then(() => message.success('Copied data')), disabled: !result },
        { key: 'download', label: 'Download', icon: Download, onClick: () => downloadText('fake-data.json', result), disabled: !result },
        { key: 'reset', label: 'Reset', icon: RotateCcw, onClick: reset }
    ], [records, result])

    useToolActions(toolId, actions)

    return (
        <SplitWorkspace
            toolId={toolId}
            title="Fake Data Generator"
            description="Generate small local JSON datasets for demos and tests."
            left={
                <div className="generator-form">
                    <label className="generator-field">
                        <span>Records</span>
                        <InputNumber min={1} max={100} value={records} onChange={(value) => setRecords(value ?? 5)} />
                    </label>
                    <Button type="primary" icon={<Database size={16} />} onClick={generate}>Generate Data</Button>
                </div>
            }
            right={<FormatterOutput value={result} language="json" placeholder="Generated JSON records appear here." />}
        />
    )
}
```

- [ ] **Step 5: Create fake data CSS**

Create `src/tools/fake-data-generator/style.css`:

```css
.generator-form {
    display: grid;
    gap: 16px;
    align-content: start;
    height: 100%;
}

.generator-field {
    display: grid;
    gap: 8px;
    color: #1f2937;
    font-weight: 600;
}
```

- [ ] **Step 6: Register Fake Data Generator**

Add this registry entry with the existing `Database` icon:

```js
{
    id: 'fake-data-generator',
    name: 'Fake Data Generator',
    group: 'Generator',
    description: 'Generate fake JSON records offline.',
    icon: Database,
    Component: lazy(() => import('./fake-data-generator/index.jsx'))
}
```

- [ ] **Step 7: Update README fake data entry**

Add under `### Generator` in `README.md`:

```md
- Fake Data Generator: tạo JSON records giả để dùng thử UI, demo hoặc test thủ công.
```

- [ ] **Step 8: Run fake data test to verify GREEN**

Run: `npm run test:e2e -- --grep "fake data records"`

Expected: PASS.

- [ ] **Step 9: Commit Fake Data Generator**

```bash
git add tests/e2e/app.spec.js src/tools/registry.js src/tools/fake-data-generator README.md
git commit -m "feat: add fake data generator"
```

---

### Task 6: Generator Responsive And Final Verification

**Files:**
- Modify: `tests/e2e/app.spec.js`
- Modify: `README.md`

- [ ] **Step 1: Add generator routes to responsive route list**

In the route coverage list in `tests/e2e/app.spec.js`, ensure these entries exist:

```js
{ path: '/tools/hash-generator', heading: 'Hash Generator' },
{ path: '/tools/uuid-generator', heading: 'UUID Generator' },
{ path: '/tools/password-generator', heading: 'Password Generator' },
{ path: '/tools/jwt-secret-generator', heading: 'JWT Secret Generator' },
{ path: '/tools/fake-data-generator', heading: 'Fake Data Generator' }
```

- [ ] **Step 2: Run generator subset**

Run: `npm run test:e2e -- --grep "Generator|UUID|passwords|JWT secrets|fake data|groups generator"`

Expected: PASS for generator grouping, behavior, routes, and responsive coverage.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS with generator tools lazy-loaded and no external network calls.

- [ ] **Step 4: Run full E2E**

Run: `npm run test:e2e`

Expected: PASS across mobile `390x844`, tablet `768x1024`, and desktop `1280x800`.

- [ ] **Step 5: Commit final verification updates**

```bash
git add tests/e2e/app.spec.js README.md
git commit -m "test: cover generator tools"
```

---

## Self-Review

- Spec coverage: Generator group is introduced, Hash Generator moves from Encoder / Decoder to Generator, and the planned generator tools gain route, registry, README, and Playwright coverage.
- TDD coverage: each behavior starts with a failing Playwright test, then a minimal implementation, then a focused green run.
- Offline-first: all tools use browser-native `crypto` and local state only; no uploads, APIs, or new dependencies.
- Project pattern: each tool lives under `src/tools/<tool-id>`, registers through `src/tools/registry.js`, and uses existing split workspace/action/output utilities.
- Responsive coverage: final task adds every Generator route to the existing breakpoint route checks.
- Placeholder scan: no `TBD`, empty implementation notes, or missing command expectations remain.

