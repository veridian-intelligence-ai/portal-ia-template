/**
 * Capturas de tela de todas as páginas, em desktop e celular, nos dois
 * temas. Não é portão: é o retrato para revisar uma mudança visual.
 * Precisa de `npm run preview` na :4173. Grava em capturas/.
 *
 *   node scripts/capturas.mjs              tema escuro
 *   node scripts/capturas.mjs --tema=claro tema claro
 */
import { chromium } from '@playwright/test'
import { existsSync, mkdirSync } from 'node:fs'
import { paginas } from './paginas.mjs'

const TEMA = process.argv.slice(2).find((a) => a.startsWith('--tema='))?.split('=')[1] ?? 'escuro'
const CHROMIUM = '/opt/pw-browsers/chromium'
const b = await chromium.launch(existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {})
mkdirSync('capturas', { recursive: true })
for (const largura of [1280, 390]) {
  const ctx = await b.newContext({ viewport: { width: largura, height: 900 } })
  if (TEMA === 'claro') await ctx.addInitScript(() => localStorage.setItem('portal-tema', 'claro'))
  const p = await ctx.newPage()
  p.on('pageerror', (e) => console.log('ERRO NA PÁGINA', e.message))
  for (const [url, nome] of paginas()) {
    await p.goto('http://localhost:4173' + url, { waitUntil: 'load' })
    await p.waitForTimeout(300)
    const arquivo = `capturas/${nome}-${largura}-${TEMA}.png`
    await p.screenshot({ path: arquivo, fullPage: true })
    console.log(arquivo)
  }
  await ctx.close()
}
await b.close()
