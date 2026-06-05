# Como Ativar a Loja

## Loja fechada

Por padrão, a loja começa fechada:

```env
VITE_STORE_DEFAULT_OPEN=false
```

Enquanto estiver fechada, o público verá:

> Loja em preparação. Em breve novas ofertas.

## Abrir pelo painel

1. Acesse `/admin/robos`.
2. Digite a senha.
3. Cadastre ou revise produtos.
4. Clique em **Testar robô**.
5. Corrija produtos com alerta.
6. Clique em **Abrir loja ao público**.

## Fechar temporariamente

1. Acesse `/admin/robos`.
2. Clique em **Fechar loja temporariamente**.

## Importante sobre site estático

Esta primeira versão usa localStorage. Isso significa que abrir/fechar a loja pelo painel muda o estado no navegador atual.

Para abrir a loja para todos em produção estática, use:

```env
VITE_STORE_DEFAULT_OPEN=true
```

Depois rode:

```bash
npm run build
```

Para controle global real por administrador, será necessário backend ou banco de dados.
