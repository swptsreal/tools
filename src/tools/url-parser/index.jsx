import { useEffect, useMemo, useState } from 'react'
import { Button, Input, message } from 'antd'
import { Clipboard, Download, Link, RotateCcw } from 'lucide-react'
import { SplitWorkspace } from '../../shared/components/SplitWorkspace.jsx'
import { useToolActions } from '../../shared/components/ToolChromeContext.jsx'
import { copyText } from '../../shared/utils/clipboard.js'
import { downloadTextFile } from '../../shared/utils/download.js'
import { loadDraft, saveDraft } from '../../shared/utils/localDraft.js'
import { urlParserExample } from './example.js'
import './style.css'
const toolId='url-parser'
function parseUrl(value){try{const url=new URL(value); return { url, params:[...url.searchParams.entries()], rebuilt:url.toString(), error:'' }}catch(error){return { url:null, params:[], rebuilt:'', error:error.message }}}
export default function UrlParserTool(){const [value,setValue]=useState(()=>loadDraft(toolId,urlParserExample)); const [result,setResult]=useState(()=>parseUrl(value)); useEffect(()=>saveDraft(toolId,value),[value]); const run=()=>setResult(parseUrl(value)); const copy=async()=>{const res=await copyText(result.rebuilt); message[res.ok?'success':'warning'](res.message)}; const reset=()=>{setValue(urlParserExample); setResult(parseUrl(urlParserExample))}; const actions=useMemo(()=><><Button icon={<Link size={16}/>} type="primary" onClick={run}>Parse URL</Button><Button icon={<Clipboard size={16}/>} onClick={copy}>Copy</Button><Button icon={<Download size={16}/>} onClick={()=>downloadTextFile(result.rebuilt,'url.txt')}>Download</Button><Button icon={<RotateCcw size={16}/>} onClick={reset}>Example</Button></>,[value,result]); useToolActions(actions); const u=result.url; return <div className="tool-page developer-tool-page"><SplitWorkspace left={<Input.TextArea className="tool-editor" value={value} onChange={(e)=>setValue(e.target.value)} spellCheck={false}/>} right={<div className="dev-result">{result.error ? <div className="dev-card">{result.error}</div> : <><div className="dev-card"><h3>Parts</h3><p>Protocol</p><p className="dev-mono">{u.protocol}</p><p>Host</p><p className="dev-mono">{u.hostname}</p><p>Port</p><p className="dev-mono">{u.port || '(default)'}</p><p>Path</p><p className="dev-mono">{u.pathname}</p><p>Hash</p><p className="dev-mono">{u.hash}</p></div><div className="dev-card"><h3>Query Params</h3>{result.params.map(([k,v])=><p className="dev-mono" key={k}>{k} = {v}</p>)}</div><div className="dev-card"><h3>Rebuilt URL</h3><p className="dev-mono">{result.rebuilt}</p></div></>}</div>} /></div>}
