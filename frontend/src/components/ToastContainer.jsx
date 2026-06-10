import React, { useEffect, useState } from 'react'

// Toast system: toasts can be anchored to the last clicked element (or explicit anchorSelector).
// Each toast shows a progress bar indicating remaining display time and pauses on hover.
export default function ToastContainer(){
  const [toasts, setToasts] = useState([])
  const [tick, setTick] = useState(Date.now())

  useEffect(()=>{
    // track last click target so toasts can anchor to the triggering button when no explicit anchor provided
    function onClick(e){ window._lastClickTarget = e.target }
    document.addEventListener('click', onClick, true)

    function onToast(e){
      const { message, type='info', duration=4000, undo_ids, anchorSelector } = e.detail || {}
      const id = Date.now() + Math.random()
      let anchorRect = null
      try{
        const el = anchorSelector ? document.querySelector(anchorSelector) : window._lastClickTarget
        if(el && el.getBoundingClientRect) anchorRect = el.getBoundingClientRect()
      }catch(err){ anchorRect = null }

      const isAnchored = !!anchorRect
      const expireAt = Date.now() + duration
      setToasts(prev => [...prev, { id, message, type, undo_ids, duration, expireAt, isAnchored, anchorRect, paused: false }])
    }
    window.addEventListener('app:toast', onToast)

    const iv = setInterval(()=> setTick(Date.now()), 100)

    return ()=>{
      clearInterval(iv)
      window.removeEventListener('app:toast', onToast)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  // cleanup expired toasts on each tick
  useEffect(()=>{
    setToasts(prev => prev.filter(t => t.paused || t.expireAt > Date.now()))
  }, [tick])

  function pauseToast(id){
    setToasts(prev => prev.map(t => t.id===id ? ({ ...t, paused: true, remaining: Math.max(0, t.expireAt - Date.now()) }) : t))
  }
  function resumeToast(id){
    setToasts(prev => prev.map(t => {
      if(t.id!==id) return t
      const remaining = t.remaining || 0
      return ({ ...t, paused: false, expireAt: Date.now() + remaining, remaining: undefined })
    }))
  }

  // helper to compute style for anchored toast
  function anchoredStyle(t){
    if(!t.isAnchored || !t.anchorRect) return {}
    const rect = t.anchorRect
    const top = Math.max(8, Math.min(window.innerHeight - 60, rect.top))
    const l = rect.left
    // if RTL, show to the left of anchor (using transform). else show to the right.
    const isRtl = document.documentElement && document.documentElement.dir === 'rtl'
    const transform = isRtl ? 'translateX(-110%)' : 'translateX(10%)'
    return { position:'fixed', top: top + 'px', left: (l) + 'px', transform, zIndex: 99999 }
  }

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => {
        const remaining = t.paused ? (t.remaining || 0) : Math.max(0, t.expireAt - Date.now())
        const pct = Math.max(0, Math.min(100, (remaining / t.duration) * 100))
        const style = t.isAnchored ? anchoredStyle(t) : {}
        return (
          <div key={t.id}
            className={`toast ${t.type==='error' ? 'error' : 'info'} ${t.isAnchored ? 'toast--anchored' : ''}`}
            style={style}
            onMouseEnter={()=>pauseToast(t.id)}
            onMouseLeave={()=>resumeToast(t.id)}
          >
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <div style={{flex:1}} dangerouslySetInnerHTML={{ __html: t.message }} />
              {t.undo_ids && (
                <button className="small" onClick={()=> window.dispatchEvent(new CustomEvent('toast:undo', { detail: { ids: t.undo_ids } }))}>{'Undo'}</button>
              )}
            </div>
            <div className="toast-progress" style={{width: `${pct}%`}} />
          </div>
        )
      })}
    </div>
  )
}
