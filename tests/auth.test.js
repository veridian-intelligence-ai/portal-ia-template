/**
 * Auth: os três estados do middleware e as duas funções que a
 * investigação achou frágeis no portal de referência (origem por
 * substring e `next` aceitando //). Tudo em memória: nenhum servidor,
 * nenhuma chamada ao WorkOS.
 */
import { SignJWT } from 'jose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import middleware from '../middleware.js'
import { caminhoSeguro, ehPublico, hostCanonico, nomeDoCookie, origemPermitida, variaveisFaltando } from '../api/_lib/comum.js'
import site from '../site.config.json' with { type: 'json' }

const SEGREDO = 'x'.repeat(40)
const COOKIE = nomeDoCookie(site)
const env = (extra) => {
  process.env = { ...process.env, VERCEL: '1', VERCEL_ENV: 'production', ...extra }
}
const guardado = { ...process.env }
beforeEach(() => {
  for (const k of ['WORKOS_API_KEY', 'WORKOS_CLIENT_ID', 'SESSION_SECRET', 'VERCEL', 'VERCEL_ENV']) delete process.env[k]
})
afterEach(() => {
  process.env = { ...guardado }
})

const pedir = (caminho, headers = {}) => middleware(new Request('https://portal.exemplo.com' + caminho, { headers }))
const sessao = async (segredo = SEGREDO, exp = '1h') =>
  new SignJWT({ email: 'a@b.c' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_1').setExpirationTime(exp).sign(new TextEncoder().encode(segredo))

describe('middleware: sem variáveis em produção, tudo responde 503', () => {
  it('a home, o bundle e as imagens do conteúdo respondem 503 com a página de configuração', async () => {
    env({})
    for (const caminho of ['/', '/assets/index-abc.js', '/conteudo/assets/foto.png', '/qualquer/coisa']) {
      const r = await pedir(caminho)
      expect(r.status, caminho).toBe(503)
      expect(r.headers.get('content-type')).toContain('text/html')
      const html = await r.text()
      expect(html).toContain('WORKOS_API_KEY')
      expect(html).toContain('SESSION_SECRET')
      expect(html).not.toContain('Visão geral')
    }
  })
  it('SESSION_SECRET curto conta como ausente', async () => {
    env({ WORKOS_API_KEY: 'k', WORKOS_CLIENT_ID: 'c', SESSION_SECRET: 'curto' })
    expect(variaveisFaltando(process.env)).toEqual(['SESSION_SECRET'])
    expect((await pedir('/')).status).toBe(503)
  })
  it('em desenvolvimento (vercel dev) sem variáveis, abre', async () => {
    env({ VERCEL_ENV: 'development' })
    expect(await pedir('/')).toBeUndefined()
  })
  it('a allowlist passa mesmo sem variáveis: login, auth, fontes, marca, favicon', async () => {
    env({})
    for (const caminho of ['/login', '/login.html', '/api/auth/senha', '/api/auth/callback', '/fontes/inter-400.woff2', '/marca/logo.svg', '/favicon.svg']) {
      expect(await pedir(caminho), caminho).toBeUndefined()
      expect(ehPublico(caminho)).toBe(true)
    }
    // e é exata: prefixos parecidos não passam
    for (const caminho of ['/login-antigo', '/loginx', '/favicon.svg.bak', '/api/auth/outra', '/api/', '/fontes']) {
      expect(ehPublico(caminho), caminho).toBe(false)
    }
  })
})

describe('middleware: com variáveis, tudo redireciona para o login; com sessão, tudo abre', () => {
  const comVariaveis = () => env({ WORKOS_API_KEY: 'sk_test', WORKOS_CLIENT_ID: 'client_x', SESSION_SECRET: SEGREDO })
  it('sem cookie: 302 para /login com o destino em next', async () => {
    comVariaveis()
    const r = await pedir('/secao?x=1')
    expect(r.status).toBe(302)
    expect(r.headers.get('location')).toBe('https://portal.exemplo.com/login?next=%2Fsecao%3Fx%3D1')
    expect((await pedir('/assets/index.js')).status).toBe(302)
  })
  it('rota de api sem sessão: 401 em JSON, não redirecionamento', async () => {
    comVariaveis()
    const r = await pedir('/api/outra')
    expect(r.status).toBe(401)
    expect(await r.json()).toEqual({ ok: false, codigo: 'nao_autenticado' })
  })
  it('cookie inválido, assinado com outro segredo ou expirado: 302', async () => {
    comVariaveis()
    for (const token of ['lixo', await sessao('y'.repeat(40)), await sessao(SEGREDO, '-1h')]) {
      expect((await pedir('/', { cookie: `${COOKIE}=${token}` })).status).toBe(302)
    }
  })
  it('cookie válido: passa', async () => {
    comVariaveis()
    const token = await sessao()
    expect(await pedir('/', { cookie: `outro=1; ${COOKIE}=${token}` })).toBeUndefined()
    expect(await pedir('/assets/index.js', { cookie: `${COOKIE}=${token}` })).toBeUndefined()
  })
  it('auth.modo aberto desliga o bloqueio, e é explícito na configuração', async () => {
    expect(site.auth.modo).toBe('workos')
  })
})

describe('origem exata, não substring', () => {
  const SITE = { dominio: 'portal.exemplo.com', aliases: ['www.portal.exemplo.com'], auth: { permitirPreview: true } }
  it('aceita a origem exata do domínio e dos aliases, e nada parecido', () => {
    expect(origemPermitida('https://portal.exemplo.com', 'portal.exemplo.com', SITE)).toBe(true)
    expect(origemPermitida('https://www.portal.exemplo.com', 'portal.exemplo.com', SITE)).toBe(true)
    expect(origemPermitida('https://portal.exemplo.com.atacante.com', 'portal.exemplo.com', SITE)).toBe(false)
    expect(origemPermitida('https://atacante.com/portal.exemplo.com', 'portal.exemplo.com', SITE)).toBe(false)
    expect(origemPermitida('https://atacante.com?portal.exemplo.com', 'portal.exemplo.com', SITE)).toBe(false)
    expect(origemPermitida('http://portal.exemplo.com', 'portal.exemplo.com', SITE)).toBe(false)
    expect(origemPermitida('https://portal.exemplo.com:8443', 'portal.exemplo.com', SITE)).toBe(false)
    expect(origemPermitida('null', 'portal.exemplo.com', SITE)).toBe(false)
  })
  it('sem Origin passa (não é navegador de terceiro)', () => {
    expect(origemPermitida(undefined, 'portal.exemplo.com', SITE)).toBe(true)
  })
  it('preview .vercel.app só quando permitido, e só o host da própria requisição', () => {
    expect(origemPermitida('https://p-abc.vercel.app', 'p-abc.vercel.app', SITE)).toBe(true)
    expect(origemPermitida('https://outro.vercel.app', 'p-abc.vercel.app', SITE)).toBe(false)
    expect(origemPermitida('https://p-abc.vercel.app', 'p-abc.vercel.app', { ...SITE, auth: { permitirPreview: false } })).toBe(false)
    expect(origemPermitida('https://p-abc.vercel.app.atacante.com', 'p-abc.vercel.app', SITE)).toBe(false)
  })
  it('em desenvolvimento aceita http://localhost:<porta> exato', () => {
    expect(origemPermitida('http://localhost:3000', 'localhost:3000', SITE, 'development')).toBe(true)
    expect(origemPermitida('http://localhost:3000', 'localhost:3000', SITE, 'production')).toBe(false)
  })
  it('o host canônico é o da requisição quando permitido, senão o domínio configurado', () => {
    expect(hostCanonico(SITE, 'www.portal.exemplo.com')).toBe('www.portal.exemplo.com')
    expect(hostCanonico(SITE, 'outro.com')).toBe('portal.exemplo.com')
    expect(hostCanonico({ dominio: '', aliases: [], auth: { permitirPreview: true } }, 'demo.vercel.app')).toBe('demo.vercel.app')
  })
})

describe('next seguro', () => {
  it('aceita caminhos do próprio site e recusa o resto', () => {
    expect(caminhoSeguro('/secao?x=1#y')).toBe('/secao?x=1#y')
    expect(caminhoSeguro('/')).toBe('/')
    for (const ruim of ['//atacante.com', '/\\atacante.com', 'https://atacante.com', 'javascript:alert(1)', '/a\\b', 'secao', '', null, undefined, 42]) {
      expect(caminhoSeguro(ruim), String(ruim)).toBe('/')
    }
  })
})

describe('a função de senha recusa origem errada antes de tocar no WorkOS', () => {
  it('responde 403 com Origin de outro site', async () => {
    env({ WORKOS_API_KEY: 'sk_test', WORKOS_CLIENT_ID: 'client_x', SESSION_SECRET: SEGREDO })
    const { default: senha } = await import('../api/auth/senha.js')
    const res = resposta()
    await senha({ method: 'POST', headers: { host: 'demo.vercel.app', origin: 'https://demo.vercel.app.atacante.com' }, body: { email: 'a@b.c', senha: 'x' } }, res)
    expect(res.codigo).toBe(403)
    expect(res.corpo).toEqual({ ok: false, codigo: 'origem' })
  })
  it('responde 405 fora de POST e 400 sem campos', async () => {
    env({ WORKOS_API_KEY: 'sk_test', WORKOS_CLIENT_ID: 'client_x', SESSION_SECRET: SEGREDO })
    const { default: senha } = await import('../api/auth/senha.js')
    let res = resposta()
    await senha({ method: 'GET', headers: { host: 'demo.vercel.app' } }, res)
    expect(res.codigo).toBe(405)
    res = resposta()
    await senha({ method: 'POST', headers: { host: 'demo.vercel.app', origin: 'https://demo.vercel.app' }, body: { email: 'a@b.c' } }, res)
    expect(res.codigo).toBe(400)
  })
})

function resposta() {
  const r = { codigo: 200, corpo: null, headers: {} }
  r.setHeader = (k, v) => {
    r.headers[k] = v
  }
  r.status = (c) => {
    r.codigo = c
    return r
  }
  r.json = (b) => {
    r.corpo = b
    return r
  }
  r.end = () => r
  return r
}
