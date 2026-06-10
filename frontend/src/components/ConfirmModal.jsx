import React from 'react'
import { t } from '../i18n'

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel, cancelLabel }){
  if(!open) return null
  return (
    <div onClick={(e)=>{ if(e.target === e.currentTarget) onCancel && onCancel() }} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2400}}>
      <div style={{width:420, maxWidth:'90%', background:'#fff', borderRadius:10, padding:18}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <h3 style={{margin:0}}>{title}</h3>
        </div>
        <div style={{marginBottom:18, color:'#111'}}>{message}</div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
          <button className="button secondary small" onClick={onCancel}>{cancelLabel || t('no')}</button>
          <button className="button small" onClick={onConfirm}>{confirmLabel || t('yes')}</button>
        </div>
      </div>
    </div>
  )
}
