import { createContext, useContext, useEffect } from 'react'

const ToolChromeContext = createContext({
    setActions: () => {}
})

export function ToolChromeProvider({ children, setActions }) {
    return (
        <ToolChromeContext.Provider value={{ setActions }}>
            {children}
        </ToolChromeContext.Provider>
    )
}

export function useToolActions(actions) {
    const { setActions } = useContext(ToolChromeContext)

    useEffect(() => {
        setActions(actions || null)

        return () => setActions(null)
    }, [actions, setActions])
}
