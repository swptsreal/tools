import { useEffect, useState } from 'react'
import { Splitter } from 'antd'

function useVerticalSplitter() {
    const [isVertical, setIsVertical] = useState(() =>
        window.matchMedia('(max-width: 1000px)').matches
    )

    useEffect(() => {
        const query = window.matchMedia('(max-width: 1000px)')
        const update = () => setIsVertical(query.matches)

        update()
        query.addEventListener('change', update)

        return () => query.removeEventListener('change', update)
    }, [])

    return isVertical
}

export function SplitWorkspace({ left, right }) {
    const isVertical = useVerticalSplitter()

    return (
        <Splitter
            className="split-workspace"
            orientation={isVertical ? 'vertical' : 'horizontal'}
        >
            <Splitter.Panel
                className="split-panel split-left"
                defaultSize={isVertical ? '45%' : '42%'}
                min={isVertical ? 220 : 280}
            >
                {left}
            </Splitter.Panel>
            <Splitter.Panel className="split-panel split-right" min={240}>
                {right}
            </Splitter.Panel>
        </Splitter>
    )
}
