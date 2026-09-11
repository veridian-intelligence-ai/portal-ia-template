/**
 * GET /api/auth/logout
 *
 * Sair de verdade: limpa o cookie e encerra a sessão no WorkOS pelo
 * `sid`. Sem o segundo passo, o próximo clique em "entrar pelo fluxo
 * hospedado" entraria sem pedir senha. O returnTo precisa estar na lista
 * de logout URIs do ambiente WorkOS.
 */
import { configurado, cookieLimpo, lerSessao, origemCanonica, workos } from '../_lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Set-Cookie', cookieLimpo())
  const sessao = configurado() ? await lerSessao(req) : null
  if (sessao && sessao.sid) {
    try {
      const url = workos().userManagement.getLogoutUrl({ sessionId: sessao.sid, returnTo: `${origemCanonica(req)}/login` })
      return res.redirect(302, url)
    } catch {
      // sem sid válido no WorkOS: o cookie já foi limpo, basta voltar ao login
    }
  }
  return res.redirect(302, '/login')
}
