# Marca do cliente

Coloque aqui o logo (SVG de preferência, monocromático) e aponte para ele em
`site.config.json`:

```json
"logo": { "escuro": "/marca/logo-branco.svg", "claro": "/marca/logo-preto.svg" }
```

`escuro` é o arquivo mostrado no tema escuro (logo branco); `claro`, no tema
claro (logo preto). Sem logo, o cabeçalho mostra `nomeCurto` em Unbounded.

Esta pasta é pública (fica fora do login) porque a página de login também
mostra a marca.
