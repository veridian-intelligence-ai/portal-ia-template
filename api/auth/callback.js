/**
 * GET /api/auth/callback?code=...&state=...
 *
 * Volta do fluxo hospedado: troca o código pela sessão, sela o cookie e
 * segue para o `next` guardado no `state` (sempre um caminho do próprio
 * site, por caminhoSeguro). Qualquer erro volta para o login.
 */
import { clientId, cookieDeSessao, decodificarEstado, ipDe, recusarSemConfiguracao, selarSessao, workos } from '../_lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (recusarSemConfiguracao(req, res)) return
  const code = req.query && typeof req.query.code === 'string' ? req.query.code : ''
  if (!code) return res.redirect(302, '/login?erro=callback')
  try {
    const auth = await workos().userManagement.authenticateWithCode({
      clientId: clientId(),
      code,
      ipAddress: ipDe(req),
      userAgent: req.headers['user-agent'],
    })
    const token = await selarSessao(auth)
    res.setHeader('Set-Cookie', cookieDeSessao(token))
    return res.redirect(302, decodificarEstado(req.query.state))
  } catch {
    return res.redirect(302, '/login?erro=callback')
  }
}
