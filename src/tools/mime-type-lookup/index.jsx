import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message } from 'antd'
import { Clipboard, FileType, RotateCcw } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { mimeTypeLookupExample } from './example.js'
import './style.css'
const toolId='mime-type-lookup'
const rows=[['.json','application/json','JavaScript Object Notation'],['.html','text/html','HTML document'],['.css','text/css','Cascading Style Sheets'],['.js','text/javascript','JavaScript source'],['.csv','text/csv','Comma-separated values'],['.txt','text/plain','Plain text'],['.svg','image/svg+xml','Scalable Vector Graphics'],['.png','image/png','PNG image'],['.jpg','image/jpeg','JPEG image'],['.pdf','application/pdf','Portable Document Format'],['.zip','application/zip','ZIP archive']]
export default function MimeTypeLookupTool(){const [query,setQuery]=useState(()=>loadDraft(toolId,mimeTypeLookupExample)); useEffect(()=>saveDraft(toolId,query),[query]); const matches=rows.filter((row)=>row.join(' ').toLowerCase().includes(query.toLowerCase().replace(/^\./,''))); const output=matches.map((r)=>r.join(' | ')).join('\n'); const copy=async()=>{const res=await copyText(output); message[res.ok?'success':'warning'](res.message)}; const actions=useMemo(()=><><Button icon={<FileType size={16}/>} type="primary">Lookup</Button><Button icon={<Clipboard size={16}/>} onClick={copy}>Copy</Button><Button icon={<RotateCcw size={16}/>} onClick={()=>setQuery(mimeTypeLookupExample)}>Example</Button></>,[output]); useToolActions(actions); return <div className="tool-page developer-tool-page"><SplitWorkspace leftToolbar={<><label className="tool-function-label" htmlFor="mime-search">Search MIME</label><Input id="mime-search" aria-label="Search MIME" value={query} onChange={(e)=>setQuery(e.target.value)} /></>} left={<div className="dev-result"><div className="dev-card"><p>Search by extension, MIME type, or description.</p></div></div>} right={<div className="dev-result">{matches.map(([ext,mime,label])=><div className="dev-card" key={ext}><h3>{ext}</h3><p className="dev-mono">{mime}</p><p>{label}</p></div>)}</div>} /></div>}
