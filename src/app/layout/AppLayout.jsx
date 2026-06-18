import { Outlet } from 'react-router-dom'
import { AppHeader } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'
import { AppFooter } from './Footer.jsx'
import './layout.css'

export function AppLayout() {
    return (
        <div className="app-shell">
            <AppHeader />
            <div className="app-body">
                <Sidebar />
                <main className="app-content">
                    <Outlet />
                </main>
            </div>
            <AppFooter />
        </div>
    )
}
