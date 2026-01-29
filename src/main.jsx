import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { CampaignProvider } from './context/CampaignContext' // <--- NY IMPORT

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CampaignProvider> {/* <--- WRAPPER APPEN HER */}
        <App />
      </CampaignProvider>
    </AuthProvider>
  </React.StrictMode>,
)