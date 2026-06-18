# Useful Tools Offline Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the current CRA Mermaid/Markdown preview app into a Vite offline Useful Tools workspace.

**Architecture:** Build a React app shell with Header + Sidebar + Content + Footer. Register each tool through metadata under `src/tools`, and move shared local-only behavior to `src/shared`.

**Tech Stack:** Vite, React, React Router, Mermaid, Marked, lucide-react, browser APIs (`localStorage`, File API, Clipboard API, Blob/Object URL), CSS.

---

## File Map

- `package.json`: rename app, replace CRA scripts/deps with Vite, add `lucide-react`.
- `vite.config.js`: Vite React config.
- `index.html`: Vite HTML entry.
- `src/main.jsx`: Vite React entry.
- `src/app/*`: app shell, routes, layout.
- `src/tools/registry.js`: tool metadata and route source.
- `src/tools/mermaid-preview/*`: Mermaid tool.
- `src/tools/markdown-preview/*`: Markdown tool.
- `src/shared/*`: reusable local-only helpers and components.
- Remove CRA/API files: `public/index.html`, `src/index.js`, `src/reportWebVitals.js`, `src/setupTests.js`, `src/App.test.js`, `src/logo.svg`, `src/api/utils.js`, `src/utils/url.js`.

---

## Task 1: Migrate CRA To Vite

**Files:**
- Modify: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Delete: `public/index.html`, `src/index.js`, `src/reportWebVitals.js`, `src/setupTests.js`, `src/App.test.js`, `src/logo.svg`

- [ ] **Step 1: Update package scripts and dependencies**

Use this shape:

```json
{
  "name": "useful-tools",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "antd": "^6.4.4",
    "lucide-react": "latest",
    "marked": "^17.0.1",
    "mermaid": "^11.12.2",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "react-router-dom": "^7.10.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest"
  }
}
```

- [ ] **Step 2: Create Vite config**

`vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: { port: 5173 }
})
```

- [ ] **Step 3: Create root HTML**

`index.html`:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Useful Tools - offline utilities" />
    <title>Useful Tools</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create Vite entry**

`src/main.jsx`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
```

- [ ] **Step 5: Remove CRA files**

Run:

```bash
git rm public/index.html src/index.js src/reportWebVitals.js src/setupTests.js src/App.test.js src/logo.svg
```

- [ ] **Step 6: Install and checkpoint**

Run:

```bash
npm install
```

Expected: Vite dependencies installed, `package-lock.json` updated.

Commit:

```bash
git add package.json package-lock.json vite.config.js index.html src/main.jsx
git commit -m "chore: migrate app shell to vite"
```

---

## Task 2: Add App Layout

**Files:**
- Create: `src/app/App.jsx`, `src/app/routes.jsx`
- Create: `src/app/layout/AppLayout.jsx`, `Header.jsx`, `Sidebar.jsx`, `Footer.jsx`, `layout.css`
- Modify: `src/index.css`
- Delete: `src/App.js`, `src/App.css`, `src/menu/index.jsx`

- [ ] **Step 1: Create app router**

`src/app/App.jsx`:

```jsx
import { ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout.jsx'
import { toolRoutes } from './routes.jsx'
import '../shared/components/shared.css'

export default function App() {
    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#2563eb', borderRadius: 8 } }}>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route index element={<Navigate to="/tools/mermaid-preview" replace />} />
                        {toolRoutes.map((tool) => <Route key={tool.path} path={tool.path} element={tool.element} />)}
                        <Route path="*" element={<Navigate to="/tools/mermaid-preview" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    )
}
```

- [ ] **Step 2: Create route source**

`src/app/routes.jsx`:

```jsx
import { tools } from '../tools/registry.js'

export const toolRoutes = tools.map((tool) => ({
    path: `/tools/${tool.id}`,
    element: <tool.Component />
}))
```

- [ ] **Step 3: Create layout files**

`src/app/layout/AppLayout.jsx`:

```jsx
import { Outlet } from 'react-router-dom'
import { AppHeader } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'
import { AppFooter } from './Footer.jsx'
import './layout.css'

export function AppLayout() {
    return <div className="app-shell"><AppHeader /><div className="app-body"><Sidebar /><main className="app-content"><Outlet /></main></div><AppFooter /></div>
}
```

`src/app/layout/Header.jsx`:

```jsx
import { Search, Wrench } from 'lucide-react'

export function AppHeader() {
    return <header className="app-header"><div className="brand"><Wrench size={20} /><strong>Useful Tools</strong></div><div className="header-search"><Search size={16} />Search tools</div></header>
}
```

`src/app/layout/Sidebar.jsx`:

```jsx
import { NavLink } from 'react-router-dom'
import { tools } from '../../tools/registry.js'

export function Sidebar() {
    return <aside className="app-sidebar">{tools.map((tool) => { const Icon = tool.icon; return <NavLink key={tool.id} to={`/tools/${tool.id}`}><Icon size={16} />{tool.name}</NavLink> })}</aside>
}
```

`src/app/layout/Footer.jsx`:

```jsx
import { WifiOff } from 'lucide-react'

export function AppFooter() {
    return <footer className="app-footer"><span>Useful Tools v0.1.0</span><span><WifiOff size={14} /> Offline-first</span></footer>
}
```

- [ ] **Step 4: Add layout CSS**

`src/app/layout/layout.css`:

```css
.app-shell { min-height: 100vh; display: flex; flex-direction: column; background: #f8fafc; color: #111827; }
.app-header { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid #e5e7eb; background: #fff; }
.brand, .header-search, .app-footer span { display: flex; align-items: center; gap: 8px; }
.header-search { width: 240px; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; color: #6b7280; background: #f9fafb; }
.app-body { flex: 1; display: flex; min-height: 0; }
.app-sidebar { width: 240px; display: flex; flex-direction: column; gap: 6px; padding: 16px; border-right: 1px solid #e5e7eb; background: #fff; }
.app-sidebar a { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 8px; color: #374151; text-decoration: none; }
.app-sidebar a.active, .app-sidebar a:hover { background: #eff6ff; color: #1d4ed8; }
.app-content { flex: 1; min-width: 0; overflow: hidden; }
.app-footer { height: 34px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-top: 1px solid #e5e7eb; color: #6b7280; background: #fff; font-size: 13px; }
```

- [ ] **Step 5: Replace global CSS**

`src/index.css`:

```css
* { box-sizing: border-box; }
html, body, #root { width: 100%; height: 100%; margin: 0; }
body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; }
button, input, textarea { font: inherit; }
```

- [ ] **Step 6: Remove old shell**

```bash
git rm src/App.js src/App.css src/menu/index.jsx
git add src/app src/index.css
git commit -m "feat: add useful tools layout"
```

---

## Task 3: Add Shared Offline Helpers

**Files:**
- Create: `src/shared/utils/clipboard.js`, `download.js`, `localDraft.js`, `fileReader.js`
- Create: `src/shared/components/ToolHeader.jsx`, `SplitWorkspace.jsx`, `shared.css`
- Delete: `src/api/utils.js`, `src/utils/url.js`, `src/utils/constants.js`, `src/utils/utils.js`

- [ ] **Step 1: Add utilities**

`src/shared/utils/clipboard.js`:

```js
export async function copyText(text) {
    if (!text) return { ok: false, message: 'Không có nội dung để copy.' }
    await navigator.clipboard.writeText(text)
    return { ok: true, message: 'Đã copy vào clipboard.' }
}
```

`src/shared/utils/download.js`:

```js
export function downloadTextFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
```

`src/shared/utils/localDraft.js`:

```js
const prefix = 'useful-tools:draft:'
export const loadDraft = (toolId, fallback = '') => localStorage.getItem(`${prefix}${toolId}`) || fallback
export const saveDraft = (toolId, value) => localStorage.setItem(`${prefix}${toolId}`, value)
export const clearDraft = (toolId) => localStorage.removeItem(`${prefix}${toolId}`)
```

`src/shared/utils/fileReader.js`:

```js
export function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => resolve(event.target.result)
        reader.onerror = () => reject(new Error('Không đọc được file.'))
        reader.readAsText(file)
    })
}
```

- [ ] **Step 2: Add shared components**

`src/shared/components/ToolHeader.jsx`:

```jsx
export function ToolHeader({ title, description, actions }) {
    return <div className="tool-header"><div><h1>{title}</h1><p>{description}</p></div>{actions ? <div className="tool-actions">{actions}</div> : null}</div>
}
```

`src/shared/components/SplitWorkspace.jsx`:

```jsx
export function SplitWorkspace({ left, right }) {
    return <div className="split-workspace"><section className="split-panel split-left">{left}</section><section className="split-panel split-right">{right}</section></div>
}
```

`src/shared/components/shared.css`:

```css
.tool-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; background: #fff; }
.tool-header h1 { margin: 0; font-size: 20px; }
.tool-header p { margin: 4px 0 0; color: #6b7280; }
.tool-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.split-workspace { height: calc(100vh - 56px - 34px - 73px); display: grid; grid-template-columns: minmax(320px, 42%) minmax(0, 1fr); overflow: hidden; }
.split-panel { min-width: 0; min-height: 0; overflow: auto; }
.split-left { border-right: 1px solid #e5e7eb; background: #fff; }
.split-right { background: #f8fafc; }
.tool-editor { height: 100%; min-height: 100%; padding: 16px; border: 0; border-radius: 0; font-family: Consolas, monospace; font-size: 14px; resize: none; }
```

- [ ] **Step 3: Remove API utilities**

```bash
git rm src/api/utils.js src/utils/url.js src/utils/constants.js src/utils/utils.js
git add src/shared
git commit -m "feat: add shared offline helpers"
```

---

## Task 4: Refactor Mermaid Tool

**Files:**
- Create: `src/tools/mermaid-preview/index.jsx`, `Preview.jsx`, `example.js`, `style.css`
- Delete: `src/mermaid/index.jsx`, `src/mermaid/preview.jsx`, `src/mermaid/example.js`

- [ ] **Step 1: Create Mermaid tool files**

`src/tools/mermaid-preview/example.js`:

```js
export const mermaidExample = `flowchart TD
  A[Open Useful Tools] --> B[Choose Mermaid Preview]
  B --> C[Write diagram]
  C --> D[Preview offline]
`
```

`src/tools/mermaid-preview/Preview.jsx`:

```jsx
import { useEffect, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })

export function MermaidPreview({ value }) {
    const [svg, setSvg] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const timer = window.setTimeout(async () => {
            try {
                if (!value.trim()) return setSvg('')
                const result = await mermaid.render(`mermaid-${Date.now()}`, value)
                setSvg(result.svg)
                setError('')
            } catch (err) {
                setSvg('')
                setError(err.message)
            }
        }, 300)
        return () => window.clearTimeout(timer)
    }, [value])

    return <div className="preview-canvas">{error ? <pre className="tool-error">{error}</pre> : <div dangerouslySetInnerHTML={{ __html: svg }} />}</div>
}
```

`src/tools/mermaid-preview/index.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp, RotateCcw } from 'lucide-react'
import { ToolHeader } from '../../shared/components/ToolHeader.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { mermaidExample } from './example.js'
import { MermaidPreview } from './Preview.jsx'
import './style.css'

const toolId = 'mermaid-preview'

export default function MermaidPreviewTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, mermaidExample))
    useEffect(() => saveDraft(toolId, value), [value])

    const openFile = async (file) => { setValue(await readTextFile(file)); message.success('Đã mở file.'); return false }
    const copy = async () => { const result = await copyText(value); message[result.ok ? 'success' : 'warning'](result.message) }

    return <div className="tool-page"><ToolHeader title="Mermaid Preview" description="Write and preview Mermaid diagrams offline." actions={<><Upload beforeUpload={openFile} showUploadList={false} accept=".mmd,.txt,.md"><Button icon={<FileUp size={16} />}>Open</Button></Upload><Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button><Button icon={<Download size={16} />} onClick={() => downloadTextFile(value, 'diagram.mmd')}>Download</Button><Button icon={<RotateCcw size={16} />} onClick={() => setValue(mermaidExample)}>Example</Button></>} /><SplitWorkspace left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />} right={<MermaidPreview value={value} />} /></div>
}
```

`src/tools/mermaid-preview/style.css`:

```css
.tool-page { height: 100%; display: flex; flex-direction: column; }
.preview-canvas { height: 100%; overflow: auto; padding: 24px; }
.tool-error { margin: 0; padding: 12px; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; background: #fef2f2; white-space: pre-wrap; }
```

- [ ] **Step 2: Remove old Mermaid files and commit**

```bash
git rm src/mermaid/index.jsx src/mermaid/preview.jsx src/mermaid/example.js
git add src/tools/mermaid-preview
git commit -m "feat: refactor mermaid as offline tool"
```

---

## Task 5: Refactor Markdown Tool

**Files:**
- Create: `src/tools/markdown-preview/index.jsx`, `Preview.jsx`, `example.js`, `style.css`, `markdown.css`
- Delete: `src/markdown/index.jsx`, `src/markdown/preview.jsx`, `src/markdown/tools.jsx`, `src/markdown/example.js`, `src/markdown/style/markdown.css`

- [ ] **Step 1: Create Markdown tool files**

`src/tools/markdown-preview/example.js`:

```js
export const markdownExample = `# Useful Tools

Write Markdown on the left and preview it on the right.

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[Preview]
\`\`\`
`
```

`src/tools/markdown-preview/Preview.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { parse } from 'marked'
import mermaid from 'mermaid'

function decodeHtml(html) {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = html
    return textarea.value
}

export function MarkdownPreview({ value }) {
    const [html, setHtml] = useState('')

    useEffect(() => {
        const timer = window.setTimeout(async () => {
            let nextHtml = parse(value)
            const matches = [...nextHtml.matchAll(/<code class="language-mermaid">([\s\S]*?)<\/code>/g)]
            for (let index = 0; index < matches.length; index += 1) {
                try {
                    const result = await mermaid.render(`markdown-mermaid-${Date.now()}-${index}`, decodeHtml(matches[index][1]))
                    nextHtml = nextHtml.replace(matches[index][0], `<div class="mermaid-diagram">${result.svg}</div>`)
                } catch (error) {
                    nextHtml = nextHtml.replace(matches[index][0], `<pre class="markdown-error">${error.message}</pre>`)
                }
            }
            setHtml(nextHtml)
        }, 250)
        return () => window.clearTimeout(timer)
    }, [value])

    return <article className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />
}
```

`src/tools/markdown-preview/index.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Button, Input, message, Upload } from 'antd'
import { Clipboard, Download, FileUp, RotateCcw } from 'lucide-react'
import { ToolHeader } from '../../shared/components/ToolHeader.jsx'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { readTextFile } from '../../shared/utils/fileReader.js'
import { markdownExample } from './example.js'
import { MarkdownPreview } from './Preview.jsx'
import './markdown.css'
import './style.css'

const toolId = 'markdown-preview'

export default function MarkdownPreviewTool() {
    const [value, setValue] = useState(() => loadDraft(toolId, markdownExample))
    useEffect(() => saveDraft(toolId, value), [value])

    const openFile = async (file) => { setValue(await readTextFile(file)); message.success('Đã mở file.'); return false }
    const copy = async () => { const result = await copyText(value); message[result.ok ? 'success' : 'warning'](result.message) }

    return <div className="tool-page"><ToolHeader title="Markdown Preview" description="Write Markdown and preview output offline." actions={<><Upload beforeUpload={openFile} showUploadList={false} accept=".md,.txt"><Button icon={<FileUp size={16} />}>Open</Button></Upload><Button icon={<Clipboard size={16} />} onClick={copy}>Copy</Button><Button icon={<Download size={16} />} onClick={() => downloadTextFile(value, 'document.md', 'text/markdown')}>Download</Button><Button icon={<RotateCcw size={16} />} onClick={() => setValue(markdownExample)}>Example</Button></>} /><SplitWorkspace left={<Input.TextArea className="tool-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} />} right={<MarkdownPreview value={value} />} /></div>
}
```

`src/tools/markdown-preview/markdown.css`:

```css
.markdown-preview { max-width: 920px; margin: 0 auto; padding: 32px; color: #1f2937; line-height: 1.7; }
.markdown-preview pre { overflow: auto; padding: 12px; border-radius: 8px; background: #f3f4f6; }
.markdown-preview code { font-family: Consolas, monospace; }
.markdown-preview table { width: 100%; border-collapse: collapse; }
.markdown-preview th, .markdown-preview td { padding: 8px; border: 1px solid #e5e7eb; }
.markdown-error { padding: 12px; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; background: #fef2f2; }
```

`src/tools/markdown-preview/style.css`:

```css
.tool-page { height: 100%; display: flex; flex-direction: column; }
```

- [ ] **Step 2: Remove old Markdown files and commit**

```bash
git rm src/markdown/index.jsx src/markdown/preview.jsx src/markdown/tools.jsx src/markdown/example.js src/markdown/style/markdown.css
git add src/tools/markdown-preview
git commit -m "feat: refactor markdown as offline tool"
```

---

## Task 6: Add Tool Registry

**Files:**
- Create: `src/tools/registry.js`
- Verify: `src/app/routes.jsx`, `src/app/layout/Sidebar.jsx`

- [ ] **Step 1: Create registry**

`src/tools/registry.js`:

```jsx
import { FileText, Workflow } from 'lucide-react'
import MermaidPreviewTool from './mermaid-preview/index.jsx'
import MarkdownPreviewTool from './markdown-preview/index.jsx'

export const tools = [
    { id: 'mermaid-preview', name: 'Mermaid Preview', group: 'Preview', description: 'Write and preview Mermaid diagrams offline.', icon: Workflow, Component: MermaidPreviewTool },
    { id: 'markdown-preview', name: 'Markdown Preview', group: 'Preview', description: 'Write Markdown and preview output offline.', icon: FileText, Component: MarkdownPreviewTool }
]
```

- [ ] **Step 2: Build and commit**

Run:

```bash
npm run build
```

Expected: `✓ built in`.

Commit:

```bash
git add src/tools/registry.js src/app/routes.jsx src/app/layout/Sidebar.jsx
git commit -m "feat: add tool registry"
```

---

## Task 7: Update Public Metadata And README

**Files:**
- Modify: `public/manifest.json`
- Modify: `public/robots.txt`
- Modify: `README.md`

- [ ] **Step 1: Update manifest**

`public/manifest.json`:

```json
{
  "short_name": "Useful Tools",
  "name": "Useful Tools",
  "icons": [{ "src": "favicon.ico", "sizes": "64x64 32x32 24x24 16x16", "type": "image/x-icon" }],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#ffffff",
  "background_color": "#f8fafc"
}
```

- [ ] **Step 2: Keep robots simple**

`public/robots.txt`:

```text
User-agent: *
Disallow:
```

- [ ] **Step 3: Verify README commands**

Ensure README mentions only:

```bash
npm install
npm run dev
npm run build
npm run preview
```

- [ ] **Step 4: Commit docs metadata**

```bash
git add public/manifest.json public/robots.txt README.md
git commit -m "docs: update useful tools public metadata"
```

---

## Task 8: Final Verification

**Files:**
- Check all source/docs/config files.

- [ ] **Step 1: Confirm removed references**

Run:

```bash
rg "react-scripts|REACT_APP|@ant-design/icons|reportWebVitals|src/api|createMermaidFile|getMermaidFile|createMarkdownFile|getMarkdownFile|BASE_API_URL|BASE_APP_URL" .
```

Expected: no source/docs matches.

- [ ] **Step 2: Confirm no network calls**

Run:

```bash
rg "fetch\(|XMLHttpRequest|axios|https://" src README.md package.json
```

Expected: no matches.

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: `✓ built in`.

- [ ] **Step 4: Manual smoke check**

Run:

```bash
npm run preview
```

Verify:

```text
/tools/mermaid-preview renders example
/tools/markdown-preview renders example
Sidebar switches tools
Open, Copy, Download, Example work offline
```

- [ ] **Step 5: Commit final verification**

```bash
git add .
git commit -m "chore: verify offline useful tools refactor"
```

---

## Self-Review

- Covers Vite migration, layout, offline-only behavior, lucide icons, and Mermaid/Markdown as initial tools.
- No API/backend flow remains after Task 3 and Task 8 checks.
- Tool metadata fields are consistent: `id`, `name`, `group`, `description`, `icon`, `Component`.
- Task 5 includes explicit Markdown page code; no implementation step depends on copying Mermaid code implicitly.

