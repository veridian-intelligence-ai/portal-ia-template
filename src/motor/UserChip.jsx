import { useEffect, useState } from 'react'
import { Icone } from './icones.jsx'
import { useT } from './idioma.jsx'

/**
 * Quem está logado e o botão de sair. Sem sessão (dev local, portal
 * aberto, funções ausentes) não renderiza nada: o mesmo bundle serve
 * os três casos.
 */
export function UserChip() {
  const t = useT()
  const [usuario, setUsuario] = useState(null)
  useEffect(() => {
    let vivo = true
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (vivo && j && j.ok) setUsuario(j)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])
  if (!usuario) return null
  return (
    <div className="user-chip">
      <span className="user-chip-email">{usuario.email}</span>
      <a className="btn btn-secundario btn-pequeno" href="/api/auth/logout">
        <Icone nome="sair" size={16} />
        {t.sair}
      </a>
    </div>
  )
}
