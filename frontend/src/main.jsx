import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/codemirror.css'
import Index from './Index'
import { SocketProvider } from './context/SocketContext'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <SocketProvider>
      <Index />
    </SocketProvider>
  </AuthProvider>,
)