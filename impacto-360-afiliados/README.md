# Impacto 360 Afiliados

Loja/vitrine premium de afiliados criada com React + Vite + Tailwind CSS, preparada para hospedagem profissional em Vercel, Netlify, GitHub Pages ou hospedagem tradicional.

## Tipo do projeto

Este projeto é uma aplicação React/Vite estática. O build final sai na pasta:

```text
dist
```

## Requisitos

- Node.js 20 ou superior.
- npm instalado.
- Conta na Vercel, Netlify ou GitHub, caso queira publicar.

## 1. Instalar dependências

```bash
cd impacto-360-afiliados
npm install
```

## 2. Rodar localmente

```bash
npm run dev
```

Acesse:

```text
http://localhost:5173
```

## 3. Fazer build

```bash
npm run build
```

Para testar o build local:

```bash
npm run preview
```

## 4. Publicar na Vercel

O arquivo `vercel.json` já está configurado.

Configurações:

```text
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Passos:

1. Envie o projeto para um repositório GitHub.
2. Acesse `https://vercel.com`.
3. Clique em `Add New Project`.
4. Importe o repositório.
5. Configure as variáveis de ambiente.
6. Clique em `Deploy`.

## 5. Publicar na Netlify

O arquivo `netlify.toml` já está configurado.

Configurações:

```text
Build command: npm run build
Publish directory: dist
Node version: 20
```

Passos:

1. Acesse `https://netlify.com`.
2. Clique em `Add new site`.
3. Importe o repositório ou envie a pasta do projeto.
4. Configure as variáveis de ambiente.
5. Publique.

## 6. Publicar no GitHub Pages

Foi criado o workflow:

```text
.github/workflows/deploy-github-pages.yml
```

Passos:

1. Suba o projeto para um repositório GitHub.
2. Vá em `Settings > Pages`.
3. Em `Source`, selecione `GitHub Actions`.
4. Faça push na branch `main` ou rode o workflow manualmente.

Se publicar em subpasta, configure no `.env`:

```text
VITE_BASE_PATH=/nome-do-repositorio/
```

Depois rode o build novamente.

## 7. Configurar domínio próprio

Na Vercel ou Netlify:

1. Abra o projeto publicado.
2. Vá em `Domains`.
3. Adicione seu domínio.
4. Configure DNS conforme a plataforma pedir.
5. Atualize a variável:

```text
VITE_SITE_URL=https://seudominio.com
```

Também atualize:

```text
public/robots.txt
public/sitemap.xml
index.html
```

Substitua `https://seudominio.com` pelo domínio real.

## 8. Configurar variáveis de ambiente

Copie:

```text
.env.example
```

para:

```text
.env
```

Principais variáveis:

```text
VITE_SITE_URL=https://seudominio.com
VITE_SITE_NAME=Impacto 360 Afiliados
VITE_BASE_PATH=/
VITE_MERCADO_LIVRE_CLIENT_ID=
VITE_MERCADO_LIVRE_REDIRECT_URI=
VITE_MERCADO_LIVRE_ACCESS_TOKEN=
VITE_MERCADO_LIVRE_REFRESH_TOKEN=
VITE_MERCADO_LIVRE_SANDBOX=true
VITE_AUTO_PUBLISH_MERCADO_LIVRE=false
```

Importante: não publique `.env`, tokens reais, refresh tokens, senhas ou chaves secretas.

## 9. Adicionar produtos

Opção 1: editar o arquivo:

```text
src/data/produtos.json
```

Opção 2: usar o menu `Admin` dentro da loja. O cadastro local salva no navegador e prepara o produto para a fila segura de sincronização.

Campos principais:

```text
nome
categoria
preco
precoAnterior
descricaoCurta
descricaoCompleta
imagem
linkCompra
origem
codigoInterno
tags
status
destaque
```

Categorias ficam em:

```text
src/data/categorias.json
```

## 10. Atualizar a loja

Depois de editar produtos, categorias ou textos:

```bash
npm run build
```

Depois publique novamente na plataforma escolhida.

## SEO e compartilhamento

Configurado:

- meta title;
- meta description;
- Open Graph;
- Twitter Card;
- favicon;
- robots.txt;
- sitemap.xml;
- canonical;
- imagem principal de compartilhamento.

Arquivos:

```text
index.html
public/favicon.svg
public/robots.txt
public/sitemap.xml
public/images/logo-afiliado-impacto360.png
```

## Responsividade e performance

O projeto usa:

- Tailwind CSS;
- imagens com `loading="lazy"` nos cards;
- build Vite otimizado;
- cache agressivo para assets em Vercel/Netlify;
- layout responsivo para celular, tablet e desktop.

## Estrutura de publicação

```text
impacto-360-afiliados
├── .github/workflows/deploy-github-pages.yml
├── public
│   ├── _headers
│   ├── _redirects
│   ├── favicon.svg
│   ├── robots.txt
│   ├── sitemap.xml
│   └── images
├── src
├── .env.example
├── .gitignore
├── index.html
├── netlify.toml
├── package.json
├── vercel.json
└── vite.config.js
```

## Proteção de tokens

- `.env` está no `.gitignore`.
- O front-end não deve receber segredos reais.
- Integrações sensíveis, como Mercado Livre e redes sociais, devem ser concluídas em backend seguro.
- Use apenas OAuth oficial e tokens protegidos.

## Comandos úteis

```bash
npm install
npm run dev
npm run build
npm run preview
```
