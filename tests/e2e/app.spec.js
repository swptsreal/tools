import { expect, test } from '@playwright/test'

const breakpoints = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 }
]

async function expectNoHorizontalOverflow(page) {
    const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
    }))

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
}

async function expectNoPageOverflow(page) {
    const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
    }))

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
    expect(overflow.scrollHeight).toBeLessThanOrEqual(overflow.clientHeight + 1)
}

async function expectEditorFillsLeftPanel(page) {
    const layout = await page.evaluate(() => {
        const panel = document.querySelector('.split-left')?.getBoundingClientRect()
        const editor = document.querySelector('.tool-editor')?.getBoundingClientRect()

        return {
            panelHeight: panel?.height ?? 0,
            editorHeight: editor?.height ?? 0,
            panelWidth: panel?.width ?? 0,
            editorWidth: editor?.width ?? 0
        }
    })

    expect(layout.editorHeight).toBeGreaterThanOrEqual(layout.panelHeight - 2)
    expect(layout.editorWidth).toBeGreaterThanOrEqual(layout.panelWidth - 2)
}

test('opens the default Mermaid tool and renders a diagram', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/tools\/mermaid-preview$/)
    await expect(page.getByRole('heading', { name: 'Mermaid Preview' })).toBeVisible()

    await page.locator('textarea').fill('graph TD\n    A[Input] --> B[Preview]')

    await expect(page.locator('.mermaid-svg svg')).toBeVisible()
})

test('opens Markdown Preview and renders markdown with Mermaid blocks', async ({ page }) => {
    await page.goto('/tools/markdown-preview')

    await expect(page.getByRole('heading', { name: 'Markdown Preview' })).toBeVisible()

    await page.locator('textarea').fill(`# Playwright Check\n\n- Fast feedback\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\``)

    await expect(page.locator('.markdown-preview h1')).toContainText('Playwright Check')
    await expect(page.locator('.markdown-preview li')).toContainText('Fast feedback')
    await expect(page.locator('.mermaid-diagram svg')).toBeVisible()
})

test('formats and minifies JSON offline', async ({ page }) => {
    await page.goto('/tools/json-formatter')

    await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible()

    await page.locator('textarea').fill('{"name":"Useful Tools","items":[1,2]}')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.fo-output')).toContainText('"name": "Useful Tools"')
    await expect(page.locator('.fo-output')).toContainText('"items": [')

    await page.getByRole('button', { name: 'Minify' }).click()
    await expect(page.locator('.fo-output')).toContainText('{"name":"Useful Tools","items":[1,2]}')
})

test('shows a readable JSON formatter error', async ({ page }) => {
    await page.goto('/tools/json-formatter')

    await page.locator('textarea').fill('{"name":}')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.formatter-error')).toContainText('Invalid JSON')
})

test('formats SQL using a lazy formatter dependency', async ({ page }) => {
    await page.goto('/tools/sql-formatter')

    await expect(page.getByRole('heading', { name: 'SQL Formatter' })).toBeVisible()

    await page.locator('textarea').fill('select id,name from users where active=1 order by name')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.fo-output')).toContainText('SELECT')
    await expect(page.locator('.fo-output')).toContainText('FROM users')
    await expect(page.locator('.fo-output')).toContainText('ORDER BY name')
})

test('formats HTML offline', async ({ page }) => {
    await page.goto('/tools/html-formatter')

    await expect(page.getByRole('heading', { name: 'HTML Formatter' })).toBeVisible()
    await page.locator('textarea').fill('<main><h1>Useful Tools</h1><p>Offline</p></main>')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.fo-output')).toContainText('<main>')
    await expect(page.locator('.fo-output')).toContainText('  <h1>Useful Tools</h1>')
})

test('formats CSS offline', async ({ page }) => {
    await page.goto('/tools/css-formatter')

    await expect(page.getByRole('heading', { name: 'CSS Formatter' })).toBeVisible()
    await page.locator('textarea').fill('.tool{display:flex;color:#111}.tool button{padding:8px}')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.fo-output')).toContainText('.tool {')
    await expect(page.locator('.fo-output')).toContainText('display: flex;')
})


test('shows converter tools in sidebar navigation', async ({ page }) => {
    await page.goto('/tools/json-yaml-converter')

    await expect(page.locator('.desktop-sidebar h2', { hasText: 'Converter' })).toBeVisible()
    await expect(page.getByRole('link', { name: /JSON YAML Converter/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /CSV JSON Converter/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Timestamp Converter/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Color Converter/ })).toBeVisible()
})

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

test('converts hex color to rgb and hsl offline', async ({ page }) => {
    await page.goto('/tools/color-converter')
    await page.locator('textarea').fill('#336699')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('.fo-output')).toContainText('HEX: #336699')
    await expect(page.locator('.fo-output')).toContainText('RGB: rgb(51, 102, 153)')
    await expect(page.locator('.fo-output')).toContainText('HSL: hsl(210, 50%, 40%)')
})

test('debounces preview rendering while editing markdown textarea', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-06-18T12:00:00') })
    await page.goto('/tools/markdown-preview')
    await page.clock.runFor(300)

    await expect(page.locator('.markdown-preview h1')).toContainText('Useful Tools')
    await page.clock.pauseAt(new Date('2026-06-18T13:00:00'))

    await page.locator('textarea').fill('# Debounced Render')
    await expect(page.locator('textarea')).toHaveValue('# Debounced Render')

    await page.clock.runFor(275)
    expect(await page.locator('.markdown-preview h1').textContent()).toBe('Useful Tools')

    await page.clock.runFor(25)
    await expect(page.locator('.markdown-preview h1')).toContainText('Debounced Render')
})

test('uses grid background only for Mermaid preview', async ({ page }) => {
    await page.goto('/tools/mermaid-preview')

    const mermaidCanvasBackground = await page
        .locator('.preview-canvas')
        .evaluate((element) => getComputedStyle(element).backgroundImage)

    expect(mermaidCanvasBackground).toContain('linear-gradient')

    await page.goto('/tools/markdown-preview')

    const markdownBackground = await page
        .locator('.markdown-preview')
        .evaluate((element) => getComputedStyle(element).backgroundImage)

    expect(markdownBackground).toBe('none')
})

test('pans Mermaid preview by dragging the canvas', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/tools/mermaid-preview')

    await expect(page.locator('.mermaid-svg svg')).toBeVisible()

    const canvasBox = await page.locator('.preview-canvas').boundingBox()
    expect(canvasBox).not.toBeNull()

    await page.mouse.move(canvasBox.x + 120, canvasBox.y + 120)
    await page.mouse.down()
    await page.mouse.move(canvasBox.x + 200, canvasBox.y + 170)
    await page.mouse.up()

    await expect(page.locator('.mermaid-svg')).toHaveCSS(
        'transform',
        'matrix(1, 0, 0, 1, 80, 50)'
    )

    await page.getByRole('button', { name: 'Reset' }).click()

    await expect(page.locator('.mermaid-svg')).toHaveCSS(
        'transform',
        'matrix(1, 0, 0, 1, 0, 0)'
    )
})

test('uses Ant Design Splitter for a resizable workspace', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/tools/mermaid-preview')

    await expect(page.locator('.ant-splitter')).toBeVisible()
    await expect(page.locator('.ant-splitter-panel')).toHaveCount(2)

    const leftPanel = page.locator('.split-left')
    const dragger = page.locator('.ant-splitter .ant-splitter-bar-dragger').first()
    const initialBox = await leftPanel.boundingBox()
    const draggerBox = await dragger.boundingBox()

    expect(initialBox).not.toBeNull()
    expect(draggerBox).not.toBeNull()

    await page.mouse.move(
        draggerBox.x + draggerBox.width / 2,
        draggerBox.y + draggerBox.height / 2
    )
    await page.mouse.down()
    await page.mouse.move(draggerBox.x + 120, draggerBox.y + draggerBox.height / 2)
    await page.mouse.up()

    const resizedBox = await leftPanel.boundingBox()

    expect(resizedBox.width).toBeGreaterThan(initialBox.width + 40)
})

test('moves tool title and actions into the app header', async ({ page }) => {
    await page.goto('/tools/mermaid-preview')

    const header = page.locator('.app-header')

    await expect(header.getByRole('heading', { name: 'Mermaid Preview' })).toBeVisible()
    await expect(header.getByText('Write and preview Mermaid diagrams offline.')).toBeVisible()
    await expect(header.getByRole('button', { name: 'Open' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Copy' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Download' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Example' })).toBeVisible()
    await expect(page.locator('.tool-page .tool-header')).toHaveCount(0)
})

test('places brand in sidebar and tool header in main column', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/tools/mermaid-preview')

    const sidebar = page.locator('.app-sidebar')
    const main = page.locator('.app-main')
    const header = page.locator('.app-header')

    await expect(sidebar.getByText('Useful Tools')).toBeVisible()
    await expect(header.getByRole('heading', { name: 'Mermaid Preview' })).toBeVisible()
    await expect(header.locator('.mobile-header-row')).toBeHidden()

    const metrics = await page.evaluate(() => {
        const sidebarBox = document.querySelector('.app-sidebar')?.getBoundingClientRect()
        const mainBox = document.querySelector('.app-main')?.getBoundingClientRect()
        const headerBox = document.querySelector('.app-header')?.getBoundingClientRect()

        return {
            sidebarTop: sidebarBox?.top ?? -1,
            sidebarLeft: sidebarBox?.left ?? -1,
            mainLeft: mainBox?.left ?? -1,
            headerLeft: headerBox?.left ?? -1,
            headerTop: headerBox?.top ?? -1
        }
    })

    expect(metrics.sidebarTop).toBe(0)
    expect(metrics.sidebarLeft).toBe(0)
    expect(metrics.headerTop).toBe(0)
    expect(metrics.headerLeft).toBeGreaterThanOrEqual(metrics.mainLeft)
    expect(metrics.mainLeft).toBeGreaterThan(240)
})

test('uses a mobile header and drawer sidebar on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/tools/mermaid-preview')

    await expect(page.locator('.mobile-header-brand')).toContainText('Useful Tools')
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
    await expect(page.locator('.desktop-sidebar')).toBeHidden()

    await page.getByRole('button', { name: 'Open navigation' }).click()

    const drawer = page.locator('.ant-drawer')
    await expect(drawer).toBeVisible()
    await expect(drawer.getByText('Useful Tools')).toBeVisible()

    await drawer.getByRole('link', { name: /Markdown Preview/ }).click()

    await expect(page).toHaveURL(/\/tools\/markdown-preview$/)
    await expect(drawer).toBeHidden()
    await expect(page.locator('.mobile-header-brand')).toContainText('Useful Tools')
    await expect(page.locator('.app-header').getByRole('heading', { name: 'Markdown Preview' })).toBeVisible()
})

for (const viewport of breakpoints) {
    test(`keeps the workspace usable without horizontal overflow on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })

        for (const path of [
            '/tools/mermaid-preview',
            '/tools/markdown-preview',
            '/tools/json-formatter',
            '/tools/sql-formatter',
            '/tools/html-formatter',
            '/tools/css-formatter',
            '/tools/json-yaml-converter',
            '/tools/csv-json-converter',
            '/tools/timestamp-converter',
            '/tools/color-converter'
        ]) {
            await page.goto(path)

            await expect(page.locator('.app-shell')).toBeVisible()
            if (viewport.name === 'desktop') {
                await expect(page.locator('.desktop-sidebar')).toBeVisible()
            } else {
                await expect(page.locator('.desktop-sidebar')).toBeHidden()
                await expect(page.locator('.mobile-header-brand')).toBeVisible()
            }
            await expect(page.locator('.app-header')).toBeVisible()
            await expect(page.locator('.split-workspace')).toBeVisible()
            await expectNoPageOverflow(page)
            await expectEditorFillsLeftPanel(page)
        }
    })
}

// ── Phase 4: FormatterOutput enhanced output tests ──────────────────────────

test('formatter output shows line numbers', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"a":1,"b":2}')
    await page.getByRole('button', { name: 'Format' }).click()
    const lines = page.locator('.fo-line')
    await expect(lines.first()).toBeVisible()
    const lineCount = await lines.count()
    expect(lineCount).toBeGreaterThan(0)
    // Verify line numbers are tracked via data attribute
    const firstDataLineNum = await lines.first().getAttribute('data-line-num')
    expect(firstDataLineNum).toBe('1')
    const lastDataLineNum = await lines.nth(lineCount - 1).getAttribute('data-line-num')
    expect(lastDataLineNum).toBe(String(lineCount))
})

test('formatter output collapses and expands blocks', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"a":{"b":1}}')
    await page.getByRole('button', { name: 'Format' }).click()
    const toggle = page.locator('.fo-fold-toggle').first()
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.locator('.fo-folded')).toHaveCount(3)
    await toggle.click()
    await expect(page.locator('.fo-folded')).toHaveCount(0)
})

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

test('formatter output renders syntax-highlighted tokens', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"key":"value"}')
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.locator('.fo-output .token.string').first()).toBeVisible()
})






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

test('decodes JWT header and payload without verifying signatures', async ({ page }) => {
    await page.goto('/tools/jwt-decoder')

    await expect(page.getByRole('heading', { name: 'JWT Decoder' })).toBeVisible()

    await page.locator('textarea').fill('eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjMiLCJuYW1lIjoiVXNlZnVsIFRvb2xzIiwiaWF0IjoxNzY2MTAwMDAwfQ.')
    await page.getByRole('button', { name: 'Decode' }).click()

    await expect(page.locator('.fo-output')).toContainText('"alg": "none"')
    await expect(page.locator('.fo-output')).toContainText('"name": "Useful Tools"')
    await expect(page.getByText('Signature is decoded, not verified.')).toBeVisible()
})

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

test('generates SHA digests offline', async ({ page }) => {
    await page.goto('/tools/hash-generator')

    await expect(page.getByRole('heading', { name: 'Hash Generator' })).toBeVisible()

    await page.locator('textarea').fill('Useful Tools')
    await page.getByText('SHA-512').click()
    await page.getByRole('button', { name: 'Generate Hashes' }).click()

    await expect(page.locator('.fo-output')).toContainText('SHA-512')
    await expect(page.locator('.fo-output')).not.toContainText('SHA-256')
})
