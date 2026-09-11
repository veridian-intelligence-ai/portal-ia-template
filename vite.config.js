import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { portal } from './plugins/conteudo.js'

/**
 * Dois plugins: o do React e o do conteúdo (plugins/conteudo.js), que lê
 * content/ e site.config.json e os entrega ao app pelos módulos virtuais
 * `virtual:conteudo` e `virtual:diagrama`. O manifesto e o hash dos assets
 * são os do Vite; o middleware protege /assets/ como o resto.
 */
export default defineConfig({
  plugins: [react(), portal()],
  server: { port: 5173, host: true },
  build: { target: 'es2022' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 60000,
  },
})
