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

    await expect(page.locator('.markdown-preview h1')).toHaveText('Playwright Check')
    await expect(page.locator('.markdown-preview li')).toHaveText('Fast feedback')
    await expect(page.locator('.mermaid-diagram svg')).toBeVisible()
})

test('debounces preview rendering while editing markdown textarea', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-06-18T12:00:00') })
    await page.goto('/tools/markdown-preview')
    await page.clock.runFor(300)

    await expect(page.locator('.markdown-preview h1')).toHaveText('Useful Tools')
    await page.clock.pauseAt(new Date('2026-06-18T13:00:00'))

    await page.locator('textarea').fill('# Debounced Render')
    await expect(page.locator('textarea')).toHaveValue('# Debounced Render')

    await page.clock.runFor(275)
    expect(await page.locator('.markdown-preview h1').textContent()).toBe('Useful Tools')

    await page.clock.runFor(25)
    await expect(page.locator('.markdown-preview h1')).toHaveText('Debounced Render')
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

        for (const path of ['/tools/mermaid-preview', '/tools/markdown-preview']) {
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
