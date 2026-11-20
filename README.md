# Velune — site

Site estático da Velune (fotografia de casamentos e ensaios — Fellipe e Natália Gomes).

## Páginas

- `index.html` — Página inicial
- `historias.html` — Todas as histórias
- `historia.html#<slug>` — Uma história completa (ex.: `historia.html#iza-yan`)

## Estrutura

- `assets/img/` — fotografias (1600 px)
- `assets/logo.svg` — logotipo
- `assets/js/dc.js` — pequeno runtime que monta as páginas a partir do `<template>` de cada uma
- `assets/js/morphdom.min.js` — atualização do DOM sem recarregar (MIT)

Não há etapa de build: basta servir a pasta como arquivos estáticos.

## Publicar com GitHub Pages

1. No repositório, abra **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Salve. Em alguns minutos o site fica em `https://velunefotografia.github.io/velunefotografia/`.
4. Para usar `velunefotografia.com`, informe o domínio em **Custom domain** e aponte o DNS conforme as instruções do GitHub.

## Ver localmente

```sh
python3 -m http.server 8000
# abra http://localhost:8000
```
