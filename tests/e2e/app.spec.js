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
            '/tools/css-formatter'
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




