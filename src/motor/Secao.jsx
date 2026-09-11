import { useT } from './idioma.jsx'

/**
 * Uma seção do portal: o HTML compilado do markdown, com o kicker
 * numerado, o título em Unbounded e o índice "nesta seção" (os H2).
 */
export function Secao({ secao, numero }) {
  const t = useT()
  return (
    <article className="secao" aria-labelledby={`titulo-${secao.slug}`}>
      <p className="kicker kicker-numero">{numero}</p>
      <h1 id={`titulo-${secao.slug}`}>{secao.titulo}</h1>
      {secao.subtitulo ? <p className="subtitulo">{secao.subtitulo}</p> : null}
      {secao.traduzido === false ? (
        <aside className="callout callout-aviso">
          <p>{t.naoTraduzido}</p>
        </aside>
      ) : null}
      {secao.cabecalhos.length > 1 ? (
        <nav className="nesta-secao" aria-label={t.nestaSecao}>
          <p className="kicker">{t.nestaSecao}</p>
          <ul>
            {secao.cabecalhos.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>{c.texto}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div className="prosa" dangerouslySetInnerHTML={{ __html: secao.html }} />
    </article>
  )
}
