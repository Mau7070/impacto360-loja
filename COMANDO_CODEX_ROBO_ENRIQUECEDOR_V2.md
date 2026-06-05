# COMANDO PARA CODEX — ROBÔ ENRIQUECEDOR + LOJA MOBILE + PAINEL ADMIN + WHATSAPP INTELIGENTE

Você é um engenheiro full stack sênior, especialista em e-commerce afiliado, UX mobile-first, automação responsável de WhatsApp Business e arquitetura segura para publicação de lojas. Atualize o projeto **Impacto 360** criando ou adaptando o módulo `robo-enriquecedor-catalogo` para transformar o catálogo de produtos em uma vitrine afiliada profissional, responsiva e controlada por painel administrativo.

---

## 1. Objetivo central

Ler o arquivo `catalogo_manifesto_original_preservado.json`, abrir os links originais de afiliado do Mercado Livre, importar fotos, descrições, características técnicas, preço, avaliação e vídeos relacionados a cada produto, preservando rigorosamente o link original de afiliado como CTA de compra.

Além disso, implementar:

1. Loja totalmente adaptada para **telemóvel/celular**, com imagem integral do produto, sem corte indevido.
2. Botão público grande, claro e fácil de visualizar para **“Entrar no Shopping Impacto 360”**.
3. Painel administrativo com botão visível somente para o administrador e oculto ao público para **abrir ou fechar lojas** após inserção e revisão dos produtos.
4. Campo administrativo para inserir/alterar o WhatsApp comercial da loja.
5. Robô de ação imediata para relacionar a busca do cliente com produtos e contatos consentidos, gerando oferta relevante no máximo uma vez por dia para cada cliente.

---

## 2. Entrada obrigatória

Arquivo principal:

```txt
catalogo_manifesto_original_preservado.json
```

Campo crítico:

```txt
link_original_preservado
```

---

## 3. Regra inviolável sobre links de afiliado

Nunca substituir `link_original_preservado` pelo link final resolvido, link canônico, link de loja ou link de produto sem autorização expressa do administrador.

O link final resolvido pode ser salvo apenas para auditoria no campo:

```json
"url_final_resolvida": "..."
```

O botão público de compra/oferta deve usar sempre:

```json
"link_original_preservado"
```

Se o link original for genérico, de loja ou inconsistente, registrar o problema, mas não apagar o link original.

---

## 4. Stack técnica obrigatória

- Node.js LTS
- React + Vite, respeitando o `package.json` já existente do projeto
- Playwright com Chromium para enriquecimento do catálogo
- JSON, CSV e HTML como saída inicial
- Banco local simples em JSON ou SQLite para estado da loja, contatos, consentimentos e histórico de ofertas
- CSS responsivo mobile-first
- Pasta local `/saida`
- Logs claros por produto, por loja, por contato e por disparo de oferta
- Rate limit de coleta: 1 produto por vez, intervalo aleatório de 2 a 5 segundos
- Retentativa com backoff em caso de erro

---

## 5. Coleta por produto

Para cada item do manifesto:

1. Abrir `link_original_preservado` com Playwright.
2. Aguardar `domcontentloaded` e estabilização de rede.
3. Capturar, quando disponível:
   - título real do anúncio ou catálogo;
   - URL final resolvida;
   - preço;
   - avaliação;
   - número de opiniões;
   - vendedor;
   - descrição do anúncio;
   - bullets de “O que você precisa saber sobre este produto”;
   - tabela de características técnicas;
   - imagens principais do produto;
   - vídeos detectados por `<video>`, `<iframe>`, YouTube, player interno ou galeria;
   - disponibilidade/estoque textual;
   - data e hora da coleta.
4. Baixar imagens em:

```txt
saida/fotos/{codigo}/
```

5. Não baixar vídeos protegidos. Salvar apenas URL, thumbnail e origem quando detectados.
6. Caso não encontre vídeo, registrar explicitamente:

```json
"sem_video_no_anuncio": true
```

---

## 6. Validação e auditoria

Marcar cada produto com os seguintes status:

- `ok_publicacao`: link individual, título compatível e pelo menos 1 imagem capturada.
- `revisar_titulo`: título do arquivo diverge do título real.
- `link_generico`: link leva a loja/lista e não a produto individual.
- `sem_foto`: nenhuma imagem capturada.
- `sem_video_no_anuncio`: nenhum vídeo detectável.
- `erro_coleta`: página não abriu ou falhou.
- `precisa_revisao_humana`: qualquer divergência crítica antes de publicar.

Gerar relatório de inconsistências com prioridade alta, média e baixa.

---

## 7. Vitrine HTML mobile-first

Criar `saida/vitrine_afiliado_impacto360.html` e/ou integrar a vitrine ao React/Vite existente.

### 7.1. Requisitos visuais no telemóvel/celular

A loja deve abrir perfeitamente em telemóveis/celulares:

- Layout mobile-first.
- Cards em uma coluna no celular e grade adaptativa em telas maiores.
- Cabeçalho fixo leve com nome **Shopping Impacto 360**.
- Botão grande no topo: **“Entrar no Shopping Impacto 360”**.
- Botão flutuante opcional: **“Ver lojas”**.
- Campo de busca visível logo no início.
- Filtros simples e recolhíveis.
- Imagem principal do produto sempre inteira, sem cortar partes importantes.
- Usar `object-fit: contain`, fundo neutro, proporção fixa e carregamento rápido.
- Usar `loading="lazy"` nas imagens.
- Evitar imagens estouradas, distorcidas ou cortadas.
- Quando a imagem capturada for pequena, centralizar e preservar proporção.

CSS mínimo esperado para imagem integral:

```css
.product-image-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f7f7;
  border-radius: 16px;
  overflow: hidden;
}

.product-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}
```

### 7.2. Cards dos produtos

Cada card deve conter:

- imagem principal;
- marca;
- nome real do produto;
- preço;
- avaliação;
- selos como 5G, Apple, Samsung, Motorola, Oferta, Mais vendido, Revisar;
- resumo técnico curto;
- botão **“Ver oferta”** usando `link_original_preservado`;
- botão **“Detalhes”** com modal;
- botão WhatsApp quando o número estiver configurado pelo administrador.

### 7.3. Modal de detalhes

O modal deve mostrar:

- descrição completa;
- ficha técnica;
- fotos extras;
- vídeos detectados;
- aviso quando não houver vídeo;
- link original preservado;
- status de auditoria;
- botão “Comprar pelo link original”.

---

## 8. Botão público “Entrar no Shopping”

Adicionar um botão visível, chamativo e simples:

```txt
ENTRAR NO SHOPPING IMPACTO 360
```

Função:

- direcionar para a página principal de lojas/categorias;
- ficar no topo da vitrine e também em posição de destaque na tela inicial;
- no celular, ocupar largura confortável e ser fácil de tocar;
- usar texto claro, sem poluição visual.

Exemplo de rota:

```txt
/shopping
```

---

## 9. Controle administrativo para abrir/fechar lojas

Criar um painel administrativo protegido por autenticação simples inicialmente, com possibilidade de evolução para login robusto.

### 9.1. Regra de publicação

Toda loja nova deve nascer com:

```json
"status_publicacao": "fechada"
```

Enquanto a loja estiver fechada:

- o público não deve ver a loja vazia;
- produtos incompletos não devem aparecer;
- a vitrine deve mostrar mensagem institucional, por exemplo: “Loja em preparação”.

Após o administrador inserir e revisar produtos, deve haver botão administrativo:

```txt
ABRIR LOJA AO PÚBLICO
```

Esse botão deve ser:

- visível somente para o administrador;
- oculto para visitantes comuns;
- protegido por autenticação;
- registrado em log quando acionado.

Também deve existir:

```txt
FECHAR LOJA TEMPORARIAMENTE
```

para manutenção.

### 9.2. Botões administrativos obrigatórios

No painel `/admin`:

- “Adicionar produto”
- “Importar produtos do catálogo”
- “Revisar pendências”
- “Abrir loja ao público”
- “Fechar loja temporariamente”
- “Configurar WhatsApp”
- “Pré-visualizar como público”
- “Salvar alterações”

### 9.3. Estado da loja

Criar arquivo ou tabela `lojas` com campos:

```json
{
  "id": "celulares",
  "nome": "Celulares Impacto 360",
  "status_publicacao": "fechada",
  "whatsapp_comercial": "",
  "admin_pode_publicar": true,
  "publicada_em": null,
  "ultima_atualizacao": null
}
```

---

## 10. WhatsApp comercial da loja

Criar campo administrativo:

```txt
WhatsApp da loja
```

Regras:

- aceitar número com DDI e DDD;
- validar formato;
- salvar em configuração da loja;
- exibir botão público somente quando houver número configurado;
- gerar link `https://wa.me/` com mensagem contextual.

Mensagem padrão do botão WhatsApp:

```txt
Olá! Vi este produto no Shopping Impacto 360 e gostaria de mais informações: {nome_produto}
```

Nunca expor ferramentas administrativas ao público.

---

## 11. Robô de ação imediata por busca do cliente

Criar módulo chamado:

```txt
robo-oferta-inteligente-whatsapp
```

Objetivo: quando um visitante pesquisar por produto, marca, faixa de preço ou categoria, o sistema deve registrar a intenção de busca e relacioná-la a contatos/clientes que autorizaram receber ofertas. O robô deve selecionar uma oferta compatível e enviar, no máximo, **uma oferta por dia para cada cliente**.

### 11.1. Regras obrigatórias de conformidade

O robô só pode enviar mensagem para contatos com consentimento registrado.

Campos mínimos do contato:

```json
{
  "id": "cliente_001",
  "nome": "",
  "telefone_whatsapp": "",
  "consentimento_marketing": true,
  "origem_consentimento": "formulario_loja|whatsapp|compra|importacao_manual_autorizada",
  "data_consentimento": "",
  "preferencias": ["Samsung", "iPhone", "Motorola", "5G"],
  "faixa_preco_interesse": "",
  "ultimo_envio_oferta": null,
  "opt_out": false
}
```

Proibido:

- raspar contatos da internet;
- enviar oferta para quem não autorizou;
- enviar para contatos marcados como `opt_out: true`;
- enviar mais de uma oferta por dia para o mesmo cliente;
- disparar mensagens genéricas em massa sem segmentação;
- burlar limites do WhatsApp ou automatizar WhatsApp Web de forma irregular.

### 11.2. Gatilhos de busca

Registrar eventos quando o cliente:

- buscar por “Samsung”, “iPhone”, “Motorola”, “5G”, “barato”, “256GB”, etc.;
- abrir detalhes de um produto;
- clicar em “Ver oferta”;
- clicar no botão WhatsApp;
- favoritar ou comparar produto, se essa função existir.

Tabela/arquivo `eventos_busca`:

```json
{
  "cliente_id": "anonimo_ou_identificado",
  "termo_busca": "iPhone 15",
  "categoria_detectada": "Apple",
  "faixa_preco_detectada": "premium",
  "produto_visualizado": "Apple iPhone 15",
  "data_evento": ""
}
```

### 11.3. Seleção inteligente da oferta

O robô deve pontuar produtos com base em:

- compatibilidade com termo buscado;
- marca preferida do cliente;
- faixa de preço;
- produto com `ok_publicacao`;
- disponibilidade capturada;
- avaliação;
- presença de imagem;
- link original preservado;
- não repetir a mesma oferta para o mesmo cliente em curto prazo.

Criar função:

```js
selecionarMelhorOfertaParaCliente(cliente, produtos, eventosBusca)
```

Retornar:

```json
{
  "cliente_id": "",
  "produto_id": "",
  "motivo": "Cliente buscou iPhone e este produto corresponde à preferência Apple",
  "link_original_preservado": "",
  "mensagem_sugerida": ""
}
```

### 11.4. Limite de uma oferta por dia

Antes de enviar, verificar:

```js
podeEnviarOfertaHoje(cliente)
```

Regras:

- se `ultimo_envio_oferta` for hoje, não enviar;
- se `opt_out` for true, não enviar;
- se `consentimento_marketing` não for true, não enviar;
- se não houver produto com status `ok_publicacao`, não enviar;
- registrar motivo de bloqueio no log.

### 11.5. Envio por WhatsApp

Implementar duas camadas:

#### Camada A — WhatsApp Business Cloud API

Preparar integração por variáveis de ambiente:

```env
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
```

Enviar somente templates aprovados quando necessário. Registrar status do envio.

#### Camada B — Fallback seguro com link manual

Quando a API não estiver configurada, gerar link manual:

```txt
https://wa.me/{telefone}?text={mensagem_codificada}
```

Nesse modo, não fazer disparo automático em massa; apenas criar fila para revisão do administrador.

### 11.6. Mensagem de oferta

A mensagem deve ser curta, útil e personalizada:

```txt
Olá, {nome}. Vi que você demonstrou interesse em {categoria}. Separei uma oferta que pode combinar com sua busca: {produto}. Veja aqui: {link_original_preservado}

Caso não queira receber ofertas, responda SAIR.
```

Se o cliente responder ou for marcado como “SAIR”, atualizar:

```json
"opt_out": true
```

---

## 12. Painel de contatos e ofertas

No `/admin`, criar área:

```txt
Contatos e Ofertas Inteligentes
```

Com funções:

- cadastrar contato autorizado;
- importar contatos apenas com confirmação de consentimento;
- ver preferências por busca;
- ver última oferta enviada;
- bloquear cliente por opt-out;
- revisar fila de ofertas do dia;
- enviar oferta manualmente;
- ativar/desativar robô;
- exportar relatório.

Relatórios obrigatórios:

- `saida/relatorio_ofertas_dia.json`
- `saida/relatorio_contatos_sem_consentimento.json`
- `saida/relatorio_opt_out.json`
- `saida/relatorio_conversoes_afiliado.csv`

---

## 13. Segurança, privacidade e ética operacional

Implementar:

- autenticação no `/admin`;
- nunca mostrar botão administrativo ao público;
- logs de abertura/fechamento de loja;
- logs de alteração de WhatsApp;
- logs de consentimento e opt-out;
- limite diário por contato;
- proteção contra envio duplicado;
- opção de desativar robô de ofertas;
- aviso de loja em manutenção quando fechada;
- não inventar preço, foto, descrição ou vídeo;
- não mascarar link de afiliado;
- respeitar termos das plataformas usadas.

---

## 14. Saídas obrigatórias

Gerar/atualizar:

1. `saida/catalogo_enriquecido.json`
2. `saida/catalogo_enriquecido.csv`
3. `saida/vitrine_afiliado_impacto360.html`
4. `saida/relatorio_inconsistencias.json`
5. `saida/relatorio_execucao.md`
6. `saida/lojas_config.json`
7. `saida/contatos_marketing.json`
8. `saida/eventos_busca.json`
9. `saida/fila_ofertas_whatsapp.json`
10. `saida/relatorio_ofertas_dia.json`

---

## 15. Scripts de execução

Adicionar ao `package.json`, sem quebrar os scripts existentes:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "enriquecer:catalogo": "node robot_enriquecedor_catalogo.mjs --input catalogo_manifesto_original_preservado.json --out saida",
    "ofertas:gerar": "node robo_oferta_inteligente_whatsapp.mjs --modo gerar-fila --out saida",
    "ofertas:enviar": "node robo_oferta_inteligente_whatsapp.mjs --modo enviar --out saida"
  }
}
```

---

## 16. Comandos esperados

Instalar dependências:

```bash
npm install
npx playwright install chromium
```

Enriquecer catálogo:

```bash
npm run enriquecer:catalogo
```

Gerar fila de ofertas:

```bash
npm run ofertas:gerar
```

Enviar ofertas autorizadas, respeitando limite de uma por dia:

```bash
npm run ofertas:enviar
```

Iniciar loja local:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Abrir no navegador:

```txt
http://localhost:5173
```

---

## 17. Critério de aceite

A entrega só será considerada pronta se:

1. A loja abrir bem no telemóvel/celular.
2. As imagens dos produtos aparecerem inteiras, sem cortes indevidos.
3. O botão “Entrar no Shopping Impacto 360” estiver claro e fácil de tocar.
4. Lojas fechadas não mostrarem vitrine vazia ao público.
5. O botão “Abrir loja ao público” aparecer somente no painel administrativo.
6. O WhatsApp puder ser configurado pelo administrador.
7. O robô de ofertas respeitar consentimento, opt-out e limite de uma oferta por dia.
8. O link de compra continuar usando sempre `link_original_preservado`.
9. O sistema gerar relatórios de auditoria, inconsistências e ofertas.
10. Nenhum dado ausente for inventado.

