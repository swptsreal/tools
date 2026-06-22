import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from 'antd'
import { Menu, Wrench } from 'lucide-react'
import { tools } from '../../tools/registry.js'

export function AppHeader({ actions, onOpenNavigation }) {
    const { pathname } = useLocation()
    const activeTool = useMemo(
        () => tools.find((tool) => pathname === `/tools/${tool.id}`),
        [pathname]
    )

    return (
        <header className="app-header">
            <div className="mobile-header-row">
                <div className="mobile-header-brand">
                    <Wrench size={18} />
                    <strong>Useful Tools</strong>
                </div>
                <Button
                    aria-label="Open navigation"
                    icon={<Menu size={18} />}
                    onClick={onOpenNavigation}
                />
            </div>
            <div className="header-main">
                {activeTool ? (
                    <div className="header-tool">
                        <h1>{activeTool.name}</h1>
                        <p>{activeTool.description}</p>
                    </div>
                ) : null}
            </div>
            {actions ? <div className="header-actions">{actions}</div> : null}
        </header>
    )
}
