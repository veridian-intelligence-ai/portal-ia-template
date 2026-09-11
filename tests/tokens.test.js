/**
 * O manual de marca, mecanicamente: paleta monocromática, tema claro
 * como espelho exato, sem itálico, sombra ou blur, fontes locais, e a
 * página de login (que duplica os tokens por ser autossuficiente) usando
 * só cores que existem em tokens.css. Também a página 503.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { paginaIndisponivel } from '../api/_lib/paginas.js'
import { FONTES_DO_LOGIN } from '../plugins/conteudo.js'

const ROOT = process.cwd()
const ler = (f) => readFileSync(join(ROOT, f), 'utf8')
const tokens = ler('src/styles/tokens.css')
const estilos = ['base.css', 'portal.css', 'diagrama.css'].map((f) => ler('src/styles/' + f)).join('\n')
const login = ler('src/login/login.html')

function andar(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name)
    if (e.isDirectory()) return andar(full)
    return /\.(jsx?|css|html)$/.test(e.name) ? [full] : []
  })
}
const componentes = andar(join(ROOT, 'src')).filter((f) => !f.includes('/styles/') && !f.endsWith('login.html')).map((f) => readFileSync(f, 'utf8')).join('\n')
const hexes = (t) => [...t.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase())
const literais = (t) => [...t.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g)].map((m) => m[0])

describe('tokens', () => {
  it('todo token usado existe, e nenhum token definido fica sem uso', () => {
    const definidos = new Set([...tokens.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]))
    const usados = new Set([...(estilos + componentes + tokens).matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map((m) => m[1]))
    const faltam = [...usados].filter((t) => !definidos.has(t))
    expect(faltam, `usados sem definição: ${faltam.join(', ')}`).toEqual([])
    // --font-* podem ser sobrescritos por site.config.json; --text-tertiary é reservado (ver tokens.css)
    const mortos = [...definidos].filter((t) => !usados.has(t) && !/^--font-/.test(t) && t !== '--text-tertiary')
    expect(mortos, `definidos sem uso: ${mortos.join(', ')}`).toEqual([])
  })
  it('nenhum literal de cor fora de tokens.css (estilos e componentes)', () => {
    expect(literais(estilos)).toEqual([])
    expect(literais(componentes)).toEqual([])
  })
  it('a paleta é monocromática: todo hex em tokens.css é cinza puro', () => {
    const comMatiz = literais(tokens).filter((lit) => {
      if (lit.startsWith('#')) {
        const h = lit.slice(1)
        const full = h.length <= 4 ? h.replace(/./g, (c) => c + c) : h
        return !(full.slice(0, 2) === full.slice(2, 4) && full.slice(2, 4) === full.slice(4, 6))
      }
      const n = lit.match(/[\d.]+/g) || []
      return lit.startsWith('hsl') || !(n[0] === n[1] && n[1] === n[2])
    })
    expect(comMatiz).toEqual([])
  })
  it('o tema claro é o espelho exato do escuro, par a par', () => {
    const escuro = tokens.slice(0, tokens.indexOf('html.theme-light'))
    const claro = tokens.slice(tokens.indexOf('html.theme-light'))
    const valor = (bloco, token) => bloco.match(new RegExp(`^\\s*${token}:\\s*([^;]+);`, 'm'))?.[1].trim()
    const PARES = [
      ['--surface-0', '#000000', '#ffffff'],
      ['--surface-1', '#1a1a1a', '#f5f5f5'],
      ['--surface-2', '#262626', '#ebebeb'],
      ['--border', '#3a3a3a', '#d4d4d4'],
      ['--border-strong', '#ffffff', '#000000'],
      ['--text-primary', '#ffffff', '#000000'],
      ['--text-secondary', '#e5e5e5', '#262626'],
      ['--text-tertiary', '#a3a3a3', '#6b6b6b'],
      ['--text-disabled', '#6b6b6b', '#a3a3a3'],
      ['--primary', '#ffffff', '#000000'],
      ['--primary-ink', '#000000', '#ffffff'],
    ]
    for (const [token, e, c] of PARES) {
      expect(valor(escuro, token), token).toBe(e)
      expect(valor(claro, token), token).toBe(c)
    }
    expect(estilos + tokens).not.toMatch(/prefers-color-scheme/)
    expect(ler('index.html')).toContain("classList.add('theme-light')")
  })
  it('nunca itálico, sombra, blur ou gradiente decorativo', () => {
    for (const css of [estilos, login]) {
      expect(css).not.toMatch(/font-style:\s*italic/)
      expect(css).not.toMatch(/text-shadow:/)
      expect(css).not.toMatch(/box-shadow:\s*(?!none)/)
      expect(css).not.toMatch(/backdrop-filter:/)
      expect(css).not.toMatch(/gradient\(/)
    }
  })
  it('as três famílias são locais via @fontsource; nenhum link externo de fonte', () => {
    const main = ler('src/main.jsx')
    for (const css of ['@fontsource/unbounded/700.css', '@fontsource/unbounded/900.css', '@fontsource/inter/400.css', '@fontsource/inter/500.css', '@fontsource/inter/600.css', '@fontsource/jetbrains-mono/400.css']) {
      expect(main).toContain(css)
    }
    for (const html of [ler('index.html'), login]) {
      expect(html).not.toMatch(/fonts\.googleapis|fonts\.gstatic|cdn\./i)
    }
    expect(login).toMatch(/url\('\/fontes\/unbounded-900\.woff2'\)/)
    // as fontes antigas do portal de referência não voltam
    for (const texto of [ler('package.json'), main, estilos, tokens, login, componentes]) expect(texto).not.toMatch(/anton|hanken/i)
    // as fontes do login saem dos pacotes @fontsource no build (plugins/conteudo.js)
    for (const f of ['unbounded-900.woff2', 'inter-400.woff2', 'inter-600.woff2']) expect(Object.keys(FONTES_DO_LOGIN)).toContain(f)
  })
  it('a página de login e a página 503 só usam cores que existem em tokens.css', () => {
    const permitidos = new Set(hexes(tokens))
    for (const [nome, html] of [['login', login], ['503', paginaIndisponivel({ nome: 'X', idiomas: { padrao: 'pt-BR' } }, ['SESSION_SECRET'])]]) {
      const fora = hexes(html).filter((h) => !permitidos.has(h))
      expect(fora, `${nome}: cores fora dos tokens`).toEqual([])
    }
    // e o espelho do claro na página de login é o mesmo do tokens.css
    expect(login).toMatch(/html\.theme-light \{[^}]*--surface-0: #ffffff/)
    expect(login).toMatch(/html\.theme-light \{[^}]*--primary: #000000/)
  })
  it('a página 503 nomeia o que falta, nunca o conteúdo', () => {
    const html = paginaIndisponivel({ nome: 'Portal <X>', idiomas: { padrao: 'en' } }, ['WORKOS_API_KEY', 'SESSION_SECRET'])
    expect(html).toContain('<code>WORKOS_API_KEY</code>')
    expect(html).toContain('Portal &lt;X&gt;')
    expect(html).toContain('Portal being configured')
    expect(html).toContain('name="robots" content="noindex"')
  })
})
