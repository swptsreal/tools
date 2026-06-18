import { theme } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import './FormatterOutput.css'

const { useToken } = theme

const PRISM_LANG = { json: 'json', sql: 'sql', html: 'markup', css: 'css' }

async function highlight(code, language) {
    if (!code) return ''
    const Prism = (await import('prismjs')).default
    const lang = PRISM_LANG[language] ?? 'plain'
    if (lang === 'json' && !Prism.languages.json) {
        await import('prismjs/components/prism-json.js')
    } else if (lang === 'sql' && !Prism.languages.sql) {
        await import('prismjs/components/prism-sql.js')
    } else if (lang === 'markup' && !Prism.languages.markup) {
        await import('prismjs/components/prism-markup.js')
    } else if (lang === 'css' && !Prism.languages.css) {
        await import('prismjs/components/prism-css.js')
    }
    const grammar = Prism.languages[lang]
    if (!grammar) return escapeHtml(code)
    return Prism.highlight(code, grammar, lang)
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function splitHighlightedLines(html) {
    const lines = []
    let current = ''
    const openSpans = []
    let i = 0
    while (i < html.length) {
        if (html[i] === '\n') {
            lines.push(current + openSpans.map(() => '</span>').join(''))
            current = openSpans.slice().join('')
            i++
        } else if (html[i] === '<') {
            const end = html.indexOf('>', i)
            const tag = html.slice(i, end + 1)
            if (tag.startsWith('</span')) openSpans.pop()
            else if (tag.startsWith('<span')) openSpans.push(tag)
            current += tag
            i = end + 1
        } else {
            current += html[i]
            i++
        }
    }
    if (current) lines.push(current)
    return lines
}

function isFoldOpen(plain) {
    const t = plain.trimEnd()
    if (t.endsWith('{') || t.endsWith('[')) return true
    if (/<[a-zA-Z][^>]*[^/]>$/.test(t)) return true
    return false
}

function isFoldClose(plain, openPlain) {
    const t = plain.trim()
    if (openPlain.trimEnd().endsWith('{') && (t === '}' || t === '},' || t === '};')) return true
    if (openPlain.trimEnd().endsWith('[') && (t === ']' || t === '],' || t === '];')) return true
    if (/^<\/[a-zA-Z]/.test(t)) return true
    return false
}

function stripTags(html) { return html.replace(/<[^>]*>/g, '') }

function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

function markMatches(lineHtml, query, currentMatchIndex, lineMatchStart) {
    if (!query) return lineHtml
    const plain = stripTags(lineHtml)
    const re = new RegExp(escapeRegex(query), 'gi')
    const positions = []
    let matchIdx = lineMatchStart
    let m
    while ((m = re.exec(plain)) !== null) {
        positions.push({ start: m.index, end: m.index + m[0].length, globalIdx: matchIdx++ })
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
            const isCurrent = pos.globalIdx === currentMatchIndex
            out += isCurrent ? '<mark class="fo-match fo-match-current">' : '<mark class="fo-match">'
            let consumed = 0
            while (consumed < query.length && htmlIdx < lineHtml.length) {
                if (lineHtml[htmlIdx] === '<') {
                    const end = lineHtml.indexOf('>', htmlIdx)
                    out += lineHtml.slice(htmlIdx, end + 1)
                    htmlIdx = end + 1
                } else {
                    out += lineHtml[htmlIdx]
                    htmlIdx++
                    plainIdx++
                    consumed++
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
    out += lineHtml.slice(htmlIdx)
    return out
}

function buildCssVars(token) {
    return {
        '--fo-bg': token.colorBgContainer,
        '--fo-fg': token.colorText,
        '--fo-gutter-bg': token.colorBgLayout,
        '--fo-gutter-fg': token.colorTextQuaternary,
        '--fo-border': token.colorBorderSecondary,
        '--fo-hover-bg': token.colorBgTextHover,
        '--fo-input-border': token.colorBorder,
        '--fo-accent': token.colorPrimary,
        '--fo-accent-shadow': token.colorPrimaryBorder,
        '--fo-match-bg': token.colorWarningBg,
        '--fo-match-fg': token.colorWarningText,
        '--fo-match-current-bg': token.colorError,
        '--fo-match-current-fg': token.colorBgContainer,
        '--fo-token-comment': token.colorTextTertiary,
        '--fo-token-punctuation': token.colorTextSecondary,
        '--fo-token-tag': token.red || token.colorErrorText,
        '--fo-token-number': token.blue || token.colorInfoText,
        '--fo-token-string': token.green || token.colorSuccessText,
        '--fo-token-operator': token.orange || token.colorWarningText,
        '--fo-token-keyword': token.purple || '#8250df',
        '--fo-token-function': token.cyan || '#0891b2',
        '--fo-token-variable': token.orange || token.colorWarningText,
    }
}

export default function FormatterOutput({ code, language }) {
    const { token } = useToken()
    const [lines, setLines] = useState([])
    const [collapsed, setCollapsed] = useState({})
    const [searchOpen, setSearchOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [currentMatch, setCurrentMatch] = useState(0)
    const wrapRef = useRef(null)
    const searchInputRef = useRef(null)

    useEffect(() => {
        setCollapsed({})
        setQuery('')
        setSearchOpen(false)
        setCurrentMatch(0)
        if (!code) { setLines([]); return }
        highlight(code, language).then((html) => {
            const htmlLines = splitHighlightedLines(html)
            const rawPlain = code.split('\n')
            setLines(htmlLines.map((h, i) => ({ html: h, plain: rawPlain[i] ?? '' })))
        })
    }, [code, language])

    const totalMatches = query
        ? lines.reduce((sum, { plain }) => {
            const re = new RegExp(escapeRegex(query), 'gi')
            return sum + (plain.match(re)?.length ?? 0)
        }, 0)
        : 0

    const clampedMatch = totalMatches > 0 ? currentMatch % totalMatches : 0

    useEffect(() => {
        if (!searchOpen || !query || totalMatches === 0) return
        const el = wrapRef.current?.querySelector('.fo-match-current')
        el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }, [clampedMatch, searchOpen, query, totalMatches])

    const goNext = useCallback(() => setCurrentMatch((m) => (totalMatches > 0 ? (m + 1) % totalMatches : 0)), [totalMatches])
    const goPrev = useCallback(() => setCurrentMatch((m) => (totalMatches > 0 ? (m - 1 + totalMatches) % totalMatches : 0)), [totalMatches])

    const onKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            setSearchOpen(true)
            setTimeout(() => searchInputRef.current?.focus(), 0)
            e.preventDefault()
        }
    }

    const onSearchKeyDown = (e) => {
        if (e.key === 'Enter') { e.shiftKey ? goPrev() : goNext(); e.preventDefault() }
        if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); setCurrentMatch(0) }
    }

    const toggleFold = (openIdx) => {
        setCollapsed((prev) => {
            const next = { ...prev }
            let depth = 0
            let closeIdx = -1
            for (let i = openIdx + 1; i < lines.length; i++) {
                if (isFoldOpen(lines[i].plain)) depth++
                else if (isFoldClose(lines[i].plain, lines[openIdx].plain)) {
                    if (depth === 0) { closeIdx = i; break }
                    depth--
                }
            }
            if (closeIdx === -1) return prev
            const shouldCollapse = prev[openIdx] !== 'open'
            for (let i = openIdx + 1; i < closeIdx; i++) {
                if (shouldCollapse) next[i] = true
                else delete next[i]
            }
            if (shouldCollapse) next[openIdx] = 'open'
            else delete next[openIdx]
            return next
        })
    }

    let globalMatchOffset = 0
    const lineMatchOffsets = lines.map(({ plain }) => {
        const offset = globalMatchOffset
        if (query) {
            const re = new RegExp(escapeRegex(query), 'gi')
            globalMatchOffset += (plain.match(re)?.length ?? 0)
        }
        return offset
    })

    const cssVars = buildCssVars(token)

    return (
        <div
            className='formatter-output-wrap formatter-output'
            tabIndex={0}
            onKeyDown={onKeyDown}
            ref={wrapRef}
            style={cssVars}
        >
            {searchOpen && (
                <div className='fo-search-bar'>
                    <input
                        ref={searchInputRef}
                        className='fo-search-input'
                        placeholder='Search...'
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setCurrentMatch(0) }}
                        onKeyDown={onSearchKeyDown}
                    />
                    {query && (
                        <span className='fo-search-count'>
                            {totalMatches === 0 ? 'No results' : `${clampedMatch + 1} / ${totalMatches}`}
                        </span>
                    )}
                    <button className='fo-search-nav' onClick={goPrev} title='Previous'>↑</button>
                    <button className='fo-search-nav' onClick={goNext} title='Next'>↓</button>
                    <button className='fo-search-close' onClick={() => { setSearchOpen(false); setQuery(''); setCurrentMatch(0) }}>×</button>
                </div>
            )}
            <div className='fo-output'>
                {lines.map(({ html, plain }, idx) => {
                    const isCollapsedLine = collapsed[idx] === true
                    const isOpenCollapsed = collapsed[idx] === 'open'
                    const canFold = isFoldOpen(plain)
                    const displayHtml = query
                        ? markMatches(html, query, clampedMatch, lineMatchOffsets[idx])
                        : html
                    return (
                        <div key={idx} className={`fo-line${isCollapsedLine ? ' fo-folded' : ''}`} data-line-num={idx + 1}>
                            {canFold ? (
                                <button
                                    className={`fo-fold-toggle${isOpenCollapsed ? ' fo-fold-toggle--collapsed' : ''}`}
                                    onClick={() => toggleFold(idx)}
                                    aria-label={isOpenCollapsed ? 'Expand' : 'Collapse'}
                                    tabIndex={-1}
                                >
                                    {isOpenCollapsed ? '▶' : '▼'}
                                </button>
                            ) : (
                                <span className='fo-fold-spacer' />
                            )}
                            <span className='fo-code' dangerouslySetInnerHTML={{ __html: displayHtml || ' ' }} />
                            {isOpenCollapsed && <span className='fo-fold-placeholder'>…</span>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
