import { useMemo, useRef, useState } from 'react'
import { Icone } from '../motor/icones.jsx'
import { useT } from '../motor/idioma.jsx'
import { Ficha } from './Ficha.jsx'
import { calcularLayout, ordemDeNavegacao } from './layout.js'

/**
 * O mapa: um SVG para raias, grupos e setas, e um <button> por nó,
 * posicionado por cima. Botões são alvos de Tab por natureza, então a
 * navegação por teclado cobre todos os nós sem código; as setas andam na
 * ordem do arquivo, e o listener fica no container, não no document.
 * No celular o container rola na horizontal (o desenho não encolhe).
 */
/** Largura estimada do rótulo (Inter 13px): serve para a caixa opaca atrás dele. */
function larguraDoRotulo(texto) {
  return Math.round(String(texto).length * 7.2) + 12
}

export function Diagrama({ diagrama, numero }) {
  const t = useT()
  const layout = useMemo(() => calcularLayout(diagrama), [diagrama])
  const ordem = useMemo(() => ordemDeNavegacao(diagrama), [diagrama])
  const [aberto, setAberto] = useState(null)
  const mapa = useRef(null)
  const raiaDe = (id) => layout.raias.find((r) => r.id === id)

  const teclado = (e) => {
    const atual = e.target.closest && e.target.closest('[data-no]')
    if (!atual) return
    const i = ordem.indexOf(atual.dataset.no)
    let alvo = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') alvo = ordem[(i + 1) % ordem.length]
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') alvo = ordem[(i - 1 + ordem.length) % ordem.length]
    else if (e.key === 'Home') alvo = ordem[0]
    else if (e.key === 'End') alvo = ordem[ordem.length - 1]
    if (!alvo) return
    e.preventDefault()
    const el = mapa.current && mapa.current.querySelector(`[data-no="${alvo}"]`)
    if (el) el.focus()
  }

  const noAberto = aberto ? layout.nos.find((n) => n.id === aberto) : null
  return (
    <article className="secao secao-diagrama" aria-labelledby="titulo-diagrama">
      <p className="kicker kicker-numero">{numero}</p>
      <h1 id="titulo-diagrama">{layout.titulo}</h1>
      <p className="subtitulo">{t.diagramaAjuda}</p>
      <div className="diagrama-rolagem">
        <div
          className="diagrama-mapa"
          ref={mapa}
          role="group"
          aria-label={layout.titulo}
          style={{ width: layout.largura, height: layout.altura }}
          onKeyDown={teclado}
        >
          <svg className="diagrama-svg" width={layout.largura} height={layout.altura} viewBox={`0 0 ${layout.largura} ${layout.altura}`} aria-hidden="true">
            <defs>
              <marker id="seta-fluxo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M1,1 L9,5 L1,9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            {layout.raias.map((r) => (
              <g key={r.id} className="raia">
                <rect x={r.x} y={24} width={r.largura} height={r.altura} rx="12" />
                <text x={r.x + 16} y={24 + 27} className="raia-titulo">
                  {r.titulo.toUpperCase()}
                </text>
              </g>
            ))}
            {layout.grupos.map((g) => (
              <g key={g.titulo} className="grupo">
                <rect x={g.x} y={g.y} width={g.largura} height={g.altura} rx="10" />
                <text x={g.x + g.largura - 10} y={g.y + g.altura - 9} textAnchor="end" className="grupo-titulo">
                  {g.titulo.toUpperCase()}
                </text>
              </g>
            ))}
            {layout.ligacoes.map((l, i) => (
              <g key={i} className={`ligacao ligacao-${l.estilo}`}>
                <path d={l.caminho} markerEnd="url(#seta-fluxo)" />
                {l.rotulo ? (
                  // Um retângulo opaco atrás do rótulo: ele pode cruzar a linha
                  // de outra ligação, e o portão de contraste mede o pixel real.
                  <g className="ligacao-rotulo-caixa">
                    <rect
                      x={l.rotuloX - (l.caminho.includes('H') ? larguraDoRotulo(l.rotulo) / 2 : 4)}
                      y={l.rotuloY - (l.caminho.includes('H') ? 14 : 9)}
                      width={larguraDoRotulo(l.rotulo)}
                      height={18}
                      rx={4}
                    />
                    <text x={l.rotuloX} y={l.rotuloY} className="ligacao-rotulo" textAnchor={l.caminho.includes('H') ? 'middle' : 'start'} dominantBaseline={l.caminho.includes('H') ? 'auto' : 'middle'}>
                      {l.rotulo}
                    </text>
                  </g>
                ) : null}
              </g>
            ))}
          </svg>
          {layout.nos.map((n) => (
            <button
              key={n.id}
              type="button"
              className="no"
              data-no={n.id}
              data-tipo={n.tipo || 'ferramenta'}
              data-estado={n.estado || 'ativo'}
              aria-expanded={aberto === n.id}
              aria-haspopup="dialog"
              style={{ left: n.x, top: n.y, width: n.largura, height: n.altura }}
              onClick={() => setAberto(n.id)}
            >
              <span className="no-icone">
                <Icone nome={n.icone || 'documento'} size={22} />
              </span>
              <span className="no-texto">
                <span className="no-titulo">{n.titulo}</span>
                {n.subtitulo ? <span className="no-subtitulo">{n.subtitulo}</span> : null}
              </span>
              {n.estado === 'futuro' ? (
                <span className="no-estado" title={t.previsto}>
                  <Icone nome="relogio" size={14} />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <Ficha no={noAberto} raia={noAberto ? raiaDe(noAberto.raia) : null} aoFechar={() => setAberto(null)} />
    </article>
  )
}
