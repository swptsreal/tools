import { Search, Wrench } from 'lucide-react'

export function AppHeader() {
    return (
        <header className="app-header">
            <div className="brand">
                <Wrench size={20} />
                <div>
                    <strong>Useful Tools</strong>
                    <span>Offline utilities</span>
                </div>
            </div>
            <div className="header-search" aria-label="Search tools placeholder">
                <Search size={16} />
                <span>Search tools</span>
            </div>
        </header>
    )
}
