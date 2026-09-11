/**
 * O motor de conteúdo, do markdown ao build.
 *
 * O teste central é o que o produto promete: mudar um .md, rebuildar e
 * ver a seção mudar. Ele roda o `vite build` de verdade duas vezes sobre
 * um projeto temporário (uma cópia deste, com content/ próprio) e lê o
 * bundle gerado. O resto exercita as funções puras do plugin: frontmatter,
 * ordem, ícones, idiomas, imagens, diretivas e as mensagens de erro.
 */
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'
import { analisarNome, compilarConteudo, renderizarMarkdown, separarFrontmatter } from '../plugins/conteudo.js'
import { portal } from '../plugins/conteudo.js'

const RAIZ = process.cwd()
const SITE = { nome: 'Teste', idiomas: { padrao: 'pt-BR', outros: ['en'] } }
const temporarios = []
afterAll(() => {
  for (const d of temporarios) rmSync(d, { recursive: true, force: true })
})

function projetoTemporario() {
  const dir = mkdtempSync(join(tmpdir(), 'portal-'))
  temporarios.push(dir)
  mkdirSync(join(dir, 'content/assets'), { recursive: true })
  return dir
}

function escrever(dir, nome, texto) {
  writeFileSync(join(dir, 'content', nome), texto)
}

const md = (title, corpo, extra = '') => `---\ntitle: ${title}\n${extra}---\n\n${corpo}\n`

describe('frontmatter e nomes', () => {
  it('separa o frontmatter do corpo', () => {
    const { dados, corpo } = separarFrontmatter('---\ntitle: Oi\norder: 2\n---\n\nTexto.\n', 'a.md')
    expect(dados).toEqual({ title: 'Oi', order: 2 })
    expect(corpo).toBe('Texto.\n')
  })
  it('lê prefixo numérico, slug e idioma do nome do arquivo', () => {
    expect(analisarNome('01-visao-geral.md')).toEqual({ prefixo: 1, slug: 'visao-geral', lang: null })
    expect(analisarNome('02-como-escrever.en.md')).toEqual({ prefixo: 2, slug: 'como-escrever', lang: 'en' })
    expect(analisarNome('Guia Rápido.md')).toEqual({ prefixo: null, slug: 'guia-rapido', lang: null })
  })
  it('recusa arquivo sem frontmatter, sem title, com campo desconhecido ou com ícone inválido', () => {
    const dir = projetoTemporario()
    escrever(dir, '01-a.md', 'Sem frontmatter\n')
    expect(() => compilarConteudo({ dir: join(dir, 'content'), site: SITE })).toThrow(/01-a\.md: falta o frontmatter/)
    escrever(dir, '01-a.md', '---\norder: 1\n---\n\nx\n')
    expect(() => compilarConteudo({ dir: join(dir, 'content'), site: SITE })).toThrow(/"title" é obrigatório/)
    escrever(dir, '01-a.md', '---\ntitle: A\ntitulo: B\n---\n\nx\n')
    expect(() => compilarConteudo({ dir: join(dir, 'content'), site: SITE })).toThrow(/campo "titulo" não existe/)
    escrever(dir, '01-a.md', '---\ntitle: A\nicon: foguete\n---\n\nx\n')
    expect(() => compilarConteudo({ dir: join(dir, 'content'), site: SITE })).toThrow(/ícone "foguete" desconhecido/)
  })
})

describe('ordem, idiomas e imagens', () => {
  it('ordena pelo campo order, depois pelo prefixo do nome', () => {
    const dir = projetoTemporario()
    escrever(dir, '01-primeiro.md', md('Primeiro', 'a'))
    escrever(dir, '02-segundo.md', md('Segundo', 'b', 'order: 10\n'))
    escrever(dir, '03-terceiro.md', md('Terceiro', 'c'))
    const c = compilarConteudo({ dir: join(dir, 'content'), site: SITE })
    expect(c.secoes['pt-BR'].map((s) => s.slug)).toEqual(['primeiro', 'terceiro', 'segundo'])
  })
  it('espelha o segundo idioma por slug e cai no padrão quando falta tradução', () => {
    const dir = projetoTemporario()
    escrever(dir, '01-a.md', md('A', 'pt'))
    escrever(dir, '02-b.md', md('B', 'pt'))
    escrever(dir, '01-a.en.md', md('A in English', 'en'))
    const c = compilarConteudo({ dir: join(dir, 'content'), site: SITE })
    expect(c.idiomas).toEqual(['pt-BR', 'en'])
    expect(c.secoes.en.map((s) => [s.slug, s.titulo, s.traduzido])).toEqual([
      ['a', 'A in English', true],
      ['b', 'B', false],
    ])
  })
  it('recusa tradução sem original e idioma fora da configuração', () => {
    const dir = projetoTemporario()
    escrever(dir, '01-a.md', md('A', 'pt'))
    escrever(dir, '02-z.en.md', md('Z', 'en'))
    expect(() => compilarConteudo({ dir: join(dir, 'content'), site: SITE })).toThrow(/tradução sem original/)
    rmSync(join(dir, 'content/02-z.en.md'))
    escrever(dir, '01-a.es.md', md('A', 'es'))
    expect(() => compilarConteudo({ dir: join(dir, 'content'), site: SITE })).toThrow(/idioma "es" não está/)
  })
  it('reescreve imagens de assets/ para /conteudo/assets/ e recusa imagem inexistente', () => {
    const dir = projetoTemporario()
    writeFileSync(join(dir, 'content/assets/foto.png'), 'png')
    escrever(dir, '01-a.md', md('A', '![Uma foto](assets/foto.png "Legenda")'))
    const c = compilarConteudo({ dir: join(dir, 'content'), site: SITE })
    expect(c.secoes['pt-BR'][0].html).toContain('<img src="/conteudo/assets/foto.png" alt="Uma foto"')
    expect(c.secoes['pt-BR'][0].html).toContain('<figcaption>Legenda</figcaption>')
    expect(c.assets).toEqual([{ nome: 'foto.png', caminho: join(dir, 'content/assets/foto.png') }])
    escrever(dir, '01-a.md', md('A', '![x](assets/nao-existe.png)'))
    expect(() => compilarConteudo({ dir: join(dir, 'content'), site: SITE })).toThrow(/assets\/nao-existe\.png não existe/)
  })
})

describe('o que o markdown vira', () => {
  it('cabeçalhos ganham id com o slug da seção, o # do corpo vira h2, e os h2 vão para o índice', () => {
    const { html, cabecalhos } = renderizarMarkdown('# Um\n\n## Dois\n\n### Três\n', { slug: 'sec' })
    expect(html).toContain('<h2 id="sec--um">Um</h2>')
    expect(html).toContain('<h2 id="sec--dois">Dois</h2>')
    expect(html).toContain('<h3 id="sec--tres">Três</h3>')
    expect(cabecalhos).toEqual([
      { id: 'sec--um', texto: 'Um' },
      { id: 'sec--dois', texto: 'Dois' },
    ])
  })
  it('tabela, código, terminal e citação viram os blocos do manual', () => {
    const { html } = renderizarMarkdown('| a | b |\n|---|---|\n| 1 | 2 |\n\n```js\nconst x = 1\n```\n\n```terminal\nnpm run build\n```\n\n> Aviso.\n', { slug: 's' })
    expect(html).toContain('<div class="tabela"><table>')
    expect(html).toContain('<pre class="terminal" data-lang="js"><code>const x = 1')
    expect(html).toContain('<pre class="terminal terminal-prompt"><code><span class="linha">npm run build</span>')
    expect(html).toContain('<aside class="callout"><p>Aviso.</p>')
  })
  it('::: cards e ::: passos viram grade e sequência; ::: sem fechar é erro', () => {
    const { html } = renderizarMarkdown('::: cards\n### Um\nTexto um.\n### Dois\nTexto dois.\n:::\n\n::: passos\n### Primeiro\nFaça.\n:::\n', { slug: 's' })
    expect(html).toContain('<div class="cards"><article class="card card-conteudo"><h3>Um</h3><p>Texto um.</p>')
    expect(html).toContain('<article class="card card-conteudo"><h3>Dois</h3>')
    expect(html).toContain('<ol class="passos"><li class="passo"><span class="passo-numero">01</span>')
    expect(() => renderizarMarkdown('::: cards\n### Um\n', { slug: 's' })).toThrow(/sem fechamento/)
  })
  it('link externo abre em nova aba com rel; interno não', () => {
    const { html } = renderizarMarkdown('[a](https://exemplo.com) e [b](#outra)', { slug: 's' })
    expect(html).toContain('<a href="https://exemplo.com" rel="noopener noreferrer" target="_blank">a</a>')
    expect(html).toContain('<a href="#outra">b</a>')
  })
})

describe('mudou o .md, mudou o site (build real)', () => {
  it('rebuildar depois de editar um arquivo troca a seção no bundle', async () => {
    const dir = projetoTemporario()
    for (const f of ['package.json', 'index.html', 'site.config.json', 'vite.config.js']) cpSync(join(RAIZ, f), join(dir, f))
    for (const d of ['src', 'plugins', 'api', 'public']) cpSync(join(RAIZ, d), join(dir, d), { recursive: true })
    cpSync(join(RAIZ, 'node_modules'), join(dir, 'node_modules'), { recursive: true, dereference: false, filter: (s) => !s.includes('.vite-temp') })
    escrever(dir, '01-unica.md', md('Seção original', 'Primeira versão do texto, marcador ALFA-0001.'))

    const bundle = async () => {
      await build({ root: dir, configFile: false, logLevel: 'silent', plugins: [(await import('@vitejs/plugin-react')).default(), portal({ raiz: dir })], build: { outDir: join(dir, 'dist'), emptyOutDir: true } })
      const js = readdirSync(join(dir, 'dist/assets')).filter((f) => f.endsWith('.js'))
      return js.map((f) => readFileSync(join(dir, 'dist/assets', f), 'utf8')).join('\n')
    }
    const primeiro = await bundle()
    expect(primeiro).toContain('ALFA-0001')
    expect(primeiro).toContain('Seção original')

    escrever(dir, '01-unica.md', md('Seção editada', 'Segunda versão do texto, marcador BETA-0002.'))
    const segundo = await bundle()
    expect(segundo).toContain('BETA-0002')
    expect(segundo).toContain('Seção editada')
    expect(segundo).not.toContain('ALFA-0001')
    expect(segundo).not.toContain('Seção original')
  }, 120000)
})
