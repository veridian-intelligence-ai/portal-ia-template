/**
 * Os textos da página de login e do chip de usuário, por idioma. A
 * página é estática (fora do bundle protegido), então o plugin escolhe o
 * idioma no build a partir de site.config.json (idiomas.padrao).
 */
export const TEXTOS_LOGIN = {
  'pt-BR': {
    titulo: 'Entrar',
    lead: 'Acesso restrito. Use o e-mail e a senha cadastrados.',
    email: 'E-mail',
    senha: 'Senha',
    entrar: 'Entrar',
    entrando: 'Entrando',
    esqueci: 'Esqueci a senha',
    provedor: 'Entrar pelo fluxo do provedor (verificação, MFA)',
    erroCredenciais: 'E-mail ou senha inválidos, ou a conta exige verificação adicional. Use o fluxo do provedor.',
    erroCallback: 'O login pelo provedor não foi concluído. Tente de novo.',
    erroOrigem: 'A requisição veio de outro site e foi recusada.',
    erroConfiguracao: 'O login ainda não foi configurado neste portal.',
    erroRede: 'Sem resposta do servidor. Tente de novo.',
    temaClaro: 'Mudar para o tema claro',
    temaEscuro: 'Mudar para o tema escuro',
    noindex: 'Página privada',
  },
  en: {
    titulo: 'Sign in',
    lead: 'Restricted access. Use your registered e-mail and password.',
    email: 'E-mail',
    senha: 'Password',
    entrar: 'Sign in',
    entrando: 'Signing in',
    esqueci: 'Forgot my password',
    provedor: 'Sign in through the provider flow (verification, MFA)',
    erroCredenciais: 'Invalid e-mail or password, or the account needs extra verification. Use the provider flow.',
    erroCallback: 'The provider sign-in was not completed. Try again.',
    erroOrigem: 'The request came from another site and was refused.',
    erroConfiguracao: 'Sign-in is not configured on this portal yet.',
    erroRede: 'No answer from the server. Try again.',
    temaClaro: 'Switch to the light theme',
    temaEscuro: 'Switch to the dark theme',
    noindex: 'Private page',
  },
}

export function textosLogin(lang) {
  return TEXTOS_LOGIN[lang] || TEXTOS_LOGIN[String(lang).split('-')[0]] || TEXTOS_LOGIN['pt-BR']
}
