import { Suspense } from 'react'
import { tools } from '../tools/registry.js'

export const toolRoutes = tools.map((tool) => ({
    path: `/tools/${tool.id}`,
    element: (
        <Suspense fallback={null}>
            <tool.Component />
        </Suspense>
    )
}))
