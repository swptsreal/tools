import { lazy } from 'react'
import { Braces, CalendarClock, CodeXml, Database, FileJson, FileSpreadsheet, FileText, Palette, Workflow } from 'lucide-react'

export const tools = [
    {
        id: 'mermaid-preview',
        name: 'Mermaid Preview',
        group: 'Preview',
        description: 'Write and preview Mermaid diagrams offline.',
        icon: Workflow,
        Component: lazy(() => import('./mermaid-preview/index.jsx'))
    },
    {
        id: 'markdown-preview',
        name: 'Markdown Preview',
        group: 'Preview',
        description: 'Write Markdown and preview output offline.',
        icon: FileText,
        Component: lazy(() => import('./markdown-preview/index.jsx'))
    },
    {
        id: 'json-formatter',
        name: 'JSON Formatter',
        group: 'Formatter',
        description: 'Format, minify, and validate JSON offline.',
        icon: Braces,
        Component: lazy(() => import('./json-formatter/index.jsx'))
    },
    {
        id: 'sql-formatter',
        name: 'SQL Formatter',
        group: 'Formatter',
        description: 'Format SQL queries offline.',
        icon: Database,
        Component: lazy(() => import('./sql-formatter/index.jsx'))
    },
    {
        id: 'html-formatter',
        name: 'HTML Formatter',
        group: 'Formatter',
        description: 'Format HTML markup offline.',
        icon: CodeXml,
        Component: lazy(() => import('./html-formatter/index.jsx'))
    },
    {
        id: 'css-formatter',
        name: 'CSS Formatter',
        group: 'Formatter',
        description: 'Format CSS stylesheets offline.',
        icon: Palette,
        Component: lazy(() => import('./css-formatter/index.jsx'))
    },
    {
        id: 'json-yaml-converter',
        name: 'JSON YAML Converter',
        group: 'Converter',
        description: 'Convert JSON and YAML offline.',
        icon: FileJson,
        Component: lazy(() => import('./json-yaml-converter/index.jsx'))
    },
    {
        id: 'csv-json-converter',
        name: 'CSV JSON Converter',
        group: 'Converter',
        description: 'Convert CSV and JSON arrays offline.',
        icon: FileSpreadsheet,
        Component: lazy(() => import('./csv-json-converter/index.jsx'))
    },
    {
        id: 'timestamp-converter',
        name: 'Timestamp Converter',
        group: 'Converter',
        description: 'Convert Unix timestamps and dates offline.',
        icon: CalendarClock,
        Component: lazy(() => import('./timestamp-converter/index.jsx'))
    },
    {
        id: 'color-converter',
        name: 'Color Converter',
        group: 'Converter',
        description: 'Convert HEX, RGB, HSL, and HSV colors offline.',
        icon: Palette,
        Component: lazy(() => import('./color-converter/index.jsx'))
    }
]
