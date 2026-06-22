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
        const toolbar = document.querySelector('.split-left .tool-function-bar')?.getBoundingClientRect()
        const editor = document.querySelector('.tool-editor')?.getBoundingClientRect()

        return {
            panelHeight: panel?.height ?? 0,
            toolbarHeight: toolbar?.height ?? 0,
            editorHeight: editor?.height ?? 0,
            panelWidth: panel?.width ?? 0,
            editorWidth: editor?.width ?? 0
        }
    })

    expect(layout.editorHeight + layout.toolbarHeight).toBeGreaterThanOrEqual(layout.panelHeight - 2)
    expect(layout.editorWidth).toBeGreaterThanOrEqual(layout.panelWidth - 2)
}


test('uses slim scrollbars across app scroll containers', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'webkit scrollbar styling is only observable in Chromium')

    await page.goto('/tools/text-diff')

    const styles = await page.locator('.app-sidebar').evaluate((element) => {
        const root = getComputedStyle(document.documentElement)
        const sidebar = getComputedStyle(element)
        const scrollbar = getComputedStyle(element, '::-webkit-scrollbar')
        const thumb = getComputedStyle(element, '::-webkit-scrollbar-thumb')

        return {
            rootWidth: root.scrollbarWidth,
            sidebarWidth: sidebar.scrollbarWidth,
            webkitWidth: scrollbar.width,
            webkitHeight: scrollbar.height,
            thumbColor: thumb.backgroundColor
        }
    })

    expect(styles.rootWidth).toBe('thin')
    expect(styles.sidebarWidth).toBe('thin')
    expect(Number.parseFloat(styles.webkitWidth)).toBeLessThanOrEqual(6)
    expect(Number.parseFloat(styles.webkitHeight)).toBeLessThanOrEqual(6)
    expect(styles.thumbColor).not.toBe('rgba(0, 0, 0, 0)')
})

test('opens the default Mermaid tool and renders a diagram', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/tools\/mermaid-preview$/)
    await expect(page.getByRole('heading', { name: 'Mermaid Preview' })).toBeVisible()

    await page.locator('textarea').fill('graph TD\n    A[Input] --> B[Preview]')

    await expect(page.locator('.mermaid-svg svg')).toBeVisible()
})

test('Mermaid Preview updates URL hash on edit and loads state from URL hash', async ({ page }) => {
    await page.goto('/tools/mermaid-preview')

    // Fill textarea
    await page.locator('textarea').fill('graph TD\n    A[Test URL Share] --> B[Works]')

    // Wait for the preview SVG to render the new value (ensuring debounced state has updated)
    await expect(page.locator('.mermaid-svg')).toContainText('Test URL Share')

    // Wait for the URL to contain `#pako:`
    await expect(page).toHaveURL(/#pako:/)
    const sharedUrl = page.url()

    // Now navigate to a different tool to reset state
    await page.goto('/tools/json-formatter')
    await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible()

    // Now go back directly to the sharedUrl
    await page.goto(sharedUrl)
    await expect(page.getByRole('heading', { name: 'Mermaid Preview' })).toBeVisible()

    // Verify textarea has the loaded value
    await expect(page.locator('textarea')).toHaveValue('graph TD\n    A[Test URL Share] --> B[Works]')
})

test('Mermaid Preview handles theme sync and Share button copy action', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/tools/mermaid-preview')

    // Change theme to Dark
    await page.getByText('Dark', { exact: true }).click()

    // Fill textarea
    await page.locator('textarea').fill('graph TD\n    A --> B')

    // Wait for the preview SVG to update (old default text gone)
    await expect(page.locator('.mermaid-svg')).not.toContainText('Open Useful Tools')

    // Wait for URL hash
    await expect(page).toHaveURL(/#pako:/)
    const sharedUrl = page.url()

    // Click Share button
    await page.getByRole('button', { name: 'Share' }).click()

    // Verify toast message
    await expect(page.locator('.ant-message-success')).toContainText('Đã sao chép liên kết chia sẻ.')

    // Verify clipboard value matches URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe(sharedUrl)

    // Load the URL in a new context or navigate directly
    await page.goto(sharedUrl)
    await expect(page.locator('.ant-radio-button-wrapper-checked')).toContainText('Dark')
    await expect(page.locator('textarea')).toHaveValue('graph TD\n    A --> B')
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
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('JSON to YAML').click()
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('name: Useful Tools')
    await expect(page.locator('.fo-output')).toContainText('- offline')
})

test('converts YAML to JSON offline', async ({ page }) => {
    await page.goto('/tools/json-yaml-converter')
    await page.locator('textarea').fill('name: Useful Tools\nenabled: true\ncount: 3')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('YAML to JSON').click()
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('"enabled": true')
    await expect(page.locator('.fo-output')).toContainText('"count": 3')
})

test('converts CSV to JSON offline', async ({ page }) => {
    await page.goto('/tools/csv-json-converter')
    await page.locator('textarea').fill('name,count\nUseful Tools,4\nOffline,1')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('CSV to JSON').click()
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('"name": "Useful Tools"')
    await expect(page.locator('.fo-output')).toContainText('"count": "4"')
})

test('converts JSON array to CSV offline', async ({ page }) => {
    await page.goto('/tools/csv-json-converter')
    await page.locator('textarea').fill('[{"name":"Useful Tools","count":4},{"name":"Offline","count":1}]')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('JSON to CSV').click()
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('name,count')
    await expect(page.locator('.fo-output')).toContainText('Useful Tools,4')
})

test('converts unix seconds to ISO date offline', async ({ page }) => {
    await page.goto('/tools/timestamp-converter')
    await page.locator('textarea').fill('1704067200')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Timestamp to Date').click()
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('2024-01-01T00:00:00.000Z')
})

test('converts ISO date to unix timestamps offline', async ({ page }) => {
    await page.goto('/tools/timestamp-converter')
    await page.locator('textarea').fill('2024-01-01T00:00:00.000Z')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Date to Timestamp').click()
    await page.getByRole('button', { name: 'Convert' }).click()
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

test('Markdown Preview updates URL hash on edit and loads state from URL hash', async ({ page }) => {
    await page.goto('/tools/markdown-preview')

    // Fill textarea
    await page.locator('textarea').fill('# Test Markdown Share\n\n- Bullet 1\n- Bullet 2')

    // Wait for the preview to render the new value (ensuring debounced state has updated)
    await expect(page.locator('.markdown-preview h1')).toContainText('Test Markdown Share')

    // Wait for the URL to contain `#pako:`
    await expect(page).toHaveURL(/#pako:/)
    const sharedUrl = page.url()

    // Now navigate to a different tool to reset state
    await page.goto('/tools/json-formatter')
    await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible()

    // Now go back directly to the sharedUrl
    await page.goto(sharedUrl)
    await expect(page.getByRole('heading', { name: 'Markdown Preview' })).toBeVisible()

    // Verify textarea has the loaded value
    await expect(page.locator('textarea')).toHaveValue('# Test Markdown Share\n\n- Bullet 1\n- Bullet 2')
})

test('Markdown Preview handles lineBreaks state sync and Share button copy action', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/tools/markdown-preview')

    // Toggle line breaks
    await page.getByLabel('Line breaks').check()

    // Fill textarea
    await page.locator('textarea').fill('First line\nSecond line')

    // Wait for URL hash
    await expect(page).toHaveURL(/#pako:/)
    const sharedUrl = page.url()

    // Click Share button
    await page.getByRole('button', { name: 'Share' }).click()

    // Verify toast message
    await expect(page.locator('.ant-message-success')).toContainText('Đã sao chép liên kết chia sẻ.')

    // Verify clipboard value matches URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe(sharedUrl)

    // Load the URL in a new context or navigate directly
    await page.goto(sharedUrl)
    await expect(page.getByLabel('Line breaks')).toBeChecked()
    await expect(page.locator('textarea')).toHaveValue('First line\nSecond line')
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



test('shows line numbers beside JSON compare editors', async ({ page }) => {
    await page.goto('/tools/json-compare')

    const firstEditor = page.locator('.json-compare-editor-panel').first()
    await firstEditor.locator('textarea').fill(`{
  "name": "Useful Tools"
}`)

    await expect(firstEditor.locator('.fi-line')).toHaveCount(3)
    await expect(firstEditor.locator('.fi-line').first()).toHaveAttribute('data-line-num', '1')
    await expect(firstEditor.locator('.fi-line').nth(2)).toHaveAttribute('data-line-num', '3')

    const metrics = await firstEditor.evaluate((element) => {
        const firstLine = element
            .querySelector('.fi-line')
            ?.getBoundingClientRect()
        const textarea = element
            .querySelector('textarea')
            ?.getBoundingClientRect()

        return {
            lineLeft: firstLine?.left ?? 0,
            textareaLeft: textarea?.left ?? 0
        }
    })

    expect(metrics.lineLeft).toBeGreaterThanOrEqual(metrics.textareaLeft)
})

test('lays out JSON compare without splitter and gives results 45 percent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/tools/json-compare')

    await expect(page.locator('.json-compare-workspace')).toBeVisible()
    await expect(page.locator('.json-compare-results-panel')).toBeVisible()
    await expect(page.locator('.json-compare-page .ant-splitter')).toHaveCount(0)
    await expect(page.locator('.json-compare-page .split-workspace')).toHaveCount(0)

    const metrics = await page.evaluate(() => {
        const workspace = document.querySelector('.json-compare-workspace')?.getBoundingClientRect()
        const results = document.querySelector('.json-compare-results-panel')?.getBoundingClientRect()

        return {
            workspaceWidth: workspace?.width ?? 0,
            resultsWidth: results?.width ?? 0
        }
    })

    expect(metrics.resultsWidth / metrics.workspaceWidth).toBeCloseTo(0.45, 1)
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


// ── FormatterInput shared editor tests ───────────────────────────────────────

test('formatter input shows line numbers and keeps textarea editing', async ({ page }) => {
    await page.goto('/tools/html-formatter')
    const editor = page.locator('.formatter-input').first()
    await page.locator('textarea').fill('<main>\n  <h1>Useful Tools</h1>\n</main>')

    await expect(editor.locator('.fi-line')).toHaveCount(3)
    await expect(editor.locator('.fi-line').first()).toHaveAttribute('data-line-num', '1')
    await expect(page.locator('textarea')).toHaveValue('<main>\n  <h1>Useful Tools</h1>\n</main>')
})

test('formatter input search opens on Ctrl+F and highlights matches', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"name":"Useful Tools","items":[1,2]}')
    await page.locator('.formatter-input').press('Control+f')

    await expect(page.locator('.fi-search-bar')).toBeVisible()
    await page.locator('.fi-search-input').fill('items')
    await expect(page.locator('.fi-match')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('.fi-search-bar')).not.toBeVisible()
})



test('formatter input search highlight uses strong colors', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"name":"Useful Tools","items":[1,2]}')
    await page.locator('.formatter-input').press('Control+f')
    await page.locator('.fi-search-input').fill('items')
    await expect(page.locator('.fi-match')).toHaveCount(1)

    const colors = await page.locator('.fi-match').first().evaluate((node) => {
        const style = window.getComputedStyle(node)
        return {
            background: style.backgroundColor,
            color: style.color,
            fontWeight: style.fontWeight,
        }
    })

    expect(colors.background).toBe('rgb(120, 53, 15)')
    expect(colors.color).toBe('rgb(255, 255, 255)')
    expect(Number(colors.fontWeight)).toBeGreaterThanOrEqual(700)
})

test('formatter input search debounces highlights by 200ms', async ({ page }) => {
    await page.clock.install()
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"name":"Useful Tools","items":[1,2]}')
    await page.locator('.formatter-input').press('Control+f')
    await page.locator('.fi-search-input').fill('items')

    expect(await page.locator('.fi-match').count()).toBe(0)
    await page.clock.fastForward(100)
    expect(await page.locator('.fi-match').count()).toBe(0)
    await page.clock.fastForward(100)
    await expect(page.locator('.fi-match')).toHaveCount(1)
})

test('formatter input renders syntax-highlighted tokens', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"key":"value"}')
    await expect(page.locator('.formatter-input-highlight .token.string').first()).toBeVisible()
})

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
    { path: '/tools/jwt-decoder', heading: 'JWT Decoder' }
]

const generatorRoutes = [
    { path: '/tools/hash-generator', heading: 'Hash Generator' },
    { path: '/tools/uuid-generator', heading: 'UUID Generator' },
    { path: '/tools/password-generator', heading: 'Password Generator' },
    { path: '/tools/jwt-secret-generator', heading: 'JWT Secret Generator' },
    { path: '/tools/fake-data-generator', heading: 'Fake Data Generator' }
]

for (const route of [...encoderDecoderRoutes, ...generatorRoutes]) {
    for (const breakpoint of breakpoints) {
        test(`${route.heading} has no page overflow at ${breakpoint.name}`, async ({ page }) => {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
            await page.goto(route.path)

            await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
            await expectNoPageOverflow(page)
        })
    }
}


const phaseTwoFormatterRoutes = [
    { path: '/tools/yaml-preview', heading: 'YAML Preview' },
    { path: '/tools/xml-formatter', heading: 'XML Formatter' },
    { path: '/tools/json-compare', heading: 'JSON Compare' }
]

for (const route of phaseTwoFormatterRoutes) {
    for (const breakpoint of breakpoints) {
        test(`${route.heading} has no page overflow at ${breakpoint.name}`, async ({ page }) => {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
            await page.goto(route.path)

            await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
            await expectNoPageOverflow(page)
        })
    }
}


test('groups generator tools together in the sidebar', async ({ page }) => {
    await page.goto('/tools/hash-generator')

    const generatorGroup = page.locator('.app-sidebar').getByRole('heading', { name: 'Generator', exact: true })
    await expect(generatorGroup).toBeVisible()

    const sidebar = page.locator('.app-sidebar')
    await expect(sidebar.getByRole('link', { name: 'Hash Generator' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'UUID Generator' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Password Generator' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'JWT Secret Generator' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Fake Data Generator' })).toBeVisible()
})

test('encodes and decodes Base64 with Unicode text offline', async ({ page }) => {
    await page.goto('/tools/base64-encoder-decoder')

    await expect(page.getByRole('heading', { name: 'Base64 Encoder Decoder' })).toBeVisible()

    await page.locator('textarea').fill('Hello Useful Tools — Xin chào')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Encode').click()
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(page.locator('.fo-output')).toContainText('SGVsbG8gVXNlZnVsIFRvb2xzIOKAlCBYaW4gY2jDoG8=')

    await page.locator('textarea').fill('SGVsbG8gVXNlZnVsIFRvb2xzIOKAlCBYaW4gY2jDoG8=')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Decode').click()
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(page.locator('.fo-output')).toContainText('Hello Useful Tools — Xin chào')
})

test('encodes and decodes URL components offline', async ({ page }) => {
    await page.goto('/tools/url-encoder-decoder')

    await expect(page.getByRole('heading', { name: 'URL Encoder Decoder' })).toBeVisible()

    await page.locator('textarea').fill('https://example.test/search?q=hello tools&lang=vi')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Encode').click()
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(page.locator('.fo-output')).toContainText('https%3A%2F%2Fexample.test%2Fsearch%3Fq%3Dhello%20tools%26lang%3Dvi')

    await page.locator('textarea').fill('https%3A%2F%2Fexample.test%2Fsearch%3Fq%3Dhello%20tools%26lang%3Dvi')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Decode').click()
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(page.locator('.fo-output')).toContainText('https://example.test/search?q=hello tools&lang=vi')
})

test('encodes and decodes HTML entities offline', async ({ page }) => {
    await page.goto('/tools/html-entity-encoder-decoder')

    await expect(page.getByRole('heading', { name: 'HTML Entity Encoder Decoder' })).toBeVisible()

    await page.locator('textarea').fill('<p title="Useful & calm">Xin chào</p>')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Encode').click()
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(page.locator('.fo-output')).toContainText('&lt;p title=&quot;Useful &amp; calm&quot;&gt;Xin chào&lt;/p&gt;')

    await page.locator('textarea').fill('&lt;p&gt;Useful &amp; offline&lt;/p&gt;')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Decode').click()
    await page.getByRole('button', { name: 'Run' }).click()

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






test('wraps long formatter output tokens without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/tools/jwt-decoder')

    const toBase64Url = (value) => btoa(value).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const token = [
        toBase64Url('{"alg":"HS256","typ":"JWT"}'),
        toBase64Url('{"sub":"1234567890","name":"Useful Tools"}'),
        's'.repeat(360),
    ].join('.')
    await page.locator('textarea').fill(token)
    await page.getByRole('button', { name: 'Decode' }).click()

    const outputWrap = page.locator('.formatter-output-wrap')
    await expect(outputWrap).toContainText('s'.repeat(120))

    const metrics = await outputWrap.evaluate((node) => ({
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
    }))

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1)
})


test('wraps long formatter input tokens without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/tools/json-formatter')

    const longValue = `{"token":"${'x'.repeat(360)}"}`
    await page.locator('textarea').fill(longValue)

    const inputWrap = page.locator('.formatter-input').first()
    await expect(inputWrap).toContainText('x'.repeat(120))

    const metrics = await inputWrap.evaluate((node) => ({
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        textareaClientWidth: node.querySelector('textarea')?.clientWidth ?? 0,
        textareaScrollWidth: node.querySelector('textarea')?.scrollWidth ?? 0,
    }))

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1)
    expect(metrics.textareaScrollWidth).toBeLessThanOrEqual(metrics.textareaClientWidth + 1)
})

test('header actions do not repeat options from the function bar', async ({ page }) => {
    const cases = [
        { path: '/tools/base64-encoder-decoder', duplicates: ['Encode', 'Decode'] },
        { path: '/tools/url-encoder-decoder', duplicates: ['Encode', 'Decode', 'Pretty Query'] },
        { path: '/tools/html-entity-encoder-decoder', duplicates: ['Encode', 'Decode'] },
        { path: '/tools/json-yaml-converter', duplicates: ['JSON to YAML', 'YAML to JSON'] },
        { path: '/tools/csv-json-converter', duplicates: ['CSV to JSON', 'JSON to CSV'] },
        { path: '/tools/timestamp-converter', duplicates: ['Timestamp to Date', 'Date to Timestamp'] }
    ]

    for (const item of cases) {
        await page.goto(item.path)
        const header = page.locator('.app-header')
        for (const duplicate of item.duplicates) {
            await expect(header.getByRole('button', { name: duplicate })).toHaveCount(0)
        }
    }
})

test('base64 options choose decode mode from the function bar', async ({ page }) => {
    await page.goto('/tools/base64-encoder-decoder')
    await page.locator('textarea').fill('VXNlZnVsIFRvb2xz')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Decode').click()
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.locator('.fo-output')).toContainText('Useful Tools')
})

test('url options decode plus signs as spaces when enabled', async ({ page }) => {
    await page.goto('/tools/url-encoder-decoder')
    await page.locator('textarea').fill('Useful+Tools')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('Decode').click()
    await page.getByLabel('Plus as space').check()
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.locator('.fo-output')).toContainText('Useful Tools')
})

test('html entity options choose numeric entity encoding', async ({ page }) => {
    await page.goto('/tools/html-entity-encoder-decoder')
    await page.locator('textarea').fill('<div>Useful</div>')
    await page.getByText('Numeric').click()
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.locator('.fo-output')).toContainText('&#60;div&#62;Useful&#60;/div&#62;')
})

test('json formatter options sort keys and use selected spacing', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.locator('textarea').fill('{"b":1,"a":2}')
    await page.getByLabel('Sort keys').check()
    await page.getByText('2 spaces').click()
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.locator('.fo-output')).toContainText('"a": 2')
})

test('sql formatter options change keyword case', async ({ page }) => {
    await page.goto('/tools/sql-formatter')
    await page.locator('textarea').fill('select * from users')
    await page.getByText('lowercase').click()
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.locator('.fo-output')).toContainText('select')
    await expect(page.locator('.fo-output')).not.toContainText('SELECT')
})

test('json yaml converter options choose yaml to json', async ({ page }) => {
    await page.goto('/tools/json-yaml-converter')
    await page.locator('textarea').fill('name: Useful Tools')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('YAML to JSON').click()
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('"name": "Useful Tools"')
})

test('csv json converter options use semicolon delimiter', async ({ page }) => {
    await page.goto('/tools/csv-json-converter')
    await page.locator('textarea').fill('name;type\nUseful Tools;offline')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('CSV to JSON').click()
    await page.getByLabel('Delimiter').fill(';')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('"type": "offline"')
})

test('timestamp converter options read milliseconds', async ({ page }) => {
    await page.goto('/tools/timestamp-converter')
    await page.locator('textarea').fill('1766100000000')
    await page.getByText('Milliseconds').click()
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('.fo-output')).toContainText('2025')
})

test('color converter options output only hsl', async ({ page }) => {
    await page.goto('/tools/color-converter')
    await page.locator('textarea').fill('#336699')
    await page.getByRole('toolbar', { name: 'Input options' }).getByText('HSL').click()
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('.fo-output')).toContainText('hsl')
    await expect(page.locator('.fo-output')).not.toContainText('RGB:')
})



test('mermaid preview options switch theme', async ({ page }) => {
    await page.goto('/tools/mermaid-preview')
    const toolbar = page.getByRole('toolbar', { name: 'Input options' })
    await toolbar.getByText('Dark').click()
    await expect(toolbar.getByText('Dark')).toBeVisible()
})

test('markdown preview options show line breaks control', async ({ page }) => {
    await page.goto('/tools/markdown-preview')
    await page.getByLabel('Line breaks').check()
    await expect(page.getByLabel('Line breaks')).toBeChecked()
})

test('jwt decoder options show payload only', async ({ page }) => {
    await page.goto('/tools/jwt-decoder')
    await page.getByText('Payload only').click()
    await page.locator('textarea').fill('eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjMifQ.')
    await page.getByRole('button', { name: 'Decode' }).click()
    await expect(page.locator('.fo-output')).toContainText('"sub": "123"')
    await expect(page.locator('.fo-output')).not.toContainText('"alg": "none"')
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


test('generates UUID values offline', async ({ page }) => {
    await page.goto('/tools/uuid-generator')

    await expect(page.getByRole('heading', { name: 'UUID Generator' })).toBeVisible()
    await page.getByLabel('Count').fill('3')
    await page.getByRole('main').getByRole('button', { name: 'Generate UUIDs' }).click()

    const output = page.locator('.fo-output')
    await expect(output).toContainText(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)

    const uuids = await output.locator('.fo-code').evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()).filter(Boolean))
    expect(uuids).toHaveLength(3)
    expect(new Set(uuids).size).toBe(3)
})

test('generates configurable passwords offline', async ({ page }) => {
    await page.goto('/tools/password-generator')

    await expect(page.getByRole('heading', { name: 'Password Generator' })).toBeVisible()
    await page.getByLabel('Length').fill('24')
    await page.getByLabel('Include symbols').check()
    await page.getByRole('main').getByRole('button', { name: 'Generate Password' }).click()

    await expect.poll(async () => (await page.locator('.fo-code').textContent()).trim()).toHaveLength(24)
    const password = (await page.locator('.fo-code').textContent()).trim()
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
})

test('generates JWT secrets offline', async ({ page }) => {
    await page.goto('/tools/jwt-secret-generator')

    await expect(page.getByRole('heading', { name: 'JWT Secret Generator' })).toBeVisible()
    await page.getByLabel('Bytes').fill('48')
    await page.getByRole('main').getByRole('button', { name: 'Generate Secret' }).click()

    await expect.poll(async () => (await page.locator('.fo-output').textContent()).trim()).toMatch(/^[A-Za-z0-9_-]+$/)
    const secret = (await page.locator('.fo-output').textContent()).trim()
    expect(secret.length).toBeGreaterThanOrEqual(64)
})

test('generates fake data records offline', async ({ page }) => {
    await page.goto('/tools/fake-data-generator')

    await expect(page.getByRole('heading', { name: 'Fake Data Generator' })).toBeVisible()
    await page.getByLabel('Records').fill('2')
    await page.getByRole('main').getByRole('button', { name: 'Generate Data' }).click()

    const output = page.locator('.fo-output')
    await expect(output).toContainText('"id"')
    await expect(output).toContainText('"name"')
    await expect(output).toContainText('"email"')

    const jsonText = await output.locator('.fo-code').evaluateAll((nodes) => nodes.map((node) => node.textContent).join('\n'))
    const records = JSON.parse(jsonText)
    expect(records).toHaveLength(2)
    expect(records[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String), email: expect.any(String) }))
})


test('word character counter reports live text metrics', async ({ page }) => {
    await page.goto('/tools/word-character-counter')

    await expect(page.getByRole('heading', { name: 'Word Character Counter' })).toBeVisible()

    const editor = page.locator('textarea').first()
    await editor.fill('Hello world\n\nXin chao Useful Tools')

    await expect(page.getByText('Characters', { exact: true })).toBeVisible()
    await expect(page.getByTestId('stat-characters')).toHaveText('34')
    await expect(page.getByText('Characters without spaces')).toBeVisible()
    await expect(page.getByTestId('stat-characters-no-spaces')).toHaveText('28')
    await expect(page.getByText('Words', { exact: true })).toBeVisible()
    await expect(page.getByTestId('stat-words')).toHaveText('6')
    await expect(page.getByText('Lines', { exact: true })).toBeVisible()
    await expect(page.getByTestId('stat-lines')).toHaveText('3')
    await expect(page.getByText('Paragraphs', { exact: true })).toBeVisible()
    await expect(page.getByTestId('stat-paragraphs')).toHaveText('2')
})

test('sort lines sorts text with options', async ({ page }) => {
    await page.goto('/tools/sort-lines')

    await expect(page.getByRole('heading', { name: 'Sort Lines' })).toBeVisible()

    const editor = page.locator('textarea').first()
    await editor.fill('banana\nApple\n\ncherry')

    await page.getByLabel('Remove empty lines').check()
    await page.getByLabel('Case insensitive').check()
    await page.getByRole('button', { name: 'Sort' }).click()

    await expect(page.locator('.fo-output')).toContainText('Apple')
    const outputText = await page.locator('.fo-code').evaluateAll((nodes) => nodes.map((node) => node.textContent).join('\n'))
    expect(outputText).toBe('Apple\nbanana\ncherry')
})

test('remove duplicate lines preserves first occurrence and shows summary', async ({ page }) => {
    await page.goto('/tools/remove-duplicate-lines')

    await expect(page.getByRole('heading', { name: 'Remove Duplicate Lines' })).toBeVisible()

    const editor = page.locator('textarea').first()
    await editor.fill('Alpha\nbeta\nalpha\n\nBETA')

    await page.getByLabel('Ignore case').check()
    await page.getByLabel('Remove empty lines').check()
    await page.getByRole('button', { name: 'Remove Duplicates' }).click()

    await expect(page.locator('.fo-output')).toContainText('Alpha')
    const outputText = await page.locator('.fo-code').evaluateAll((nodes) => nodes.map((node) => node.textContent).join('\n'))
    expect(outputText).toBe('Alpha\nbeta')
    await expect(page.getByText('Removed 3 duplicate/empty lines')).toBeVisible()
})

test('case converter converts text to multiple cases', async ({ page }) => {
    await page.goto('/tools/case-converter')

    await expect(page.getByRole('heading', { name: 'Case Converter' })).toBeVisible()

    const editor = page.locator('textarea').first()
    await editor.fill('hello useful tools')

    await page.getByLabel('Mode').click()
    await page.getByText('Pascal Case').click()
    await page.getByRole('button', { name: 'Convert' }).click()

    await expect(page.locator('.fo-code')).toHaveText('HelloUsefulTools')
})


test('text diff uses dedicated layout without splitter overflow on short text', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/tools/text-diff')

    await expect(page.locator('.split-workspace')).toHaveCount(0)
    await expect(page.locator('.text-diff-workspace')).toBeVisible()

    const editors = page.locator('textarea')
    await editors.nth(0).fill('a')
    await editors.nth(1).fill('b')
    await page.getByRole('button', { name: 'Compare' }).click()

    const metrics = await page.locator('.text-diff-workspace').evaluate((node) => ({
        workspaceWidth: node.clientWidth,
        workspaceScrollWidth: node.scrollWidth,
        pageWidth: document.documentElement.clientWidth,
        pageScrollWidth: document.documentElement.scrollWidth,
    }))

    expect(metrics.workspaceScrollWidth).toBeLessThanOrEqual(metrics.workspaceWidth + 1)
    expect(metrics.pageScrollWidth).toBeLessThanOrEqual(metrics.pageWidth + 1)
})

test('text diff shows added and removed lines', async ({ page }) => {
    await page.goto('/tools/text-diff')

    await expect(page.getByRole('heading', { name: 'Text Diff' })).toBeVisible()

    const editors = page.locator('textarea')
    await editors.nth(0).fill('alpha\nbeta\ngamma')
    await editors.nth(1).fill('alpha\nbeta changed\ngamma\ndelta')

    await page.getByRole('button', { name: 'Compare' }).click()

    await expect(page.getByText('- beta')).toBeVisible()
    await expect(page.getByText('+ beta changed')).toBeVisible()
    await expect(page.getByText('+ delta')).toBeVisible()
})

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
            await expectNoHorizontalOverflow(page)
        }
    })
}


test('regex tester highlights matches and previews replacement', async ({ page }) => {
    await page.goto('/tools/regex-tester')

    await expect(page.getByRole('heading', { name: 'Regex Tester' })).toBeVisible()
    await page.getByLabel('Pattern').fill('(user)@(example)\\.com')
    await page.getByLabel('Flags').fill('gi')
    await page.getByLabel('Replacement').fill('$1@test.dev')
    await page.locator('textarea').fill('user@example.com\nUSER@example.com')
    await page.getByRole('button', { name: 'Test Regex' }).click()

    await expect(page.getByText('2 matches')).toBeVisible()
    await expect(page.getByText('Group 1: user', { exact: true })).toBeVisible()
    await expect(page.getByText('user@test.dev')).toBeVisible()
})

test('cron expression helper explains schedule and lists next runs', async ({ page }) => {
    await page.goto('/tools/cron-expression-helper')

    await expect(page.getByRole('heading', { name: 'Cron Expression Helper' })).toBeVisible()
    await page.getByLabel('Cron expression').fill('*/15 9-17 * * 1-5')
    await page.getByRole('button', { name: 'Explain Cron' }).click()

    await expect(page.getByText('Every 15 minutes')).toBeVisible()
    await expect(page.getByText('09:00 through 17:59')).toBeVisible()
    await expect(page.getByText('Monday through Friday')).toBeVisible()
    await expect(page.getByTestId('cron-next-runs').locator('li')).toHaveCount(10)
})

test('mime type lookup finds extensions and media types offline', async ({ page }) => {
    await page.goto('/tools/mime-type-lookup')

    await expect(page.getByRole('heading', { name: 'MIME Type Lookup' })).toBeVisible()
    await page.getByLabel('Search MIME').fill('json')

    await expect(page.getByText('.json')).toBeVisible()
    await expect(page.getByText('application/json')).toBeVisible()
    await expect(page.getByText('JavaScript Object Notation')).toBeVisible()
})

test('url parser splits and rebuilds URLs', async ({ page }) => {
    await page.goto('/tools/url-parser')

    await expect(page.getByRole('heading', { name: 'URL Parser' })).toBeVisible()
    await page.locator('textarea').fill('https://example.com:8080/docs?q=tools&lang=vi#intro')
    await page.getByRole('button', { name: 'Parse URL' }).click()

    await expect(page.getByText('Protocol')).toBeVisible()
    await expect(page.getByText('https:', { exact: true })).toBeVisible()
    await expect(page.getByText('example.com', { exact: true })).toBeVisible()
    await expect(page.getByText('8080', { exact: true })).toBeVisible()
    await expect(page.getByText('/docs', { exact: true })).toBeVisible()
    await expect(page.getByText('q = tools')).toBeVisible()
    await expect(page.getByText('lang = vi')).toBeVisible()
    await expect(page.getByText('#intro', { exact: true })).toBeVisible()
    await expect(page.locator('.split-right').getByText('https://example.com:8080/docs?q=tools&lang=vi#intro')).toBeVisible()
})


async function selectAntdOption(page, selectId, option) {
    await page.locator(`.ant-select:has(#${selectId})`).click()
    await page.locator(`.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option[title="${option}"]`).last().click()
}

test('unit converter converts common units offline', async ({ page }) => {
    await page.goto('/tools/unit-converter')
    await expect(page.getByRole('heading', { name: 'Unit Converter' })).toBeVisible()
    await page.getByLabel('Value').fill('1000')
    await expect(page.locator('select#unit-category')).toHaveCount(0)
    await expect(page.locator('.ant-select:has(#unit-category)')).toBeVisible()
    await expect(page.locator('select#unit-from')).toHaveCount(0)
    await expect(page.locator('.ant-select:has(#unit-from)')).toBeVisible()
    await expect(page.locator('select#unit-to')).toHaveCount(0)
    await expect(page.locator('.ant-select:has(#unit-to)')).toBeVisible()
    await selectAntdOption(page, 'unit-category', 'Length')
    await selectAntdOption(page, 'unit-from', 'Meter')
    await selectAntdOption(page, 'unit-to', 'Kilometer')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.getByText('1 Kilometer')).toBeVisible()
})

test('number base converter converts decimal to other bases', async ({ page }) => {
    await page.goto('/tools/number-base-converter')
    await expect(page.getByRole('heading', { name: 'Number Base Converter' })).toBeVisible()
    await page.getByLabel('Number').fill('255')
    await expect(page.locator('select#input-base')).toHaveCount(0)
    await expect(page.locator('.ant-select:has(#input-base)')).toBeVisible()
    await selectAntdOption(page, 'input-base', 'Decimal')
    await page.getByRole('button', { name: 'Convert Number' }).click()
    await expect(page.getByRole('heading', { name: 'Binary' })).toBeVisible()
    await expect(page.getByText('11111111')).toBeVisible()
    await expect(page.locator('.split-right').getByText('FF', { exact: true })).toBeVisible()
})

test('escape unescape converts JSON strings', async ({ page }) => {
    await page.goto('/tools/escape-unescape')
    await expect(page.getByRole('heading', { name: 'Escape / Unescape' })).toBeVisible()
    await expect(page.locator('select#escape-mode')).toHaveCount(0)
    await expect(page.locator('.ant-select:has(#escape-mode)')).toBeVisible()
    await expect(page.locator('select#escape-direction')).toHaveCount(0)
    await expect(page.locator('.ant-select:has(#escape-direction)')).toBeVisible()
    await selectAntdOption(page, 'escape-mode', 'JSON string')
    await selectAntdOption(page, 'escape-direction', 'Escape')
    await page.locator('textarea').fill('Hello "Useful" Tools')
    await page.getByRole('button', { name: 'Run Escape' }).click()
    await expect(page.locator('.fo-code')).toHaveText('Hello \\"Useful\\" Tools')
})



test('YAML formatter input stays between toolbar and footer', async ({ page }) => {
    await page.setViewportSize({ width: 633, height: 411 })
    await page.goto('/tools/yaml-preview')
    await page.waitForSelector('.yaml-editor-panel .formatter-input')

    const metrics = await page.evaluate(() => {
        const toolbar = document.querySelector('.yaml-editor-panel .tool-function-bar').getBoundingClientRect()
        const editor = document.querySelector('.yaml-editor-panel .formatter-input').getBoundingClientRect()
        const panel = document.querySelector('.yaml-editor-panel').getBoundingClientRect()
        const footer = document.querySelector('.app-footer').getBoundingClientRect()

        return {
            toolbarBottom: toolbar.bottom,
            editorTop: editor.top,
            editorBottom: editor.bottom,
            panelBottom: panel.bottom,
            footerTop: footer.top
        }
    })

    expect(metrics.editorTop).toBeGreaterThanOrEqual(metrics.toolbarBottom - 1)
    expect(metrics.panelBottom).toBeLessThanOrEqual(metrics.footerTop + 1)
    expect(metrics.editorBottom).toBeLessThanOrEqual(metrics.panelBottom + 1)
})

test('YAML Preview renders OpenAPI docs offline', async ({ page }) => {
    await page.goto('/tools/yaml-preview')

    await expect(page.getByRole('heading', { name: 'YAML Preview' })).toBeVisible()

    await page.locator('textarea').fill(`openapi: 3.0.3
info:
  title: Useful Tools API
  version: 1.0.0
servers:
  - url: https://api.example.test
paths:
  /tools:
    get:
      summary: List tools
      responses:
        '200':
          description: Tool list`)

    await expect(page.locator('.swagger-ui')).toContainText('Useful Tools API')
    await expect(page.locator('.swagger-ui')).toContainText('https://api.example.test')
    await expect(page.locator('.swagger-ui')).toContainText('GET')
    await expect(page.locator('.swagger-ui')).toContainText('/tools')
    await expect(page.locator('.swagger-ui')).toContainText('200')
    await expect(page.getByRole('button', { name: /Try it out/i })).toBeVisible()
    await expect(page.locator('.yaml-preview-page .split-workspace')).toHaveCount(0)
})

test('YAML Preview renders generic YAML tree offline', async ({ page }) => {
    await page.goto('/tools/yaml-preview')

    await expect(page.getByRole('heading', { name: 'YAML Preview' })).toBeVisible()

    await page.locator('textarea').fill(`project:
  name: Useful Tools
  features:
    - yaml preview
    - offline docs`)

    await expect(page.locator('.yaml-tree-preview')).toContainText('project')
    await expect(page.locator('.yaml-tree-preview')).toContainText('features')
    await expect(page.locator('.yaml-tree-preview')).toContainText('yaml preview')
})

test('YAML Preview formats YAML from toolbar action', async ({ page }) => {
    await page.goto('/tools/yaml-preview')

    await page.locator('textarea').fill('name: Useful Tools\nitems:\n- json\n- yaml')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('textarea')).toHaveValue(/items:\n  - json\n  - yaml/)
    await expect(page.locator('.yaml-tree-preview')).toContainText('Useful Tools')
})

test('YAML Preview manual preview works when auto preview is disabled', async ({ page }) => {
    await page.goto('/tools/yaml-preview')

    await page.getByLabel('Auto preview').uncheck()
    await page.locator('textarea').fill('name: Manual Preview')
    await expect(page.locator('.yaml-preview-output')).not.toContainText('Manual Preview')

    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(page.locator('.yaml-tree-preview')).toContainText('Manual Preview')
})

test('YAML Preview updates URL hash on edit and loads state from URL hash', async ({ page }) => {
    await page.goto('/tools/yaml-preview')

    // Fill textarea
    await page.locator('textarea').fill('project:\n  name: Test YAML Share\n  version: 1.0.0')

    // Wait for the preview to render the new value (ensuring debounced state has updated)
    await expect(page.locator('.yaml-tree-preview')).toContainText('Test YAML Share')

    // Wait for the URL to contain `#pako:`
    await expect(page).toHaveURL(/#pako:/)
    const sharedUrl = page.url()

    // Now navigate to a different tool to reset state
    await page.goto('/tools/json-formatter')
    await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible()

    // Now go back directly to the sharedUrl
    await page.goto(sharedUrl)
    await expect(page.getByRole('heading', { name: 'YAML Preview' })).toBeVisible()

    // Verify textarea has the loaded value
    await expect(page.locator('textarea')).toHaveValue('project:\n  name: Test YAML Share\n  version: 1.0.0')
})

test('YAML Preview handles options state sync and Share button copy action', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/tools/yaml-preview')

    // Change indent to 4 spaces
    await page.getByText('4 spaces', { exact: true }).click()

    // Uncheck Auto preview
    await page.getByLabel('Auto preview').uncheck()

    // Fill textarea
    await page.locator('textarea').fill('name: Options Check')

    // Wait for URL hash
    await expect(page).toHaveURL(/#pako:/)
    const sharedUrl = page.url()

    // Click Share button
    await page.getByRole('button', { name: 'Share' }).click()

    // Verify toast message
    await expect(page.locator('.ant-message-success')).toContainText('Đã sao chép liên kết chia sẻ.')

    // Verify clipboard value matches URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe(sharedUrl)

    // Load the URL in a new context or navigate directly
    await page.goto(sharedUrl)
    await expect(page.locator('.ant-radio-button-wrapper-checked')).toContainText('4 spaces')
    await expect(page.getByLabel('Auto preview')).not.toBeChecked()
    await expect(page.locator('textarea')).toHaveValue('name: Options Check')
})

test('YAML Preview avoids horizontal overflow at core breakpoints', async ({ page }) => {
    for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
        await page.goto('/tools/yaml-preview')
        await expect(page.getByRole('heading', { name: 'YAML Preview' })).toBeVisible()
        await expectNoHorizontalOverflow(page)
    }
})

test('formats, minifies, and validates XML offline', async ({ page }) => {
    await page.goto('/tools/xml-formatter')

    await expect(page.getByRole('heading', { name: 'XML Formatter' })).toBeVisible()

    await page.locator('textarea').fill('<root><item id="1">Alpha</item><item id="2">Beta</item></root>')
    await page.getByRole('button', { name: 'Format' }).click()

    await expect(page.locator('.fo-output')).toContainText('<root>')
    await expect(page.locator('.fo-output')).toContainText('<item id="1">')

    await page.getByRole('button', { name: 'Minify' }).click()
    await expect(page.locator('.fo-output')).toContainText('<root><item id="1">Alpha</item><item id="2">Beta</item></root>')

    await page.locator('textarea').fill('<root><item></root>')
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.locator('.formatter-error')).toContainText('Invalid XML')
})

test('compares JSON objects and reports added removed changed fields', async ({ page }) => {
    await page.goto('/tools/json-compare')

    await expect(page.getByRole('heading', { name: 'JSON Compare' })).toBeVisible()

    const editors = page.locator('textarea')
    await editors.nth(0).fill('{"name":"tool","version":1,"old":true}')
    await editors.nth(1).fill('{"name":"toolkit","version":1,"new":true}')

    await page.getByRole('button', { name: 'Compare' }).click()

    await expect(page.getByRole('heading', { name: 'Changed' })).toBeVisible()
    await expect(page.locator('.json-compare-results')).toContainText('name')
    await expect(page.getByRole('heading', { name: 'Removed' })).toBeVisible()
    await expect(page.locator('.json-compare-results')).toContainText('old')
    await expect(page.getByRole('heading', { name: 'Added' })).toBeVisible()
    await expect(page.locator('.json-compare-results')).toContainText('new')

    await editors.nth(0).fill('{"name":}')
    await page.getByRole('button', { name: 'Compare' }).click()
    await expect(page.locator('.formatter-error')).toContainText('Invalid original JSON')
})
