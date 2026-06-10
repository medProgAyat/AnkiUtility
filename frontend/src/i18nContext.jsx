import React, { createContext, useContext, useState, useEffect } from 'react'
import i18n, { getLocale, setLocale, t, tf } from './i18n'

const I18nContext = createContext({ locale: getLocale(), t, tf, setLocale })

export function I18nProvider({ children }){
  const [locale, setLocaleState] = useState(getLocale())

  useEffect(()=>{
    const h = ()=> setLocaleState(getLocale())
    window.addEventListener('app:lang-changed', h)
    return ()=> window.removeEventListener('app:lang-changed', h)
  }, [])

  return (
    <I18nContext.Provider value={{ locale, t: i18n.t, tf: i18n.tf, setLocale: (l)=> { setLocale(l); setLocaleState(l) } }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(){ return useContext(I18nContext) }

export default I18nContext
