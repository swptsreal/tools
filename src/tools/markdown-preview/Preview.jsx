import { useEffect, useState } from 'react'
import { parse } from 'marked'
import { getMermaidRenderTarget } from '../../shared/utils/mermaidRenderTarget.js'

let mermaidInstance = null
async function getMermaid() {
    if (!mermaidInstance) {
        const mod = await import('mermaid')
        mermaidInstance = mod.default
        mermaidInstance.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'strict',
            suppressErrorRendering: true,
            suppressErrorLogging: true
        })
    }
    return mermaidInstance
}

function decodeHtml(html) {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = html
    return textarea.value
}

export function MarkdownPreview({ value }) {
    const [html, setHtml] = useState('')

    useEffect(() => {
        let cancelled = false
        async function renderPreview() {
            let nextHtml = parse(value)
            const matches = [...nextHtml.matchAll(/<code class="language-mermaid">([\s\S]*?)<\/code>/g)]

            for (let index = 0; index < matches.length; index += 1) {
                try {
                    const mermaid = await getMermaid()
                    const result = await mermaid.render(
                        `markdown-mermaid-${Date.now()}-${index}`,
                        decodeHtml(matches[index][1]),
                        getMermaidRenderTarget()
                    )
                    nextHtml = nextHtml.replace(
                        matches[index][0],
                        `<div class="mermaid-diagram">${result.svg}</div>`
                    )
                } catch (error) {
                    nextHtml = nextHtml.replace(
                        matches[index][0],
                        `<pre class="markdown-error">${error.message}</pre>`
                    )
                }
            }

            if (!cancelled) setHtml(nextHtml)
        }
        renderPreview()
        return () => { cancelled = true }
    }, [value])

    return (
        <article
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}
