/**
 * A biblioteca das funções de auth (Node, Vercel Functions).
 *
 * Sessão: JWT HS256 assinado com SESSION_SECRET, em cookie HttpOnly,
 * Secure, SameSite=Lax, com a validade de `auth.sessaoHoras` (padrão 12).
 * Não há tabela de sessões: o middleware valida a assinatura na borda.
 * O `sid` do WorkOS vai dentro do JWT para o logout encerrar a sessão
 * lá também; sem isso, o próximo login entraria sozinho.
 *
 * O segredo precisa de 32+ caracteres. A IA gera; a pessoa nunca digita.
 */
import { WorkOS } from '@workos-inc/node'
import { SignJWT, jwtVerify } from 'jose'
import site from '../../site.config.json' with { type: 'json' }
import {
  caminhoSeguro,
  hostCanonico,
  lerCookie,
  nomeDoCookie,
  origemPermitida,
  variaveisFaltando,
} from './comum.js'

export { site, caminhoSeguro }

export const COOKIE = nomeDoCookie(site)
const HORAS = Number(site.auth && site.auth.sessaoHoras) || 12
const MAX_AGE = HORAS * 60 * 60

export function configurado() {
  return variaveisFaltando(process.env).length === 0
}

let cliente = null
export function workos() {
  if (!cliente) cliente = new WorkOS(process.env.WORKOS_API_KEY, { clientId: process.env.WORKOS_CLIENT_ID })
  return cliente
}

export function clientId() {
  return process.env.WORKOS_CLIENT_ID
}

function segredo() {
  return new TextEncoder().encode(process.env.SESSION_SECRET)
}

/** O `sid` da sessão do WorkOS, lido do access token sem validar (o WorkOS o emitiu). */
export function sidDe(accessToken) {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'))
    return typeof payload.sid === 'string' ? payload.sid : null
  } catch {
    return null
  }
}

/** Sela a sessão a partir da resposta de autenticação do WorkOS. */
export async function selarSessao(auth) {
  const nome = [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' ') || null
  return new SignJWT({ email: auth.user.email, nome, sid: sidDe(auth.accessToken) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(auth.user.id)
    .setIssuedAt()
    .setExpirationTime(`${HORAS}h`)
    .sign(segredo())
}

/** A sessão do pedido, ou null. */
export async function lerSessao(req) {
  const token = lerCookie(req.headers.cookie, COOKIE)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, segredo(), { algorithms: ['HS256'] })
    return { id: payload.sub, email: payload.email, nome: payload.nome || null, sid: payload.sid || null }
  } catch {
    return null
  }
}

export function cookieDeSessao(token) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`
}

export function cookieLimpo() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

/** O host da requisição, como a Vercel o entrega. */
export function hostDoPedido(req) {
  const h = req.headers['x-forwarded-host'] || req.headers.host || ''
  return String(h).split(',')[0].trim().toLowerCase()
}

/** `https://<host canônico>`: base do redirect_uri e do returnTo. */
export function origemCanonica(req) {
  const host = hostCanonico(site, hostDoPedido(req))
  const esquema = process.env.VERCEL_ENV === 'development' ? 'http' : 'https'
  return `${esquema}://${host}`
}

/** Recusa POST vindo de outra origem. Devolve true quando já respondeu. */
export function recusarOrigem(req, res) {
  if (origemPermitida(req.headers.origin, hostDoPedido(req), site, process.env.VERCEL_ENV)) return false
  res.status(403).json({ ok: false, codigo: 'origem' })
  return true
}

/** Responde 503 quando as variáveis não estão lá. Devolve true quando já respondeu. */
export function recusarSemConfiguracao(req, res) {
  if (configurado()) return false
  res.status(503).json({ ok: false, codigo: 'nao_configurado' })
  return true
}

/** O `next` codificado no `state` do fluxo hospedado, e de volta. */
export function codificarEstado(next) {
  return Buffer.from(JSON.stringify({ next: caminhoSeguro(next) })).toString('base64url')
}
export function decodificarEstado(state) {
  try {
    const { next } = JSON.parse(Buffer.from(String(state), 'base64url').toString('utf8'))
    return caminhoSeguro(next)
  } catch {
    return '/'
  }
}

export function ipDe(req) {
  const xff = req.headers['x-forwarded-for']
  return xff ? String(xff).split(',')[0].trim() : undefined
}
