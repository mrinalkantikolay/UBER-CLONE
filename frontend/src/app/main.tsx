import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import QueryProvider from './providers/query-provider.tsx'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <App />
  </QueryProvider>
)
