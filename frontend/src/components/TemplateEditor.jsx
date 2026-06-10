import React from 'react'

import {useEffect, useState} from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { html as htmlLang } from '@codemirror/lang-html'
import { css as cssLang } from '@codemirror/lang-css'
import { autocompletion } from '@codemirror/autocomplete'
import { t } from '../i18n'

export default function TemplateEditor({ projectId = null, newTemplate = false }){
  const [templates, setTemplates] = useState([])
  const [current, setCurrent] = useState({html: '', css: '', name: ''})

  useEffect(()=>{
    const qs = projectId ? `?project_id=${projectId}` : ''
    fetch('/api/templates' + qs).then(r=>r.json()).then(list=>{
      setTemplates(list || [])
      if(newTemplate){
        setCurrent({ id: null, name: '', html: '', css: '' })
      } else if(list && list[0]){
        setCurrent(list[0])
      } else if(!list || !list.length){
        setCurrent({ id: null, name: '', html: '', css: '' })
      }
    })
  }, [projectId, newTemplate])

  async function save(){
    const url = current.id ? '/api/templates/' + current.id : '/api/templates'
    const method = current.id ? 'PUT' : 'POST'
    const payload = {...current}
    // if creating, attach to selected project by assigning deck if available
    if(!current.id && projectId && templates.length){
      // attempt to attach to first deck in project
      payload.deck_id = templates[0]?.deck_id || undefined
    }
    try{
      const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const data = await res.json()
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('template.saved'), type: 'info' } }))
      // notify other components (LivePreview) to reload templates and refresh preview
      try{ window.dispatchEvent(new CustomEvent('template:updated', { detail: { id: data.id || current.id } })) }catch(e){}
      return data
    }catch(e){
      console.error('template save failed', e)
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('template.save_failed'), type: 'error' } }))
      throw e
    }
  }

  // bind Ctrl+S / Cmd+S to save while this editor is mounted
  React.useEffect(()=>{
    function onKey(e){
      const isSave = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')
      if(isSave){
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [current])

  return (
    <div className="panel">
      <h3>{t('template_editor.title')}</h3>
      <div style={{marginBottom:8}}>
        <label htmlFor="template-name" style={{fontSize:13}}>{t('template.name_label') || 'Name'}</label>
        <div style={{position:'relative', display:'inline-block', marginLeft:8}}>
          <input id="template-name" className="float-input" value={current.name||''} onChange={e=>setCurrent({...current, name: e.target.value})} style={{width:320}} />
          <label htmlFor="template-name" className={`floating-label ${current.name ? 'filled' : ''}`} />
          <button className="clear-btn" aria-label="clear-template-name" onClick={()=>setCurrent({...current, name: ''})}>&times;</button>
        </div>
      </div>

      <div style={{marginBottom:8}}>
        <label style={{fontSize:13}}>{t('template.html_label') || 'HTML'}</label>
        <div className="code-area" dir="ltr" style={{marginTop:8}}>
          <CodeMirror
            value={current.html||''}
            height="200px"
            extensions={[htmlLang(), autocompletion()]}
            onChange={(value)=>setCurrent({...current, html: value})}
          />
        </div>
      </div>

      <div style={{marginBottom:8}}>
        <label style={{fontSize:13}}>{t('template.css_label') || 'CSS'}</label>
        <div className="code-area" dir="ltr" style={{marginTop:8}}>
          <CodeMirror
            value={current.css||''}
            height="140px"
            extensions={[cssLang(), autocompletion()]}
            onChange={(value)=>setCurrent({...current, css: value})}
          />
        </div>
      </div>

      <div style={{marginTop:8}}>
        <button className="button" onClick={save}>{t('save_template')}</button>
      </div>
    </div>
  )
}
