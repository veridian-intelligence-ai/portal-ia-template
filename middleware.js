/**
 * Middleware de borda (Vercel): protege TUDO por padrão.
 *
 * Roda em toda requisição antes do sistema de arquivos, então cobre o
 * HTML, o bundle em /assets/ e as imagens em /conteudo/. A allowlist é
 * exata e curta (api/_lib/comum.js): login, as funções de auth, fontes,
 * marca e favicon. Qualquer rota nova nasce protegida.
 *
 * Três estados, decididos aqui:
 *   1. `auth.modo = "aberto"` em site.config.json: não bloqueia. É uma
 *      decisão explícita do cliente, mostrada no rodapé do portal.
 *   2. Faltam variáveis (WORKOS_API_KEY, WORKOS_CLIENT_ID, SESSION_SECRET
 *      com 32+ caracteres): em desenvolvimento (`vercel dev`) abre; em
 *      preview e produção responde 503 com uma página que diz o que
 *      falta. Nunca abre em produção por acidente.
 *   3. Variáveis presentes: sem cookie de sessão válido, redireciona para
 *      /login guardando o destino em ?next=. Com cookie válido, passa.
 *
 * A sessão é um JWT HS256 assinado com SESSION_SECRET, no cookie HttpOnly
 * que api/_lib/auth.js emite. Nada aqui chama o WorkOS: validar a
 * assinatura basta, e é por isso que não há banco.
 */
import { jwtVerify } from 'jose'
import site from './site.config.json' with { type: 'json' }
import { ehPublico, lerCookie, nomeDoCookie, variaveisFaltando } from './api/_lib/comum.js'
import { paginaIndisponivel } from './api/_lib/paginas.js'

export default async function middleware(request) {
  const url = new URL(request.url)
  if (ehPublico(url.pathname)) return undefined
  if (site.auth && site.auth.modo === 'aberto') return undefined

  const env = process.env
  const faltam = variaveisFaltando(env)
  if (faltam.length) {
    // Local (`vercel dev`): aberto, para desenvolver sem chaves.
    if (env.VERCEL_ENV === 'development' || !env.VERCEL) return undefined
    return new Response(paginaIndisponivel(site, faltam), {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '300',
      },
    })
  }

  const token = lerCookie(request.headers.get('cookie'), nomeDoCookie(site))
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(env.SESSION_SECRET), { algorithms: ['HS256'] })
      return undefined
    } catch {
      // cookie inválido ou expirado: cai no redirecionamento abaixo
    }
  }

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ ok: false, codigo: 'nao_autenticado' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    })
  }
  const destino = new URL('/login', url.origin)
  destino.searchParams.set('next', url.pathname + url.search)
  return Response.redirect(destino.toString(), 302)
}
