# Como adicionar produtos

Edite o arquivo:

`pacote-github-pages-pronto/dados/products.json`

Para produtos de afiliado, mantenha sempre o link original no campo:

`affiliateLink`

Modelo recomendado:

```json
{
  "id": "mercado-livre-produto-001",
  "storeId": "impacto-tech-computadores",
  "name": "Nome real do produto",
  "slug": "nome-real-do-produto",
  "brand": "Marca identificada",
  "category": "Computadores e Informatica",
  "subcategoria": "Notebooks",
  "description": "Descricao curta do produto.",
  "price": "Consultar",
  "image": "public/placeholder-produto-mercado-livre.svg",
  "badge": "Mercado Livre",
  "affiliateLink": "LINK_ORIGINAL_DE_COMISSAO",
  "source": "Mercado Livre",
  "status": "ativo",
  "actionType": "buy"
}
```

Regras importantes:

- Nao remova parametros dos links de afiliado.
- Nao troque `meli.la` por link comum.
- Nao use senha, token ou chave secreta no front-end.
- Quando a informacao nao existir no fornecedor, use `Informacao nao especificada pelo fornecedor`.

