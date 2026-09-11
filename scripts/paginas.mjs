/**
 * As páginas que os portões e as capturas visitam: uma por seção de
 * content/ (pelo #slug), o diagrama, o login e a página 503. Lê o
 * conteúdo pelo mesmo plugin do build, então uma seção nova entra
 * sozinha.
 */
import { readFileSync } from 'node:fs'
import { compilarConteudo, compilarDiagrama } from '../plugins/conteudo.js'

export function paginas() {
  const site = JSON.parse(readFileSync('site.config.json', 'utf8'))
  const conteudo = compilarConteudo({ dir: 'content', site })
  const diagrama = compilarDiagrama({ dir: 'content', site })
  const lista = conteudo.secoes[conteudo.padrao].filter((s) => !s.oculto).map((s) => [`/#${s.slug}`, `secao-${s.slug}`])
  if (diagrama.porIdioma) lista.push(['/#diagrama', 'diagrama'])
  lista.push(['/login.html', 'login'], ['/indisponivel.html', 'indisponivel'])
  return lista
}
