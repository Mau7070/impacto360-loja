# Como Testar os Robôs

## 1. Instalar dependências

```bash
npm install
```

## 2. Rodar localmente

```bash
npm run dev
```

Abra:

`http://localhost:5173`

## 3. Abrir painel administrativo

Abra:

`http://localhost:5173/admin/robos`

Senha padrão local:

`impacto360-admin`

Para trocar, crie ou edite `.env`:

```env
VITE_ADMIN_ROBOS_PASSWORD=sua-senha-aqui
```

Depois reinicie o servidor.

## 4. Testar Robô de Catálogo

No painel:

1. Clique em **Testar robô**.
2. Veja total de produtos, produtos prontos, rascunhos e incompletos.
3. Clique em **Ver logs**.
4. Confirme se produtos sem link, imagem ou descrição aparecem com alerta.

## 5. Cadastrar produto teste

Preencha:

- Nome;
- Categoria;
- Preço;
- URL da imagem;
- Link original de afiliado;
- Descrição.

Clique em **Salvar produto manual**.

Depois clique em **Testar robô**.

## 6. Abrir e fechar loja

No painel:

- **Abrir loja ao público**: libera a vitrine neste navegador.
- **Fechar loja temporariamente**: mostra "Loja em preparação".

## 7. Verificar celular

No navegador:

1. Abra o DevTools.
2. Ative visualização mobile.
3. Confirme se:
   - imagem do produto aparece inteira;
   - botão de compra fica visível;
   - texto continua legível;
   - WhatsApp aparece no canto inferior.

## 8. Testes obrigatórios

- `npm install`
- `npm run dev`
- abrir `/admin/robos`
- testar Robô de Catálogo
- cadastrar produto teste
- abrir loja
- fechar loja
- confirmar que produto usa link original de afiliado
- confirmar que nenhum envio automático de WhatsApp acontece
