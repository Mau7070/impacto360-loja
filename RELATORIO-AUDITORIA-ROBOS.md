# Relatório de Auditoria dos Robôs

Data: 05/06/2026

## Objetivo

Reorganizar os robôs do Shopping Impacto 360 em uma base simples, modular e segura, começando apenas pelo Robô de Catálogo.

## Robôs encontrados

| Item encontrado | Local | Situação |
| --- | --- | --- |
| Robô de atendimento Orbit | `integracoes/impacto360-robo-orbit.js` | Antigo, misturava atendimento, lead, módulos e links locais. Movido para backup. |
| Painel antigo de servidores/produtos | `integracoes/impacto360-servidores-produtos.js` | Antigo, misturava robôs, servidores localhost e editor de produtos. Movido para backup. |
| Scripts de integração antigos | `INTEGRAR-ROBOS-NA-LOJA.*` | Antigos e confusos para o fluxo atual. Movidos para backup. |
| Documentos antigos de comando | `COMANDOS-ROBOS-IMPACTO360.txt`, `COMANDOS-SERVIDORES-PRODUTOS.txt`, `README-INTEGRAR-ROBOS-IMPACTO360.md` | Movidos para backup para evitar orientação duplicada. |
| AFILIADO-ORBIT | `AFILIADO-ORBIT/` | Mantido como projeto separado/legado avançado. Não foi apagado nem movido para não quebrar trabalhos anteriores. |
| Cópias estáticas antigas | `pacote-github-pages-pronto/integracoes/` | Duplicadas em relação aos robôs antigos. Movidas para backup e substituídas pelo novo admin seguro. |

## Arquivos movidos para backup

Backup criado em:

`_backup_robos_antigos/`

Arquivos movidos:

- `_backup_robos_antigos/integracoes/impacto360-robo-orbit.js`
- `_backup_robos_antigos/integracoes/impacto360-servidores-produtos.js`
- `_backup_robos_antigos/INTEGRAR-ROBOS-NA-LOJA.bat`
- `_backup_robos_antigos/INTEGRAR-ROBOS-NA-LOJA.ps1`
- `_backup_robos_antigos/README-INTEGRAR-ROBOS-IMPACTO360.md`
- `_backup_robos_antigos/COMANDOS-ROBOS-IMPACTO360.txt`
- `_backup_robos_antigos/COMANDOS-SERVIDORES-PRODUTOS.txt`
- `_backup_robos_antigos/pacote-github-pages-pronto/integracoes/impacto360-robo-orbit.js`
- `_backup_robos_antigos/pacote-github-pages-pronto/integracoes/impacto360-servidores-produtos.js`

## Funções duplicadas identificadas

- Atendimento ao cliente aparecia no robô Orbit e em painéis de servidores.
- Produtos editáveis apareciam fora do fluxo oficial de catálogo.
- Links para localhost apareciam para o usuário sem garantia de servidor ligado.
- Vários arquivos orientavam comandos diferentes para a mesma finalidade.
- Havia risco de confundir robô de atendimento, robô de produtos e painel de servidores.

## Erros e riscos identificados

- Robôs antigos ficavam expostos dentro da loja pública.
- Não havia controle claro de ativar/desativar por robô.
- Não havia fluxo simples de logs por robô.
- Não havia bloqueio administrativo central para abrir/fechar a loja.
- Produtos incompletos podiam aparecer misturados na vitrine.
- O link de afiliado precisava de uma regra explícita de preservação.
- Logs em frontend não podem gravar arquivo real automaticamente; por isso, a execução no navegador grava logs em localStorage e o arquivo `logs/catalogo.log` fica como referência inicial.

## Nova arquitetura

Pasta oficial:

```text
src/robos/
  catalogo/
    config.js
    index.js
  busca/
    README.md
  contato/
    README.md
  oferta/
    README.md
  whatsapp/
    README.md
  auditoria/
    README.md
  logs/
    config.js
    index.js
```

Nesta etapa, apenas o Robô de Catálogo foi implementado de verdade.

Os próximos robôs foram deixados como módulos reservados para serem criados um por vez, sem misturar funções.

## Nova área administrativa

Rota oculta:

`/admin/robos`

Ela permite:

- acessar com senha local;
- testar o Robô de Catálogo;
- ativar/desativar o Robô de Catálogo;
- ver logs;
- cadastrar produtos manualmente;
- configurar WhatsApp da loja;
- abrir ou fechar a loja ao público.

## Regra de publicação

Produto sem link original de afiliado não é considerado pronto.

Produto sem imagem fica como rascunho.

Produto com descrição curta recebe alerta.

Produto duplicado é sinalizado.

Produto incompleto não é publicado automaticamente.
