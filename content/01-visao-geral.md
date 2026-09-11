---
title: Visão geral
subtitle: Um portal de conteúdo protegido, construído a partir dos seus arquivos markdown.
icon: casa
---

Este portal é o próprio template. Cada arquivo `.md` na pasta `content/` vira uma seção do menu ao lado; o texto que você está lendo está em `content/01-visao-geral.md`. Mudou o arquivo, mudou o site: não há transcrição em lugar nenhum.

## O que vem pronto

::: cards
### Conteúdo em markdown
Títulos, listas, tabelas, código e imagens. O build lê `content/` e gera as seções.

### Login por senha
Página própria, sessão em cookie assinado, sem banco. O WorkOS guarda as contas.

### Diagrama declarado
Nós, raias e ligações em `content/diagrama.yaml`. O desenho é calculado.

### Identidade monocromática
Tema escuro por padrão, claro pelo toggle. Unbounded, Inter e JetBrains Mono, locais.
:::

## Como o portal nasce

::: passos
### Escreva
Coloque os seus `.md` em `content/`, com um frontmatter de quatro campos.

### Configure
Preencha `site.config.json`: nome, domínio, idiomas, logo, diagrama.

### Publique
Importe o repositório na Vercel. O middleware protege tudo por padrão.
:::

> Sem as três variáveis do WorkOS, o portal responde 503 em produção. Ele nunca abre por acidente; abrir de propósito é `auth.modo: "aberto"` em `site.config.json`.

## Onde cada coisa mora

| O que | Onde | Quem edita |
|---|---|---|
| Conteúdo | `content/*.md` | você |
| Configuração | `site.config.json` | você |
| Diagrama | `content/diagrama.yaml` | você |
| Motor | `plugins/`, `src/motor/`, `api/`, `middleware.js` | ninguém, em condições normais |
