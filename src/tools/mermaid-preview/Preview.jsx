import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { getMermaidRenderTarget } from '../../shared/utils/mermaidRenderTarget.js'

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
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const dragRef = useRef(null)

    useEffect(() => {
        async function renderPreview() {
            if (!value.trim()) {
                setSvg('')
                setError('')
                return
            }

            try {
                const result = await mermaid.render(
                    `mermaid-${Date.now()}`,
                    value,
                    getMermaidRenderTarget()
                )
                setSvg(result.svg)
                setError('')
            } catch (renderError) {
                setSvg('')
                setError(renderError.message)
            }
        }

        renderPreview()
    }, [value])

    const startPan = (event) => {
        if (!svg || event.button !== 0) {
            return
        }

        event.currentTarget.setPointerCapture(event.pointerId)
        dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startPan: pan
        }
        setIsPanning(true)
    }

    const movePan = (event) => {
        const drag = dragRef.current

        if (!drag || drag.pointerId !== event.pointerId) {
            return
        }

        setPan({
            x: drag.startPan.x + event.clientX - drag.startX,
            y: drag.startPan.y + event.clientY - drag.startY
        })
    }

    const stopPan = (event) => {
        if (dragRef.current?.pointerId !== event.pointerId) {
            return
        }

        dragRef.current = null
        setIsPanning(false)
    }

    const resetView = () => {
        setScale(1)
        setPan({ x: 0, y: 0 })
    }

    return (
        <div className="mermaid-preview">
            <div className="preview-toolbar">
                <button onClick={() => setScale((current) => Math.max(0.5, current - 0.1))}>-</button>
                <span>{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale((current) => Math.min(3, current + 0.1))}>+</button>
                <button onClick={resetView}>Reset</button>
            </div>
            <div
                className={`preview-canvas${isPanning ? ' is-panning' : ''}`}
                onPointerDown={startPan}
                onPointerMove={movePan}
                onPointerUp={stopPan}
                onPointerCancel={stopPan}
            >
                {error ? <pre className="tool-error">{error}</pre> : null}
                {!error && svg ? (
                    <div
                        className="mermaid-svg"
                        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                ) : null}
            </div>
        </div>
    )
}
