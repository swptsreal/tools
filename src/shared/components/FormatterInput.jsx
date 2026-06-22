import { theme } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import './FormatterInput.css'

const { useToken } = theme

const PRISM_LANG = { json: 'json', sql: 'sql', html: 'markup', xml: 'markup', css: 'css', yaml: 'yaml', markdown: 'markdown', javascript: 'javascript', text: 'plain' }
const prismCache = new Map()

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripTags(html) {
    return html.replace(/<[^>]*>/g, '')
}

const PRISM_IMPORTS = {
    json: () => import('prismjs/components/prism-json.js'),
    sql: () => import('prismjs/components/prism-sql.js'),
    markup: () => import('prismjs/components/prism-markup.js'),
    css: () => import('prismjs/components/prism-css.js'),
    yaml: () => import('prismjs/components/prism-yaml.js'),
    markdown: () => import('prismjs/components/prism-markdown.js'),
    javascript: () => import('prismjs/components/prism-javascript.js'),
}

async function highlight(code, language) {
    if (!code) return ''
    const lang = PRISM_LANG[language] ?? 'plain'
    if (lang === 'plain') return escapeHtml(code)

    const cacheKey = `prism-${lang}`
    if (!prismCache.has(cacheKey)) {
        const Prism = (await import('prismjs')).default
        if (!Prism.languages[lang] && PRISM_IMPORTS[lang]) {
            await PRISM_IMPORTS[lang]()
        }
        if (!Prism.languages[lang]) return escapeHtml(code)
        prismCache.set(cacheKey, { Prism, lang })
    }
    const { Prism } = prismCache.get(cacheKey)
    return Prism.highlight(code, Prism.languages[lang], lang)
}

function splitHighlightedLines(html, value) {
    const source = html || escapeHtml(value)
    const parts = source.split('\n')
    const lineCount = value.split('\n').length
    while (parts.length < lineCount) parts.push('')
    return parts
}

function markMatches(lineHtml, query, currentMatchIndex, lineMatchStart) {
    if (!query) return lineHtml
    const plain = stripTags(lineHtml)
    const re = new RegExp(escapeRegex(query), 'gi')
    const positions = []
    let matchIdx = lineMatchStart
    let match
    while ((match = re.exec(plain)) !== null) {
        positions.push({ start: match.index, end: match.index + match[0].length, globalIdx: matchIdx++ })
    }
    if (!positions.length) return lineHtml

    let out = ''
    let htmlIdx = 0
    let plainIdx = 0
    let posPtr = 0
    while (htmlIdx < lineHtml.length && posPtr < positions.length) {
        const pos = positions[posPtr]
        if (lineHtml[htmlIdx] === '<') {
            const end = lineHtml.indexOf('>', htmlIdx)
            out += lineHtml.slice(htmlIdx, end + 1)
            htmlIdx = end + 1
        } else if (plainIdx === pos.start) {
            out += pos.globalIdx === currentMatchIndex ? '<mark class="fi-match fi-match-current">' : '<mark class="fi-match">'
            while (plainIdx < pos.end && htmlIdx < lineHtml.length) {
                if (lineHtml[htmlIdx] === '<') {
                    const end = lineHtml.indexOf('>', htmlIdx)
                    out += lineHtml.slice(htmlIdx, end + 1)
                    htmlIdx = end + 1
                } else {
                    out += lineHtml[htmlIdx]
                    htmlIdx++
                    plainIdx++
                }
            }
            out += '</mark>'
            posPtr++
        } else {
            out += lineHtml[htmlIdx]
            htmlIdx++
            plainIdx++
        }
    }
    return out + lineHtml.slice(htmlIdx)
}

function buildCssVars(token) {
    return {
        '--fi-bg': token.colorBgContainer,
        '--fi-border': token.colorBorderSecondary,
        '--fi-gutter-bg': token.colorFillQuaternary,
        '--fi-gutter-text': token.colorTextTertiary,
        '--fi-text': token.colorText,
        '--fi-muted': token.colorTextSecondary,
        '--fi-match': token.colorWarningBg,
        '--fi-current': token.colorWarningBorder,
        '--fi-focus': token.colorPrimaryBorder
    }
}

export default function FormatterInput({ value, onChange, language = 'text', className = '', spellCheck = false, placeholder = '', ariaLabel = 'Editor', ...props }) {
    const { token } = useToken()
    const [highlighted, setHighlighted] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [currentMatch, setCurrentMatch] = useState(0)
    const searchInputRef = useRef(null)
    const textareaRef = useRef(null)
    const scrollRef = useRef(null)
    const cssVars = useMemo(() => buildCssVars(token), [token])

    useEffect(() => {
        let cancelled = false
        highlight(value, language).then((html) => {
            if (!cancelled) setHighlighted(html)
        })
        return () => { cancelled = true }
    }, [language, value])

    useEffect(() => {
        if (searchOpen) searchInputRef.current?.focus()
    }, [searchOpen])

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedQuery(query), 200)
        return () => window.clearTimeout(timeout)
    }, [query])

    const lines = useMemo(() => splitHighlightedLines(highlighted, value), [highlighted, value])
    const plainLines = useMemo(() => value.split('\n'), [value])

    const matchData = useMemo(() => {
        if (!debouncedQuery) return { total: 0, offsets: lines.map(() => 0) }
        let total = 0
        const re = new RegExp(escapeRegex(debouncedQuery), 'gi')
        const offsets = plainLines.map((line) => {
            const offset = total
            total += line.match(re)?.length ?? 0
            return offset
        })
        return { total, offsets }
    }, [debouncedQuery, lines, plainLines])

    const clampedMatch = matchData.total ? Math.min(currentMatch, matchData.total - 1) : 0

    const goNext = useCallback(() => {
        if (matchData.total) setCurrentMatch((idx) => (idx + 1) % matchData.total)
    }, [matchData.total])

    const goPrev = useCallback(() => {
        if (matchData.total) setCurrentMatch((idx) => (idx - 1 + matchData.total) % matchData.total)
    }, [matchData.total])

    const onKeyDown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
            event.preventDefault()
            setSearchOpen(true)
        }
    }

    const onSearchKeyDown = (event) => {
        if (event.key === 'Escape') {
            setSearchOpen(false)
            setQuery('')
            setDebouncedQuery('')
            setCurrentMatch(0)
            textareaRef.current?.focus()
        } else if (event.key === 'Enter') {
            event.preventDefault()
            if (event.shiftKey) goPrev()
            else goNext()
        }
    }

    const syncScroll = (event) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = event.currentTarget.scrollTop
            scrollRef.current.scrollLeft = event.currentTarget.scrollLeft
        }
    }

    return (
        <div className={`formatter-input ${className}`.trim()} style={cssVars} onKeyDown={onKeyDown} tabIndex={-1}>
            {searchOpen && (
                <div className="fi-search-bar">
                    <input
                        ref={searchInputRef}
                        className="fi-search-input"
                        placeholder="Search..."
                        value={query}
                        onChange={(event) => { setQuery(event.target.value); setCurrentMatch(0) }}
                        onKeyDown={onSearchKeyDown}
                    />
                    {debouncedQuery && <span className="fi-search-count">{matchData.total === 0 ? 'No results' : `${clampedMatch + 1} / ${matchData.total}`}</span>}
                    <button className="fi-search-nav" onClick={goPrev} title="Previous">↑</button>
                    <button className="fi-search-nav" onClick={goNext} title="Next">↓</button>
                    <button className="fi-search-close" onClick={() => { setSearchOpen(false); setQuery(''); setDebouncedQuery(''); setCurrentMatch(0); textareaRef.current?.focus() }}>×</button>
                </div>
            )}
            <div className="formatter-input-scroll" ref={scrollRef} aria-hidden="true">
                <div className="formatter-input-highlight">
                    {lines.map((line, idx) => {
                        const html = debouncedQuery ? markMatches(line, debouncedQuery, clampedMatch, matchData.offsets[idx]) : line
                        return (
                            <div key={idx} className="fi-line" data-line-num={idx + 1}>
                                <span className="fi-code" dangerouslySetInnerHTML={{ __html: html || ' ' }} />
                            </div>
                        )
                    })}
                </div>
            </div>
            <textarea
                ref={textareaRef}
                className="formatter-input-textarea"
                value={value}
                onChange={onChange}
                onScroll={syncScroll}
                onKeyDown={onKeyDown}
                spellCheck={spellCheck}
                placeholder={placeholder}
                aria-label={ariaLabel}
                {...props}
            />
        </div>
    )
}
