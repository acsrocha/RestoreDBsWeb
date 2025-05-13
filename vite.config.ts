import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // Adicione esta seção 'server'
    proxy: {
      // Qualquer requisição que comece com '/api'
      // será redirecionada para o seu backend Go
      '/api': {
        target: 'http://localhost:8558', // Certifique-se que esta é a porta do seu backend Go
        changeOrigin: true, // Necessário para o backend aceitar a requisição da origem diferente
        secure: false,      // Se o seu backend Go não estiver usando HTTPS (comum localmente)
        // Se o seu backend Go espera as rotas sem o prefixo /api (por exemplo, /status em vez de /api/status),
        // você pode adicionar a reescrita de path. No seu caso, o Go espera /api/..., então não é necessário.
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})