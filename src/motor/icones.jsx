/**
 * Os ícones lineares do template (manual, 5.1): traço de 1,5px, cantos
 * arredondados, sem preenchimento, base de 24px, em currentColor. Os
 * nomes válidos estão em icones-nomes.js; `custom:<arquivo.svg>` carrega
 * um SVG monocromático do cliente em content/assets/.
 */
export function Icone({ nome, size = 24, className = '' }) {
  if (typeof nome === 'string' && nome.startsWith('custom:')) {
    return (
      <img
        src={`/conteudo/assets/${encodeURIComponent(nome.slice(7))}`}
        alt=""
        width={size}
        height={size}
        className={`icone icone-custom ${className}`.trim()}
        aria-hidden="true"
      />
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icone icone-${nome} ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      {desenho(nome)}
    </svg>
  )
}

function desenho(nome) {
  switch (nome) {
    case 'documento':
      return (
        <>
          <path d="M7 3.5h7l5 5v11a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5.5 19.5v-14.5A1.5 1.5 0 0 1 7 3.5z" />
          <path d="M14 3.5v5h5M9 13h6M9 16.5h6" />
        </>
      )
    case 'mapa':
      return (
        <>
          <path d="M3.5 6.5 9 4l6 2.5 5.5-2.5v13L15 19.5 9 17l-5.5 2.5z" />
          <path d="M9 4v13M15 6.5v13" />
        </>
      )
    case 'engrenagem':
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
        </>
      )
    case 'cilindro':
      return (
        <>
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
          <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
        </>
      )
    case 'barras':
      return (
        <>
          <rect x="3.5" y="12.5" width="4.5" height="8" rx="1" />
          <rect x="9.75" y="7.5" width="4.5" height="13" rx="1" />
          <rect x="16" y="3.5" width="4.5" height="17" rx="1" />
        </>
      )
    case 'nuvem':
      return <path d="M7 18.5h10.5a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.4 9.4 4.5 4.5 0 0 0 7 18.5z" />
    case 'robo':
      return (
        <>
          <rect x="4.5" y="8" width="15" height="11" rx="3" />
          <path d="M12 8V4.5M9.5 4.5h5M2.5 12.5v3M21.5 12.5v3" />
          <circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none" />
        </>
      )
    case 'pasta':
      return <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z" />
    case 'usuario':
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
        </>
      )
    case 'cadeado':
      return (
        <>
          <rect x="5" y="11" width="14" height="9.5" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      )
    case 'globo':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z" />
        </>
      )
    case 'casa':
      return (
        <>
          <path d="M4 11 12 4l8 7" />
          <path d="M6 9.5V19a1 1 0 0 0 1 1h3.5v-5h3v5H17a1 1 0 0 0 1-1V9.5" />
        </>
      )
    case 'seta':
      return (
        <>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </>
      )
    case 'check':
      return <path d="m5 12.5 5 5 9-10.5" />
    case 'alerta':
      return (
        <>
          <path d="M12 4 21 19.5H3z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" />
        </>
      )
    case 'relogio':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      )
    case 'circulo':
      return <circle cx="12" cy="12" r="8.5" />
    case 'circulo-ponto':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" className="icone-ponto" />
        </>
      )
    case 'fechar':
      return <path d="M6 6 18 18M18 6 6 18" />
    case 'sol':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
        </>
      )
    case 'lua':
      return <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a7 7 0 0 0 9.7 9.7z" />
    case 'sair':
      return (
        <>
          <path d="M10 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h4" />
          <path d="M15 8.5 19 12l-4 3.5M9 12h10" />
        </>
      )
    default:
      return <circle cx="12" cy="12" r="8.5" />
  }
}
