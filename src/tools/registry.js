import { FileText, Workflow } from 'lucide-react'
import MermaidPreviewTool from './mermaid-preview/index.jsx'
import MarkdownPreviewTool from './markdown-preview/index.jsx'

export const tools = [
    {
        id: 'mermaid-preview',
        name: 'Mermaid Preview',
        group: 'Preview',
        description: 'Write and preview Mermaid diagrams offline.',
        icon: Workflow,
        Component: MermaidPreviewTool
    },
    {
        id: 'markdown-preview',
        name: 'Markdown Preview',
        group: 'Preview',
        description: 'Write Markdown and preview output offline.',
        icon: FileText,
        Component: MarkdownPreviewTool
    }
]
