# Relatorio de ajustes - Mobile, midia, links e revisao

Data: 2026-06-09

## O que foi aplicado

- Home preservada: a entrada inicial e o shopping continuam no `index.html`.
- Botao `ENTRAR NO SHOPPING` tornado visivel, grande e facil de tocar no celular.
- Layout mobile-first reforcado para cards, botoes, filtros, busca e imagens.
- Cards de produto passam a usar `linkPlataforma` como campo preferencial de compra.
- Imagens usam `object-fit: contain`, `loading="lazy"` e `decoding="async"`.
- Produtos sem foto ou link sao marcados como `Revisar antes de publicar`, sem travar a pagina.
- Campos de video adicionados de forma segura: `videoPrincipal`, `videosExtras`, `thumbnailVideo`, `origemVideo`, `statusVideo`.
- Nova integracao administrativa em `integracoes/impacto360-admin-robos.js`.
- Novas rotas administrativas:
  - `/admin/catalogo-inteligente`
  - `/admin/postagens`
  - `/admin/midias`
  - `/admin/tendencias`
  - `/admin/plataformas`
  - `/admin/atendimento`
  - `/admin/revisao`
- `404.html` criado para preservar rotas administrativas no GitHub Pages.
- Validador criado em `scripts/validar-impacto360.mjs`.

## Como validar

```bash
npm run test:seguranca
npm run build
```

## Regra de seguranca

Se a validacao falhar, nao publicar a alteracao. Corrigir primeiro os itens marcados como `FALHA`.
