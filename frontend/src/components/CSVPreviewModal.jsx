import React, { useState, useEffect } from 'react'
import i18n, { t, getLocale } from '../i18n'

export default function CSVPreviewModal({ open, onClose, columns = [], sample = [], rows = [], mapping = {}, onMappingChange, onApply, decks = [], templates = [] , selectedDeckId, setSelectedDeckId, selectedTemplateId, setSelectedTemplateId }){
  const [locale, setLocaleState] = useState(getLocale())
  useEffect(()=>{ const h = ()=> setLocaleState(getLocale()); window.addEventListener('app:lang-changed', h); return ()=> window.removeEventListener('app:lang-changed', h) }, [])
  const [localMapping, setLocalMapping] = useState(mapping || {})
  const [tab, setTab] = useState('mapping')
  const [localRows, setLocalRows] = useState([]) // { __included: bool, __original: row, mapped: {field: value} }

  useEffect(()=>{
    setLocalMapping(mapping || {})
  }, [mapping])

  useEffect(()=>{
    // initialize localRows from rows + mapping
    const mf = Object.values(localMapping).filter(Boolean)
    const lr = (rows||[]).map(r => {
      const mapped = {}
      Object.entries(localMapping||{}).forEach(([csv, field])=>{ if(field) mapped[field] = r[csv] })
      return { __included: true, __original: r, mapped }
    })
    setLocalRows(lr)
  }, [rows, JSON.stringify(localMapping)])

  function updateMap(csvCol, val){ const nm = {...localMapping}; if(!val) delete nm[csvCol]; else nm[csvCol] = val; setLocalMapping(nm); onMappingChange && onMappingChange(nm)
    // also update localRows mapped keys
    setLocalRows(prev => prev.map(r => {
      const mapped = {}
      Object.entries(nm).forEach(([csv, field])=>{ if(field) mapped[field] = r.__original[csv] })
      return { ...r, mapped }
    }))
  }

  function updateMappedCell(rowIdx, field, value){ setLocalRows(prev => { const copy = [...prev]; copy[rowIdx] = { ...copy[rowIdx], mapped: { ...copy[rowIdx].mapped, [field]: value } }; return copy }) }
  function toggleInclude(rowIdx){ setLocalRows(prev => { const copy = [...prev]; copy[rowIdx] = { ...copy[rowIdx], __included: !copy[rowIdx].__included }; return copy }) }
  function removeSelected(){ setLocalRows(prev => prev.filter(r=> !r.__selected)) }
  function selectAll(){ setLocalRows(prev => prev.map(r=> ({...r, __included: true}))) }
  function deselectAll(){ setLocalRows(prev => prev.map(r=> ({...r, __included: false}))) }

  function apply(){
    // prepare mapped_rows array for backend
    const toImport = localRows.filter(r=> r.__included).map(r=> r.mapped)
    onApply && onApply(localMapping, toImport)
  }

  if(!open) return null
  const derivedFields = Array.from(new Set(Object.values(localMapping).filter(Boolean)))

  return (
    <div onClick={e => { if(e.target === e.currentTarget) onClose && onClose() }} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2100}}>
      <div style={{width:'90%', maxWidth:1100, maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:12, padding:18}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <h3 style={{margin:0}}>{t('import_preview.title')}</h3>
          <div>
            <button className="action-btn ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div style={{display:'flex', gap:12, marginBottom:12}}>
          <div style={{display:'flex', gap:8}}>
          <button className={`small ${tab==='mapping' ? 'button' : 'button secondary'}`} onClick={()=>setTab('mapping')}>{t('import_preview.mapping')}</button>
          <button className={`small ${tab==='table' ? 'button' : 'button secondary'}`} onClick={()=>setTab('table')}>{t('import_preview.edit_table')}</button>
          </div>
          <div style={{marginLeft:'auto', display:'flex', gap:8}}>
            <div>
              <label className="note">Deck</label>
              <select value={selectedDeckId||''} onChange={e=> setSelectedDeckId && setSelectedDeckId(e.target.value)}>
                <option value="">(default)</option>
                {decks.map(d=> (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div>
              <label className="note">Template</label>
              <select value={selectedTemplateId||''} onChange={e=> setSelectedTemplateId && setSelectedTemplateId(e.target.value)}>
                <option value="">(default)</option>
                {templates.map(t=> (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>
          </div>
        </div>

        {tab === 'mapping' && (
          <div className="panel" style={{marginBottom:12}}>
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              <div style={{flex:1}}>
                <strong>{t('import_preview.mapping')}</strong>
                <div className="helper">{t('import_preview.mapping')} — Map CSV columns to card field names. Unmapped columns are ignored. Auto-detected suggestions applied.</div>
              </div>
            </div>

            <div style={{marginTop:12}}>
              {columns.map(col => (
                <div key={col} style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
                  <div style={{minWidth:220, color:'#374151'}}><strong>{col}</strong></div>
                  <input placeholder={t('card.field_value_placeholder')} value={localMapping[col]||''} onChange={e=> updateMap(col, e.target.value)} style={{flex:1}} />
                </div>
              ))}
            </div>

            <div className="helper">Detected fields: {derivedFields.join(', ') || '(none)'}</div>
          </div>
        )}

        {tab === 'table' && (
          <div className="panel">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <strong>{t('import_preview.edit_table')}</strong>
              <div style={{display:'flex', gap:8}}>
                <button className="small" onClick={()=> setLocalRows(prev => prev.map(r=> ({...r, __included: true})))}>{t('table.select_all')}</button>
                <button className="small" onClick={()=> setLocalRows(prev => prev.map(r=> ({...r, __included: false})))}>{t('table.clear_selection')}</button>
                <button className="small" onClick={()=> setLocalRows(prev => prev.filter(r=> !r.__included))}>{t('table.delete_selected')}</button>
              </div>
            </div>

            <div style={{overflowX:'auto'}}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{width:36}}>#</th>
                    {derivedFields.map(f=> <th key={f}>{f}</th>)}
                    <th>{t('table.original')}</th>
                  </tr>
                </thead>
                <tbody>
                  {localRows.map((r,idx)=> (
                    <tr key={idx} style={{opacity: r.__included ? 1 : 0.4}}>
                      <td><input type="checkbox" checked={r.__included} onChange={()=> toggleInclude(idx)} /></td>
                      {derivedFields.map(f=> (
                        <td key={f} style={{minWidth:180}}>
                          <input className="float-input" value={r.mapped[f]||''} onChange={e=> updateMappedCell(idx, f, e.target.value)} />
                        </td>
                      ))}
                      <td style={{minWidth:240}}><pre style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', margin:0}}>{JSON.stringify(r.__original)}</pre></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
        <button className="button secondary" onClick={onClose}>{t('card.cancel')}</button>
        <button className="button" onClick={apply}>{t('import_rows')}</button>
        </div>
      </div>
    </div>
  )
}
