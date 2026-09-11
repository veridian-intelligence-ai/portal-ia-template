/**
 * GET /api/auth/me → { email, nome } da sessão, ou 401.
 * Só o que o chip de usuário mostra; nada além.
 */
import { configurado, lerSessao } from '../_lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!configurado()) return res.status(503).json({ ok: false, codigo: 'nao_configurado' })
  const sessao = await lerSessao(req)
  if (!sessao) return res.status(401).json({ ok: false, codigo: 'nao_autenticado' })
  return res.status(200).json({ ok: true, email: sessao.email, nome: sessao.nome })
}
