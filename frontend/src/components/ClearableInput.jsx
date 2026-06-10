import React, { useState } from 'react'

export default function ClearableInput({ value, onChange, label='', placeholder='', type='text', className='', style={}, id }){
  const [focused, setFocused] = useState(false)
  const showClear = !!value
  return (
    <div className={"input-wrapper " + className} style={{position:'relative', display:'flex', alignItems:'center', ...style}}>
      <input id={id} className={"float-input"} value={value} onChange={e=>onChange && onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder={placeholder} type={type} style={{flex:1, paddingRight: showClear ? 36 : 12, borderRadius:12}} />
      {label && (
        <label htmlFor={id} className={"floating-label" + ((focused || value) ? ' filled' : '')}>{label}</label>
      )}
      {showClear && (
        <button aria-label="clear-input" title="Clear" onClick={()=>onChange && onChange('')} style={{position:'absolute', right:8, background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'#64748b'}}>&times;</button>
      )}
    </div>
  )
}
