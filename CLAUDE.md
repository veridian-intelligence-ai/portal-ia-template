# Portal IA Template: o mapa para quem constrói

Este repositório é um template. Quem o usa (uma pessoa ou o Claude Code)
edita **conteúdo e configuração**; o **motor** fica como está. Este arquivo
diz o que é cada coisa, onde mora e o que os portões provam.

## Motor versus conteúdo

| É conteúdo (edite) | É motor (não edite para mudar conteúdo) |
|---|---|
| `content/*.md`: uma seção por arquivo | `plugins/conteudo.js`: lê `content/` no build |
| `content/assets/`: imagens e ícones do cliente | `src/motor/`: shell, navegação, tema, idioma |
| `content/diagrama.yaml` (e `diagrama.<lang>.yaml`) | `src/diagrama/`: layout calculado, mapa, ficha |
| `site.config.json`: nome, domínio, idiomas, logo, tema, auth | `api/` e `middleware.js`: login e proteção |
| `public/marca/`: logo e favicon do cliente | `src/styles/`: tokens e componentes do manual |

Regra prática: se a mudança pedida é "trocar um texto, uma imagem, uma
seção, o nome, o logo, o domínio", ela cabe em `content/`, `public/marca/`
ou `site.config.json`. Se exige tocar em `src/` ou `plugins/`, pare e
confirme que é mesmo uma mudança de motor.

## O motor de conteúdo

`plugins/conteudo.js` é um plugin do Vite. No build e no `vite dev`, ele:

1. lê `content/*.md`, separa o frontmatter (`title`, `subtitle`, `order`,
   `icon`, `lang`, `hidden`) e valida cada campo;
2. converte o corpo em HTML com `marked` (GFM), com cabeçalhos identificados
   (`<slug>--<cabecalho>`), imagens de `assets/` reescritas para
   `/conteudo/assets/`, código como bloco de terminal, tabela dentro de uma
   caixa que rola, citação como callout, e os blocos `::: cards` e
   `::: passos`;
3. entrega tudo ao app como `virtual:conteudo` (`{ padrao, idiomas, secoes }`)
   e o diagrama como `virtual:diagrama` (`{ [lang]: diagrama | null }`);
4. publica `content/assets/` em `dist/conteudo/assets/`, gera `login.html`
   a partir de `src/login/login.html` e `indisponivel.html` (a página 503).

Qualquer erro (campo desconhecido, ícone inexistente, imagem que não
existe, ligação para nó inexistente) derruba o build com o nome do arquivo.
Isso é de propósito: conteúdo inválido não publica.

## Auth, em uma tela

- `middleware.js` roda em toda requisição na Vercel. Allowlist exata em
  `api/_lib/comum.js` (`ehPublico`). Tudo o mais exige o cookie de sessão.
- Três variáveis ligam o login: `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`,
  `SESSION_SECRET` (32+ caracteres). Sem elas: `vercel dev` abre; preview e
  produção respondem 503 com a página que diz o que falta.
- `auth.modo: "aberto"` em `site.config.json` desliga o bloqueio de
  propósito; o rodapé mostra "portal aberto".
- A sessão é um JWT HS256 em cookie HttpOnly (`api/_lib/auth.js`). Sem banco.
- `POST /api/auth/senha` faz o login por senha; todo erro é o mesmo 401.
  `GET /api/auth/login` leva ao fluxo hospedado do WorkOS (MFA, verificação,
  senha esquecida); `GET /api/auth/callback` volta de lá; `GET /api/auth/logout`
  limpa o cookie e encerra a sessão no WorkOS; `GET /api/auth/me` alimenta o
  chip de usuário.
- Origem é comparada por igualdade exata (`origemPermitida`); `next` só
  aceita caminhos do próprio site (`caminhoSeguro`).

## O que os portões provam

| Comando | Prova |
|---|---|
| `npm test` | frontmatter, ordem, idiomas, imagens, diretivas; mudar um `.md` e rebuildar troca a seção; middleware 503 / 302 / passa; origem exata; `next` seguro; tokens monocromáticos e espelho do tema claro; layout do diagrama; nenhum termo do portal de referência |
| `npm run build` | o site inteiro nasce de `content/` e `site.config.json` |
| `npm run audit:contrast` (e `:claro`) | AA medido pixel a pixel, com hover, a 1280px; `--largura=390` para o celular |
| `npm run audit:overflow` (e `:claro`) | nenhum transbordo horizontal de 720 a 320px; nada debaixo do cabeçalho |
| `npm run check:limpo` | nada do portal de referência |
| `node scripts/capturas.mjs` | capturas de cada página em 1280 e 390px (não é portão) |

Os portões visuais precisam de `npm run build && npm run preview` na :4173.

## Identidade

O manual de marca está em `docs/MANUAL_DE_MARCA.md`. Os tokens são os únicos
valores de cor do repositório (`src/styles/tokens.css`); a página de login
duplica um subconjunto porque fica fora do bundle, e o teste confere que
todo hex dela existe nos tokens. Títulos em Unbounded caixa alta, texto em
Inter, código em JetBrains Mono, todas locais via `@fontsource`. Sem
gradiente, sombra, blur, itálico ou cor de acento.

## Ao acrescentar um bloco de markdown novo

1. Renderização em `plugins/conteudo.js` (`criarMarked` ou `segmentar`).
2. Estilo em `src/styles/portal.css`, só com `var()`.
3. Um caso em `tests/conteudo.test.js`, um exemplo em `content/02-como-escrever.md`.
4. `npm test`, `npm run build`, os dois portões visuais nos dois temas.
