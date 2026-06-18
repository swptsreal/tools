import { useEffect, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
    suppressErrorRendering: true,
    suppressErrorLogging: true
})

export function MermaidPreview({ value }) {
    const [svg, setSvg] = useState('')
    const [error, setError] = useState('')
    const [scale, setScale] = useState(1)

    useEffect(() => {
        const timer = window.setTimeout(async () => {
            if (!value.trim()) {
                setSvg('')
                setError('')
                return
            }

            try {
                const result = await mermaid.render(`mermaid-${Date.now()}`, value)
                setSvg(result.svg)
                setError('')
            } catch (renderError) {
                setSvg('')
                setError(renderError.message)
            }
        }, 300)

        return () => window.clearTimeout(timer)
    }, [value])

    return (
        <div className="mermaid-preview">
            <div className="preview-toolbar">
                <button onClick={() => setScale((current) => Math.max(0.5, current - 0.1))}>-</button>
                <span>{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale((current) => Math.min(3, current + 0.1))}>+</button>
                <button onClick={() => setScale(1)}>Reset</button>
            </div>
            <div className="preview-canvas">
                {error ? <pre className="tool-error">{error}</pre> : null}
                {!error && svg ? (
                    <div
                        className="mermaid-svg"
                        style={{ transform: `scale(${scale})` }}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                ) : null}
            </div>
        </div>
    )
}
