/**
 * POST /api/auth/senha  { email, senha, next? }
 *
 * Login por senha, sem sair da página do portal. Toda falha responde o
 * MESMO 401 com o código `credenciais`: senha errada, e-mail inexistente,
 * conta que exige verificação ou MFA. Diferenciar confirmaria que a conta
 * existe. Quem precisa de verificação ou MFA entra pelo fluxo hospedado
 * (/api/auth/login), cujo link a página de login mostra sempre.
 */
import {
  caminhoSeguro,
  clientId,
  cookieDeSessao,
  ipDe,
  recusarOrigem,
  recusarSemConfiguracao,
  selarSessao,
  workos,
} from '../_lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, codigo: 'metodo' })
  if (recusarOrigem(req, res)) return
  if (recusarSemConfiguracao(req, res)) return

  const corpo = req.body && typeof req.body === 'object' ? req.body : {}
  const email = typeof corpo.email === 'string' ? corpo.email.trim() : ''
  const senha = typeof corpo.senha === 'string' ? corpo.senha : ''
  if (!email || !senha) return res.status(400).json({ ok: false, codigo: 'campos' })

  try {
    const auth = await workos().userManagement.authenticateWithPassword({
      clientId: clientId(),
      email,
      password: senha,
      ipAddress: ipDe(req),
      userAgent: req.headers['user-agent'],
    })
    const token = await selarSessao(auth)
    res.setHeader('Set-Cookie', cookieDeSessao(token))
    return res.status(200).json({ ok: true, next: caminhoSeguro(corpo.next) })
  } catch {
    return res.status(401).json({ ok: false, codigo: 'credenciais' })
  }
}
