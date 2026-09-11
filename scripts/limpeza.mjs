/**
 * Portão de limpeza: nada do portal de referência (o cliente de onde os
 * padrões foram extraídos) pode aparecer neste template. Nem nome, nem
 * domínio, nem os ícones de ferramentas do mapa antigo, nem as fontes
 * antigas. Sai diferente de zero em qualquer ocorrência.
 *
 *   node scripts/limpeza.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = process.cwd()
const IGNORAR = new Set(['node_modules', 'dist', '.git', '.vercel', 'capturas'])
const BINARIO = /\.(woff2?|png|jpe?g|gif|webp|avif|ico|pdf|zip)$/i

// Termos proibidos: o cliente de referência, os domínios dele, o nome do
// cookie antigo e os ícones de ferramentas do mapa antigo. Comparação sem
// distinção de caixa. As fontes antigas (que o manual de marca cita como o
// que sai) são vigiadas em tests/tokens.test.js, fora de docs/.
const PROIBIDOS = [
  'clever',
  'cleverads',
  'cleverdatastack',
  'moderndatastack',
  'mds_session',
  'target_architecture',
  'vscode',
  'databricks',
  'fabric',
  'powerbi',
  'power bi',
  'kql',
  'jira',
  'confluence',
  'dbt',
  'airflow',
  'snowflake',
  'bigquery',
  'fablogs',
  'confsrc',
]

function andar(dir) {
  const out = []
  for (const nome of readdirSync(dir)) {
    if (IGNORAR.has(nome)) continue
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) out.push(...andar(caminho))
    else if (!BINARIO.test(nome) && nome !== 'package-lock.json') out.push(caminho)
  }
  return out
}

export function varrer(raiz = RAIZ) {
  const achados = []
  for (const arquivo of andar(raiz)) {
    if (arquivo.endsWith('scripts/limpeza.mjs') || arquivo.endsWith('tests/limpeza.test.js')) continue
    const linhas = readFileSync(arquivo, 'utf8').split('\n')
    linhas.forEach((linha, i) => {
      const baixa = linha.toLowerCase()
      for (const termo of PROIBIDOS) {
        if (baixa.includes(termo)) achados.push(`${relative(raiz, arquivo)}:${i + 1}  [${termo}]  ${linha.trim().slice(0, 90)}`)
      }
    })
  }
  return achados
}

if (process.argv[1] && process.argv[1].endsWith('limpeza.mjs')) {
  const achados = varrer()
  for (const a of achados) console.log('FAIL ' + a)
  console.log(achados.length ? `\n${achados.length} ocorrências de termos proibidos` : '\nLimpo: nenhuma ocorrência de termos do portal de referência.')
  process.exit(achados.length ? 1 : 0)
}
