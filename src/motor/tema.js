/**
 * O tema: escuro por padrão, claro como alternativa (manual, 3.4). A
 * escolha mora no localStorage (chave `portal-tema`) e liga a classe
 * `theme-light` no <html>; os tokens fazem o resto. O script em
 * index.html e a página de login leem a mesma chave.
 */
export const CHAVE_DO_TEMA = 'portal-tema'
export const CLASSE_DO_TEMA_CLARO = 'theme-light'

export function temaAtual() {
  return document.documentElement.classList.contains(CLASSE_DO_TEMA_CLARO) ? 'claro' : 'escuro'
}

export function aplicarTema(tema) {
  document.documentElement.classList.toggle(CLASSE_DO_TEMA_CLARO, tema === 'claro')
  try {
    localStorage.setItem(CHAVE_DO_TEMA, tema)
  } catch {
    // sem armazenamento, a escolha vale só para esta visita
  }
}
