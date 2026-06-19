import { lazy } from 'react'
import { Binary, Braces, CalendarClock, CodeXml, BadgePlus, Database, FileCode2, FileJson, FileSpreadsheet, FileText, Fingerprint, KeyRound, Link, Palette, ShieldCheck, Workflow } from 'lucide-react'

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
    },
    {
        id: 'base64-encoder-decoder',
        name: 'Base64 Encoder Decoder',
        group: 'Encoder / Decoder',
        description: 'Encode and decode Base64 text offline.',
        icon: Binary,
        Component: lazy(() => import('./base64-encoder-decoder/index.jsx'))
    },
    {
        id: 'url-encoder-decoder',
        name: 'URL Encoder Decoder',
        group: 'Encoder / Decoder',
        description: 'Encode, decode, and inspect URL query strings offline.',
        icon: Link,
        Component: lazy(() => import('./url-encoder-decoder/index.jsx'))
    },
    {
        id: 'html-entity-encoder-decoder',
        name: 'HTML Entity Encoder Decoder',
        group: 'Encoder / Decoder',
        description: 'Encode and decode HTML entities offline.',
        icon: FileCode2,
        Component: lazy(() => import('./html-entity-encoder-decoder/index.jsx'))
    },
    {
        id: 'jwt-decoder',
        name: 'JWT Decoder',
        group: 'Encoder / Decoder',
        description: 'Decode JWT headers and payloads offline without signature verification.',
        icon: KeyRound,
        Component: lazy(() => import('./jwt-decoder/index.jsx'))
    },
    {
        id: 'hash-generator',
        name: 'Hash Generator',
        group: 'Generator',
        description: 'Generate SHA hashes for text offline.',
        icon: Fingerprint,
        Component: lazy(() => import('./hash-generator/index.jsx'))
    },
    {
        id: 'uuid-generator',
        name: 'UUID Generator',
        group: 'Generator',
        description: 'Generate UUID v4 values offline.',
        icon: BadgePlus,
        Component: lazy(() => import('./uuid-generator/index.jsx'))
    },
    {
        id: 'password-generator',
        name: 'Password Generator',
        group: 'Generator',
        description: 'Generate configurable passwords offline.',
        icon: ShieldCheck,
        Component: lazy(() => import('./password-generator/index.jsx'))
    },
    {
        id: 'jwt-secret-generator',
        name: 'JWT Secret Generator',
        group: 'Generator',
        description: 'Generate base64url JWT secrets offline.',
        icon: KeyRound,
        Component: lazy(() => import('./jwt-secret-generator/index.jsx'))
    },
    {
        id: 'fake-data-generator',
        name: 'Fake Data Generator',
        group: 'Generator',
        description: 'Generate fake JSON records offline.',
        icon: Database,
        Component: lazy(() => import('./fake-data-generator/index.jsx'))
    }
]
