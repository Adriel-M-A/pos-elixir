import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from './App'
import './assets/main.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* Predeterminado la primera vez: tema claro; después se mantiene la elección del usuario */}
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
