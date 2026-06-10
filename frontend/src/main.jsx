import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ToastContainer from './components/ToastContainer'
import './styles.css'

import { I18nProvider } from './i18nContext'

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <App />
    <ToastContainer />
  </I18nProvider>
)
