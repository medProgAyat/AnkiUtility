import React, { useState, useEffect } from 'react'
import { PlusIcon, SaveIcon, XIcon } from '../icons'
import i18n, { t, getLocale } from '../i18n'

export default function NewCardModal({ open, onClose, onCreate, decks = [], templates = [] }){
  const [locale, setLocaleState] = useState(getLocale())
  useEffect(()=>{ const h = ()=> setLocaleState(getLocale()); window.addEventListener('app:lang-changed', h); return ()=> window.removeEventListener('app:lang-changed', h) }, [])
  const [fields, setFields] = useState([{ key: 'Front', value: '' }, { key: 'Back', value: '' }])
  const [tags, setTags] = useState('')
  const [deckId, setDeckId] = useState('')
  const [templateId, setTemplateId] = useState('')

  // helpers for tag chips
  const tagList = tags ? tags.split(',').map(s=>s.trim()).filter(Boolean) : []
  function removeTag(t){ setTags(tagList.filter(x=>x!==t).join(',')) }
  function addTagFromInput(){ const v = tags.trim(); /* no-op, tags typed directly */ }

  function addField(){ setFields(f => [...f, { key:'', value:'' }]) }
  function removeField(i){ setFields(f => f.filter((_,idx)=>idx!==i)) }
  function setFieldKey(i, k){ setFields(f => { const nf = [...f]; nf[i].key = k; return nf }) }
  function setFieldValue(i, v){ setFields(f => { const nf = [...f]; nf[i].value = v; return nf }) }

  function handleCreate(){
    // validate
    const out = {}
    for(const f of fields){ if(!f.key){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('all_fields_required'), type: 'error' } })); return } out[f.key] = f.value }
    const keys = fields.map(f=>f.key)
    if(new Set(keys).size !== keys.length){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('field_names_unique'), type: 'error' } })); return }
    const payload = { fields: out, tags, deck_id: deckId || undefined, template_id: templateId || undefined }
    onCreate && onCreate(payload)
    // reset and close
    setFields([{ key: 'Front', value: '' }, { key: 'Back', value: '' }])
    setTags('')
    setDeckId('')
    setTemplateId('')
    onClose && onClose()
  }

  if(!open) return null

  return (
    <div onClick={e => { if(e.target === e.currentTarget) onClose && onClose() }} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
      <div style={{width:760, maxWidth:'95%', background:'#fff', borderRadius:10, padding:18}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <h3 style={{margin:0}}>{t('card.new')}</h3>
          <div>
            <button className="action-btn ghost" onClick={onClose} style={{display:'inline-flex', alignItems:'center', gap:8}}><XIcon w={14} h={14} /> {t('card.close')}</button>
          </div>
        </div>

        <div style={{display:'flex', gap:16}}>
          <div style={{flex:1}}>
            {fields.map((f,i)=> (
              <div key={i} className="field-row">
                <div className="field-name">{f.key || `${t('card.field_name_default')} ` + (i+1)}</div>
                <div style={{position:'relative', flex:1}}>
                  <input className="field-value float-input" id={`field-${i}`} placeholder={t('card.field_value_placeholder')} value={f.value} onChange={e=>setFieldValue(i, e.target.value)} />
                  <label htmlFor={`field-${i}`} className={`floating-label ${f.value ? 'filled' : ''}`}></label>
                  <button className="clear-btn" aria-label={`clear-field-${i}`} onClick={()=>setFieldValue(i, '')}>&times;</button>
                </div>
                <button className="small" onClick={()=>removeField(i)} aria-label={`remove-field-${i}`}>{t('table.delete_selected')}</button>
              </div>
            ))}
            <div style={{marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <button className="small" onClick={addField} style={{display:'inline-flex', alignItems:'center', gap:8}}><PlusIcon w={12} h={12} /> {t('card.add_field')}</button>
              <div className="helper">Field names are the template placeholders (e.g. Front, Back)</div>
            </div>
          </div>

          <div style={{width:260}}>
            <div style={{marginBottom:8}}>
              <label className="note">{t('card.tags_label')}</label>
              <div style={{position:'relative'}}>
              <input id="card-tags" className="float-input" value={tags} onChange={e=>setTags(e.target.value)} style={{width:'100%'}} />
              <label htmlFor="card-tags" className={`floating-label ${tags ? 'filled' : ''}`} style={{left:8, top:8}}>{t('card.tags_label')}</label>
              <button className="clear-btn" aria-label="clear-tags" onClick={()=>setTags('')}>&times;</button>
            </div>
              <div className="chips">
                {tagList.map(t=> (
                  <div className="chip" key={t}>{t} <button className="remove" onClick={()=>removeTag(t)} aria-label={`remove-tag-${t}`}>×</button></div>
                ))}
              </div>
            </div>
            <div style={{marginBottom:8}}>
              <label className="note">Deck</label>
              <select value={deckId} onChange={e=>setDeckId(e.target.value)} style={{width:'100%'}}>
                <option value="">(default)</option>
                {decks.map(d=> (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div style={{marginBottom:8}}>
              <label className="note">Template</label>
              <select value={templateId} onChange={e=>setTemplateId(e.target.value)} style={{width:'100%'}}>
                <option value="">(default)</option>
                {templates.map(t=> (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>
            <div style={{marginTop:18, display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="button secondary" onClick={onClose}>{t('card.cancel')}</button>
              <button className="button" onClick={handleCreate} style={{display:'inline-flex', alignItems:'center', gap:8}}><SaveIcon w={14} h={14} /> {t('card.create')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
