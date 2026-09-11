/**
 * A página "portal em configuração" (503), gerada pelo middleware quando
 * faltam variáveis em preview ou produção. Autossuficiente: nenhum
 * asset, porque tudo em /assets/ está atrás do login. As cores são as
 * dos tokens (src/styles/tokens.css); o teste de tokens confere.
 */
import { escaparHtml } from './comum.js'

const TEXTOS = {
  'pt-BR': {
    titulo: 'Portal em configuração',
    lead: 'O login ainda não foi configurado, então o conteúdo fica fechado.',
    faltam: 'Variáveis de ambiente ausentes ou inválidas na Vercel:',
    dica: 'Grave as três variáveis no projeto (Production e Preview), faça um novo deploy e esta página some.',
  },
  en: {
    titulo: 'Portal being configured',
    lead: 'Login is not configured yet, so the content stays closed.',
    faltam: 'Environment variables missing or invalid on Vercel:',
    dica: 'Set the three variables on the project (Production and Preview), redeploy, and this page goes away.',
  },
}

export function paginaIndisponivel(site, faltam) {
  const lang = site.idiomas && site.idiomas.padrao ? site.idiomas.padrao : 'pt-BR'
  const t = TEXTOS[lang] || TEXTOS[lang.split('-')[0]] || TEXTOS['pt-BR']
  const nome = escaparHtml(site.nome || 'Portal')
  const lista = faltam.map((v) => `<li><code>${escaparHtml(v)}</code></li>`).join('')
  return `<!doctype html>
<html lang="${escaparHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escaparHtml(t.titulo)} · ${nome}</title>
<style>
  :root { color-scheme: dark; --surface-0: #000000; --surface-1: #1a1a1a; --border: #3a3a3a; --text-primary: #ffffff; --text-secondary: #e5e5e5; }
  html, body { margin: 0; background: var(--surface-0); color: var(--text-primary); }
  body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 17px; line-height: 1.55; padding: max(20px, 5vw); }
  main { max-width: 640px; margin: 0 auto; }
  .kicker { font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-secondary); margin: 0 0 24px; }
  h1 { font-family: Unbounded, 'Arial Black', Arial, sans-serif; font-weight: 900; font-size: clamp(28px, 4.5vw, 48px); line-height: 1; text-transform: uppercase; letter-spacing: -0.01em; margin: 0 0 24px; overflow-wrap: anywhere; }
  p { margin: 0 0 16px; color: var(--text-secondary); }
  .card { background: var(--surface-1); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin: 24px 0; }
  .card p { margin: 0 0 12px; color: var(--text-primary); }
  ul { margin: 0; padding-left: 20px; }
  li { color: var(--text-primary); }
  code { font-family: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace; font-size: 14px; }
</style>
</head>
<body>
<main>
  <p class="kicker">${nome}</p>
  <h1>${escaparHtml(t.titulo)}</h1>
  <p>${escaparHtml(t.lead)}</p>
  <div class="card">
    <p>${escaparHtml(t.faltam)}</p>
    <ul>${lista}</ul>
  </div>
  <p>${escaparHtml(t.dica)}</p>
</main>
</body>
</html>
`
}
