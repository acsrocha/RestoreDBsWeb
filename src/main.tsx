// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client' // Importação correta para React 18+
import App from './App.tsx'
import { LastUpdatedProvider } from './contexts/LastUpdatedContext.tsx'
// Se você moveu seu CSS global para src/styles/global.css e não o importou em App.tsx:
// import './styles/global.css';
// No entanto, a prática comum é importar o CSS global em App.tsx ou no seu componente de layout principal.

// Encontra o elemento root no seu index.html
const rootElement = document.getElementById('root')

// Garante que o elemento root exista antes de tentar renderizar
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <LastUpdatedProvider>
        <App />
      </LastUpdatedProvider>
    </React.StrictMode>
  )
} else {
  console.error(
    'Elemento root não encontrado no DOM. Verifique seu index.html.'
  )
}
