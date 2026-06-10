import React, {useEffect, useState, useRef} from 'react'
import { t, tf, getLocale } from '../i18n'

// LivePreview shows a rendered card using server-side preview endpoint.
export default function LivePreview({ projectId = null }){
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [fields, setFields] = useState({ Front: t('preview.example_front'), Back: t('preview.example_back') })
  const [html, setHtml] = useState(tf('preview.placeholder_html', { txt: t('preview.placeholder') }))
  const [frontHtml, setFrontHtml] = useState(null)
  const [backHtml, setBackHtml] = useState(null)
  const [side, setSide] = useState('front')
  const [previewStatus, setPreviewStatus] = useState('')
  const debounceRef = useRef(null)
  const [locale, setLocaleState] = useState(getLocale())

  useEffect(()=>{
    const h = () => setLocaleState(getLocale())
    window.addEventListener('app:lang-changed', h)
    return ()=> window.removeEventListener('app:lang-changed', h)
  }, [])

  async function loadTemplates(){
    const qs = projectId ? `?project_id=${projectId}` : ''
    console.log('[LivePreview] loading templates with qs=', qs)
    try{
      const r = await fetch('/api/templates' + qs)
      console.log('[LivePreview] templates fetch status', r.status)
      if(!r.ok) throw new Error('templates fetch failed')
      const data = await r.json()
      console.log('[LivePreview] templates response', data)
      const list = Array.isArray(data) ? data : []
      console.log('[LivePreview] templates list normalized', list)
      setTemplates(list)

      if(list && list.length){
        console.log('[LivePreview] selecting first template id=', list[0].id)
        setSelectedTemplateId(Number(list[0].id))
        // if template HTML is empty, use simple Front/Back fallback
        if(!list[0].html || !list[0].html.trim()){
          console.log('[LivePreview] template html empty; using default front/back sample')
          const sampleHtml = '<div>{{Front}}</div><hr id="answer"><div>{{Back}}</div>'
          setFields({ Front: t('preview.example_front'), Back: t('preview.example_back') })
          // run preview for sample
          await doPreviewWithFallback(sampleHtml, list[0].css || '')
        } else {
          // attempt to extract fields and preserve any existing values for the same names
          const names = extractFields(list[0].html)
          console.log('[LivePreview] detected template fields', names)
          if(names.length){
          setFields(prev => {
            const merged = {}
            names.forEach(n => {
              if(prev && prev[n]) merged[n] = prev[n]
              else if(n.toLowerCase() === 'front') merged[n] = t('preview.example_front')
              else if(n.toLowerCase() === 'back') merged[n] = t('preview.example_back')
              else merged[n] = ''
            })
            console.log('[LivePreview] initial fields set', merged)
            return merged
          })
          // request preview for the selected template
          await doPreview()
          }
        }
      } else {
        // no templates: prepare a sample template so preview is visible
        const sampleHtml = '<div>{{Front}}</div><hr id="answer"><div>{{Back}}</div>'
        console.log('[LivePreview] no templates; using sample template')
        setTemplates([])
        setSelectedTemplateId(null)
        setFields({ Front: t('preview.example_front'), Back: t('preview.example_back') })
        // run preview for sample
        await doPreviewWithFallback(sampleHtml)
      }
    }catch(err){
      console.error('[LivePreview] templates load failed', err)
      setTemplates([])
      setHtml(tf('preview.error_html', { err: t('preview.templates_load_failed') }))
    }
  }

  useEffect(()=>{ loadTemplates() }, [projectId])

  // listen for external template updates and reload templates/preview
  useEffect(()=>{
    function onUpdated(e){
      console.log('[LivePreview] received template:updated event', e && e.detail)
      loadTemplates()
    }
    window.addEventListener('template:updated', onUpdated)
    return ()=> window.removeEventListener('template:updated', onUpdated)
  }, [projectId])

  useEffect(()=>{
    // auto-preview when template or fields change, debounced
    if(debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(()=> doPreview(), 300)
    return ()=> { if(debounceRef.current) clearTimeout(debounceRef.current) }
  }, [selectedTemplateId, JSON.stringify(fields)])

  function extractFields(html){
    if(!html) return []
    const re = /\{\{\s*([^\}\s]+)\s*\}\}/g
    const names = []
    let m
    while((m = re.exec(html)) !== null){
      if(!names.includes(m[1])) names.push(m[1])
    }
    return names
  }

  async function doPreview(){
    const tpl = templates.find(t => t.id === Number(selectedTemplateId)) || templates[0]
    if(!tpl) return
    const sampleHtml = '<div>{{Front}}</div><hr id="answer"><div>{{Back}}</div>'
    const htmlToSend = tpl.html && tpl.html.trim() ? tpl.html : sampleHtml
    await doPreviewWithFallback(htmlToSend, tpl.css || '')
  }

  async function doPreviewWithFallback(htmlPayload, cssPayload=''){
    const payload = { html: htmlPayload, css: cssPayload, fields }
    console.log('[LivePreview] sending preview payload', payload)
    try{
      const res = await fetch('/api/preview', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      console.log('[LivePreview] preview fetch status', res.status)
      if(!res.ok){
        const text = await res.text()
        console.error('[LivePreview] preview error', text)
        setHtml(tf('preview.error_html', { err: text }))
        setFrontHtml(null)
        setBackHtml(null)
        setPreviewStatus(tf('preview.request_failed_with', { err: text }))
        return
      }
      const data = await res.json()
      console.log('[LivePreview] preview response data', data)
      if(data.error){
        setHtml(tf('preview.error_html', { err: data.error }))
        setFrontHtml(null)
        setBackHtml(null)
        setPreviewStatus(tf('preview.render_error', { err: data.error }))
      } else {
        if(data.html) setHtml(data.html)
        setFrontHtml(data.front_html || null)
        setBackHtml(data.back_html || null)
        console.log('[LivePreview] front/back html set', {front: data.front_html, back: data.back_html})
        setPreviewStatus(t('preview.updated'))
      }
    }catch(e){ console.error('[LivePreview] preview failed', e); setHtml(tf('preview.error_html', { err: t('preview.request_failed') })); setFrontHtml(null); setBackHtml(null); setPreviewStatus(t('preview.request_exception')) }
  }

  function updateField(key, value){ setFields(prev => ({ ...prev, [key]: value })) }

  return (
    <div style={{display:'flex', gap:12}}>
      <div style={{width:360}} className="panel">
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <label style={{fontSize:13}}>{t('preview.template_label')}</label>
          <select value={selectedTemplateId||''} onChange={e=>setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}>
            {Array.isArray(templates) ? templates.map(tpl=> (<option key={tpl.id} value={tpl.id}>{tpl.name}</option>)) : null}
          </select>
        </div>

        <div style={{marginTop:12}}>
          <h4 style={{margin:0}}>{t('preview.fields_title')}</h4>
          <div className="note">{t('preview.fields_helper')}</div>
          <div style={{marginTop:8}}>
            {Object.keys(fields).length === 0 && <div className="note">{t('preview.no_fields')}</div>}
            {Object.keys(fields).map(k => (
              <div key={k} style={{display:'flex', gap:8, marginBottom:6}}>
                <div style={{width:110, color:'#444'}}>{k}</div>
                <div style={{position:'relative', flex:1}}>
                  <input className="float-input" id={`preview-field-${k}`} value={fields[k]||''} onChange={e=>updateField(k, e.target.value)} style={{flex:1}} />
                  <label htmlFor={`preview-field-${k}`} className={`floating-label ${fields[k] ? 'filled' : ''}`} />
                  <button className="clear-btn" aria-label={`clear-preview-${k}`} onClick={()=>updateField(k, '')}>&times;</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginTop:8}} className="note">{tf('preview.templates_status', { n: Array.isArray(templates) ? templates.length : 0, sel: selectedTemplateId || t('preview.selected_sample') })}</div>

        <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
          <div style={{display:'flex', gap:8}}>
            <button className={`small ${side==='front' ? 'button' : 'button secondary'}`} onClick={()=>setSide('front')}>{t('preview.front')}</button>
            <button className={`small ${side==='back' ? 'button' : 'button secondary'}`} onClick={()=>setSide('back')}>{t('preview.back')}</button>
          </div>
          <div style={{marginLeft:'auto'}}>
            <button className="button" onClick={async ()=>{ console.log('[LivePreview] manual refresh: reloading templates'); await loadTemplates(); }}>{t('preview.refresh')}</button>
            <button className="button secondary" onClick={()=>{ setFields({ Front: t('preview.example_front'), Back: t('preview.example_back') }); }}>{t('preview.reset')}</button>
          </div>
        </div>

        {previewStatus && <div style={{marginTop:8}} className="note">{previewStatus}</div>}
      </div>

      <div style={{flex:1, border:'1px solid var(--border)', borderRadius:6, overflow:'hidden'}}>
        <iframe title="preview" style={{width:'100%', height:'70vh', border:0}} srcDoc={side === 'back' && backHtml ? backHtml : (frontHtml || html)} />
      </div>
    </div>
  )
}
