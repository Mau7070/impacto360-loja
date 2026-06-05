# Mapa da Nova Arquitetura dos Robôs

## Visão geral

```text
Cliente público
  -> loja aberta
  -> vê produtos prontos

Cliente público
  -> loja fechada
  -> vê mensagem "Loja em preparação"

Administrador
  -> /admin/robos
  -> senha local
  -> cadastra produto
  -> testa Robô de Catálogo
  -> abre loja ao público
```

## Pasta oficial

```text
src/robos/
  catalogo/
  busca/
  contato/
  oferta/
  whatsapp/
  auditoria/
  logs/
```

## Robô ativo nesta etapa

### Robô de Catálogo

Local:

`src/robos/catalogo/index.js`

Funções:

- `start(products, options)`
- `stop()`
- `status()`

O robô:

- lê produtos cadastrados;
- preserva `affiliateLink` e `link_original_afiliado`;
- normaliza campos para o padrão de catálogo;
- marca produtos incompletos;
- sinaliza duplicados;
- gera logs locais;
- opera em modo simulado por padrão.

## Logs

Local de referência:

`logs/catalogo.log`

Durante a execução no navegador, os logs ficam no localStorage:

`ai360:roboLogs:catalogo`

## Painel administrativo

Local:

`src/pages/AdminRobos.jsx`

Rota:

`/admin/robos`

Senha:

`VITE_ADMIN_ROBOS_PASSWORD`

Se a variável não existir, a senha local temporária é:

`impacto360-admin`

Compatibilidade com a loja HTML estática:

`integracoes/impacto360-admin-robos.js`

Esse script substitui os robôs antigos da loja estática e também reconhece `/admin/robos`.

## Controle de abertura da loja

LocalStorage:

`ai360:storeOpen`

Variável padrão:

`VITE_STORE_DEFAULT_OPEN=false`

Observação: em site estático, esse controle é local por navegador. Para controle global real de todos os visitantes, será necessário backend ou configuração de build.
