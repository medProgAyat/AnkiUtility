import React, { useEffect, useState } from 'react'
import { PlusIcon, SaveIcon, TrashIcon } from '../icons'
import i18n, { t, getLocale, setLocale, tf } from '../i18n'
import ConfirmModal from './ConfirmModal'
import TemplateEditor from './TemplateEditor'
export default function ProjectBar({ projectId, setProjectId }){
  const [projects, setProjects] = useState([])
  const [newName, setNewName] = useState('')
  const [locale, setLocaleState] = useState(getLocale())
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showTemplateNewModal, setShowTemplateNewModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const menuRef = React.useRef(null)
  const templateMenuRef = React.useRef(null)

  // close popups when clicking outside
  React.useEffect(()=>{
    function onDocClick(e){
      if(menuRef.current && !menuRef.current.contains(e.target)){
        setShowMenu(false)
      }
      if(templateMenuRef.current && !templateMenuRef.current.contains(e.target)){
        setShowTemplateMenu(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return ()=> document.removeEventListener('click', onDocClick)
  }, [])

  useEffect(()=>{ fetch('/api/projects').then(r=>r.json()).then(setProjects).catch(()=>{}) }, [])

  useEffect(()=>{
    const h = () => setLocaleState(getLocale())
    window.addEventListener('app:lang-changed', h)
    return () => window.removeEventListener('app:lang-changed', h)
  }, [])

  async function createProject(){
    const name = newName || t('new_project.placeholder')
    const res = await fetch('/api/projects', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name }) })
    if(res.ok){ const data = await res.json(); setProjects([{id:data.id, name}, ...projects]); setNewName(''); setProjectId(data.id); setShowNewProjectModal(false); window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('project.created'), type: 'info' } })); }
  }

  async function deleteProject(){
    if(!projectId) return window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('no_project_selected'), type: 'error' } }))
    // open modal
    setShowDeleteProjectConfirm(true)
  }

  async function performDeleteProject(){
    setShowDeleteProjectConfirm(false)
    const res = await fetch('/api/projects/' + projectId, { method: 'DELETE' })
    if(res.ok){ setProjects(projects.filter(p=>p.id!==projectId)); setProjectId(null); window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('project.deleted'), type: 'info' } })) }
  }

  async function exportProject(){
    if(!projectId) return window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('select_project_first'), type: 'error' } }))
    const res = await fetch('/api/export/apkg', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ project_id: projectId }) })
    if(res.ok){ const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'project.apkg'; a.click();
        // notify UI that project apkg was saved (so export button can hide)
        window.dispatchEvent(new CustomEvent('project:apkg-saved', { detail: { project_id: projectId } }))
      }
  }

  return (
    <div className="header">
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <strong style={{fontSize:16}}>{t('app.title')}</strong>
        <div className="toolbar">
          <label style={{fontSize:13, color:'#444'}}>{t('project.label')}</label>
          <select value={projectId||''} onChange={e=>setProjectId(e.target.value ? parseInt(e.target.value,10) : null)}>
            <option value="">(none)</option>
            {projects.map(p=> <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
          </select>
        </div>
      </div>

      <div className="toolbar" style={{position:'relative'}}>
        <div ref={menuRef} style={{display:'inline-flex', alignItems:'center', gap:8}}>
        <div>
          <button className="button small" onClick={()=>setShowMenu(s=>!s)} style={{display:'inline-flex', alignItems:'center', gap:8}} aria-haspopup="true" aria-expanded={showMenu}>{t('project.menu') || 'Project'} ▾</button>
          {showMenu && (
            <div style={{position:'absolute', top:38, right:0, background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:8, boxShadow:'0 8px 24px rgba(2,6,23,0.06)'}}>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                <button className="action-btn" onClick={()=>{ setShowNewProjectModal(true); setShowMenu(false) }}><PlusIcon w={14} h={14} /> {t('new_project.button')}</button>
                <button className="action-btn" onClick={()=>{ deleteProject(); setShowMenu(false) }}><TrashIcon w={14} h={14} /> {t('delete_project')}</button>
                <button className="action-btn" onClick={()=>{ exportProject(); setShowMenu(false) }}><SaveIcon w={14} h={14} /> {t('save_apkg')}</button>
              </div>
              </div>
          )}
        </div>

        <div ref={templateMenuRef} style={{position:'relative'}}>
          <button className="button small" onClick={()=>setShowTemplateMenu(s=>!s)} style={{display:'inline-flex', alignItems:'center', gap:8}} aria-haspopup="true" aria-expanded={showTemplateMenu}>{t('template.menu') || 'Templates'} ▾</button>
          {showTemplateMenu && (
            <div style={{position:'absolute', top:38, right:0, background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:8, boxShadow:'0 8px 24px rgba(2,6,23,0.06)'}}>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                <button className="action-btn" onClick={()=>{ setShowTemplateModal(true); setShowTemplateMenu(false); setShowMenu(false) }}><SaveIcon w={14} h={14} /> {t('templates.edit') || 'Edit templates'}</button>
                <button className="action-btn" onClick={()=>{ setShowTemplateNewModal(true); setShowTemplateMenu(false); setShowMenu(false) }}><PlusIcon w={14} h={14} /> {t('templates.new') || 'New template'}</button>
              </div>
            </div>
          )}
        </div>
        </div>

        <div style={{marginLeft:12}}>
          <select value={locale} onChange={e=>{ setLocale(e.target.value); setLocaleState(e.target.value); }}>
            <option value="en">English</option>
            <option value="fa">فارسی</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>

      {showNewProjectModal && (
        <div onClick={(e)=>{ if(e.target === e.currentTarget){ setShowNewProjectModal(false); setNewName('') } }} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2200}}>
          <div style={{width:420, maxWidth:'95%', background:'#fff', borderRadius:12, padding:18}}>
            <h3 style={{marginTop:0}}>{t('new_project.button')}</h3>
            <div style={{marginTop:8}}>
              <label htmlFor="np-name" style={{fontSize:13}}>{t('new_project.placeholder')}</label>
              <input id="np-name" className="float-input" value={newName} onChange={e=>setNewName(e.target.value)} style={{width:'100%', marginTop:8}} />
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
              <button className="button secondary small" onClick={()=>{ setShowNewProjectModal(false); setNewName('') }}>{t('card.cancel')}</button>
              <button className="button small" onClick={createProject}>{t('create_project') || t('new_project.button')}</button>
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div onClick={(e)=>{ if(e.target === e.currentTarget) setShowTemplateModal(false) }} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2200}}>
          <div style={{width:'90%', maxWidth:1000, maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:12, padding:18}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <h3 style={{margin:0}}>{t('templates.edit') || 'Edit templates'}</h3>
              <div>
                <button className="action-btn ghost" onClick={()=>setShowTemplateModal(false)}>{t('card.close')}</button>
              </div>
            </div>
            <TemplateEditor projectId={projectId} />
          </div>
        </div>
      )}

      {showTemplateNewModal && (
        <div onClick={(e)=>{ if(e.target === e.currentTarget) setShowTemplateNewModal(false) }} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2200}}>
          <div style={{width:'90%', maxWidth:1000, maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:12, padding:18}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <h3 style={{margin:0}}>{t('templates.new') || 'New template'}</h3>
              <div>
                <button className="action-btn ghost" onClick={()=>setShowTemplateNewModal(false)}>{t('card.close')}</button>
              </div>
            </div>
            <TemplateEditor projectId={projectId} newTemplate={true} />
          </div>
        </div>
      )}

      {showDeleteProjectConfirm && (
        <ConfirmModal open={true} title={t('delete_project')} message={t('confirm.delete_project')} onConfirm={performDeleteProject} onCancel={()=>setShowDeleteProjectConfirm(false)} />
      )}
    </div>
  )
}
