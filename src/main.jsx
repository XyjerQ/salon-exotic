import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css' // <- upewnij się, że jest
createRoot(document.getElementById('root')).render(<App />)
