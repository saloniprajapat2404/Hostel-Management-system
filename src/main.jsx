import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { HostelConfigProvider } from './context/HostelConfigContext'
import './index.css'

const storedTheme = localStorage.getItem('hms_theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.classList.toggle('dark', storedTheme ? storedTheme === 'dark' : prefersDark)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <HostelConfigProvider>
        <App />
      </HostelConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
