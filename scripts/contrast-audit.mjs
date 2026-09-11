/**
 * Portão de contraste: cada nó de texto renderizado contra WCAG 2.2 AA,
 * medido pixel a pixel. Adaptado do portal do AI Data Analyst (o comentário
 * de método está preservado abaixo, porque cada regra dele nasceu de um
 * defeito real).
 *
 * Precisa de `npm run preview` na :4173. Sai diferente de zero em qualquer
 * falha. As páginas medidas vêm de scripts/paginas.mjs: uma por seção de
 * content/, o diagrama, o login e a página 503.
 *
 *   node scripts/contrast-audit.mjs                 mede tudo a 1280px
 *   node scripts/contrast-audit.mjs --largura=390   mede tudo a 390px
 *   node scripts/contrast-audit.mjs --tema=claro    mede o tema claro
 *   node scripts/contrast-audit.mjs login           só as páginas com o trecho
 *
 * O método, herdado:
 *
 * 1. A primeira versão lia a cor computada por regex. O navegador serializa
 *    cor moderna no espaço que quiser; passou a resolver pintando num canvas.
 * 2. A segunda varria só o estado de repouso; um :hover derrubava o
 *    contraste sem o portão ver. Passou a varrer :hover e pseudo-elementos.
 * 3. A terceira lia `backgroundColor` e nunca `background-image`. O fundo
 *    agora é fotografado, não deduzido.
 *
 * Tira-se DOIS retratos, um com o texto escondido e um normal, e os pixels
 * de glifo são exatamente aqueles em que os dois diferem. Cada letra é
 * medida contra o fundo real embaixo dela. Vale o PIOR pixel.
 */
import { chromium } from '@playwright/test'
import { existsSync } from 'node:fs'
import { paginas } from './paginas.mjs'

const BASE = 'http://localhost:4173'
const URLS = paginas().map(([url, label]) => [url, label])

/**
 * Transição e animação desligadas durante a auditoria.
 *
 * Sem isto, tirar o texto do transparente o traz de volta ANIMADO: os links
 * da navegação têm `transition: color 120ms`, e a medição pegava a cor no
 * meio do caminho, rgba(109,40,217,0.706), acusando 1,86:1 num link que em
 * repouso está perfeitamente legível. O estado final é o que interessa.
 */
const SEM_TRANSICAO = `*, *::before, *::after {
  transition: none !important;
  animation: none !important;
}`

/**
 * Some com TODA letra, propria e de pseudo-elemento.
 *
 * O pseudo-elemento so da para esconder por folha de estilo, entao esta
 * regra existe para ele. A letra propria e escondida por estilo EM LINHA,
 * na funcao abaixo, e a diferenca importa: `*` tem especificidade zero e
 * perde para qualquer `.classe { color: ... !important }` do app. Quando
 * isso acontece a letra aparece nos DOIS retratos, a mascara nao acha
 * glifo nenhum, e o no sai da medicao em silencio. Estilo em linha com
 * !important nao perde para folha nenhuma.
 */
const ESCONDE_PSEUDO_TUDO = `*::before, *::after, *::marker {
  color: transparent !important;
  text-shadow: none !important;
}`

/**
 * Some so com a letra de pseudo-elemento.
 *
 * Com tres retratos os glifos ficam separaveis: o proprio texto e a
 * diferenca entre o retrato so-proprio e o retrato vazio, e o pseudo e a
 * diferenca entre o retrato cheio e o so-proprio. Sem essa separacao, medir
 * um ::marker usava a caixa inteira do <li>, achava os glifos do TEXTO do
 * item e media a cor do marcador contra o fundo deles: foi assim que o
 * stepper apareceu a 3,11:1 num marcador que nem chega a ser pintado.
 */
const ESCONDE_PSEUDO = `*::before, *::after, *::marker {
  color: transparent !important;
  text-shadow: none !important;
}`

/** Esconde e devolve a letra propria por estilo em linha, sem perder para o app. */
const ESCONDE_PROPRIO = `(esconder) => {
  const marca = '__cxCorAntiga'
  for (const el of document.querySelectorAll('*')) {
    if (esconder) {
      el[marca] = el.style.getPropertyValue('color')
      el.style.setProperty('color', 'transparent', 'important')
    } else if (marca in el) {
      el.style.removeProperty('color')
      if (el[marca]) el.style.setProperty('color', el[marca])
      delete el[marca]
    }
  }
}`

/** Injetado na página: resolução de cor, máscara de glifo e medida de AA. */
const HELPERS = `
window.__cx = (() => {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const paint = (css, backdrop) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = 'rgb(' + backdrop.join(',') + ')'
    ctx.fillRect(0, 0, 1, 1)
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2]]
  }
  const isOpaque = (css) => {
    const w = paint(css, [255, 255, 255])
    const b = paint(css, [0, 0, 0])
    return w[0] === b[0] && w[1] === b[1] && w[2] === b[2]
  }
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  const ratio = (fg, bg) => {
    const l1 = L(fg), l2 = L(bg)
    const [x, y] = l1 > l2 ? [l1, l2] : [l2, l1]
    return (x + 0.05) / (y + 0.05)
  }

  // ── Os dois retratos ────────────────────────────────────────────────
  let vazio = null, soProprio = null, cheio = null, pw = 0, ph = 0, scale = 1

  const leImagem = (url) => new Promise((ok, fail) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const g = c.getContext('2d', { willReadFrequently: true })
      g.drawImage(img, 0, 0)
      ok({ data: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height })
    }
    img.onerror = () => fail(new Error('retrato não carregou'))
    img.src = url
  })

  const carregaRetratos = async (urlVazio, urlProprio, urlCheio, larguraCss) => {
    const a = await leImagem(urlVazio)
    const b = await leImagem(urlProprio)
    const c = await leImagem(urlCheio)
    vazio = a.data; soProprio = b.data; cheio = c.data
    pw = Math.min(a.w, b.w, c.w); ph = Math.min(a.h, b.h, c.h)
    scale = a.w / larguraCss
    return { w: pw, h: ph, scale }
  }

  /**
   * O pior pixel de fundo DEBAIXO DE GLIFO, dentro de uma lista de linhas.
   *
   * Pixel de glifo é aquele em que o retrato com texto difere do retrato sem
   * texto. É o que separa a letra do resto da caixa de linha: um chip
   * encostado no parágrafo cai dentro da caixa e não tem letra nenhuma em
   * cima, e medir contra ele produzia falha inventada.
   */
  const piorFundo = (rects, fgCss, pseudo) => {
    if (!vazio || !rects.length) return null
    // Glifo proprio: so-proprio menos vazio. Glifo de pseudo: cheio menos so-proprio.
    const frente = pseudo ? cheio : soProprio
    const tras = pseudo ? soProprio : vazio
    // Tudo em coordenadas de JANELA: o retrato e sempre da janela, e o
    // retangulo do elemento ja vem relativo a ela. Nao ha origem para errar.
    const opaco = isOpaque(fgCss)
    const fgFixa = opaco ? paint(fgCss, [0, 0, 0]) : null
    let pior = Infinity, piorBg = null, glifos = 0

    for (const rect of rects) {
      const x0 = Math.max(0, Math.floor(rect.left * scale))
      const y0 = Math.max(0, Math.floor(rect.top * scale))
      const x1 = Math.min(pw - 1, Math.ceil(rect.right * scale))
      const y1 = Math.min(ph - 1, Math.ceil(rect.bottom * scale))
      if (x1 <= x0 || y1 <= y0) continue

      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = (y * pw + x) * 4
          // Limiar quase zero, e isso é essencial.
          //
          // A versão anterior exigia diferença de 60 entre os dois retratos
          // para considerar o pixel um glifo. Mas a diferença entre "texto
          // pintado" e "texto transparente" É O PRÓPRIO CONTRASTE: letra de
          // baixo contraste produz diferença pequena e era descartada como
          // "não é glifo". O portão ficava cego justamente no defeito que
          // ele existe para achar. Provado injetando #2a2a2a sobre o fundo
          // escuro do billboard: 1,2:1, e o portão dizia que estava tudo bem.
          //
          // Os retratos são PNG, sem perda, e a renderização é determinística,
          // então qualquer pixel que difere é um pixel que a letra tocou. A
          // borda suavizada entra junto, e isso não atrapalha: a cor de
          // frente vem do estilo computado, não da foto, e o fundo vem do
          // retrato vazio, que não tem letra nenhuma.
          const d =
            Math.abs(frente[i] - tras[i]) +
            Math.abs(frente[i + 1] - tras[i + 1]) +
            Math.abs(frente[i + 2] - tras[i + 2])
          if (d < 3) continue
          glifos++
          const bg = [vazio[i], vazio[i + 1], vazio[i + 2]]
          const fg = fgFixa || paint(fgCss, bg)
          const v = ratio(fg, bg)
          if (v < pior) { pior = v; piorBg = bg }
        }
      }
    }
    return glifos ? { ratio: pior, bg: piorBg, glifos } : null
  }

  /**
   * O recorte visivel de um elemento: a janela, cortada por toda caixa
   * ancestral que corta o que transborda.
   *
   * Sem isto, texto dentro de um "pre" com overflow: auto devolve
   * retangulo para TODA linha, inclusive as que estao fora do recorte de
   * 480px e nunca foram pintadas. Esses retangulos caem por cima de outro
   * conteudo da pagina, a mascara de glifo pega a letra ALHEIA que esta ali,
   * e o portao mede a cor de um elemento contra o fundo de outro. Foi assim
   * que ele acusou o bloco de codigo da missao a 2,34:1 quando ele esta
   * sobre o painel escuro, a 5,81:1.
   */
  const recorteVisivel = (el) => {
    let cx0 = 0, cy0 = 0, cx1 = window.innerWidth, cy1 = window.innerHeight
    let n = el.parentElement
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n)
      if (s.overflow !== 'visible' || s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const r = n.getBoundingClientRect()
        cx0 = Math.max(cx0, r.left); cy0 = Math.max(cy0, r.top)
        cx1 = Math.min(cx1, r.right); cy1 = Math.min(cy1, r.bottom)
      }
      n = n.parentElement
    }
    return { left: cx0, top: cy0, right: cx1, bottom: cy1 }
  }

  const corta = (r, c) => ({
    left: Math.max(r.left, c.left), top: Math.max(r.top, c.top),
    right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom),
  })

  /**
   * Esta linha esta VISIVEL, ou tem outro elemento pintando por cima dela?
   *
   * A mascara de glifo compara dois retratos dentro de um retangulo, e nao
   * sabe de quem sao os glifos que achou ali. Quando um cabecalho fixo passa
   * por cima de um botao, a letra do cabecalho cai dentro do retangulo do
   * botao, e o portao mede a cor do botao contra o fundo do cabecalho: foi
   * assim que o botao branco da home apareceu a 1,14:1 estando escondido.
   *
   * Texto coberto nao e problema de contraste, e sim texto que ninguem le.
   * Fica de fora da medicao, e o relatorio de cobertura mostra isso.
   */
  const visivel = (el, r) => {
    const meio = [
      [(r.left + r.right) / 2, (r.top + r.bottom) / 2],
      [r.left + 2, (r.top + r.bottom) / 2],
      [r.right - 2, (r.top + r.bottom) / 2],
    ]
    return meio.some(([x, y]) => {
      const emCima = document.elementFromPoint(x, y)
      return emCima && (emCima === el || el.contains(emCima))
    })
  }

  /** Os retângulos das linhas de texto próprias do elemento, já recortados. */
  const linhasDeTexto = (el) => {
    const c = recorteVisivel(el)
    const out = []
    for (const filho of el.childNodes) {
      if (filho.nodeType !== 3 || filho.textContent.trim().length <= 1) continue
      const rg = document.createRange()
      rg.selectNodeContents(filho)
      for (const r of rg.getClientRects()) {
        const v = corta(r, c)
        if (v.right - v.left < 2 || v.bottom - v.top < 2) continue
        if (!visivel(el, v)) continue
        out.push(v)
      }
    }
    return out
  }

  /** A caixa de conteúdo: sem borda e sem padding, para pseudo-elemento. */
  const caixaDeConteudo = (el) => {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    const n = (v) => parseFloat(v) || 0
    const caixa = corta({
      left: r.left + n(s.borderLeftWidth) + n(s.paddingLeft),
      top: r.top + n(s.borderTopWidth) + n(s.paddingTop),
      right: r.right - n(s.borderRightWidth) - n(s.paddingRight),
      bottom: r.bottom - n(s.borderBottomWidth) - n(s.paddingBottom),
    }, recorteVisivel(el))
    return visivel(el, caixa) ? [caixa] : []
  }

  const minFor = (px, weight) => (px >= 24 || (px >= 18.66 && +weight >= 700) ? 3 : 4.5)
  const label = (el, suffix = '') => {
    const cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '')
    return el.tagName.toLowerCase() + (cls.trim() ? '.' + cls.trim().split(/\\s+/).slice(0, 2).join('.') : '') + suffix
  }
  return { paint, isOpaque, ratio, minFor, label, carregaRetratos, piorFundo, linhasDeTexto, caixaDeConteudo }
})()
`

/** Uma passada de medição sobre o estado atual do DOM. */
const MEASURE = `(() => {
  const { piorFundo, minFor, label, linhasDeTexto, caixaDeConteudo } = window.__cx
  const out = []
  let n = 0
  const medidos = [], todos = []
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity < 0.5) continue

    const own = [...el.childNodes].filter((c) => c.nodeType === 3 && c.textContent.trim().length > 1)
    if (own.length) {
      const px = parseFloat(s.fontSize)
      const min = minFor(px, s.fontWeight)
      const chave = label(el) + '|' + own.map((c) => c.textContent.trim()).join(' ').slice(0, 30)
      todos.push(chave)
      const m = piorFundo(linhasDeTexto(el), s.color)
      if (m) {
        medidos.push(chave)
        n++
        if (m.ratio < min - 0.005) {
          out.push({
            sel: label(el),
            text: own.map((c) => c.textContent.trim()).join(' ').slice(0, 45),
            ratio: +m.ratio.toFixed(2), min, px, fg: s.color,
            bg: 'rgb(' + m.bg.join(',') + ')',
          })
        }
      }
    }

    for (const pseudo of ['::marker', '::before', '::after']) {
      const ps = getComputedStyle(el, pseudo)
      if (pseudo === '::marker') {
        // list-style: none nao pinta marcador nenhum, e o navegador ainda
        // devolve estilo computado para ele.
        if (s.display !== 'list-item' || s.listStyleType === 'none') continue
      } else {
        const c = ps.content
        if (!c || c === 'none' || c === 'normal' || c === '""') continue
      }
      const px = parseFloat(ps.fontSize) || parseFloat(s.fontSize)
      const min = minFor(px, ps.fontWeight)
      const chaveP = label(el, pseudo) + '|pseudo'
      todos.push(chaveP)
      const m = piorFundo(caixaDeConteudo(el), ps.color, true)
      if (!m) continue
      medidos.push(chaveP)
      n++
      if (m.ratio < min - 0.005) {
        out.push({
          sel: label(el, pseudo), text: '(pseudo-elemento)',
          ratio: +m.ratio.toFixed(2), min, px, fg: ps.color,
          bg: 'rgb(' + m.bg.join(',') + ')',
        })
      }
    }
  }
  return { out, n, medidos, todos }
})()`

// O Chromium pré-instalado quando existe; senão o do Playwright (a regra
// de playwright.config.ts), para o portão rodar fora deste ambiente.
const CHROMIUM_PREINSTALADO = '/opt/pw-browsers/chromium'
const browser = await chromium.launch(
  existsSync(CHROMIUM_PREINSTALADO) ? { executablePath: CHROMIUM_PREINSTALADO } : {},
)
/* `--largura=390` mede o layout do celular; sem ele, o do desktop. O
   argumento posicional continua sendo o filtro de página. */
const ARGS = process.argv.slice(2)
const LARGURA = Number((ARGS.find((a) => a.startsWith('--largura=')) ?? '--largura=1280').split('=')[1])
/* `--tema=claro` mede o tema claro (manual 3.4): a chave é a mesma que
   src/lib/tema.ts lê, então o que se mede é o caminho real da pessoa que
   escolheu o claro e recarregou a página. Sem ele, o escuro, o padrão. */
const TEMA = ARGS.find((a) => a.startsWith('--tema='))?.split('=')[1] ?? 'escuro'
const ctx = await browser.newContext({ viewport: { width: LARGURA, height: 1000 } })
if (TEMA === 'claro') await ctx.addInitScript(() => localStorage.setItem('portal-tema', 'claro'))
await ctx.addInitScript(HELPERS)
const page = await ctx.newPage()

const b64 = (buf) => 'data:image/png;base64,' + buf.toString('base64')

/**
 * Os dois retratos da JANELA no estado atual: um sem letra, um com.
 *
 * Nunca `fullPage`. Para capturar a página inteira o Chromium redimensiona
 * a janela e REFAZ O LAYOUT: cabeçalho grudento muda de lugar, medida em vh
 * muda de tamanho, e os retângulos medidos na janela normal deixam de
 * corresponder à foto. Foi assim que este portão acusou o bloco de código da
 * missão a 2,34:1 quando ele está sobre o painel escuro, a 5,81:1. A página
 * é percorrida em passos do tamanho da janela.
 */
async function carregaRetratos() {
  const pseudoFora = await page.addStyleTag({ content: ESCONDE_PSEUDO_TUDO })
  await page.evaluate(`(${ESCONDE_PROPRIO})(true)`)
  let vazio
  try {
    vazio = await page.screenshot()
  } finally {
    await page.evaluate(`(${ESCONDE_PROPRIO})(false)`)
    await pseudoFora.evaluate((el) => el.remove())
  }
  const soPseudo = await page.addStyleTag({ content: ESCONDE_PSEUDO })
  let proprio
  try {
    proprio = await page.screenshot()
  } finally {
    await soPseudo.evaluate((el) => el.remove())
  }
  const cheio = await page.screenshot()
  const largura = await page.evaluate(() => window.innerWidth)
  return page.evaluate(
    ([a, b, c, w]) => window.__cx.carregaRetratos(a, b, c, w),
    [b64(vazio), b64(proprio), b64(cheio), largura],
  )
}

let failures = 0
let checked = 0
const medidosGlobal = new Set()
const todosGlobal = new Set()

const report = (label, hits, suffix = '') => {
  for (const f of hits) {
    failures++
    console.log(
      `FAIL ${label}${suffix}  ${String(f.ratio).padStart(5)} (precisa ${f.min}) ${f.sel} ${f.px}px fg=${f.fg} sobre ${f.bg}  "${f.text}"`,
    )
  }
}

const FILTRO = ARGS.find((a) => !a.startsWith('--')) ?? ''

for (const [url, label] of URLS) {
  if (FILTRO && !label.includes(FILTRO)) continue
  await page.goto(BASE + url, { waitUntil: 'load' })
  await page.waitForTimeout(200)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.addStyleTag({ content: SEM_TRANSICAO })

  // Varre a página em passos do tamanho da janela, com uma sobreposição
  // para que nenhuma linha caia na emenda entre dois passos.
  const { alturaDoc, alturaJanela } = await page.evaluate(() => ({
    alturaDoc: document.documentElement.scrollHeight,
    alturaJanela: window.innerHeight,
  }))
  const passo = Math.floor(alturaJanela * 0.85)
  const vistos = new Set()
  let medidosAqui = 0
  for (let y = 0; y < Math.max(1, alturaDoc - 100); y += passo) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(60)
    await carregaRetratos()
    const passada = await page.evaluate(MEASURE)
    medidosAqui += passada.n
    for (const k of passada.medidos) medidosGlobal.add(k)
    for (const k of passada.todos) todosGlobal.add(k)
    const novos = passada.out.filter((f) => {
      const k = f.sel + '|' + f.text
      if (vistos.has(k)) return false
      vistos.add(k)
      return true
    })
    report(label, novos)
  }
  checked += medidosAqui
  const rest = { out: [...vistos].length ? [1] : [], n: medidosAqui }
  await page.evaluate(() => window.scrollTo(0, 0))

  // :hover — um hover que baixa o contraste continua sendo falha, e ele muda
  // o fundo, então cada estado precisa do seu par de retratos.
  const targets = await page.$$('a, button, summary, [role="button"], .no, .card')
  const seen = new Set()
  for (const t of targets.slice(0, 12)) {
    // Quem estava sob o cursor vai no relatório: uma falha de hover só se
    // corrige sabendo QUAL hover a provocou, e ela pode estar longe do
    // texto que caiu (o véu de uma seta sobre o card vizinho, a sombra de
    // um card sobre o próprio pé).
    let alvo = '?'
    try {
      alvo = await t.evaluate((el) => {
        const cls = String(el.className || '').trim().split(/\s+/).slice(0, 2).join('.')
        const txt = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)
        return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (txt ? ` "${txt}"` : '')
      })
      await t.hover({ timeout: 700 })
      await carregaRetratos()
    } catch {
      continue
    }
    const hov = await page.evaluate(MEASURE)
    checked += hov.n
    const fresh = hov.out.filter((f) => {
      const k = f.sel + '|' + f.text
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    report(label, fresh, ` :hover em ${alvo}`)
  }

  if (!vistos.size) console.log(` ok  ${label.padEnd(16)} ${rest.n} nós de texto, todos em AA (incl. hover)`)
}

await browser.close()
// Cobertura de verdade: um no que ficou de fora em UM passo de rolagem foi
// medido no passo seguinte, entao contar "nao medido" por passo nao diz
// nada. O que importa e o no que nunca foi medido em passo nenhum: letra
// coberta por outro elemento, ou da mesma cor exata do fundo. Esse fica
// nomeado, em vez de somar em silencio ao numero de aprovados.
const nunca = [...todosGlobal].filter((k) => !medidosGlobal.has(k))
if (nunca.length) {
  console.log(`\n${nunca.length} de ${todosGlobal.size} nós nunca renderizaram glifo (não medidos):`)
  for (const k of nunca.slice(0, 12)) console.log('   ' + k)
}
console.log(
  failures
    ? `\n${failures} falhas de contraste em ${checked} medições, a ${LARGURA}px, tema ${TEMA}`
    : `\nTodos os ${checked} nós medidos passam em WCAG AA, contra os pixels reais sob cada letra, a ${LARGURA}px, tema ${TEMA}.`,
)
process.exit(failures ? 1 : 0)
