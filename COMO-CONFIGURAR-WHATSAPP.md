# Como Configurar WhatsApp

## Pelo painel

1. Acesse `/admin/robos`.
2. Digite a senha.
3. Encontre a seção **WhatsApp da loja**.
4. Informe o número com DDD e código do país.

Exemplo:

```text
5531999999999
```

O botão flutuante da loja usará esse número.

## Pela variável de ambiente

Crie ou edite `.env`:

```env
VITE_STORE_WHATSAPP=5531999999999
```

Depois reinicie:

```bash
npm run dev
```

## Regras de segurança

- O botão abre uma conversa manual.
- Não há disparo em massa.
- Não há envio automático sem consentimento.
- A integração com WhatsApp Business API deve ser feita em etapa futura, com autorização oficial.

## Mensagem padrão

O botão envia uma mensagem inicial simples:

```text
Quero receber atendimento da loja IMPACTO 360.
```
