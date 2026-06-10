import React, { useState } from 'react'
import ProjectBar from './components/ProjectBar'
import CardTable from './components/CardTable'
import LivePreview from './components/LivePreview'
import { t } from './i18n'

export default function App() {
  const [projectId, setProjectId] = useState(null)

  return (
    <div>
      <ProjectBar projectId={projectId} setProjectId={setProjectId} />
      <div style={{display: 'flex', gap: '16px', padding: '16px'}}>
        <div style={{width: '45%'}}>
          <h2>{t('live_preview.title') || 'Live Preview'}</h2>
          <LivePreview />
        </div>
        <div style={{flex: 1}}>
          <h2>{t('editors.title') || 'Editors'}</h2>
          <CardTable projectId={projectId} />
        </div>
      </div>
    </div>
  )
}
