export function SplitWorkspace({ left, right }) {
    return (
        <div className="split-workspace">
            <section className="split-panel split-left">{left}</section>
            <section className="split-panel split-right">{right}</section>
        </div>
    )
}
