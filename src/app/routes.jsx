import { tools } from '../tools/registry.js'

export const toolRoutes = tools.map((tool) => ({
    path: `/tools/${tool.id}`,
    element: <tool.Component />
}))
