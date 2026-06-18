const renderTargetId = 'mermaid-render-target'

export function getMermaidRenderTarget() {
    let target = document.getElementById(renderTargetId)

    if (!target) {
        target = document.createElement('div')
        target.id = renderTargetId
        target.setAttribute('aria-hidden', 'true')
        Object.assign(target.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            opacity: '0',
            pointerEvents: 'none'
        })
        document.body.appendChild(target)
    }

    return target
}
