import { useState } from 'react'
import { Icone } from './icones.jsx'
import { useT } from './idioma.jsx'
import { aplicarTema, temaAtual } from './tema.js'

/** Sol e lua, sem texto, no canto superior direito (manual, 3.4). */
export function TemaToggle() {
  const t = useT()
  const [tema, setTema] = useState(() => temaAtual())
  const claro = tema === 'claro'
  return (
    <button
      type="button"
      className="tema-toggle"
      aria-pressed={claro}
      aria-label={claro ? t.temaEscuro : t.temaClaro}
      title={claro ? t.temaEscuro : t.temaClaro}
      onClick={() => {
        const proximo = claro ? 'escuro' : 'claro'
        aplicarTema(proximo)
        setTema(proximo)
      }}
    >
      <Icone nome={claro ? 'lua' : 'sol'} size={18} />
    </button>
  )
}
