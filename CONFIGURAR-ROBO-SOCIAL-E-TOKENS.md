# Robo Social 360 e Tokens de Recompensa

## O que foi ativado

- Painel administrativo "Robo Social 360" dentro da sala dos agentes.
- Geracao automatica de campanhas para WhatsApp, Instagram, Facebook, TikTok e YouTube Shorts.
- Fila local de divulgacao com limite diario.
- Botao para publicar a proxima campanha via servidor seguro.
- Modo automatico opcional para enviar a fila ao servidor.
- Tokens de recompensa locais para entrada no shopping, favoritos, compartilhamentos e cliques em ofertas.

## Como publicar com seguranca

O GitHub Pages e estatico. Por isso, tokens reais das redes sociais nao ficam no `index.html` nem nos arquivos publicos.

Para ativar o servidor local:

```powershell
copy .env.example .env
npm run robo:social
```

Ou clique duas vezes em:

```text
INICIAR-ROBO-SOCIAL-E-TOKENS.bat
```

Endpoint usado pelo painel:

```text
http://localhost:3000/api/social/publish
```

Status:

```text
http://localhost:3000/health
```

## Integrar com automacao externa

No arquivo `.env`, configure um webhook seguro:

```env
SOCIAL_PUBLISH_WEBHOOK_URL=
SOCIAL_PUBLISH_SECRET=
```

Esse webhook pode ser de um servidor proprio, Make, Zapier, n8n ou outro publicador conectado as APIs oficiais das redes sociais.

Sem webhook, o servidor salva tudo em:

```text
dados/social-publish-log.jsonl
```

Assim a fila fica testavel sem expor credenciais.

## Tokens de recompensa

Os tokens sao pontos locais do navegador do visitante:

- Entrada no shopping: 5 tokens
- Favoritar produto: 3 tokens
- Compartilhar shopping, loja ou produto: 8 tokens
- Abrir oferta de compra: 10 tokens
- Campanha social enviada: 6 tokens

Para transformar esses pontos em saldo real, cupom ou cashback, conecte um backend com login de cliente e banco de dados.
