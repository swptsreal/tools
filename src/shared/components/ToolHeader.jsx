export function ToolHeader({ title, description, actions }) {
    return (
        <div className="tool-header">
            <div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            {actions ? <div className="tool-actions">{actions}</div> : null}
        </div>
    )
}
