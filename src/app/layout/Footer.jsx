import { WifiOff } from 'lucide-react'

export function AppFooter() {
    return (
        <footer className="app-footer">
            <span>Useful Tools v0.1.0</span>
            <span className="offline-status">
                <WifiOff size={14} />
                Offline-first
            </span>
        </footer>
    )
}
