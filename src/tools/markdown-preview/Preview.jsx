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
                    const result = await mermaid.render(
                        `markdown-mermaid-${Date.now()}-${index}`,
                        decodeHtml(matches[index][1])
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

            setHtml(nextHtml)
        }, 250)

        return () => window.clearTimeout(timer)
    }, [value])

    return (
        <article
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}
