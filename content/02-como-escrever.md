---
title: Como escrever
subtitle: O frontmatter, a ordem, os ícones e o que o markdown vira na tela.
icon: documento
---

## O frontmatter

Todo arquivo começa com um bloco entre `---`. Quatro campos, e só `title` é obrigatório:

| Campo | Obrigatório | O que faz | Padrão |
|---|---|---|---|
| `title` | sim | o nome no menu e o título da seção | |
| `order` | não | a posição no menu (inteiro) | o prefixo `NN-` do nome do arquivo |
| `icon` | não | o ícone linear ao lado do título | `documento` |
| `lang` | não | o idioma da seção, para o segundo idioma | `idiomas.padrao` da configuração |

Dois campos extras: `subtitle` (uma frase abaixo do título) e `hidden: true` (compila, mas não entra no menu).

Um exemplo completo:

```yaml
---
title: Fluxo de dados
subtitle: Uma pergunta de negócio atravessa cada camada.
icon: cilindro
order: 3
---
```

## Os ícones

Os nomes válidos são `documento`, `mapa`, `engrenagem`, `cilindro`, `barras`, `nuvem`, `robo`, `pasta`, `usuario`, `cadeado`, `globo`, `casa`, `seta`, `check`, `alerta` e `relogio`. Para um ícone seu, coloque um SVG monocromático em `content/assets/` e use `icon: custom:nome-do-arquivo.svg`.

## O que o markdown vira

- `##` e `###` viram subtítulos em caixa alta. O `#` é reservado ao título da seção; se aparecer no corpo, vira `##`.
- Listas, negrito e links funcionam como sempre. Links internos usam a âncora da seção: `[veja a visão geral](#visao-geral)`.
- Tabelas viram tabelas listradas que rolam na horizontal no celular.
- Blocos de código viram o bloco de terminal. Com a linguagem `terminal`, cada linha ganha o `>` na frente:

```terminal
npm install
npm run build
```

- Citações (`>`) viram um destaque com barra à esquerda.
- Imagens vêm de `content/assets/`; a seção seguinte mostra.

## Dois blocos a mais

Além do markdown comum, dois contêineres:

```markdown
::: cards
### Primeiro card
Texto do card.
### Segundo card
Texto do card.
:::

::: passos
### Passo um
O que fazer.
### Passo dois
O que fazer depois.
:::
```

`cards` vira uma grade de cards; `passos` vira uma sequência numerada. Tudo o que não for reconhecido continua sendo markdown comum, nunca erro.

## Segundo idioma

Para uma versão em inglês da seção `02-como-escrever.md`, crie `02-como-escrever.en.md` com `lang: en` e coloque `"outros": ["en"]` em `idiomas` no `site.config.json`. O toggle de idioma aparece sozinho. Uma seção sem tradução mostra o texto do idioma padrão com um aviso.
