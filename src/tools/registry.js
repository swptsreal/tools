import { lazy } from 'react'
import {
    AlignLeft,
    ArrowDownAZ,
    Binary,
    Braces,
    Clock3,
    CalendarClock,
    CodeXml,
    BadgePlus,
    Database,
    FileCode2,
    FileType,
    FileJson,
    FileSpreadsheet,
    FileText,
    Fingerprint,
    GitCompareArrows,
    KeyRound,
    LetterText,
    Link,
    ListMinus,
    Palette,
    Regex,
    Ruler,
    ShieldCheck,
    Workflow
} from 'lucide-react'

export const tools = [
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
        id: 'yaml-preview',
        name: 'YAML Preview',
        group: 'Preview',
        description: 'Preview OpenAPI docs or generic YAML trees offline.',
        icon: FileCode2,
        Component: lazy(() => import('./yaml-preview/index.jsx'))
    },
    {
        id: 'xml-formatter',
        name: 'XML Formatter',
        group: 'Formatter',
        description: 'Format, minify, and validate XML offline.',
        icon: CodeXml,
        Component: lazy(() => import('./xml-formatter/index.jsx'))
    },
    {
        id: 'json-compare',
        name: 'JSON Compare',
        group: 'Formatter',
        description:
            'Compare two JSON objects and highlight field changes offline.',
        icon: GitCompareArrows,
        Component: lazy(() => import('./json-compare/index.jsx'))
    },
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
        id: 'jwt-decoder',
        name: 'JWT Decoder',
        group: 'Encoder / Decoder',
        description:
            'Decode JWT headers and payloads offline without signature verification.',
        icon: KeyRound,
        Component: lazy(() => import('./jwt-decoder/index.jsx'))
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
        id: 'jwt-secret-generator',
        name: 'JWT Secret Generator',
        group: 'Generator',
        description: 'Generate base64url JWT secrets offline.',
        icon: KeyRound,
        Component: lazy(() => import('./jwt-secret-generator/index.jsx'))
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
        id: 'fake-data-generator',
        name: 'Fake Data Generator',
        group: 'Generator',
        description: 'Generate fake JSON records offline.',
        icon: Database,
        Component: lazy(() => import('./fake-data-generator/index.jsx'))
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
        id: 'unit-converter',
        name: 'Unit Converter',
        group: 'Developer',
        description:
            'Convert length, weight, temperature, and storage units offline.',
        icon: Ruler,
        Component: lazy(() => import('./unit-converter/index.jsx'))
    },
    {
        id: 'number-base-converter',
        name: 'Number Base Converter',
        group: 'Developer',
        description:
            'Convert numbers between binary, octal, decimal, and hex offline.',
        icon: Binary,
        Component: lazy(() => import('./number-base-converter/index.jsx'))
    },
    {
        id: 'escape-unescape',
        name: 'Escape / Unescape',
        group: 'Developer',
        description:
            'Escape and unescape JSON, JavaScript, regex, and URL text offline.',
        icon: Braces,
        Component: lazy(() => import('./escape-unescape/index.jsx'))
    },
    {
        id: 'regex-tester',
        name: 'Regex Tester',
        group: 'Developer',
        description:
            'Test regex matches, groups, flags, and replacement previews offline.',
        icon: Regex,
        Component: lazy(() => import('./regex-tester/index.jsx'))
    },
    {
        id: 'cron-expression-helper',
        name: 'Cron Expression Helper',
        group: 'Developer',
        description:
            'Explain cron expressions and preview upcoming run times offline.',
        icon: Clock3,
        Component: lazy(() => import('./cron-expression-helper/index.jsx'))
    },
    {
        id: 'mime-type-lookup',
        name: 'MIME Type Lookup',
        group: 'Developer',
        description: 'Look up file extensions and MIME types offline.',
        icon: FileType,
        Component: lazy(() => import('./mime-type-lookup/index.jsx'))
    },
    {
        id: 'url-parser',
        name: 'URL Parser',
        group: 'Developer',
        description:
            'Parse URL parts, query params, and rebuilt output offline.',
        icon: Link,
        Component: lazy(() => import('./url-parser/index.jsx'))
    },

    {
        id: 'text-diff',
        name: 'Text Diff',
        group: 'Text',
        description:
            'Compare two text blocks and show line differences offline.',
        icon: GitCompareArrows,
        Component: lazy(() => import('./text-diff/index.jsx'))
    },
    {
        id: 'sort-lines',
        name: 'Sort Lines',
        group: 'Text',
        description: 'Sort text lines ascending or descending offline.',
        icon: ArrowDownAZ,
        Component: lazy(() => import('./sort-lines/index.jsx'))
    },
    {
        id: 'remove-duplicate-lines',
        name: 'Remove Duplicate Lines',
        group: 'Text',
        description:
            'Remove repeated lines while preserving first occurrence offline.',
        icon: ListMinus,
        Component: lazy(() => import('./remove-duplicate-lines/index.jsx'))
    },
    {
        id: 'case-converter',
        name: 'Case Converter',
        group: 'Text',
        description:
            'Convert text between common letter and identifier cases offline.',
        icon: LetterText,
        Component: lazy(() => import('./case-converter/index.jsx'))
    },
    {
        id: 'word-character-counter',
        name: 'Word Character Counter',
        group: 'Text',
        description:
            'Count words, characters, lines, paragraphs, and bytes offline.',
        icon: AlignLeft,
        Component: lazy(() => import('./word-character-counter/index.jsx'))
    }
]
