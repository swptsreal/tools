import { NavLink } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { tools } from '../../tools/registry.js'

export function Sidebar({ className = '', onNavigate }) {
    const groups = tools.reduce((result, tool) => {
        const group = tool.group || 'Tools'
        result[group] = result[group] || []
        result[group].push(tool)
        return result
    }, {})

    return (
        <aside className={`app-sidebar ${className}`.trim()}>
            <div className="brand sidebar-brand">
                <Wrench size={20} />
                <strong>Useful Tools</strong>
            </div>
            {Object.entries(groups).map(([group, groupTools]) => (
                <section className="tool-group" key={group}>
                    <h2>{group}</h2>
                    <nav>
                        {groupTools.map((tool) => {
                            const Icon = tool.icon
                            return (
                                <NavLink
                                    key={tool.id}
                                    to={`/tools/${tool.id}`}
                                    onClick={onNavigate}
                                >
                                    <Icon size={16} />
                                    <span>{tool.name}</span>
                                </NavLink>
                            )
                        })}
                    </nav>
                </section>
            ))}
        </aside>
    )
}
