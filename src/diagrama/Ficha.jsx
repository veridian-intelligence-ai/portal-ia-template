import { useEffect, useRef } from 'react'
import { Icone } from '../motor/icones.jsx'
import { useT } from '../motor/idioma.jsx'
import { renderInline } from './inline.js'

/** A ficha de um nó, num <dialog> nativo: fecha por X, por Esc e por clique fora. */
export function Ficha({ no, raia, aoFechar }) {
  const t = useT()
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (no && !d.open) d.showModal()
    if (!no && d.open) d.close()
  }, [no])
  if (!no) return <dialog ref={ref} className="ficha" />
  const f = no.ficha || {}
  return (
    <dialog
      ref={ref}
      className="ficha"
      aria-labelledby={`ficha-${no.id}`}
      onClose={aoFechar}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
    >
      <div className="ficha-caixa">
        <div className="ficha-cabeca">
          <div>
            <p className="kicker">
              {t.raia}: {raia ? raia.titulo : no.raia}
            </p>
            <h2 id={`ficha-${no.id}`}>{no.titulo}</h2>
            {no.subtitulo ? <p className="ficha-subtitulo">{no.subtitulo}</p> : null}
          </div>
          <button type="button" className="ficha-fechar" aria-label={t.fechar} onClick={() => ref.current && ref.current.close()}>
            <Icone nome="fechar" size={18} />
          </button>
        </div>
        <p className="pilula" data-estado={no.estado === 'futuro' ? 'aguardando' : 'concluido'}>
          <Icone nome={no.estado === 'futuro' ? 'relogio' : 'check'} size={14} />
          <span>{no.estado === 'futuro' ? t.previsto : t.ativo}</span>
        </p>
        {f.definicao ? (
          <section className="ficha-secao">
            <h3>{t.definicao}</h3>
            <p>{renderInline(f.definicao)}</p>
          </section>
        ) : null}
        {Array.isArray(f.como) && f.como.length ? (
          <section className="ficha-secao">
            <h3>{t.como}</h3>
            <dl className="ficha-como">
              {f.como.map(([rotulo, texto], i) => (
                <div key={i}>
                  <dt>{renderInline(rotulo)}</dt>
                  <dd>{renderInline(texto)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
        {f.exemplo ? (
          <section className="ficha-secao">
            <h3>{t.exemplo}</h3>
            <pre className="terminal">
              <code>{f.exemplo}</code>
            </pre>
          </section>
        ) : null}
        {f.nunca ? (
          <section className="ficha-secao">
            <h3>{t.nunca}</h3>
            <aside className="callout">
              <p>{renderInline(f.nunca)}</p>
            </aside>
          </section>
        ) : null}
      </div>
    </dialog>
  )
}
