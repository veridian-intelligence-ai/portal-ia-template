/**
 * GET /api/auth/login?next=/caminho
 *
 * O fluxo hospedado do WorkOS (AuthKit), por código de autorização. É a
 * saída para o que a página própria não trata: MFA, verificação de
 * e-mail e "esqueci a senha" (a tela hospedada tem o link e o WorkOS
 * envia o e-mail de redefinição). O `next` viaja no `state`.
 */
import { clientId, codificarEstado, origemCanonica, recusarSemConfiguracao, workos } from '../_lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (recusarSemConfiguracao(req, res)) return
  const url = workos().userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId: clientId(),
    redirectUri: `${origemCanonica(req)}/api/auth/callback`,
    state: codificarEstado(req.query && req.query.next),
  })
  res.redirect(302, url)
}
