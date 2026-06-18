import { ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout.jsx'
import { toolRoutes } from './routes.jsx'
import '../shared/components/shared.css'

export default function App() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#2563eb',
                    borderRadius: 8,
                    fontFamily: 'Inter, system-ui, sans-serif'
                }
            }}
        >
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route
                            index
                            element={
                                <Navigate to="/tools/mermaid-preview" replace />
                            }
                        />
                        {toolRoutes.map((tool) => (
                            <Route
                                key={tool.path}
                                path={tool.path}
                                element={tool.element}
                            />
                        ))}
                        <Route
                            path="*"
                            element={
                                <Navigate to="/tools/mermaid-preview" replace />
                            }
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    )
}
