/**
 * O marcador inline da ficha do nó: crase para código, asteriscos duplos
 * para negrito. Nada de HTML: a cópia vem de um YAML e vira nós React,
 * nunca innerHTML.
 */
import { createElement, Fragment } from 'react'

export function renderInline(texto) {
  const partes = []
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g
  let ultimo = 0
  let m
  let k = 0
  const s = String(texto || '')
  while ((m = re.exec(s))) {
    if (m.index > ultimo) partes.push(s.slice(ultimo, m.index))
    const tok = m[0]
    if (tok.startsWith('`')) partes.push(createElement('code', { key: k++ }, tok.slice(1, -1)))
    else partes.push(createElement('strong', { key: k++ }, tok.slice(2, -2)))
    ultimo = m.index + tok.length
  }
  if (ultimo < s.length) partes.push(s.slice(ultimo))
  return createElement(Fragment, null, ...partes)
}
