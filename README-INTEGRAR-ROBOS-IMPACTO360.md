# Integrar robos na loja IMPACTO 360

## Arquivo principal

Use este pacote para publicar a loja com o robo integrado:

`IMPACTO360-LOJA-ROBO-ORBIT-INTEGRADO-20260602.zip`

## Comando para adicionar o robo novamente

Se a loja for recriada ou atualizada, rode:

```powershell
powershell -ExecutionPolicy Bypass -File .\INTEGRAR-ROBOS-NA-LOJA.ps1
```

Ou clique duas vezes em:

`INTEGRAR-ROBOS-NA-LOJA.bat`

## Arquivo do robo

`pacote-github-pages-pronto\integracoes\impacto360-robo-orbit.js`

## O que foi incorporado na loja

- Robo flutuante IMPACTO 360.
- Atendimento por chat simples.
- Recomendacao de produto/loja com base nos dados locais.
- Captura de lead com consentimento LGPD.
- Botao para continuar no WhatsApp.
- Central de modulos criados anteriormente.
- Comandos para AFILIADO-ORBIT.
- Comandos para Automacao Afiliado Pessoal 360.
- Comandos para Automacao Afiliado Social 360.

## Importante

A loja publicada no GitHub Pages e estatica. Por isso:

- o robo da loja funciona no navegador;
- leads ficam no localStorage;
- WhatsApp abre manualmente;
- AFILIADO-ORBIT precisa rodar no PC ou servidor;
- automacoes sociais precisam rodar no PC ou servidor;
- tokens e chaves nunca devem ir para o HTML da loja.

## Rodar AFILIADO-ORBIT

```powershell
cd AFILIADO-ORBIT
copy .env.example .env
docker compose -f infra/docker-compose.yml --env-file .env up --build
```

Painel:

`http://localhost:5174`

API:

`http://localhost:8000/docs`

## Rodar Automacao Afiliado Pessoal 360

```powershell
cd automacao-afiliado-pessoal-360
copy .env.example .env
npm install
npm run dev
```

## Rodar Automacao Afiliado Social 360

```powershell
cd automacao-afiliado-social-360
copy .env.example .env
npm install
npm run dev
```

