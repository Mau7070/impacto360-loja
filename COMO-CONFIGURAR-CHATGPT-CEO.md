# Como configurar o ChatGPT CEO no Shopping Impacto360

Esta integração adiciona uma área simples de CRM ao Shopping Impacto360 para registrar clientes, contatos autorizados e interesses comerciais.

## O que foi adicionado

- Botão flutuante **CEO / CRM** dentro da loja.
- Cadastro manual de cliente.
- Campos para nome, telefone, WhatsApp, e-mail, cidade, estado, origem, intenção de compra, status e observações internas.
- Registro de produtos pesquisados, produtos visualizados, categorias de interesse, links clicados e perguntas feitas.
- Exportação de clientes em JSON e CSV.
- Ações para apagar, anonimizar ou desativar cliente.
- Aviso obrigatório de autorização antes de salvar contato.
- Recomendações locais com base no catálogo carregado na loja.
- Endpoint seguro `api/chatgpt-ceo.js` preparado para futura resposta com OpenAI, sem chave no front-end.

## Privacidade

O aviso usado no cadastro é:

> Autorizo o Shopping Impacto360 a registrar meus dados de contato e interesses para atendimento, recomendações de produtos e acompanhamento comercial. Posso solicitar alteração ou remoção dos meus dados.

Regras importantes:

- Não salve telefone, WhatsApp ou e-mail sem autorização.
- Não colete dados sensíveis.
- Não colete documentos, biometria, saúde, religião, política ou informações íntimas.
- Não venda nem compartilhe dados dos clientes com terceiros.
- Permita correção, anonimização, remoção ou retirada da autorização.

## Modo local provisório

Neste momento, o CRM usa `localStorage`.

Isso significa que os dados salvos ficam apenas no navegador administrativo usado no atendimento. Eles não são enviados para o GitHub e não ficam dentro do `index.html` público.

Para uso profissional com vários atendentes, a próxima etapa recomendada é ligar este CRM a um backend seguro com autenticação e banco protegido.

## Variáveis de ambiente

Copie `.env.example` para `.env` somente no servidor ou ambiente privado:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
CHATGPT_CEO_ADMIN_PASSWORD=
FRONTEND_URL=http://localhost:5173
CHATGPT_CEO_CRM_STORAGE_MODE=local
```

Nunca publique `.env` no GitHub.

## Como usar

1. Abra a loja.
2. Clique no botão flutuante **CEO / CRM**.
3. Cadastre ou selecione um cliente.
4. Marque a autorização antes de salvar telefone, WhatsApp ou e-mail.
5. Registre intenção de compra, perguntas, categorias e observações.
6. Use a aba **Recomendações** para ver produtos sugeridos pelo interesse do cliente.
7. Use **Exportar JSON** ou **Exportar CSV** para backup administrativo.

## Arquivos principais

- `integracoes/impacto360-chatgpt-ceo.js`: interface do CRM local e recomendações.
- `integracoes/impacto360-admin-robos.js`: carrega automaticamente o ChatGPT CEO junto da loja.
- `api/chatgpt-ceo.js`: endpoint seguro opcional para integração com OpenAI.
- `.env.example`: modelo de variáveis privadas.

## Segurança

A chave `OPENAI_API_KEY` deve ficar somente no backend/servidor. Não coloque chave real no front-end, em `index.html`, em arquivos públicos ou no GitHub.
