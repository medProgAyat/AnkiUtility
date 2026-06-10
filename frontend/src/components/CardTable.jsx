import React, { useEffect, useState } from 'react'
import NewCardModal from './NewCardModal'
import CSVImporter from './CSVImporter'
import { PlusIcon, PencilIcon, SaveIcon, TrashIcon, XIcon, CsvIcon } from '../icons'
import i18n, { t, tf, getLocale } from '../i18n'
import ConfirmModal from './ConfirmModal'

export default function CardTable({ projectId = null }){
  const [locale, setLocaleState] = useState(getLocale())
  useEffect(()=>{ const h = ()=> setLocaleState(getLocale()); window.addEventListener('app:lang-changed', h); return ()=> window.removeEventListener('app:lang-changed', h) }, [])
  const [cards, setCards] = useState([])
  const [decks, setDecks] = useState([])
  const [templates, setTemplates] = useState([])

  const [newFields, setNewFields] = useState([{ key: 'Front', value: '' }, { key: 'Back', value: '' }])
  const [newTags, setNewTags] = useState('')
  const [newDeckId, setNewDeckId] = useState('')
  const [newTemplateId, setNewTemplateId] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [confirmState, setConfirmState] = useState(null) // { type: 'soft'|'perm', ids: [] }

  // selection for delete (not for export) — all cards are exported by default
  const [selectedForDelete, setSelectedForDelete] = useState(new Set())
  function updateSelectionForCard(cardId, included){
    setSelectedForDelete(prev=>{
      const s = new Set(prev)
      if(included) s.add(cardId)
      else s.delete(cardId)
      return s
    })
  }
  const deletedCardsRef = React.useRef(new Map())
  const deleteTimersRef = React.useRef(new Map())

  function selectAllVisible(){ const ids = cards.map(c=>c.id); setSelectedForDelete(new Set(ids)) }
  function clearSelection(){ setSelectedForDelete(new Set()) }

  async function reloadData(){
    try{
      const qs = projectId ? `?project_id=${projectId}` : ''
      const [cardsRes, decksRes, templatesRes] = await Promise.all([
        fetch(`/api/cards${qs}`),
        fetch(`/api/decks${qs}`),
        fetch(`/api/templates${qs}`)
      ])
      const [cards, decks, templates] = await Promise.all([cardsRes.json(), decksRes.json(), templatesRes.json()])
      setCards(cards)
      setDecks(decks)
      setTemplates(templates)
      setSelectedForDelete(new Set())
    }catch(e){ /* ignore */ }
  }

  useEffect(()=>{ reloadData() }, [projectId])

  function saveCard(c){
    const payload = { fields: c.fields, tags: c.tags }
    if ('deck_id' in c) payload.deck_id = c.deck_id
    if ('template_id' in c) payload.template_id = c.template_id
    fetch('/api/cards/' + c.id, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(r=>r.json()).then(()=> window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('saved'), type: 'info' } })))
  }

  function addFieldRow(){ setNewFields([...newFields, { key: '', value: '' }]) }
  function removeFieldRow(i){ setNewFields(newFields.filter((_,idx)=>idx!==i)) }
  function setFieldKey(i, k){ const nf = [...newFields]; nf[i].key = k; setNewFields(nf) }
  function setFieldValue(i, v){ const nf = [...newFields]; nf[i].value = v; setNewFields(nf) }

  function fieldsToObject(fieldsArr){
    const out = {}
    for(const f of fieldsArr){ if(!f.key) return null; out[f.key] = f.value }
    return out
  }

  async function createCard(){
    const fields = fieldsToObject(newFields)
    if(!fields){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('all_fields_required'), type: 'error' } })); return }
    // check duplicate keys
    const keys = newFields.map(f=>f.key)
    const uniq = new Set(keys)
    if(uniq.size !== keys.length){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('field_names_unique'), type: 'error' } })); return }

    const payload = { fields, tags: newTags, deck_id: newDeckId || undefined, template_id: newTemplateId || undefined }
    const res = await fetch('/api/cards', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    if(res.ok){
      const data = await res.json()
      const created = { id: data.id, fields, tags: newTags, deck_id: newDeckId || null, template_id: newTemplateId || null }
      setCards([created, ...cards])
      // ensure new card is not selected for deletion
      setSelectedForDelete(prev=>{
        const s = new Set(prev)
        s.delete(created.id)
        return s
      })
      setNewFields([{ key: 'Front', value: '' }, { key: 'Back', value: '' }])
      setNewTags('')
      setNewDeckId('')
      setNewTemplateId('')
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('card.created'), type: 'info' } }))
    } else {
      const txt = await res.text()
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('create_failed', { txt }), type: 'error' } }))
    }
  }

  // existing card editing state
  const [editingId, setEditingId] = useState(null)
  const [editingFields, setEditingFields] = useState([])
  const [editingDeckId, setEditingDeckId] = useState('')
  const [editingTemplateId, setEditingTemplateId] = useState('')

  function startEdit(c){
    setEditingId(c.id)
    setEditingFields(Object.entries(c.fields || {}).map(([k,v])=>({ key:k, value:v })))
    setEditingDeckId(c.deck_id || '')
    setEditingTemplateId(c.template_id || '')
  }

  useEffect(()=>{
    function onUndo(e){
      const ids = (e.detail && e.detail.ids) || []
      if(!ids.length) return
      // only restore ids we have cached
      const toRestore = ids.map(id => deletedCardsRef.current.get(id)).filter(Boolean)
      if(!toRestore.length) return
      // call backend restore
      fetch('/api/cards/restore', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ids }) })
        .then(r=>r.json()).then(data => {
          // re-insert restored cards at top
          setCards(prev => [...toRestore, ...prev])
          // clear timers and cache
          ids.forEach(id => {
            const t = deleteTimersRef.current.get(id)
            if(t) clearTimeout(t)
            deleteTimersRef.current.delete(id)
            deletedCardsRef.current.delete(id)
          })
          window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('restored_cards', { n: toRestore.length }), type: 'info' } }))
        }).catch(()=> window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('restore_failed'), type: 'error' } })))
    }
    window.addEventListener('toast:undo', onUndo)
    return ()=> window.removeEventListener('toast:undo', onUndo)
  }, [])
  function updateEditField(i, key, value){ const ef = [...editingFields]; ef[i] = { key, value }; setEditingFields(ef) }
  function addEditField(){ setEditingFields([...editingFields, { key:'', value:'' }]) }
  function removeEditField(i){ setEditingFields(editingFields.filter((_,idx)=>idx!==i)) }
  async function saveEdit(){
    const obj = fieldsToObject(editingFields)
    if(!obj){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('all_fields_required'), type: 'error' } })); return }
    // unique keys
    const keys = editingFields.map(f=>f.key)
    if(new Set(keys).size !== keys.length){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('field_names_unique'), type: 'error' } })); return }
    const payload = { fields: obj, deck_id: editingDeckId || undefined, template_id: editingTemplateId || undefined }
    const res = await fetch('/api/cards/' + editingId, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    if(res.ok){
      setCards(cards.map(c => c.id === editingId ? { ...c, fields: obj, deck_id: editingDeckId || null, template_id: editingTemplateId || null } : c ))
      setEditingId(null)
      setEditingFields([])
      setEditingDeckId('')
      setEditingTemplateId('')
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('saved'), type: 'info' } }))
    } else {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('save_failed'), type: 'error' } }))
    }
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h3 style={{margin:0}}>{t('cards.title')}</h3>
        <div>
          <button className="button small" onClick={()=>setShowNewModal(true)} style={{display:'inline-flex', alignItems:'center', gap:8, height:36, padding:'6px 10px', borderRadius:8}}><PlusIcon w={14} h={14} /> {t('card.new')}</button>
          <button className="button small" onClick={()=>setShowImportModal(true)} style={{display:'inline-flex', alignItems:'center', gap:8, marginLeft:8, height:36, padding:'6px 10px', borderRadius:8}}><CsvIcon w={14} h={14} /> {t('import_csv.button')}</button>
        </div>
      </div>

      {/* New card modal (opened via + New Card) */}
      <NewCardModal open={showNewModal} onClose={()=>setShowNewModal(false)} onCreate={async (payload)=>{
        // reuse existing creation flow but accept payload
        const res = await fetch('/api/cards', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
        if(res.ok){
          const data = await res.json()
          const created = { id: data.id, fields: payload.fields, tags: payload.tags || '', deck_id: payload.deck_id || null, template_id: payload.template_id || null }
          setCards([created, ...cards])
          setSelectedForDelete(prev=>{ const s = new Set(prev); s.delete(created.id); return s })
          window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('card.created'), type: 'info' } }))
        } else {
          const txt = await res.text()
          window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('create_failed', { txt }), type: 'error' } }))
        }
        setShowNewModal(false)
      }} decks={decks} templates={templates} />

      {showImportModal && (
        <div onClick={(e)=>{ if(e.target === e.currentTarget) setShowImportModal(false) }} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2200}}>
          <div style={{width:'90%', maxWidth:1000, maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:12, padding:18}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <h3 style={{margin:0}}>{t('import_csv.title')}</h3>
              <div>
                <button className="action-btn ghost" onClick={()=>setShowImportModal(false)}>{t('card.close')}</button>
              </div>
            </div>
            <CSVImporter projectId={projectId} onImported={(data)=>{ setShowImportModal(false); reloadData(); }} />
          </div>
        </div>
      )}

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <div>
          <button className="small" onClick={selectAllVisible}>Select all visible</button>
          <button className="small" onClick={clearSelection} style={{marginLeft:8}}>Clear selection</button>
          <button className="small" onClick={async()=>{
            // delete selected (batch) — open confirm modal
            const ids = Array.from(selectedForDelete)
            if(ids.length===0){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('no_cards_selected'), type: 'info' } })); return }
            setConfirmState({ type: 'soft', ids })
          }} style={{marginLeft:8, display:'inline-flex', alignItems:'center', gap:8}}><TrashIcon w={14} h={14} /> Delete selected</button>

          <button className="small" onClick={async()=>{
            // permanently delete selected — open confirm modal
            const ids = Array.from(selectedForDelete)
            if(ids.length===0){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('no_cards_selected'), type: 'info' } })); return }
            setConfirmState({ type: 'perm', ids })
          }} style={{marginLeft:8, display:'inline-flex', alignItems:'center', gap:8}}><TrashIcon w={14} h={14} /> Permanently delete</button>
        </div>
        <div style={{fontSize:13}}>
          Selected for delete: {selectedForDelete.size}
        </div>
      </div>

      <table className="table card-table">
        <thead>
          <tr>
            <th style={{width:36}}><input type="checkbox" onChange={e=> e.target.checked ? selectAllVisible() : clearSelection()} checked={selectedForDelete.size>0 && selectedForDelete.size===cards.length && cards.length>0} aria-label="Select all" /></th>
            <th style={{width:80}}>ID</th>
            <th>Fields</th>
            <th style={{width:140}}>Tags</th>
            <th style={{width:160}}>Deck / Template</th>
            <th style={{width:180}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cards.map(c => (
            <tr key={c.id}>
              <td><input aria-label={`select-${c.id}`} type="checkbox" checked={selectedForDelete.has(c.id)} onChange={e=> updateSelectionForCard(c.id, e.target.checked)} /></td>
              <td><div style={{fontWeight:700}}>{c.id}</div></td>
              <td>
                {editingId === c.id ? (
                  <div>
                    {editingFields.map((f,i)=> (
                      <div key={i} style={{display:'flex', gap:8, marginBottom:4}}>
                        <div style={{position:'relative', width:160}}>
                          <input className="float-input" id={`edit-key-${i}`} value={f.key} onChange={e=>updateEditField(i, e.target.value, f.value)} style={{width:140}} />
                          <label htmlFor={`edit-key-${i}`} className={`floating-label ${f.key ? 'filled' : ''}`} />
                          <button className="clear-btn" aria-label={`clear-key-${i}`} onClick={()=>updateEditField(i, '', f.value)}>&times;</button>
                        </div>
                        <div style={{position:'relative', flex:1}}>
                          <input className="float-input" id={`edit-val-${i}`} value={f.value} onChange={e=>updateEditField(i, f.key, e.target.value)} style={{flex:1}} />
                          <label htmlFor={`edit-val-${i}`} className={`floating-label ${f.value ? 'filled' : ''}`} />
                          <button className="clear-btn" aria-label={`clear-val-${i}`} onClick={()=>updateEditField(i, f.key, '')}>&times;</button>
                        </div>
                        <button onClick={()=>removeEditField(i)}>Remove</button>
                      </div>
                    ))}
                    <div><button onClick={addEditField}>Add field</button></div>
                  </div>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:6}}>
                    {Object.entries(c.fields || {}).map(([k,v])=> (
                      <div key={k} style={{display:'flex', gap:8, alignItems:'center'}}>
                        <div className="chip" style={{background:'#fff', border:'1px solid var(--border)'}}><strong style={{marginRight:6}}>{k}:</strong> <span style={{color:'#0f172a'}}>{v}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </td>
              <td>
                {editingId === c.id ? (
                  <div style={{position:'relative', width:180}}>
                    <input className="float-input" id={`ctags-${c.id}`} value={c.tags||''} onChange={e=>{ c.tags = e.target.value; setCards([...cards]) }} style={{padding:8, borderRadius:8, width:'100%'}} />
                    <label htmlFor={`ctags-${c.id}`} className={`floating-label ${c.tags ? 'filled' : ''}`} />
                    <button className="clear-btn" aria-label={`clear-tags-${c.id}`} onClick={()=>{ c.tags=''; setCards([...cards]) }}>&times;</button>
                  </div>
                ) : (
                  <span className="badge">{c.tags || '-'}</span>
                )}
              </td>
              <td>
                {editingId === c.id ? (
                  <select value={editingDeckId} onChange={e=>setEditingDeckId(e.target.value)} style={{padding:6, borderRadius:6}}>
                    <option value="">(default)</option>
                    {decks.map(d=> (<option key={d.id} value={d.id}>{d.name} ({d.id})</option>))}
                  </select>
                ) : (
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <div style={{fontWeight:600}}>{(decks.find(dd=>dd.id===c.deck_id)||{}).name || ''}</div>
                    <div style={{fontSize:12, color:'var(--muted)'}}>{(templates.find(tt=>tt.id===c.template_id)||{}).name || ''}</div>
                  </div>
                )}
              </td>
              <td>
                {editingId === c.id ? (
                  <>
                    <button className="action-btn ghost" onClick={saveEdit} style={{display:'inline-flex', alignItems:'center', gap:8}}><SaveIcon w={14} h={14} /> Save</button>
                    <button className="action-btn ghost" onClick={()=>{ setEditingId(null); setEditingFields([]) }} style={{marginLeft:8}}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="action-btn ghost" onClick={()=>startEdit(c)} style={{display:'inline-flex', alignItems:'center', gap:8}}><PencilIcon w={14} h={14} /> {t('edit') || 'Edit'}</button>
                    <button className="action-btn ghost" onClick={()=>setConfirmState({ type: 'soft', ids: [c.id] })} style={{marginLeft:8, display:'inline-flex', alignItems:'center', gap:8}} aria-label={`delete-${c.id}`}><TrashIcon w={14} h={14} /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmState && (
        <ConfirmModal open={true}
          title={confirmState.type === 'perm' ? t('permanently_delete') : t('delete_selected')}
          message={confirmState.type === 'perm' ? tf('confirm.perm_delete_cards', { n: confirmState.ids.length }) : tf('confirm.delete_cards', { n: confirmState.ids.length })}
          onConfirm={async ()=>{
            const ids = confirmState.ids
            setConfirmState(null)
            try{
              if(confirmState.type === 'perm'){
                const res = await fetch('/api/cards/permanent-delete', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ids }) })
                if(!res.ok) throw new Error('permanent delete failed')
                setCards(prev => prev.filter(c=> !ids.includes(c.id)))
                setSelectedForDelete(new Set())
                ids.forEach(id=>{
                  const t = deleteTimersRef.current.get(id)
                  if(t) clearTimeout(t)
                  deleteTimersRef.current.delete(id)
                  deletedCardsRef.current.delete(id)
                })
                window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('permanently_deleted', { n: ids.length }), type: 'info' } }))
              } else {
                // soft-delete
                const toDelete = cards.filter(c => ids.includes(c.id))
                toDelete.forEach(c => deletedCardsRef.current.set(c.id, c))
                const res = await fetch('/api/cards/batch-delete', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ids }) })
                if(!res.ok) throw new Error('batch delete failed')
                setCards(prev => prev.filter(c=> !ids.includes(c.id)))
                setSelectedForDelete(new Set())
                const undoDuration = 8000
                ids.forEach(id => {
                  const t = setTimeout(()=>{
                    deletedCardsRef.current.delete(id)
                    deleteTimersRef.current.delete(id)
                  }, undoDuration)
                  deleteTimersRef.current.set(id, t)
                })
                window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: tf('deleted_cards_info', { n: ids.length }), type: 'info', undo_ids: ids, duration: undoDuration } }))
              }
            }catch(e){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('delete_failed'), type: 'error' } })) }
          }}
          onCancel={()=>setConfirmState(null)}
        />
      )}

    </div>

  )
}
