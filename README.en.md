# Portal IA Template

[Português](README.md)

A password-protected content portal, on your own domain, generated from
your markdown files. Every `.md` in `content/` becomes a section; the
diagram comes from a YAML file; the identity is monochrome, with dark and
light themes. No database: sign-in uses WorkOS and a signed cookie session.
Runs on Vercel.

This repository is a **template**: use "Use this template" on GitHub (not
Fork) to create yours.

## What is inside

| Folder or file | What it is |
|---|---|
| `content/*.md` | the sections, one per file, with a frontmatter (`title`, `order`, `icon`, `lang`) |
| `content/assets/` | the client's images and icons, published behind the login |
| `content/diagrama.yaml` | the map: lanes, nodes and links; the drawing is computed |
| `site.config.json` | name, domain, languages, logo, theme, sign-in mode |
| `plugins/conteudo.js` | the engine: reads `content/` at build time and generates the sections |
| `src/` | the app (React), the diagram and the brand-manual styles |
| `api/auth/*`, `middleware.js` | password sign-in, cookie session, everything protected by default |
| `docs/` | the brand manual |

The example content in `content/` (in Portuguese) describes the template
itself: how to write, the icons, images and the diagram.

## Run locally

```
npm install
npm run dev
```

Opens at `http://localhost:5173`, without sign-in (the middleware only runs
on Vercel). Edit anything in `content/` and the page reloads.

`npm run build` writes `dist/`; `npm run preview` serves it on `:4173`.

## Writing content

One file per section, in `content/`, named `NN-slug.md`:

```markdown
---
title: Data flow
subtitle: One sentence under the title.
icon: cilindro
---

## A subheading

Full markdown: lists, tables, code, images from `assets/`.
```

Fields: `title` (required), `order` (default: the `NN` prefix), `icon`
(`documento`, `mapa`, `engrenagem`, `cilindro`, `barras`, `nuvem`, `robo`,
`pasta`, `usuario`, `cadeado`, `globo`, `casa`, `seta`, `check`, `alerta`,
`relogio`, or `custom:file.svg` in `content/assets/`), `lang` (for the
second language), `subtitle`, `hidden`. Two extra blocks, `::: cards` and
`::: passos` (steps), are explained in `content/02-como-escrever.md`.

Second language: `02-slug.en.md` with `lang: en`, plus `"outros": ["en"]`
under `idiomas` in `site.config.json`. The default language is
`idiomas.padrao`; the interface labels exist in `pt-BR` and `en`.

Diagram: `content/diagrama.yaml` (example in the repository). To turn it
off, delete the file or set `"diagrama": { "ativo": false }`.

## How sign-in works

- `middleware.js` runs on every request on Vercel and protects everything
  by default, including the JavaScript bundle and the images. The allowlist
  is short and exact: `/login`, the `/api/auth/*` functions, `/fontes/`,
  `/marca/`, `/favicon.svg`.
- The session is a JWT signed with `SESSION_SECRET`, in an `HttpOnly`
  cookie, valid for `auth.sessaoHoras` (12 by default). No database.
- Sign-in is by password, on the portal's own page (`/login`). E-mail
  verification, MFA and forgotten passwords go through the WorkOS hosted
  flow, linked from the page. Every sign-in failure gets the same answer.
- Without the three variables (`WORKOS_API_KEY`, `WORKOS_CLIENT_ID`,
  `SESSION_SECRET`), the portal answers **503** on preview and production,
  with a page that names what is missing. Under `vercel dev` it opens. It
  never ends up open in production by accident; opening on purpose is
  `"auth": { "modo": "aberto" }`.

## Deploy in five steps

1. **Repository.** Create yours from this template, put your content in
   `content/` and fill in `site.config.json` (`nome`, `dominio`, `idiomas`).
2. **Vercel.** Import the repository into a new project. Vercel detects
   Vite; `vercel.json` carries the rest. The first deploy answers 503: that
   is expected, sign-in does not exist yet.
3. **WorkOS.** Create a project, enable password authentication, disable
   sign-up, and add `https://<your domain>/api/auth/callback` to the
   redirect URIs and `https://<your domain>/login` to the logout URIs. Create
   the first user.
4. **Variables.** On the Vercel project, set `WORKOS_API_KEY`,
   `WORKOS_CLIENT_ID` and `SESSION_SECRET` (32+ random characters) for
   Production and Preview, then redeploy.
5. **Domain.** Point your domain to Vercel and make sure it matches
   `dominio` in `site.config.json`. Open `/` in a private window: it must
   land on `/login`. Sign in. Done.

## Verify

```
npm test                     # engine, auth, tokens, diagram, cleanliness
npm run build
npm run preview &            # on :4173
npm run audit:contrast       # AA measured pixel by pixel (and :claro)
npm run audit:overflow       # no horizontal overflow from 720 to 320px (and :claro)
```

`CLAUDE.md` explains what is engine and what is content, for whoever
builds with Claude Code.

## License

MIT.
