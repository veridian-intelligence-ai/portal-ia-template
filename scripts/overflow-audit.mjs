/**
 * Portão de transbordo (celular): duas medidas por página, sobre conteúdo
 * que a pessoa não alcança.
 *
 * 1. HORIZONTAL: zero transbordo a 720, 480, 390 e 320px. Elementos dentro
 *    de um ancestral que rola de propósito (a fileira de navegação, a
 *    caixa da tabela, o diagrama) podem ser mais largos; um elemento
 *    estacionado fora da tela à esquerda (o link "pular") não é transbordo.
 * 2. VERTICAL: nenhum conteúdo começa acima da base da barra fixa.
 *
 * Precisa de `npm run preview` na :4173. Sai diferente de zero em falha.
 *   node scripts/overflow-audit.mjs
 *   node scripts/overflow-audit.mjs --tema=claro
 */
import { chromium } from '@playwright/test'
import { existsSync } from 'node:fs'
import { paginas } from './paginas.mjs'

const CHROMIUM = '/opt/pw-browsers/chromium'
const b = await chromium.launch(existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {})
const TEMA = process.argv.slice(2).find((a) => a.startsWith('--tema='))?.split('=')[1] ?? 'escuro'
let bad = 0
for (const width of [720, 480, 390, 320]) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } })
  if (TEMA === 'claro') await ctx.addInitScript(() => localStorage.setItem('portal-tema', 'claro'))
  const page = await ctx.newPage()
  for (const [url, label] of paginas()) {
    await page.goto('http://localhost:4173' + url, { waitUntil: 'load' })
    await page.waitForTimeout(150)
    const r = await page.evaluate((vw) => {
      const off = []
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        if (r.right <= 0) continue
        if (r.right <= vw + 0.5 && r.left >= -0.5) continue
        let p = el
        let rola = false
        while (p) {
          const s = getComputedStyle(p)
          if (s.overflowX === 'auto' || s.overflowX === 'scroll') {
            rola = true
            break
          }
          p = p.parentElement
        }
        if (rola) continue
        off.push(el.tagName.toLowerCase() + '.' + String(el.className || '').trim().split(/\s+/).slice(0, 2).join('.') + ` right=${r.right.toFixed(0)}`)
      }
      // vertical: o primeiro elemento em fluxo do main, contra a base do que está fixo/grudado no topo
      const main = document.querySelector('main')
      let folga = null
      if (main) {
        let base = 0
        for (const el of document.querySelectorAll('header, nav')) {
          const s = getComputedStyle(el)
          if (s.position === 'sticky' || s.position === 'fixed') base = Math.max(base, el.getBoundingClientRect().bottom)
        }
        const alvo = [...main.querySelectorAll('*')].find((el) => {
          const cs = getComputedStyle(el)
          if (cs.position === 'absolute' || cs.position === 'fixed') return false
          const cr = el.getBoundingClientRect()
          return cr.width > 0 && cr.height > 0
        })
        if (alvo) folga = { base: +base.toFixed(0), top: +alvo.getBoundingClientRect().top.toFixed(0) }
      }
      return { doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, off: off.slice(0, 6), folga }
    }, width)
    const over = r.doc > width || r.body > width || r.off.length > 0
    const sob = r.folga !== null && r.folga.top < r.folga.base - 0.5
    if (over || sob) bad++
    console.log(
      `${over || sob ? 'FAIL' : ' ok '} ${width}px  ${label.padEnd(24)} doc=${r.doc} body=${r.body}` +
        (r.folga ? `  topo=${r.folga.base} conteudo=${r.folga.top}` : '') +
        (r.off.length ? '\n      ' + r.off.join('\n      ') : '') +
        (sob ? `\n      CONTEUDO DEBAIXO DO CABECALHO por ${(r.folga.base - r.folga.top).toFixed(0)}px` : ''),
    )
  }
  await ctx.close()
}
await b.close()
console.log(bad ? `\n${bad} estados com transbordo horizontal ou conteúdo debaixo do cabeçalho` : `\nNenhum transbordo horizontal e nenhum conteúdo debaixo do cabeçalho, de 720px a 320px, tema ${TEMA}.`)
process.exit(bad ? 1 : 0)
