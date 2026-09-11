/**
 * O layout do diagrama, calculado a partir de content/diagrama.yaml: raias
 * são colunas (na ordem declarada), `linha` dá a posição vertical dentro
 * da raia, as caixas têm um tamanho só, e as ligações são caminhos
 * ortogonais gerados. Nenhuma coordenada é escrita à mão.
 *
 * Puro: sem DOM, sem React. tests/diagrama.test.js prova as regras.
 */
export const MEDIDAS = {
  margem: 24,
  cabecalho: 44,
  raiaLargura: 248,
  raiaEspaco: 128,
  noLargura: 216,
  noAltura: 76,
  linhaAltura: 112,
  grupoFolga: 12,
}

export function calcularLayout(diagrama, medidas = MEDIDAS) {
  const m = medidas
  const raias = diagrama.raias.map((r, i) => ({
    id: r.id,
    titulo: r.titulo,
    x: m.margem + i * (m.raiaLargura + m.raiaEspaco),
    largura: m.raiaLargura,
  }))
  const raiaPorId = new Map(raias.map((r) => [r.id, r]))
  const linhas = Math.max(...diagrama.nos.map((n) => n.linha))
  const altura = m.margem * 2 + m.cabecalho + (linhas - 1) * m.linhaAltura + m.noAltura
  const largura = m.margem * 2 + raias.length * m.raiaLargura + (raias.length - 1) * m.raiaEspaco
  for (const r of raias) r.altura = altura - m.margem * 2

  const nos = diagrama.nos.map((n, indice) => {
    const raia = raiaPorId.get(n.raia)
    return {
      ...n,
      indice,
      x: raia.x + (m.raiaLargura - m.noLargura) / 2,
      y: m.margem + m.cabecalho + (n.linha - 1) * m.linhaAltura,
      largura: m.noLargura,
      altura: m.noAltura,
      raiaIndice: raias.indexOf(raia),
    }
  })
  const noPorId = new Map(nos.map((n) => [n.id, n]))

  const ligacoes = (diagrama.ligacoes || []).map((l) => {
    const a = noPorId.get(l.de)
    const b = noPorId.get(l.para)
    const cy = (n) => n.y + n.altura / 2
    const cx = (n) => n.x + n.largura / 2
    let caminho, rotuloX, rotuloY
    if (a.raiaIndice < b.raiaIndice) {
      // para a direita: sai pela borda direita, cotovelo no meio do vão, entra pela esquerda
      const x0 = a.x + a.largura
      const x1 = b.x
      const meio = (x0 + x1) / 2
      caminho = `M${x0},${cy(a)} H${meio} V${cy(b)} H${x1}`
      // o rótulo fica sobre o primeiro trecho horizontal, na linha da origem:
      // origens em linhas diferentes nunca disputam o mesmo lugar
      rotuloX = meio
      rotuloY = cy(a) - 8
    } else if (a.raiaIndice > b.raiaIndice) {
      // para a esquerda: sai pela borda esquerda e entra pela direita
      const x0 = a.x
      const x1 = b.x + b.largura
      const meio = (x0 + x1) / 2
      caminho = `M${x0},${cy(a)} H${meio} V${cy(b)} H${x1}`
      rotuloX = meio
      rotuloY = cy(a) - 8
    } else {
      // mesma raia: liga por baixo (ou por cima, se o destino está acima)
      const desce = b.y > a.y
      const y0 = desce ? a.y + a.altura : a.y
      const y1 = desce ? b.y : b.y + b.altura
      caminho = `M${cx(a)},${y0} V${y1}`
      rotuloX = cx(a) + 12
      rotuloY = (y0 + y1) / 2
    }
    return { de: l.de, para: l.para, estilo: l.estilo || 'fluxo', rotulo: l.rotulo || null, caminho, rotuloX, rotuloY }
  })

  const grupos = (diagrama.grupos || []).map((g) => {
    const membros = g.nos.map((id) => noPorId.get(id))
    const x0 = Math.min(...membros.map((n) => n.x)) - m.grupoFolga
    const y0 = Math.min(...membros.map((n) => n.y)) - m.grupoFolga
    const x1 = Math.max(...membros.map((n) => n.x + n.largura)) + m.grupoFolga
    // o título vai no pé da caixa, para nunca disputar o cabeçalho da raia
    const y1 = Math.max(...membros.map((n) => n.y + n.altura)) + m.grupoFolga + 20
    return { titulo: g.titulo, x: x0, y: y0, largura: x1 - x0, altura: y1 - y0 }
  })

  return { titulo: diagrama.titulo, largura, altura, raias, nos, ligacoes, grupos }
}

/** A ordem de navegação por teclado: a ordem dos nós no arquivo. */
export function ordemDeNavegacao(diagrama) {
  return diagrama.nos.map((n) => n.id)
}
