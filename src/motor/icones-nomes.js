/**
 * O vocabulário de ícones do template (manual de marca, 5.1 e 5.2), pelo
 * nome. O plugin de conteúdo valida o frontmatter e o diagrama contra
 * esta lista; src/motor/icones.jsx desenha cada um. Um nome novo entra
 * nos dois lugares. `custom:<arquivo.svg>` aponta para content/assets/.
 */
export const ICONES = [
  'documento',
  'mapa',
  'engrenagem',
  'cilindro',
  'barras',
  'nuvem',
  'robo',
  'pasta',
  'usuario',
  'cadeado',
  'globo',
  'casa',
  'seta',
  'check',
  'alerta',
  'relogio',
]

export function iconeValido(nome) {
  if (typeof nome !== 'string' || !nome) return false
  if (ICONES.includes(nome)) return true
  return /^custom:[A-Za-z0-9._-]+\.svg$/.test(nome)
}
