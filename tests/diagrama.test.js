/**
 * O diagrama declarado: o layout é calculado (nenhuma coordenada à mão),
 * a navegação por teclado cobre todos os nós na ordem do arquivo, e o
 * YAML de exemplo é válido. Ligações e raias inexistentes são erro.
 *
 * O diagrama é opcional: quem não quer um apaga `content/diagrama.yaml`
 * ou põe `"diagrama": { "ativo": false }` na configuração. Por isso o
 * exemplo do repositório é lido só se existir, e o que ele verifica a
 * mais é pulado quando não existe. O motor continua coberto pelo YAML
 * mínimo escrito aqui e por diretórios temporários.
 */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dump, load } from 'js-yaml'
import { afterAll, describe, expect, it } from 'vitest'
import { compilarDiagrama, validarDiagrama } from '../plugins/conteudo.js'
import { calcularLayout, MEDIDAS, ordemDeNavegacao } from '../src/diagrama/layout.js'

const EXEMPLO = 'content/diagrama.yaml'
const exemplo = existsSync(EXEMPLO) ? load(readFileSync(EXEMPLO, 'utf8')) : null
/** Só roda quando o repositório ainda tem o diagrama de exemplo. */
const comExemplo = it.skipIf(exemplo === null)

const minimo = () => ({
  titulo: 'T',
  raias: [{ id: 'a', titulo: 'A' }, { id: 'b', titulo: 'B' }],
  nos: [
    { id: 'n1', raia: 'a', linha: 1, titulo: 'N1' },
    { id: 'n2', raia: 'a', linha: 2, titulo: 'N2' },
    { id: 'n3', raia: 'b', linha: 1, titulo: 'N3' },
  ],
  ligacoes: [{ de: 'n1', para: 'n3', rotulo: 'x' }, { de: 'n1', para: 'n2' }, { de: 'n3', para: 'n2', estilo: 'apoio' }],
  grupos: [{ titulo: 'G', nos: ['n3'] }],
})

/** Os diagramas que o layout precisa dar conta: o mínimo sempre, o exemplo quando há. */
const diagramas = () => (exemplo ? [minimo(), exemplo] : [minimo()])

const temporarios = []
afterAll(() => {
  for (const d of temporarios) rmSync(d, { recursive: true, force: true })
})

function conteudoTemporario(arquivos = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'portal-diagrama-'))
  temporarios.push(dir)
  mkdirSync(dir, { recursive: true })
  for (const [nome, dados] of Object.entries(arquivos)) writeFileSync(join(dir, nome), dump(dados))
  return dir
}

describe('validação', () => {
  comExemplo('o diagrama de exemplo do repositório é válido e compila para o idioma padrão', () => {
    expect(() => validarDiagrama(exemplo, 'diagrama.yaml')).not.toThrow()
    const c = compilarDiagrama({ dir: 'content', site: { idiomas: { padrao: 'pt-BR', outros: ['en'] }, diagrama: { ativo: true } } })
    expect(c.porIdioma['pt-BR'].titulo).toBe(exemplo.titulo)
    expect(c.porIdioma.en).toBe(c.porIdioma['pt-BR'])
  })
  it('lê o diagrama do diretório e repete o padrão nos outros idiomas', () => {
    const dir = conteudoTemporario({ 'diagrama.yaml': minimo() })
    const c = compilarDiagrama({ dir, site: { idiomas: { padrao: 'pt-BR', outros: ['en'] }, diagrama: { ativo: true } } })
    expect(c.porIdioma['pt-BR'].titulo).toBe('T')
    expect(c.porIdioma.en).toBe(c.porIdioma['pt-BR'])
    expect(c.arquivos).toEqual([join(dir, 'diagrama.yaml')])
  })
  it('sem arquivo, não há diagrama — a ausência é caso válido, não erro', () => {
    const dir = conteudoTemporario()
    expect(compilarDiagrama({ dir, site: { idiomas: { padrao: 'pt-BR', outros: ['en'] }, diagrama: { ativo: true } } }))
      .toEqual({ porIdioma: null, arquivos: [] })
  })
  it('desligado na configuração, não há diagrama', () => {
    expect(compilarDiagrama({ dir: 'content', site: { idiomas: { padrao: 'pt-BR' }, diagrama: { ativo: false } } }).porIdioma).toBeNull()
  })
  it('recusa raia inexistente, ligação para nó inexistente, id repetido e posição ocupada', () => {
    let d = minimo()
    d.nos[0].raia = 'zzz'
    expect(() => validarDiagrama(d, 'd.yaml')).toThrow(/raia "zzz" não existe/)
    d = minimo()
    d.ligacoes.push({ de: 'n1', para: 'nada' })
    expect(() => validarDiagrama(d, 'd.yaml')).toThrow(/nó inexistente/)
    d = minimo()
    d.nos.push({ id: 'n1', raia: 'b', linha: 2, titulo: 'dup' })
    expect(() => validarDiagrama(d, 'd.yaml')).toThrow(/nó "n1" repetido/)
    d = minimo()
    d.nos.push({ id: 'n4', raia: 'a', linha: 1, titulo: 'ocupado' })
    expect(() => validarDiagrama(d, 'd.yaml')).toThrow(/já existe um nó na raia "a", linha 1/)
    d = minimo()
    d.nos[0].icone = 'foguete'
    expect(() => validarDiagrama(d, 'd.yaml')).toThrow(/ícone "foguete" desconhecido/)
  })
})

describe('layout calculado', () => {
  it('todo nó tem posição, dentro da própria raia, e a caixa tem um tamanho só', () => {
    for (const d of diagramas()) {
      const l = calcularLayout(d)
      expect(l.nos).toHaveLength(d.nos.length)
      for (const n of l.nos) {
        const raia = l.raias.find((r) => r.id === n.raia)
        expect(n.x).toBeGreaterThanOrEqual(raia.x)
        expect(n.x + n.largura).toBeLessThanOrEqual(raia.x + raia.largura)
        expect(n.largura).toBe(MEDIDAS.noLargura)
        expect(n.altura).toBe(MEDIDAS.noAltura)
        expect(n.y).toBe(MEDIDAS.margem + MEDIDAS.cabecalho + (n.linha - 1) * MEDIDAS.linhaAltura)
      }
      expect(l.largura).toBeGreaterThan(0)
      expect(l.altura).toBeGreaterThan(0)
    }
  })
  it('raias são colunas na ordem declarada, sem sobreposição', () => {
    const l = calcularLayout(minimo())
    expect(l.raias[0].x).toBeLessThan(l.raias[1].x)
    expect(l.raias[0].x + l.raias[0].largura).toBeLessThan(l.raias[1].x)
  })
  it('as ligações são caminhos ortogonais gerados: para a direita saem pela borda direita; na mesma raia, por baixo', () => {
    const l = calcularLayout(minimo())
    const [direita, mesma, esquerda] = l.ligacoes
    const n1 = l.nos[0], n2 = l.nos[1], n3 = l.nos[2]
    expect(direita.caminho).toBe(`M${n1.x + n1.largura},${n1.y + n1.altura / 2} H${(n1.x + n1.largura + n3.x) / 2} V${n3.y + n3.altura / 2} H${n3.x}`)
    expect(direita.rotulo).toBe('x')
    expect(mesma.caminho).toBe(`M${n1.x + n1.largura / 2},${n1.y + n1.altura} V${n2.y}`)
    expect(esquerda.caminho.startsWith(`M${n3.x},`)).toBe(true)
    expect(esquerda.caminho.endsWith(`H${n2.x + n2.largura}`)).toBe(true)
    expect(esquerda.estilo).toBe('apoio')
  })
  it('o grupo envolve os seus nós com folga', () => {
    const l = calcularLayout(minimo())
    const g = l.grupos[0]
    const n3 = l.nos[2]
    expect(g.x).toBeLessThan(n3.x)
    expect(g.x + g.largura).toBeGreaterThan(n3.x + n3.largura)
    expect(g.y).toBeLessThan(n3.y)
    expect(g.y + g.altura).toBeGreaterThan(n3.y + n3.altura)
  })
  it('a ordem de navegação por teclado é a ordem dos nós no arquivo, e cobre todos', () => {
    for (const d of diagramas()) {
      expect(ordemDeNavegacao(d)).toEqual(d.nos.map((n) => n.id))
      expect(new Set(ordemDeNavegacao(d)).size).toBe(d.nos.length)
    }
  })
})
