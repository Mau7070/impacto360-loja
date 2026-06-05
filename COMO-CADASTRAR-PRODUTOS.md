# Como Cadastrar Produtos

## Pelo painel administrativo

1. Acesse `/admin/robos`.
2. Informe a senha.
3. Vá até **Cadastrar produto manualmente**.
4. Preencha:
   - nome;
   - categoria;
   - preço;
   - imagem;
   - link original de afiliado;
   - descrição.
5. Clique em **Salvar produto manual**.
6. Clique em **Testar robô**.

O produto entra como rascunho e passa pelo Robô de Catálogo.

## Regra do link de afiliado

O campo mais importante é:

`link_original_afiliado`

Esse link nunca deve ser substituído automaticamente.

Se o produto não tiver link de afiliado, ele não fica pronto para publicação.

## Campos obrigatórios

```json
{
  "id": "produto-001",
  "nome": "Nome do produto",
  "categoria": "Categoria",
  "descricao": "Descrição do produto",
  "imagem": "https://exemplo.com/imagem.jpg",
  "link_original_afiliado": "https://seu-link-afiliado.com",
  "preco": 99.9,
  "status": "rascunho"
}
```

## Alertas gerados pelo robô

O Robô de Catálogo alerta quando:

- falta link de afiliado;
- falta imagem;
- falta preço;
- descrição está curta;
- produto está duplicado;
- id está ausente.

## Cadastro direto no JSON

Produtos fixos continuam em:

`src/data/products.json`

Use o painel para testes rápidos e o JSON para dados permanentes antes do build.
