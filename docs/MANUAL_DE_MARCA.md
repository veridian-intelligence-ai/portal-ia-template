# Manual de Marca

Extraído do guia de identidade visual fornecido. Escrito para dois leitores: você, para decidir e revisar, e o Claude Code, para aplicar ao portal sem interpretar.

---

## 0. Decisões tomadas

| # | Decisão |
|---|---|
| 1 | **Nome:** a marca continua **Modern Data Stack**. O formato do produto passa de "Blueprint" para **Framework** em toda interface, nos três idiomas, mantendo ids internos intactos. A imagem é referência visual, não de nome; "Agentes de IA em Engenharia de Dados" não substitui nada no portal |
| 2 | **Mascote:** entra no portal, nas capas e nas telas, conforme seção 6 |
| 3 | **Fonte de título:** Unbounded (gratuita, Google Fonts), via `@fontsource` |

---

## 1. Essência

**Tagline principal:** Planejam. Executam. Validam. Evoluem juntos.

**Frase de posicionamento:** Inteligência que move dados para um amanhã mais real.

**Quatro palavras que resumem:** Dados. Pessoas. Agentes. Resultados reais.

**Assinatura de fechamento:** Agentes hoje. Mais valor amanhã.

**O que a marca é:** técnica, precisa, minimalista, séria sem ser fria. Fala de execução e resultado, não de promessa. A estética é de ferramenta bem feita, não de anúncio.

**O que a marca não é:** colorida, animada, cheia de efeito, futurista de filme. Não usa gradiente, não usa neon, não usa mais de uma cor de destaque. O contraste é o efeito.

---

## 2. Logo

### 2.1 Logo principal

Três linhas empilhadas, alinhadas à esquerda, em caixa alta:

```
AGENTES
DE IA
EM ENGENHARIA DE DADOS
```

- Linhas 1 e 2 ("AGENTES" / "DE IA"): fonte de título, peso Black/Bold, tamanho grande.
- Linha 3 ("EM ENGENHARIA DE DADOS"): mesma fonte, peso Bold, cerca de 40% do tamanho das linhas acima, com letter-spacing levemente positivo.
- À direita, opcional, em fonte de texto, caixa alta, letter-spacing +0.2em, tamanho pequeno: "PLANEJAM / EXECUTAM / VALIDAM / EVOLUEM / JUNTOS", uma palavra por linha.

### 2.2 Logo alternativa (horizontal)

Mascote à esquerda (só a cabeça, ou cabeça e ombros), e à direita o mesmo bloco de texto em três linhas, menor. Para cabeçalhos estreitos, favicon composto, assinaturas.

### 2.3 Regras

- Sempre branco sobre preto, ou preto sobre branco. Nunca colorido.
- Área de proteção: a altura da letra "A" de "AGENTES" em todos os lados.
- Tamanho mínimo: a linha "EM ENGENHARIA DE DADOS" precisa continuar legível. Abaixo disso, usar só "AGENTES DE IA" ou só o mascote.
- Não inclinar, não distorcer, não aplicar sombra ou contorno, não colocar sobre foto sem véu escuro.

### 2.4 Versão reduzida

Só "AGENTES DE IA" em duas linhas, sem a terceira. Para espaços onde a versão completa não cabe.

---

## 3. Paleta

Monocromática. Quatro valores. Nenhuma cor de acento.

| Nome | Hex | Papel |
|---|---|---|
| **Branco** | `#FFFFFF` | Destaque, tipografia principal, ícones ativos, botão primário (fundo) |
| **Cinza primário** | `#1A1A1A` | Superfícies elevadas: cards, painéis, campos de formulário, blocos de código |
| **Cinza secundário** | `#3A3A3A` | Bordas, divisores, ícones inativos, texto terciário, estados desabilitados |
| **Preto** | `#000000` | Fundo base de tudo |

### 3.1 Valores derivados (para o portal)

A imagem define quatro cores. Um sistema de interface precisa de alguns intermediários. Estes são derivados, não inventados: ficam entre os valores oficiais e nunca introduzem matiz.

| Token | Hex | Uso |
|---|---|---|
| `--text-primary` | `#FFFFFF` | Títulos, texto de leitura |
| `--text-secondary` | `#E5E5E5` | Texto de apoio, descrições, parágrafos secundários |
| `--text-tertiary` | `#A3A3A3` | Metadados curtos: datas, contagens, legendas de uma linha |
| `--text-disabled` | `#6B6B6B` | Só placeholder de campo e texto desabilitado. Nunca conteúdo |
| `--surface-0` | `#000000` | Página |
| `--surface-1` | `#1A1A1A` | Card, painel |
| `--surface-2` | `#262626` | Card sobre card, hover de superfície |
| `--border` | `#3A3A3A` | Bordas padrão |
| `--border-strong` | `#FFFFFF` | Borda de foco, card selecionado |

### 3.2 Contraste (medido)

| Par | Razão | AA texto normal | AA texto pequeno |
|---|---|---|---|
| Branco sobre preto | 21:1 | sim | sim |
| Branco sobre `#1A1A1A` | 17,4:1 | sim | sim |
| `#E5E5E5` sobre `#000000` | 17,1:1 | sim | sim |
| `#A3A3A3` sobre `#1A1A1A` | 7,2:1 | sim | sim (só metadado curto) |
| `#6B6B6B` sobre `#1A1A1A` | 3,4:1 | não | não. Só para placeholder e desabilitado, nunca para conteúdo |

### 3.3 Regra de legibilidade

Texto que a pessoa precisa **ler** (título, parágrafo, instrução, rótulo de botão) é branco
ou `#E5E5E5`. Cinza médio (`#A3A3A3`) só para metadado de uma linha que a pessoa consulta,
não lê: data, contagem, tempo estimado. Se houver dúvida, é branco.

### 3.4 Tema claro (alternativa)

O portal oferece alternância entre tema escuro (padrão) e claro. O claro é o espelho exato,
sem introduzir matiz:

| Token | Escuro | Claro |
|---|---|---|
| `--surface-0` | `#000000` | `#FFFFFF` |
| `--surface-1` | `#1A1A1A` | `#F5F5F5` |
| `--surface-2` | `#262626` | `#EBEBEB` |
| `--border` | `#3A3A3A` | `#D4D4D4` |
| `--border-strong` | `#FFFFFF` | `#000000` |
| `--text-primary` | `#FFFFFF` | `#000000` |
| `--text-secondary` | `#E5E5E5` | `#262626` |
| `--text-tertiary` | `#A3A3A3` | `#6B6B6B` |
| `--text-disabled` | `#6B6B6B` | `#A3A3A3` |
| Botão primário | branco sobre preto | preto sobre branco |

O mascote e as capas são gerados em fundo preto; no tema claro, as capas ficam como ilhas
escuras dentro de cards, que é o mesmo efeito de pôster sobre parede branca. Não regenerar
arte para o tema claro.

Padrão: escuro. A escolha da pessoa persiste no navegador (localStorage). O toggle fica no
canto superior direito, ao lado do seletor de idioma, como ícone de sol/lua, sem texto.

### 3.5 Estados sem cor

Como não há verde, vermelho ou amarelo, os estados se distinguem por **ícone e texto**, nunca só por cor. Ver seção 7.

---

## 4. Tipografia

### 4.1 Famílias

| Papel | Fonte | Alternativa gratuita | Pesos |
|---|---|---|---|
| Títulos e logo | Monument Extended | **Unbounded** (Google Fonts) | Bold (700), Black (900) |
| Texto corrido, interface | Inter | Inter (já é gratuita) | Regular (400), Medium (500), Semibold (600) |
| Código, terminal, dados | JetBrains Mono | mantida do portal atual | Regular (400) |

Monument Extended é fonte paga. A Unbounded tem a mesma proporção estendida e o mesmo peso visual. Para o portal, usar Unbounded via `@fontsource`, mantendo o padrão de fontes locais que já existe no projeto.

### 4.2 Escala

| Nível | Fonte | Tamanho | Peso | Caixa | Letter-spacing | Linha |
|---|---|---|---|---|---|---|
| Display (logo, hero) | Unbounded | `clamp(40px, 7vw, 88px)` | 900 | ALTA | -0.02em | 0.95 |
| H1 | Unbounded | `clamp(32px, 4.5vw, 56px)` | 900 | ALTA | -0.01em | 1.0 |
| H2 | Unbounded | `clamp(24px, 3vw, 36px)` | 700 | ALTA | 0 | 1.1 |
| H3 | Unbounded | 20px | 700 | ALTA | 0 | 1.2 |
| Kicker (rótulo de seção) | Inter | 11px | 500 | ALTA | +0.2em | 1.4 |
| Corpo | Inter | 17px | 400 | normal | 0 | 1.55 |
| Corpo pequeno | Inter | 15px | 400 | normal | 0 | 1.5 |
| Legenda | Inter | 13px | 400 | normal | +0.01em | 1.4 |
| Código | JetBrains Mono | 14px | 400 | normal | 0 | 1.6 |

### 4.3 Regras

- Títulos sempre em caixa alta. É a assinatura tipográfica; não há título em caixa baixa.
- Kickers (rótulos acima de seções, como "01 LOGO PRINCIPAL") sempre em Inter, caixa alta, letter-spacing largo, com número de dois dígitos e um traço curto depois.
- Texto corrido nunca em caixa alta.
- Nunca itálico. Nunca sublinhado em título. Links em texto: sublinhado fino, branco.
- Alinhamento à esquerda por padrão. Centralizado só em estados vazios e telas de confirmação.

---

## 5. Iconografia

### 5.1 Estilo

Linear, traço de 1,5px, cantos arredondados, sem preenchimento, branco sobre fundo escuro. Tamanho base 24px. Sem sombra, sem gradiente.

### 5.2 Vocabulário base

| Ícone | Significado |
|---|---|
| Robô (linear) | Agente |
| Engrenagem | Processo |
| Cilindro | Dados, banco |
| Barras | Analytics, resultado |
| Nuvem | Cloud, infraestrutura |

### 5.3 Os quatro agentes

A imagem define quatro papéis, representados pelo mascote com pequenas variações. Servem para nomear etapas de um fluxo:

**Extrator → Transformador → Validador → Publicador**

No portal, esses quatro podem virar os nomes das fases de um Framework, ou os rótulos das missões. Não inventar um quinto sem motivo.

---

## 6. Mascote

### 6.1 Descrição

Robô branco, 3D com acabamento fosco, cabeça arredondada, visor preto com dois olhos brancos luminosos, braços curtos. Expressão neutra, levemente simpática. Sem boca, sem sobrancelha, sem cor.

### 6.2 Quando usar

- Redes sociais: sempre. É o rosto da marca no feed.
- Logo alternativa (cabeça).
- Estado vazio ("Nenhuma missão iniciada ainda").
- Página de erro ou de sucesso.
- Ilustração de conceito (os quatro agentes em fila).

### 6.3 Quando não usar

- Ao lado de conteúdo técnico denso (instrução, código, tabela). Distrai.
- Em tamanho pequeno onde vira uma mancha branca.
- Com expressão diferente da definida. O mascote não sorri, não pisca, não gesticula.
- Colorido. Nunca.

### 6.4 Consistência entre gerações

Para gerar novas cenas com o mascote (capas, posts), usar a imagem de referência como entrada no gerador (imagem para imagem), não só descrição em texto. Sem isso, cada geração produz um robô diferente. Guardar o arquivo-fonte do mascote em `public/marca/mascote.png` em alta resolução, de frente, fundo preto puro.

---

## 7. Componentes de interface

### 7.1 Card de superfície

- Fundo `#1A1A1A`, borda 1px `#3A3A3A`, raio 12px.
- Ícone linear à esquerda, título em Inter Medium branco, seta `>` à direita quando é clicável.
- Hover: borda vira `#FFFFFF`. Sem mudança de fundo.

### 7.2 Bloco de terminal

- Fundo `#1A1A1A`, sem borda, raio 12px, padding 20px.
- JetBrains Mono 14px, branco. Cada linha começa com `> `.
- Usado para mostrar passos de execução, comandos, logs.

### 7.3 Estados (sem cor)

| Estado | Ícone | Rótulo | Tratamento |
|---|---|---|---|
| Em execução | círculo com ponto pulsante | EM EXECUÇÃO | ícone branco, animação de pulso lenta |
| Concluído | check | CONCLUÍDO | ícone branco sólido |
| Validando | círculo com ponto | VALIDANDO | ícone branco, sem animação |
| Aguardando | círculo vazio | AGUARDANDO | ícone `#3A3A3A` |
| Erro | triângulo com exclamação | ERRO | ícone branco, borda do container vira branca |

Todos como pílula: fundo `#1A1A1A`, borda 1px `#3A3A3A`, raio total, texto Inter 12px caixa alta letter-spacing +0.1em.

### 7.4 Botão primário

- Fundo `#FFFFFF`, texto `#000000`, Inter Semibold 15px, caixa alta, letter-spacing +0.05em.
- Raio 8px. Padding 14px 24px. Seta `→` à direita quando é ação de avanço.
- Hover: fundo `#E5E5E5`. Ativo: `#CCCCCC`.
- Um por tela. O resto é secundário.

### 7.5 Botão secundário

- Fundo transparente, borda 1px `#3A3A3A`, texto branco.
- Hover: borda branca.

### 7.6 Campo de formulário

- Fundo `#1A1A1A`, borda 1px `#3A3A3A`, raio 8px, texto branco, placeholder `#6B6B6B`.
- Foco: borda branca. Erro: borda branca e mensagem abaixo com ícone de erro.

---

## 8. Grid e layout

- 12 colunas, gutter 24px, margem lateral 5vw (mínimo 20px).
- Largura máxima de conteúdo: 1200px.
- Espaçamento vertical entre seções: 96px desktop, 64px mobile.

### Princípios

1. **Espaço em branco respira ideias.** Menos elementos por tela. Cada bloco tem ar em volta.
2. **Hierarquia clara guia o olhar.** Um título grande, um texto de apoio, uma ação. Não três títulos disputando.
3. **Elementos modulares e consistentes.** Card é card em todo lugar. Botão é botão.
4. **Foco no conteúdo e na mensagem.** Nada decorativo. Se um elemento não informa, sai.
5. **Estética técnica e minimalista.** A referência é ferramenta profissional, não site de agência.

---

## 9. Tom e mensagem

### 9.1 Cinco pilares

| Pilar | Significado | Como aparece no texto |
|---|---|---|
| **Precisão** | Exatidão em cada etapa | Números específicos, nunca "muito" ou "vários" |
| **Orquestração** | Agentes que trabalham em conjunto | Verbos de sequência: primeiro, depois, então |
| **Execução** | Do plano ao resultado real | Verbos de ação no presente: executa, valida, publica |
| **Validação** | Confiança em cada dado | Prova antes de afirmação: "testado em", "confirmado por" |
| **Impacto** | Dados que geram valor | Sempre termina no resultado, não na ferramenta |

### 9.2 Regras de voz

- Frases curtas. Um ponto por frase.
- Presente do indicativo. "O agente valida", não "o agente vai validar".
- Sem adjetivo de intensidade: nada de "poderoso", "incrível", "revolucionário".
- Sem pergunta retórica em título.
- Sem jargão de consultoria, sem metáfora de guerra ou esporte.
- Quando houver número, o número vem primeiro: "57 dias. 5 sprints. 200 PRs."

### 9.3 Exemplos de mensagem (das peças de referência)

- "Dados melhores. Decisões reais."
- "Mesmos dados. Mais possibilidades."
- "Da extração ao impacto."
- "Agentes hoje. Mais valor amanhã."

Padrão: duas frases curtas, a segunda responde à primeira. Substantivo, ponto, substantivo, ponto.

---

## 10. Redes sociais

### 10.1 Formato de post (quadrado 1080x1080)

Três modelos da referência:

**A. Título forte:** fundo preto, título em Unbounded caixa alta ocupando 60% da altura, logo pequeno no rodapé, mascote no canto inferior direito.

**B. Afirmação com gráfico:** fundo preto, frase de duas linhas à esquerda, gráfico de barras linear branco à direita, mascote pequeno no rodapé.

**C. Contraste:** fundo preto, primeira frase em Inter Regular, segunda em Unbounded Bold, mascote no rodapé.

### 10.2 Regras

- Sempre fundo preto. Nunca foto, nunca gradiente.
- Máximo 8 palavras no título.
- Logo em toda peça, no rodapé, em versão reduzida.
- Mascote em toda peça, pequeno, no canto inferior direito.

---

## 11. Aplicação ao portal

Esta seção é a ponte para o Claude Code. Diz o que muda, o que sai, e o que fica.

### 11.1 O que muda

| Área | Hoje | Passa a ser |
|---|---|---|
| `tokens.css` | Índigo `#2b2178`, teal `#14c9b8`, fundo `#f7f7fb`, tema claro | Os tokens das seções 3.1 e 3.4. Escuro por padrão, com alternância para claro. Sem cor de acento |
| Fonte de título | Anton itálico | Unbounded caixa alta, sem itálico |
| Fonte de texto | Hanken Grotesk | Inter |
| Fonte de código | JetBrains Mono | mantida |
| Capas (11 arquivos) | Cinematográficas, índigo/teal/dourado | Regenerar em monocromático. Com ou sem mascote conforme decisão 2 |
| Estados de missão | Cor (verde/amarelo/vermelho) | Ícone + texto, seção 7.3 |
| Botão primário | Índigo | Branco sobre preto |
| Login, redefinir senha | Tema claro | Tema escuro, mesmo componente de campo da seção 7.6 |
| WorkOS branding | Tema claro, cores índigo | Tema escuro, botão branco, fundo preto |
| Páginas de vendas e legais | Tema claro | Tema escuro |

### 11.2 O que sai

- Toda cor de matiz. Grep por qualquer hex que não seja cinza puro e substituir.
- Itálico em qualquer título.
- Gradientes, sombras coloridas, blur decorativo.
- O gerador de arte anterior, se ainda existir.

### 11.3 O que fica

- Estrutura de rotas, componentes, i18n, testes, portões.
- A regra de contraste AA continua valendo, e fica mais fácil: branco sobre preto passa em tudo. O único cuidado é o `#6B6B6B`, que não serve para conteúdo.
- O scrim escuro no terço inferior das capas continua, porque agora combina com o fundo.

### 11.4 Ordem sugerida de aplicação

1. Tokens e fontes (uma sessão). Tudo muda de cor de uma vez, e os portões de contraste dizem o que quebrou.
2. Componentes (estados, botões, campos).
3. Capas (depende das decisões 1 e 2 e de você gerar as imagens).
4. WorkOS branding (eu faço pela API).
5. Redes sociais (fora do repositório).

---

## 12. Arquivos a produzir

Para a marca ficar utilizável fora deste documento:

| Arquivo | Conteúdo | Onde |
|---|---|---|
| `logo-principal.svg` | Três linhas, branco, fundo transparente | `public/marca/` |
| `logo-principal-preto.svg` | Mesma, preto, para fundo claro | `public/marca/` |
| `logo-reduzido.svg` | Só "AGENTES DE IA" | `public/marca/` |
| `mascote.png` | Alta resolução, de frente, fundo preto | `public/marca/` |
| `mascote-cabeca.png` | Só a cabeça, para favicon e logo alternativa | `public/marca/` |
| `favicon.svg` | Cabeça do mascote simplificada, 32px | `public/` |
| `tokens.css` | Seção 3.1 e 4.2 em variáveis | `src/styles/` |

Os SVGs de logo o Claude Code consegue gerar a partir da especificação. O mascote precisa vir de você (extraído da referência ou gerado com ela como base).
