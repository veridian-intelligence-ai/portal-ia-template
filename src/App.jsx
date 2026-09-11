import { useEffect, useMemo, useState } from 'react'
import conteudo from 'virtual:conteudo'
import diagramas from 'virtual:diagrama'
import site from '../site.config.json'
import { Diagrama } from './diagrama/Diagrama.jsx'
import { Icone } from './motor/icones.jsx'
import { guardarIdioma, IdiomaCtx, idiomaGuardado } from './motor/idioma.jsx'
import { Secao } from './motor/Secao.jsx'
import { TemaToggle } from './motor/TemaToggle.jsx'
import { textos } from './motor/textos.js'
import { UserChip } from './motor/UserChip.jsx'

/**
 * O shell do portal. Tudo que é do cliente vem de site.config.json e de
 * content/; este arquivo só monta a moldura: barra lateral com as
 * seções, cabeçalho com idioma, tema e usuário, a seção ativa e o
 * rodapé. A seção ativa vem do #slug da URL (e #slug--cabecalho rola até
 * o cabeçalho), para qualquer seção ter link.
 */
const DIAGRAMA = 'diagrama'

function lerHash() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''))
  if (!h) return { slug: null, alvo: null }
  const [slug] = h.split('--')
  return { slug, alvo: h.includes('--') ? h : null }
}

export default function App() {
  const [lang, setLang] = useState(() => idiomaGuardado(conteudo.idiomas, conteudo.padrao))
  const t = textos(lang)
  const secoes = conteudo.secoes[lang] || conteudo.secoes[conteudo.padrao]
  const diagrama = diagramas ? diagramas[lang] || diagramas[conteudo.padrao] : null

  // A navegação: as seções visíveis mais o diagrama, pela ordem.
  const itens = useMemo(() => {
    const lista = secoes.filter((s) => !s.oculto).map((s) => ({ slug: s.slug, titulo: s.titulo, icone: s.icone, ordem: s.ordem }))
    if (diagrama) lista.push({ slug: DIAGRAMA, titulo: diagrama.titulo, icone: 'mapa', ordem: diagrama.ordem !== undefined ? diagrama.ordem : 9999 })
    return lista.sort((a, b) => a.ordem - b.ordem || a.slug.localeCompare(b.slug))
  }, [secoes, diagrama])

  const [hash, setHash] = useState(lerHash)
  useEffect(() => {
    const ouvir = () => setHash(lerHash())
    window.addEventListener('hashchange', ouvir)
    return () => window.removeEventListener('hashchange', ouvir)
  }, [])

  const existe = (slug) => slug === DIAGRAMA ? Boolean(diagrama) : secoes.some((s) => s.slug === slug)
  const ativo = hash.slug && existe(hash.slug) ? hash.slug : itens[0].slug
  const indice = itens.findIndex((i) => i.slug === ativo)
  const numero = String((indice >= 0 ? indice : itens.length) + 1).padStart(2, '0')

  // Depois de trocar de seção, rola para o cabeçalho pedido ou para o topo.
  useEffect(() => {
    if (hash.alvo) {
      const el = document.getElementById(hash.alvo)
      if (el) {
        el.scrollIntoView({ block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [ativo, hash.alvo])

  useEffect(() => {
    document.documentElement.lang = lang
    guardarIdioma(lang)
  }, [lang])

  // Fontes trocadas em site.config.json (tema.fontes) entram como variáveis.
  useEffect(() => {
    const f = (site.tema && site.tema.fontes) || {}
    const raiz = document.documentElement.style
    const por = (token, valor, fallback) => {
      if (valor) raiz.setProperty(token, `'${valor}', ${fallback}`)
    }
    por('--font-display', f.titulo, "'Arial Black', Arial, sans-serif")
    por('--font-ui', f.texto, 'Arial, sans-serif')
    por('--font-mono', f.codigo, 'ui-monospace, Menlo, Consolas, monospace')
  }, [])

  const secao = ativo === DIAGRAMA ? null : secoes.find((s) => s.slug === ativo)
  const anterior = indice > 0 ? itens[indice - 1] : null
  const proxima = indice >= 0 && indice < itens.length - 1 ? itens[indice + 1] : null
  const aberto = site.auth && site.auth.modo === 'aberto'

  const nav = (className) => (
    <nav className={className} aria-label={t.secoes}>
      <ul>
        {itens.map((i, k) => (
          <li key={i.slug}>
            <a href={`#${i.slug}`} aria-current={i.slug === ativo ? 'page' : undefined}>
              <Icone nome={i.icone} size={20} />
              <span className="nav-numero">{String(k + 1).padStart(2, '0')}</span>
              <span className="nav-titulo">{i.titulo}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )

  return (
    <IdiomaCtx.Provider value={lang}>
      <a className="pular" href="#conteudo">
        {t.pular}
      </a>
      <div className="portal">
        <aside className="lateral">
          <Marca />
          {nav('nav nav-lateral')}
          <p className="lateral-pe">{site.organizacao}</p>
        </aside>
        <div className="principal">
          <header className="topo">
            <div className="topo-marca">
              <Marca />
            </div>
            <div className="controles">
              {conteudo.idiomas.length > 1 ? (
                <div className="idiomas" role="group" aria-label={t.idioma}>
                  {conteudo.idiomas.map((l) => (
                    <button key={l} type="button" className="idioma" aria-pressed={l === lang} onClick={() => setLang(l)} lang={l}>
                      {l.split('-')[0].toUpperCase()}
                    </button>
                  ))}
                </div>
              ) : null}
              <TemaToggle />
              <UserChip />
            </div>
          </header>
          {nav('nav nav-movel')}
          <main id="conteudo" className="conteudo" tabIndex={-1}>
            {secao ? <Secao key={`${lang}:${secao.slug}`} secao={secao} numero={numero} /> : null}
            {!secao && diagrama ? <Diagrama key={lang} diagrama={diagrama} numero={numero} /> : null}
            <nav className="secao-nav" aria-label={`${t.anterior} / ${t.proxima}`}>
              {anterior ? (
                <a className="btn btn-secundario" href={`#${anterior.slug}`}>
                  <span className="secao-nav-dir">{t.anterior}</span>
                  <span className="secao-nav-titulo">{anterior.titulo}</span>
                </a>
              ) : (
                <span />
              )}
              {proxima ? (
                <a className="btn btn-primario" href={`#${proxima.slug}`}>
                  <span className="secao-nav-titulo">{proxima.titulo}</span>
                  <Icone nome="seta" size={18} />
                </a>
              ) : null}
            </nav>
          </main>
          <footer className="rodape">
            <p>
              <span className="rodape-nome">{site.nome}</span>
              {site.rodape ? <span className="rodape-texto">{site.rodape}</span> : null}
            </p>
            {aberto ? (
              <p className="pilula" data-estado="aguardando">
                <Icone nome="circulo" size={14} />
                <span>{t.portalAberto}</span>
              </p>
            ) : null}
          </footer>
        </div>
      </div>
    </IdiomaCtx.Provider>
  )
}

/** A marca: o logo do cliente por tema (public/marca/), ou o nome curto em Unbounded. */
function Marca() {
  const logo = site.logo || {}
  if (logo.escuro || logo.claro) {
    return (
      <a className="marca" href="#" aria-label={site.nome}>
        <img className="marca-logo marca-logo-escuro" src={logo.escuro || logo.claro} alt={site.nome} />
        <img className="marca-logo marca-logo-claro" src={logo.claro || logo.escuro} alt={site.nome} />
      </a>
    )
  }
  return (
    <a className="marca" href="#" aria-label={site.nome}>
      <span className="marca-nome">{site.nomeCurto || site.nome}</span>
    </a>
  )
}
