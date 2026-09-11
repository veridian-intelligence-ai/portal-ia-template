/**
 * O motor de conteúdo: um plugin do Vite que, no build e no dev, lê
 * content/*.md e content/diagrama*.yaml e os entrega ao app como dois
 * módulos virtuais, `virtual:conteudo` e `virtual:diagrama`.
 *
 * Nada de parser no navegador: o markdown vira HTML aqui, em Node, e o
 * frontmatter é validado antes de publicar. Erro de frontmatter, ícone
 * desconhecido, imagem que não existe ou ligação de diagrama para um nó
 * inexistente derrubam o build com o nome do arquivo. Mudou o .md, mudou
 * o site: em dev, qualquer alteração em content/ recarrega a página.
 *
 * O mesmo plugin publica as imagens de content/assets/ em /conteudo/assets/
 * (protegidas pelo middleware, como o resto), gera a página de login a
 * partir de src/login/login.html com os textos do idioma padrão, e grava
 * a página 503 em /indisponivel.html para os portões visuais medirem.
 *
 * As funções puras (compilarConteudo, compilarDiagrama, renderizarLogin)
 * são exportadas para os testes chamarem sem subir o Vite.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve, sep } from 'node:path'
import { load as lerYaml } from 'js-yaml'
import { Marked, Renderer } from 'marked'
import { escaparHtml } from '../api/_lib/comum.js'
import { paginaIndisponivel } from '../api/_lib/paginas.js'
import { ICONES, iconeValido } from '../src/motor/icones-nomes.js'
import { textosLogin } from '../src/login/textos.js'

const CAMPOS = ['title', 'subtitle', 'order', 'icon', 'lang', 'hidden']
const PREFIXO_ASSETS = '/conteudo/assets/'

/**
 * As fontes da página de login, servidas em /fontes/ (fora do bundle
 * protegido). Vêm dos mesmos pacotes @fontsource que o app usa, copiadas
 * no build: nada de binário no repositório, e nunca fora de sincronia.
 */
export const FONTES_DO_LOGIN = {
  'unbounded-900.woff2': '@fontsource/unbounded/files/unbounded-latin-900-normal.woff2',
  'inter-400.woff2': '@fontsource/inter/files/inter-latin-400-normal.woff2',
  'inter-600.woff2': '@fontsource/inter/files/inter-latin-600-normal.woff2',
}

function caminhoDaFonte(pacoteArquivo, raiz) {
  const require = createRequire(join(raiz, 'package.json'))
  const [escopo, nome, ...resto] = pacoteArquivo.split('/')
  const base = dirname(require.resolve(`${escopo}/${nome}/package.json`))
  return join(base, ...resto)
}

// ── Utilidades ───────────────────────────────────────────────────────

export function slugificar(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function textoDe(tokens) {
  return tokens
    .map((t) => (t.tokens ? textoDe(t.tokens) : t.text !== undefined ? t.text : t.raw || ''))
    .join('')
}

/** Separa o frontmatter (entre `---`) do corpo. */
export function separarFrontmatter(texto, nome) {
  const t = texto.replace(/\r\n?/g, '\n')
  if (!t.startsWith('---\n')) throw new Error(`content/${nome}: falta o frontmatter (o arquivo precisa começar com ---).`)
  const fim = t.indexOf('\n---', 4)
  if (fim < 0) throw new Error(`content/${nome}: o frontmatter não fecha (falta a segunda linha ---).`)
  let dados
  try {
    dados = lerYaml(t.slice(4, fim)) || {}
  } catch (e) {
    throw new Error(`content/${nome}: frontmatter inválido (${e.message}).`)
  }
  if (typeof dados !== 'object' || Array.isArray(dados)) throw new Error(`content/${nome}: o frontmatter precisa ser um mapa chave: valor.`)
  return { dados, corpo: t.slice(fim + 4).replace(/^\n+/, '') }
}

/** `01-visao-geral.en.md` → { prefixo: 1, slug: 'visao-geral', lang: 'en' } */
export function analisarNome(nome) {
  const m = nome.match(/^(?:(\d+)-)?(.+?)(?:\.([a-z]{2}(?:-[A-Za-z]{2})?))?\.md$/)
  if (!m) return null
  return { prefixo: m[1] ? Number(m[1]) : null, slug: slugificar(m[2]), lang: m[3] || null }
}

function idiomasDe(site) {
  const padrao = (site.idiomas && site.idiomas.padrao) || 'pt-BR'
  const outros = (site.idiomas && site.idiomas.outros) || []
  return { padrao, lista: [padrao, ...outros.filter((l) => l !== padrao)] }
}

// ── Markdown → HTML ──────────────────────────────────────────────────

function criarMarked({ slug, assets, nome, ids, cabecalhos }) {
  const marked = new Marked({ gfm: true, breaks: false })
  const unico = (base) => {
    let id = base || 'secao'
    let n = 2
    while (ids.has(id)) id = `${base}-${n++}`
    ids.add(id)
    return id
  }
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const texto = textoDe(tokens)
        // O H1 é o título da seção (frontmatter); um `#` no corpo vira H2.
        const nivel = depth === 1 ? 2 : Math.min(depth, 6)
        const id = unico(`${slug}--${slugificar(texto)}`)
        if (nivel === 2) cabecalhos.push({ id, texto })
        return `<h${nivel} id="${id}">${this.parser.parseInline(tokens)}</h${nivel}>\n`
      },
      image({ href, title, text }) {
        const alvo = resolverAsset(href, assets, nome)
        const legenda = title ? `<figcaption>${escaparHtml(title)}</figcaption>` : ''
        return `<figure><img src="${alvo}" alt="${escaparHtml(text || '')}" loading="lazy">${legenda}</figure>`
      },
      code({ text, lang, escaped }) {
        const codigo = escaped ? text : escaparHtml(text)
        const linguagem = (lang || '').trim().split(/\s+/)[0]
        if (linguagem === 'terminal') {
          const linhas = codigo.split('\n').map((l) => `<span class="linha">${l}</span>`).join('\n')
          return `<pre class="terminal terminal-prompt"><code>${linhas}</code></pre>\n`
        }
        const attr = linguagem ? ` data-lang="${escaparHtml(linguagem)}"` : ''
        return `<pre class="terminal"${attr}><code>${codigo}</code></pre>\n`
      },
      table(token) {
        return `<div class="tabela">${Renderer.prototype.table.call(this, token)}</div>\n`
      },
      blockquote({ tokens }) {
        return `<aside class="callout">${this.parser.parse(tokens)}</aside>\n`
      },
      link({ href, title, tokens }) {
        const externo = /^https?:\/\//i.test(href)
        const t = title ? ` title="${escaparHtml(title)}"` : ''
        const rel = externo ? ' rel="noopener noreferrer" target="_blank"' : ''
        return `<a href="${escaparHtml(href)}"${t}${rel}>${this.parser.parseInline(tokens)}</a>`
      },
    },
  })
  return marked
}

function resolverAsset(href, assets, nome) {
  const h = String(href || '')
  if (/^(https?:)?\/\//i.test(h) || h.startsWith('data:')) return escaparHtml(h)
  const m = h.match(/^(?:\.\/)?(?:content\/)?assets\/(.+)$/)
  if (!m) throw new Error(`content/${nome}: a imagem "${h}" precisa estar em content/assets/ e ser referenciada como assets/<arquivo>.`)
  const arquivo = m[1]
  if (!assets.has(arquivo)) throw new Error(`content/${nome}: a imagem assets/${arquivo} não existe em content/assets/.`)
  return PREFIXO_ASSETS + arquivo.split('/').map(encodeURIComponent).join('/')
}

/**
 * As diretivas `::: cards` e `::: passos`: cada `###` dentro do bloco é
 * um item. O bloco é renderizado à parte e concatenado, para o HTML
 * gerado nunca passar pelo parser de markdown de novo.
 */
function segmentar(corpo) {
  const linhas = corpo.split('\n')
  const segmentos = []
  let atual = { tipo: 'md', linhas: [] }
  let cerca = false
  for (const linha of linhas) {
    if (/^\s*(```|~~~)/.test(linha)) cerca = !cerca
    const abre = !cerca && linha.match(/^:::\s*(cards|passos)\s*$/)
    const fecha = !cerca && atual.tipo !== 'md' && /^:::\s*$/.test(linha)
    if (abre) {
      segmentos.push(atual)
      atual = { tipo: abre[1], linhas: [] }
    } else if (fecha) {
      segmentos.push(atual)
      atual = { tipo: 'md', linhas: [] }
    } else {
      atual.linhas.push(linha)
    }
  }
  if (atual.tipo !== 'md') throw new Error(`diretiva ::: ${atual.tipo} sem fechamento (:::).`)
  segmentos.push(atual)
  return segmentos.filter((s) => s.linhas.join('').trim())
}

function renderizarItens(tipo, linhas, marked, nome) {
  const itens = []
  let item = null
  for (const linha of linhas) {
    const h = linha.match(/^###\s+(.+?)\s*$/)
    if (h) {
      item = { titulo: h[1], corpo: [] }
      itens.push(item)
    } else if (item) {
      item.corpo.push(linha)
    } else if (linha.trim()) {
      throw new Error(`content/${nome}: dentro de ::: ${tipo}, cada item começa com "### Título".`)
    }
  }
  if (!itens.length) throw new Error(`content/${nome}: ::: ${tipo} sem itens (### Título).`)
  const html = itens
    .map((it, i) => {
      const corpo = marked.parse(it.corpo.join('\n'))
      const titulo = marked.parseInline(it.titulo)
      if (tipo === 'passos') {
        return `<li class="passo"><span class="passo-numero">${String(i + 1).padStart(2, '0')}</span><div class="passo-corpo"><h3>${titulo}</h3>${corpo}</div></li>`
      }
      return `<article class="card card-conteudo"><h3>${titulo}</h3>${corpo}</article>`
    })
    .join('\n')
  return tipo === 'passos' ? `<ol class="passos">${html}</ol>\n` : `<div class="cards">${html}</div>\n`
}

export function renderizarMarkdown(corpo, { slug, assets = new Set(), nome = 'secao.md' } = {}) {
  const ids = new Set()
  const cabecalhos = []
  const marked = criarMarked({ slug, assets, nome, ids, cabecalhos })
  const html = segmentar(corpo)
    .map((s) => (s.tipo === 'md' ? marked.parse(s.linhas.join('\n')) : renderizarItens(s.tipo, s.linhas, marked, nome)))
    .join('\n')
  return { html, cabecalhos }
}

// ── Conteúdo ─────────────────────────────────────────────────────────

function listarAssets(dir) {
  const pasta = join(dir, 'assets')
  const nomes = new Map()
  if (!existsSync(pasta)) return nomes
  const andar = (sub) => {
    for (const e of readdirSync(join(pasta, sub), { withFileTypes: true })) {
      const rel = sub ? `${sub}/${e.name}` : e.name
      if (e.isDirectory()) andar(rel)
      else nomes.set(rel, join(pasta, rel))
    }
  }
  andar('')
  return nomes
}

function validarFrontmatter(dados, nome, idiomas, assets) {
  for (const chave of Object.keys(dados)) {
    if (!CAMPOS.includes(chave)) {
      throw new Error(`content/${nome}: campo "${chave}" não existe no frontmatter. Os campos são: ${CAMPOS.join(', ')}.`)
    }
  }
  if (typeof dados.title !== 'string' || !dados.title.trim()) throw new Error(`content/${nome}: "title" é obrigatório (texto).`)
  if (dados.subtitle !== undefined && typeof dados.subtitle !== 'string') throw new Error(`content/${nome}: "subtitle" precisa ser texto.`)
  if (dados.order !== undefined && !Number.isInteger(dados.order)) throw new Error(`content/${nome}: "order" precisa ser um inteiro.`)
  if (dados.hidden !== undefined && typeof dados.hidden !== 'boolean') throw new Error(`content/${nome}: "hidden" precisa ser true ou false.`)
  if (dados.icon !== undefined && !iconeValido(dados.icon)) {
    throw new Error(`content/${nome}: ícone "${dados.icon}" desconhecido. Use um de: ${ICONES.join(', ')}, ou custom:<arquivo.svg> em content/assets/.`)
  }
  if (typeof dados.icon === 'string' && dados.icon.startsWith('custom:') && !assets.has(dados.icon.slice(7))) {
    throw new Error(`content/${nome}: o ícone ${dados.icon} não existe em content/assets/.`)
  }
  if (dados.lang !== undefined && !idiomas.lista.includes(dados.lang)) {
    throw new Error(`content/${nome}: idioma "${dados.lang}" não está em site.config.json (idiomas: ${idiomas.lista.join(', ')}).`)
  }
}

/**
 * Lê content/ e devolve as seções por idioma, ordenadas. O idioma padrão
 * é a base; os outros espelham por slug e caem no padrão quando falta a
 * tradução (marcado em `traduzido: false`).
 */
export function compilarConteudo({ dir, site }) {
  const idiomas = idiomasDe(site)
  const assets = listarAssets(dir)
  const nomesAssets = new Set(assets.keys())
  const arquivos = existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.md')).sort() : []
  if (!arquivos.length) throw new Error(`content/: nenhum arquivo .md. O portal precisa de ao menos uma seção.`)

  const porIdioma = Object.fromEntries(idiomas.lista.map((l) => [l, new Map()]))
  for (const nome of arquivos) {
    const info = analisarNome(nome)
    if (!info) throw new Error(`content/${nome}: nome de arquivo inválido. Use NN-nome.md ou NN-nome.<idioma>.md.`)
    const { dados, corpo } = separarFrontmatter(readFileSync(join(dir, nome), 'utf8'), nome)
    validarFrontmatter(dados, nome, idiomas, nomesAssets)
    const lang = dados.lang || info.lang || idiomas.padrao
    if (!idiomas.lista.includes(lang)) throw new Error(`content/${nome}: idioma "${lang}" não está em site.config.json.`)
    if (info.lang && dados.lang && info.lang !== dados.lang) throw new Error(`content/${nome}: o sufixo .${info.lang} e o campo lang: ${dados.lang} discordam.`)
    if (porIdioma[lang].has(info.slug)) throw new Error(`content/${nome}: já existe uma seção "${info.slug}" em ${lang}.`)
    let render
    try {
      render = renderizarMarkdown(corpo, { slug: info.slug, assets: nomesAssets, nome })
    } catch (e) {
      throw new Error(e.message.startsWith('content/') ? e.message : `content/${nome}: ${e.message}`)
    }
    porIdioma[lang].set(info.slug, {
      slug: info.slug,
      ordem: dados.order !== undefined ? dados.order : info.prefixo !== null ? info.prefixo : 999,
      titulo: dados.title.trim(),
      subtitulo: dados.subtitle ? dados.subtitle.trim() : null,
      icone: dados.icon || 'documento',
      lang,
      oculto: dados.hidden === true,
      html: render.html,
      cabecalhos: render.cabecalhos,
      arquivo: nome,
      traduzido: true,
    })
  }

  const base = [...porIdioma[idiomas.padrao].values()].sort((a, b) => a.ordem - b.ordem || a.slug.localeCompare(b.slug))
  if (!base.length) throw new Error(`content/: nenhuma seção no idioma padrão (${idiomas.padrao}).`)
  const secoes = {}
  for (const lang of idiomas.lista) {
    for (const slug of porIdioma[lang].keys()) {
      if (!porIdioma[idiomas.padrao].has(slug)) {
        throw new Error(`content/${porIdioma[lang].get(slug).arquivo}: tradução sem original. Crie a seção "${slug}" em ${idiomas.padrao} primeiro.`)
      }
    }
    secoes[lang] = base.map((s) => {
      const t = porIdioma[lang].get(s.slug)
      return t ? { ...t, ordem: s.ordem, oculto: s.oculto } : { ...s, lang, traduzido: false }
    })
  }
  return {
    padrao: idiomas.padrao,
    idiomas: idiomas.lista,
    secoes,
    arquivos: arquivos.map((n) => join(dir, n)),
    assets: [...assets.entries()].map(([nome, caminho]) => ({ nome, caminho })),
  }
}

// ── Diagrama ─────────────────────────────────────────────────────────

const TIPOS = ['ferramenta', 'plataforma']
const ESTADOS = ['ativo', 'futuro']
const ESTILOS = ['fluxo', 'apoio']

export function validarDiagrama(d, nome, assets = new Set()) {
  const erro = (m) => new Error(`content/${nome}: ${m}`)
  if (!d || typeof d !== 'object') throw erro('o arquivo precisa ser um mapa YAML.')
  if (typeof d.titulo !== 'string' || !d.titulo.trim()) throw erro('"titulo" é obrigatório.')
  if (!Array.isArray(d.raias) || !d.raias.length) throw erro('"raias" precisa ser uma lista com ao menos uma raia.')
  const raias = new Set()
  for (const r of d.raias) {
    if (!r || typeof r.id !== 'string' || typeof r.titulo !== 'string') throw erro('cada raia precisa de id e titulo.')
    if (raias.has(r.id)) throw erro(`raia "${r.id}" repetida.`)
    raias.add(r.id)
  }
  if (!Array.isArray(d.nos) || !d.nos.length) throw erro('"nos" precisa ser uma lista com ao menos um nó.')
  const nos = new Set()
  const posicoes = new Set()
  for (const n of d.nos) {
    if (!n || typeof n.id !== 'string' || typeof n.titulo !== 'string') throw erro('cada nó precisa de id e titulo.')
    if (nos.has(n.id)) throw erro(`nó "${n.id}" repetido.`)
    nos.add(n.id)
    if (!raias.has(n.raia)) throw erro(`nó "${n.id}": raia "${n.raia}" não existe.`)
    if (!Number.isInteger(n.linha) || n.linha < 1) throw erro(`nó "${n.id}": "linha" precisa ser um inteiro a partir de 1.`)
    const pos = `${n.raia}:${n.linha}`
    if (posicoes.has(pos)) throw erro(`nó "${n.id}": já existe um nó na raia "${n.raia}", linha ${n.linha}.`)
    posicoes.add(pos)
    if (n.icone !== undefined && !iconeValido(n.icone)) throw erro(`nó "${n.id}": ícone "${n.icone}" desconhecido.`)
    if (typeof n.icone === 'string' && n.icone.startsWith('custom:') && !assets.has(n.icone.slice(7))) {
      throw erro(`nó "${n.id}": o ícone ${n.icone} não existe em content/assets/.`)
    }
    if (n.tipo !== undefined && !TIPOS.includes(n.tipo)) throw erro(`nó "${n.id}": tipo "${n.tipo}" (use ${TIPOS.join(' ou ')}).`)
    if (n.estado !== undefined && !ESTADOS.includes(n.estado)) throw erro(`nó "${n.id}": estado "${n.estado}" (use ${ESTADOS.join(' ou ')}).`)
    if (n.ficha !== undefined) {
      if (typeof n.ficha !== 'object') throw erro(`nó "${n.id}": "ficha" precisa ser um mapa.`)
      if (n.ficha.como !== undefined) {
        if (!Array.isArray(n.ficha.como)) throw erro(`nó "${n.id}": ficha.como precisa ser uma lista.`)
        for (const c of n.ficha.como) {
          if (!Array.isArray(c) || c.length !== 2 || typeof c[0] !== 'string' || typeof c[1] !== 'string') {
            throw erro(`nó "${n.id}": cada item de ficha.como é um par [rótulo, texto].`)
          }
        }
      }
    }
  }
  for (const l of d.ligacoes || []) {
    if (!l || !nos.has(l.de) || !nos.has(l.para)) throw erro(`ligação de "${l && l.de}" para "${l && l.para}": nó inexistente.`)
    if (l.estilo !== undefined && !ESTILOS.includes(l.estilo)) throw erro(`ligação ${l.de} → ${l.para}: estilo "${l.estilo}" (use ${ESTILOS.join(' ou ')}).`)
  }
  for (const g of d.grupos || []) {
    if (!g || typeof g.titulo !== 'string' || !Array.isArray(g.nos) || !g.nos.length) throw erro('cada grupo precisa de titulo e uma lista nos.')
    for (const id of g.nos) if (!nos.has(id)) throw erro(`grupo "${g.titulo}": nó "${id}" não existe.`)
  }
  if (d.ordem !== undefined && !Number.isInteger(d.ordem)) throw erro('"ordem" precisa ser um inteiro.')
  return d
}

/** Lê diagrama.yaml (e diagrama.<lang>.yaml) e devolve por idioma, ou null quando não há diagrama. */
export function compilarDiagrama({ dir, site }) {
  if (site.diagrama && site.diagrama.ativo === false) return { porIdioma: null, arquivos: [] }
  const idiomas = idiomasDe(site)
  const principal = join(dir, 'diagrama.yaml')
  if (!existsSync(principal)) return { porIdioma: null, arquivos: [] }
  const assets = new Set(listarAssets(dir).keys())
  const ler = (caminho, nome) => {
    let d
    try {
      d = lerYaml(readFileSync(caminho, 'utf8'))
    } catch (e) {
      throw new Error(`content/${nome}: YAML inválido (${e.message}).`)
    }
    return validarDiagrama(d, nome, assets)
  }
  const base = ler(principal, 'diagrama.yaml')
  const porIdioma = {}
  const arquivos = [principal]
  for (const lang of idiomas.lista) {
    const proprio = join(dir, `diagrama.${lang}.yaml`)
    if (lang !== idiomas.padrao && existsSync(proprio)) {
      porIdioma[lang] = ler(proprio, `diagrama.${lang}.yaml`)
      arquivos.push(proprio)
    } else {
      porIdioma[lang] = base
    }
  }
  return { porIdioma, arquivos }
}

// ── Login e index ────────────────────────────────────────────────────

export function renderizarLogin({ site, modelo }) {
  const lang = idiomasDe(site).padrao
  const t = textosLogin(lang)
  const valores = {
    nome: site.nome || 'Portal',
    organizacao: site.organizacao || '',
    lang,
    temaPadrao: site.tema && site.tema.padrao === 'claro' ? 'claro' : 'escuro',
    favicon: site.favicon || '/favicon.svg',
  }
  return modelo.replace(/\{\{\s*([a-zA-Z.]+)\s*\}\}/g, (_, chave) => {
    if (chave.startsWith('t.')) return escaparHtml(t[chave.slice(2)] ?? '')
    return escaparHtml(valores[chave] ?? '')
  })
}

export function renderizarIndex(html, site) {
  const lang = idiomasDe(site).padrao
  return html
    .replaceAll('%NOME%', escaparHtml(site.nome || 'Portal'))
    .replaceAll('%LANG%', escaparHtml(lang))
    .replaceAll('%TEMA_PADRAO%', site.tema && site.tema.padrao === 'claro' ? 'claro' : 'escuro')
    .replaceAll('%FAVICON%', escaparHtml(site.favicon || '/favicon.svg'))
    .replaceAll('%NOINDEX%', site.seo && site.seo.noindex === false ? '' : '<meta name="robots" content="noindex, nofollow" />')
}

// ── O plugin ─────────────────────────────────────────────────────────

const ID_CONTEUDO = 'virtual:conteudo'
const ID_DIAGRAMA = 'virtual:diagrama'

export function portal(opcoes = {}) {
  const raiz = resolve(opcoes.raiz || process.cwd())
  const dir = join(raiz, 'content')
  const lerSite = () => opcoes.site || JSON.parse(readFileSync(join(raiz, 'site.config.json'), 'utf8'))
  const modeloLogin = () => readFileSync(join(raiz, 'src/login/login.html'), 'utf8')
  let ultimo = null

  const compilar = () => {
    const site = lerSite()
    ultimo = { site, conteudo: compilarConteudo({ dir, site }), diagrama: compilarDiagrama({ dir, site }) }
    return ultimo
  }
  const tipoDe = (nome) => {
    const ext = nome.split('.').pop().toLowerCase()
    return { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', pdf: 'application/pdf' }[ext] || 'application/octet-stream'
  }

  return {
    name: 'portal-conteudo',
    resolveId(id) {
      if (id === ID_CONTEUDO) return '\0' + ID_CONTEUDO
      if (id === ID_DIAGRAMA) return '\0' + ID_DIAGRAMA
      return undefined
    },
    load(id) {
      if (id !== '\0' + ID_CONTEUDO && id !== '\0' + ID_DIAGRAMA) return undefined
      const { conteudo, diagrama } = compilar()
      for (const f of [...conteudo.arquivos, ...diagrama.arquivos, join(raiz, 'site.config.json')]) this.addWatchFile(f)
      if (id === '\0' + ID_CONTEUDO) {
        const { padrao, idiomas, secoes } = conteudo
        return `export default ${JSON.stringify({ padrao, idiomas, secoes })}`
      }
      return `export default ${JSON.stringify(diagrama.porIdioma)}`
    },
    transformIndexHtml(html) {
      return renderizarIndex(html, lerSite())
    },
    configureServer(server) {
      server.watcher.add([dir, join(raiz, 'site.config.json'), join(raiz, 'src/login')])
      const recarregar = (arquivo) => {
        const dentro = arquivo.startsWith(dir + sep) || arquivo === join(raiz, 'site.config.json') || arquivo.startsWith(join(raiz, 'src/login') + sep)
        if (!dentro) return
        for (const id of ['\0' + ID_CONTEUDO, '\0' + ID_DIAGRAMA]) {
          const mod = server.moduleGraph.getModuleById(id)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', recarregar)
      server.watcher.on('change', recarregar)
      server.watcher.on('unlink', recarregar)
      server.middlewares.use((req, res, next) => {
        const caminho = decodeURIComponent((req.url || '').split('?')[0])
        if (caminho === '/login' || caminho === '/login.html') {
          res.setHeader('content-type', 'text/html; charset=utf-8')
          res.end(renderizarLogin({ site: lerSite(), modelo: modeloLogin() }))
          return
        }
        if (caminho.startsWith('/fontes/') && FONTES_DO_LOGIN[caminho.slice(8)]) {
          res.setHeader('content-type', 'font/woff2')
          res.end(readFileSync(caminhoDaFonte(FONTES_DO_LOGIN[caminho.slice(8)], raiz)))
          return
        }
        if (caminho === '/indisponivel.html') {
          res.setHeader('content-type', 'text/html; charset=utf-8')
          res.end(paginaIndisponivel(lerSite(), ['WORKOS_API_KEY', 'WORKOS_CLIENT_ID', 'SESSION_SECRET']))
          return
        }
        if (caminho.startsWith(PREFIXO_ASSETS)) {
          const rel = caminho.slice(PREFIXO_ASSETS.length)
          const arquivo = join(dir, 'assets', rel)
          if (!arquivo.startsWith(join(dir, 'assets') + sep) || !existsSync(arquivo) || !statSync(arquivo).isFile()) {
            res.statusCode = 404
            res.end('não encontrado')
            return
          }
          res.setHeader('content-type', tipoDe(rel))
          res.end(readFileSync(arquivo))
          return
        }
        next()
      })
    },
    generateBundle() {
      const { site, conteudo } = ultimo || compilar()
      for (const { nome, caminho } of conteudo.assets) {
        this.emitFile({ type: 'asset', fileName: `conteudo/assets/${nome}`, source: readFileSync(caminho) })
      }
      this.emitFile({ type: 'asset', fileName: 'login.html', source: renderizarLogin({ site, modelo: modeloLogin() }) })
      for (const [nome, origem] of Object.entries(FONTES_DO_LOGIN)) {
        this.emitFile({ type: 'asset', fileName: `fontes/${nome}`, source: readFileSync(caminhoDaFonte(origem, raiz)) })
      }
      this.emitFile({
        type: 'asset',
        fileName: 'indisponivel.html',
        source: paginaIndisponivel(site, ['WORKOS_API_KEY', 'WORKOS_CLIENT_ID', 'SESSION_SECRET']),
      })
    },
  }
}

export default portal
