/**
 * O que o middleware (Vercel Edge) e as funções em api/ (Node) têm em comum.
 *
 * Este arquivo não importa nada: nem Node, nem SDK. É a única forma de o
 * mesmo código valer nos dois runtimes, e é o que os testes de auth
 * exercitam sem subir servidor nenhum.
 */

/** O segredo que assina a sessão precisa de 32 caracteres, no mínimo. */
export const SEGREDO_MINIMO = 32

/** As três variáveis que ligam o login. Sem qualquer uma delas, fecha. */
export const VARIAVEIS = ['WORKOS_API_KEY', 'WORKOS_CLIENT_ID', 'SESSION_SECRET']

/** Quais variáveis faltam (ou estão curtas demais para valer). */
export function variaveisFaltando(env) {
  const faltam = VARIAVEIS.filter((nome) => !env[nome] || !String(env[nome]).trim())
  if (!faltam.includes('SESSION_SECRET') && String(env.SESSION_SECRET).length < SEGREDO_MINIMO) {
    faltam.push('SESSION_SECRET')
  }
  return faltam
}

/**
 * Allowlist do middleware: exata, curta, e por caminho inteiro. O que não
 * está aqui é protegido, inclusive /assets/ (o bundle) e /conteudo/ (as
 * imagens do markdown).
 */
const PUBLICOS_EXATOS = new Set([
  '/login',
  '/login.html',
  '/favicon.svg',
  '/robots.txt',
  '/api/auth/senha',
  '/api/auth/login',
  '/api/auth/callback',
  '/api/auth/logout',
  '/api/auth/me',
])
const PUBLICOS_PREFIXO = ['/fontes/', '/marca/']

export function ehPublico(pathname) {
  if (PUBLICOS_EXATOS.has(pathname)) return true
  return PUBLICOS_PREFIXO.some((p) => pathname.startsWith(p))
}

/** Nome do cookie de sessão: o da configuração, ou derivado do nome curto. */
export function nomeDoCookie(site) {
  if (site.auth && site.auth.cookie) return String(site.auth.cookie)
  const base = String(site.nomeCurto || site.nome || 'portal')
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `${slug || 'portal'}_sessao`
}

/**
 * Um `next` seguro é um caminho do próprio site: começa com uma barra, não
 * com duas (protocol-relative), e não tem esquema nem barra invertida.
 */
export function caminhoSeguro(next) {
  if (typeof next !== 'string') return '/'
  const n = next.trim()
  if (!n.startsWith('/') || n.startsWith('//') || n.startsWith('/\\')) return '/'
  if (/^\/[^/]*:/.test(n) || n.includes('\\')) return '/'
  return n
}

/** Os hosts em que este portal existe: domínio, aliases e, se permitido, o preview. */
export function hostsPermitidos(site, hostDaRequisicao) {
  const lista = [site.dominio, ...(site.aliases || [])].filter(Boolean).map((h) => String(h).toLowerCase())
  const h = String(hostDaRequisicao || '').toLowerCase()
  if (h && site.auth && site.auth.permitirPreview && h.endsWith('.vercel.app')) lista.push(h)
  return lista
}

/**
 * Verificação de origem, EXATA. `Origin` precisa ser `https://<host permitido>`,
 * caractere por caractere. Substring não vale: `https://portal.exemplo.com.atacante.com`
 * contém o host e não pode passar. Sem `Origin` (curl, navegadores antigos em
 * navegação de mesma origem) passa: a proteção é contra navegadores de terceiros.
 */
export function origemPermitida(origin, hostDaRequisicao, site, vercelEnv) {
  if (origin === undefined || origin === null || origin === '') return true
  const o = String(origin).toLowerCase()
  const host = String(hostDaRequisicao || '').toLowerCase()
  if (vercelEnv === 'development' && host && o === `http://${host}`) return true
  return hostsPermitidos(site, host).some((h) => o === `https://${h}`)
}

/** O host canônico para redirect_uri e returnTo (o primeiro da configuração, ou o do pedido). */
export function hostCanonico(site, hostDaRequisicao) {
  const host = String(hostDaRequisicao || '').toLowerCase()
  const permitidos = hostsPermitidos(site, host)
  if (permitidos.includes(host)) return host
  return permitidos[0] || host
}

/** Lê um cookie do header Cookie, sem biblioteca. */
export function lerCookie(header, nome) {
  if (!header) return null
  for (const parte of String(header).split(';')) {
    const i = parte.indexOf('=')
    if (i < 0) continue
    if (parte.slice(0, i).trim() === nome) return decodeURIComponent(parte.slice(i + 1).trim())
  }
  return null
}

/** Escapa texto para dentro de HTML. */
export function escaparHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
