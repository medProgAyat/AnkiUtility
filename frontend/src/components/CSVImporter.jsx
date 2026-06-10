import React, { useState, useRef, useEffect } from 'react'
import CSVPreviewModal from './CSVPreviewModal'
import i18n, { t, getLocale } from '../i18n'

export default function CSVImporter({ projectId = null }){
  const [locale, setLocaleState] = useState(getLocale())
  useEffect(()=>{ const h = ()=> setLocaleState(getLocale()); window.addEventListener('app:lang-changed', h); return ()=> window.removeEventListener('app:lang-changed', h) }, [])
  const [dragOver, setDragOver] = useState(false)
  const [columns, setColumns] = useState([])
  const [sample, setSample] = useState([])
  const [rows, setRows] = useState([])
  const [mapping, setMapping] = useState({})
  const [showPreview, setShowPreview] = useState(false)
  const [decks, setDecks] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedDeckId, setSelectedDeckId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const fileRef = useRef(null)

  useEffect(()=>{
    const qs = projectId ? `?project_id=${projectId}` : ''
    fetch('/api/decks' + qs).then(r=>r.json()).then(setDecks).catch(()=>{})
    fetch('/api/templates' + qs).then(r=>r.json()).then(setTemplates).catch(()=>{})
  }, [projectId])

  function handleFile(f){
    if(!f) return
    const form = new FormData()
    form.append('file', f)
    fetch('/api/imports/upload', { method: 'POST', body: form })
      .then(r => r.json())
      .then(data => {
        if (data.error) { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('upload_error', { err: data.error }), type: 'error' } })); return }
        setColumns(data.columns || [])
        setSample(data.sample || [])
        setRows(data.rows || [])
        // enhanced detection heuristics for mapping
        const defaultMap = {}
        const lowerCols = (data.columns||[]).map(c=>c.toLowerCase())
        if((data.columns||[]).length === 2){
          defaultMap[data.columns[0]] = 'Front'
          defaultMap[data.columns[1]] = 'Back'
        } else {
          (data.columns||[]).forEach(c=>{
            const lc = c.toLowerCase()
            if(/front|question|q|term|prompt|source|word|text|phrase/.test(lc)) defaultMap[c] = 'Front'
            else if(/back|answer|a|definition|translation|target|meaning/.test(lc)) defaultMap[c] = 'Back'
            else if(/eng|_en|en_|english/.test(lc)) defaultMap[c] = 'Front'
            else if(/de|_de|de_|german/.test(lc)) defaultMap[c] = 'Back'
          })
          if(!Object.values(defaultMap).length){
            const maybeFront = (data.columns||[]).find(c=> /question|term|text|word/.test(c.toLowerCase()))
            const maybeBack = (data.columns||[]).find(c=> /answer|definition|translation|meaning/.test(c.toLowerCase()))
            if(maybeFront && maybeBack){ defaultMap[maybeFront] = 'Front'; defaultMap[maybeBack] = 'Back' }
          }
        }
        setMapping(defaultMap)
        setShowPreview(true)
        // notify UI that upload succeeded (tests expect a dispatch)
        try{ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('import_preview.title'), type: 'info' } })) }catch(e){}
      })
      .catch(err => window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('upload_failed', { err: err.message || String(err) }), type: 'error' } })))
  }

  function onChange(e){ handleFile(e.target.files?.[0]) }
  function onDrop(e){ e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; handleFile(f) }

  // applyImport now accepts optional mapped_rows (editable table) as second arg
  async function applyImport(localMapping, mapped_rows){
    try{
      const payload = mapped_rows ? { mapped_rows, deck_id: selectedDeckId || undefined, template_id: selectedTemplateId || undefined } : { rows, mapping: localMapping, deck_id: selectedDeckId || undefined, template_id: selectedTemplateId || undefined }
      const res = await fetch('/api/imports/apply', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const data = await res.json()
      if(res.ok){
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('imported_cards', { n: data.created.length }), type: 'info' } }))
        setShowPreview(false)
      } else {
        const errMsg = data && data.error ? data.error : JSON.stringify(data)
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('import_failed', { err: errMsg }), type: 'error' } }))
      }
    }catch(e){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('import_failed', { err: e.message || String(e) }), type: 'error' } })) }
  }

  return (
    <div className="panel" onDragOver={e=>{ e.preventDefault(); setDragOver(true) }} onDragLeave={e=>{ e.preventDefault(); setDragOver(false) }} onDrop={onDrop}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div>
          <strong>{t('import_csv.title')}</strong>
          <div className="helper">{t('import_csv.helper')}</div>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".csv" onChange={onChange} style={{display:'none'}} />
          <button className="button" onClick={()=>fileRef.current && fileRef.current.click()}>{t('choose_file') || 'Choose file'}</button>
        </div>
      </div>

      <div style={{marginTop:12, padding:18, borderRadius:10, border: dragOver ? '2px dashed var(--accent)' : '1px dashed var(--border)', background: dragOver ? 'rgba(37,99,235,0.03)' : 'transparent' }}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{width:48, height:48, borderRadius:12, background:'linear-gradient(180deg,#eef2ff,#e0f2ff)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)'}}>CSV</div>
          <div>
            <div style={{fontWeight:700}}>{t('import_csv.drag')}</div>
            <div className="helper">{t('import_csv.helper')}</div>
          </div>
        </div>
      </div>

      <CSVPreviewModal open={showPreview} onClose={()=>setShowPreview(false)} columns={columns} sample={sample} rows={rows} mapping={mapping} onMappingChange={setMapping} onApply={(m, mapped_rows)=> applyImport(m, mapped_rows)} decks={decks} templates={templates} selectedDeckId={selectedDeckId} setSelectedDeckId={setSelectedDeckId} selectedTemplateId={selectedTemplateId} setSelectedTemplateId={setSelectedTemplateId} />
    </div>
  )
}
