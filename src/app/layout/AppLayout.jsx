import { useEffect, useState } from 'react'
import { Drawer } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'
import { AppFooter } from './Footer.jsx'
import { ToolChromeProvider } from '../../shared/components/ToolChromeContext.jsx'
import './layout.css'

export function AppLayout() {
    const [actions, setActions] = useState(null)
    const [isNavOpen, setIsNavOpen] = useState(false)
    const { pathname } = useLocation()

    useEffect(() => {
        setIsNavOpen(false)
    }, [pathname])

    return (
        <ToolChromeProvider setActions={setActions}>
            <div className="app-shell">
                <Sidebar className="desktop-sidebar" />
                <div className="app-main">
                    <AppHeader
                        actions={actions}
                        onOpenNavigation={() => setIsNavOpen(true)}
                    />
                    <main className="app-content">
                        <Outlet />
                    </main>
                    <AppFooter />
                </div>
            </div>
            <Drawer
                className="mobile-nav-drawer"
                placement="left"
                open={isNavOpen}
                onClose={() => setIsNavOpen(false)}
                closeIcon={null}
                size={266}
                destroyOnHidden
            >
                <Sidebar
                    className="mobile-sidebar"
                    onNavigate={() => setIsNavOpen(false)}
                />
            </Drawer>
        </ToolChromeProvider>
    )
}
