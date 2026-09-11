# Portal IA Template

[English](README.en.md)

Um portal de conteúdo protegido, no seu domínio, com login, gerado a partir
dos seus arquivos markdown. Cada `.md` em `content/` vira uma seção; o
diagrama vem de um YAML; a identidade é monocromática, com tema escuro e
claro. Sem banco: o login usa o WorkOS e uma sessão assinada em cookie.
Roda na Vercel.

Este repositório é um **template**: use "Use this template" no GitHub (não
Fork) para criar o seu.

## O que tem dentro

| Pasta ou arquivo | O que é |
|---|---|
| `content/*.md` | as seções do portal, uma por arquivo, com frontmatter (`title`, `order`, `icon`, `lang`) |
| `content/assets/` | imagens e ícones do cliente, publicados atrás do login |
| `content/diagrama.yaml` | o mapa: raias, nós e ligações; o desenho é calculado |
| `site.config.json` | nome, domínio, idiomas, logo, tema, modo de login |
| `plugins/conteudo.js` | o motor: lê `content/` no build e gera as seções |
| `src/` | o app (React), o diagrama e os estilos do manual de marca |
| `api/auth/*`, `middleware.js` | login por senha, sessão em cookie, proteção de tudo por padrão |
| `docs/` | o manual de marca |

O conteúdo de exemplo em `content/` descreve o próprio template: como
escrever, os ícones, as imagens e o diagrama. Leia-o no portal rodando.

## Rodar localmente

```
npm install
npm run dev
```

Abre em `http://localhost:5173`, sem login (o middleware só roda na
Vercel). Edite qualquer arquivo em `content/` e a página recarrega.

`npm run build` gera `dist/`; `npm run preview` serve o build na `:4173`.

## Escrever conteúdo

Um arquivo por seção, em `content/`, com o nome `NN-slug.md`:

```markdown
---
title: Fluxo de dados
subtitle: Uma frase abaixo do título.
icon: cilindro
---

## Um subtítulo

Markdown completo: listas, tabelas, código, imagens em `assets/`.
```

Campos: `title` (obrigatório), `order` (padrão: o `NN` do nome), `icon`
(`documento`, `mapa`, `engrenagem`, `cilindro`, `barras`, `nuvem`, `robo`,
`pasta`, `usuario`, `cadeado`, `globo`, `casa`, `seta`, `check`, `alerta`,
`relogio`, ou `custom:arquivo.svg` em `content/assets/`), `lang` (para o
segundo idioma), `subtitle`, `hidden`. Dois blocos a mais, `::: cards` e
`::: passos`, estão explicados em `content/02-como-escrever.md`.

Segundo idioma: `02-slug.en.md` com `lang: en`, e `"outros": ["en"]` em
`idiomas` no `site.config.json`.

Diagrama: `content/diagrama.yaml` (exemplo no repositório). Para desligar,
apague o arquivo ou `"diagrama": { "ativo": false }`.

## Como o login funciona

- `middleware.js` roda em toda requisição na Vercel e protege tudo por
  padrão, inclusive o JavaScript e as imagens. A allowlist é curta e exata:
  `/login`, as funções em `/api/auth/*`, `/fontes/`, `/marca/`, `/favicon.svg`.
- A sessão é um JWT assinado com `SESSION_SECRET`, em cookie `HttpOnly`, com
  a validade de `auth.sessaoHoras` (12 por padrão). Não há banco.
- O login é por senha, na página própria (`/login`). Verificação de e-mail,
  MFA e senha esquecida passam pelo fluxo hospedado do WorkOS, que a página
  linka. Toda falha de login recebe a mesma resposta.
- Sem as três variáveis (`WORKOS_API_KEY`, `WORKOS_CLIENT_ID`,
  `SESSION_SECRET`), o portal responde **503** em preview e produção, com uma
  página que diz o que falta. Em `vercel dev`, abre. Ele nunca fica aberto
  em produção por acidente; abrir de propósito é `"auth": { "modo": "aberto" }`.

## Publicar em cinco passos

1. **Repositório.** Crie o seu a partir deste template, coloque o conteúdo
   em `content/` e preencha `site.config.json` (`nome`, `dominio`, `idiomas`).
2. **Vercel.** Importe o repositório num projeto novo. A Vercel detecta o
   Vite; `vercel.json` já traz o resto. O primeiro deploy responde 503: é o
   esperado, o login ainda não existe.
3. **WorkOS.** Crie um projeto, ligue a autenticação por senha, desligue o
   cadastro (sign-up) e adicione `https://<seu domínio>/api/auth/callback` aos
   redirect URIs e `https://<seu domínio>/login` aos logout URIs. Crie o
   primeiro usuário.
4. **Variáveis.** No projeto Vercel, grave `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`
   e `SESSION_SECRET` (32 ou mais caracteres aleatórios) em Production e
   Preview, e faça um novo deploy.
5. **Domínio.** Aponte o seu domínio para a Vercel e confira que ele bate
   com `dominio` em `site.config.json`. Abra `/` numa janela anônima: deve
   cair em `/login`. Entre. Pronto.

O passo a passo detalhado de cada etapa (com o que digitar em cada painel)
vive nas etapas do produto, não aqui.

## Verificar

```
npm test                     # motor, auth, tokens, diagrama, limpeza
npm run build
npm run preview &            # na :4173
npm run audit:contrast       # AA medido pixel a pixel (e :claro)
npm run audit:overflow       # sem transbordo de 720 a 320px (e :claro)
```

`CLAUDE.md` explica o que é motor e o que é conteúdo, para quem constrói
com o Claude Code.

## Licença

MIT.
