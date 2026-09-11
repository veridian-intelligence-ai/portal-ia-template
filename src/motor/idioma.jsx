import { createContext, useContext } from 'react'
import { textos } from './textos.js'

export const IdiomaCtx = createContext('pt-BR')

export function useIdioma() {
  return useContext(IdiomaCtx)
}

/** Os rótulos da interface no idioma ativo. */
export function useT() {
  return textos(useIdioma())
}

export const CHAVE_DO_IDIOMA = 'portal-idioma'

export function idiomaGuardado(lista, padrao) {
  try {
    const v = localStorage.getItem(CHAVE_DO_IDIOMA)
    return lista.includes(v) ? v : padrao
  } catch {
    return padrao
  }
}

export function guardarIdioma(lang) {
  try {
    localStorage.setItem(CHAVE_DO_IDIOMA, lang)
  } catch {
    // sem armazenamento, a escolha vale só para esta visita
  }
}
