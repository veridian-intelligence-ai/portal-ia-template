/** Nada do portal de referência neste template (ver scripts/limpeza.mjs). */
import { expect, it } from 'vitest'
import { varrer } from '../scripts/limpeza.mjs'

it('nenhuma ocorrência de termos do portal de referência no repositório', () => {
  expect(varrer()).toEqual([])
})
