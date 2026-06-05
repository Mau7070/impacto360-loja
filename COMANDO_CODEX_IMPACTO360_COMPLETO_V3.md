# COMANDO PARA CODEX - IMPACTO 360 COMPLETO

Voce e um engenheiro full stack senior, especialista em e-commerce afiliado, UX mobile-first, automacao Windows + Node.js, WhatsApp Business responsavel e arquitetura segura para publicacao de lojas.

Atualize o projeto **Impacto 360** criando ou adaptando os modulos necessarios para transformar o catalogo de produtos em uma vitrine afiliada profissional, responsiva, controlada por painel administrativo e preparada para iniciar automaticamente no Windows.

Este comando consolida as diretrizes do robo enriquecedor, loja mobile, painel admin, WhatsApp inteligente e auto-start Windows. Quando houver comandos ou scripts repetidos, unifique sem remover funcionalidades.

---

## 1. Objetivo central

Ler o arquivo `catalogo_manifesto_original_preservado.json`, abrir os links originais de afiliado do Mercado Livre, importar fotos, descricoes, caracteristicas tecnicas, preco, avaliacao e videos relacionados a cada produto, preservando rigorosamente o link original de afiliado como CTA de compra.

Tambem implementar:

1. Loja mobile-first, com imagem integral do produto, sem corte indevido.
2. Botao publico grande e claro: `ENTRAR NO SHOPPING IMPACTO 360`.
3. Painel administrativo protegido para abrir ou fechar lojas.
4. Campo administrativo para configurar o WhatsApp comercial da loja.
5. Robo de oferta inteligente por busca do cliente, respeitando consentimento, opt-out e limite de uma oferta por dia.
6. Automacao Windows para iniciar o servidor local no logon do usuario e abrir `http://localhost:5173`.

---

## 2. Entrada obrigatoria

Arquivo principal:

```txt
catalogo_manifesto_original_preservado.json
```

Campo critico:

```txt
link_original_preservado
```

---

## 3. Regra inviolavel sobre links de afiliado

Nunca substituir `link_original_preservado` pelo link final resolvido, link canonico, link de loja ou link de produto sem autorizacao expressa do administrador.

O link final resolvido pode ser salvo apenas para auditoria no campo:

```json
"url_final_resolvida": "..."
```

O botao publico de compra/oferta deve usar sempre:

```json
"link_original_preservado"
```

Se o link original for generico, de loja ou inconsistente, registrar o problema, mas nao apagar o link original.

---

## 4. Stack obrigatoria

- Node.js LTS.
- React + Vite, respeitando o `package.json` ja existente.
- Playwright com Chromium para enriquecimento do catalogo.
- JSON, CSV e HTML como saidas iniciais.
- Banco local simples em JSON ou SQLite para loja, contatos, consentimentos e historico de ofertas.
- CSS responsivo mobile-first.
- Pasta local `saida`.
- Logs claros por produto, loja, contato e disparo de oferta.
- Rate limit de coleta: 1 produto por vez, intervalo aleatorio de 2 a 5 segundos.
- Retentativa com backoff em caso de erro.

---

## 5. Coleta por produto

Para cada item do manifesto:

1. Abrir `link_original_preservado` com Playwright.
2. Aguardar `domcontentloaded` e estabilizacao de rede.
3. Capturar, quando disponivel:
   - titulo real do anuncio ou catalogo;
   - URL final resolvida;
   - preco;
   - avaliacao;
   - numero de opinioes;
   - vendedor;
   - descricao do anuncio;
   - bullets de "O que voce precisa saber sobre este produto";
   - tabela de caracteristicas tecnicas;
   - imagens principais do produto;
   - videos detectados por `<video>`, `<iframe>`, YouTube, player interno ou galeria;
   - disponibilidade/estoque textual;
   - data e hora da coleta.
4. Baixar imagens em `saida/fotos/{codigo}/`.
5. Nao baixar videos protegidos. Salvar apenas URL, thumbnail e origem quando detectados.
6. Caso nao encontre video, registrar:

```json
"sem_video_no_anuncio": true
```

---

## 6. Validacao e auditoria

Marcar cada produto com os seguintes status:

- `ok_publicacao`: link individual, titulo compativel e pelo menos 1 imagem capturada.
- `revisar_titulo`: titulo do arquivo diverge do titulo real.
- `link_generico`: link leva a loja/lista e nao a produto individual.
- `sem_foto`: nenhuma imagem capturada.
- `sem_video_no_anuncio`: nenhum video detectavel.
- `erro_coleta`: pagina nao abriu ou falhou.
- `precisa_revisao_humana`: qualquer divergencia critica antes de publicar.

Gerar relatorio de inconsistencias com prioridade alta, media e baixa.

---

## 7. Vitrine mobile-first

Criar `saida/vitrine_afiliado_impacto360.html` e/ou integrar a vitrine ao React/Vite existente.

Requisitos:

- Layout mobile-first.
- Cards em uma coluna no celular e grade adaptativa em telas maiores.
- Cabecalho fixo leve com nome `Shopping Impacto 360`.
- Botao grande no topo: `ENTRAR NO SHOPPING IMPACTO 360`.
- Campo de busca visivel logo no inicio.
- Filtros simples e recolhiveis.
- Imagem principal sempre inteira, sem corte.
- Usar `object-fit: contain`, fundo neutro, proporcao fixa e carregamento rapido.
- Usar `loading="lazy"` nas imagens.
- Centralizar imagens pequenas e preservar proporcao.

CSS minimo para imagem integral:

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

Cada card deve conter:

- imagem principal;
- marca;
- nome real do produto;
- preco;
- avaliacao;
- selos como 5G, Apple, Samsung, Motorola, Oferta, Mais vendido e Revisar;
- resumo tecnico curto;
- botao `Ver oferta` usando `link_original_preservado`;
- botao `Detalhes` com modal;
- botao WhatsApp quando o numero estiver configurado pelo administrador.

O modal deve mostrar descricao completa, ficha tecnica, fotos extras, videos detectados, aviso quando nao houver video, link original preservado, status de auditoria e botao `Comprar pelo link original`.

---

## 8. Controle administrativo para abrir/fechar lojas

Criar painel `/admin` protegido por autenticacao simples inicialmente, com possibilidade de evolucao para login robusto.

Toda loja nova deve nascer com:

```json
"status_publicacao": "fechada"
```

Enquanto a loja estiver fechada:

- o publico nao deve ver loja vazia;
- produtos incompletos nao devem aparecer;
- a vitrine deve mostrar mensagem institucional, como `Loja em preparacao`.

No painel `/admin`, criar botoes:

- `Adicionar produto`
- `Importar produtos do catalogo`
- `Revisar pendencias`
- `Abrir loja ao publico`
- `Fechar loja temporariamente`
- `Configurar WhatsApp`
- `Pre-visualizar como publico`
- `Salvar alteracoes`

O botao `Abrir loja ao publico` deve aparecer somente para administrador autenticado, nunca para visitantes comuns.

Criar arquivo ou tabela `lojas` com:

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

## 9. WhatsApp comercial da loja

Criar campo administrativo `WhatsApp da loja`.

Regras:

- aceitar numero com DDI e DDD;
- validar formato;
- salvar na configuracao da loja;
- exibir botao publico somente quando houver numero configurado;
- gerar link `https://wa.me/` com mensagem contextual;
- nunca expor ferramentas administrativas ao publico.

Mensagem padrao:

```txt
Ola! Vi este produto no Shopping Impacto 360 e gostaria de mais informacoes: {nome_produto}
```

---

## 10. Robo de oferta inteligente por busca

Criar modulo:

```txt
robo-oferta-inteligente-whatsapp
```

O robo deve registrar intencoes de busca e relaciona-las a contatos/clientes que autorizaram receber ofertas. Deve selecionar uma oferta compativel e enviar, no maximo, uma oferta por dia para cada cliente.

Contato minimo:

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
- enviar oferta para quem nao autorizou;
- enviar para contatos com `opt_out: true`;
- enviar mais de uma oferta por dia para o mesmo cliente;
- disparar mensagens genericas em massa sem segmentacao;
- burlar limites do WhatsApp ou automatizar WhatsApp Web de forma irregular.

Registrar eventos em `eventos_busca`:

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

Criar funcao:

```js
selecionarMelhorOfertaParaCliente(cliente, produtos, eventosBusca)
```

Retorno:

```json
{
  "cliente_id": "",
  "produto_id": "",
  "motivo": "Cliente buscou iPhone e este produto corresponde a preferencia Apple",
  "link_original_preservado": "",
  "mensagem_sugerida": ""
}
```

Antes de enviar, verificar:

```js
podeEnviarOfertaHoje(cliente)
```

Bloquear envio se:

- `ultimo_envio_oferta` for hoje;
- `opt_out` for true;
- `consentimento_marketing` nao for true;
- nao houver produto com status `ok_publicacao`;
- nao houver link original preservado valido para a oferta.

---

## 11. WhatsApp: API e fallback seguro

Preparar integracao com WhatsApp Business Cloud API por variaveis de ambiente:

```env
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
```

Enviar somente templates aprovados quando necessario e registrar status do envio.

Quando a API nao estiver configurada, gerar apenas link manual:

```txt
https://wa.me/{telefone}?text={mensagem_codificada}
```

Nesse modo, nao fazer disparo automatico em massa. Criar fila para revisao do administrador.

Mensagem de oferta:

```txt
Ola, {nome}. Vi que voce demonstrou interesse em {categoria}. Separei uma oferta que pode combinar com sua busca: {produto}. Veja aqui: {link_original_preservado}

Caso nao queira receber ofertas, responda SAIR.
```

Se o cliente responder ou for marcado como `SAIR`, atualizar:

```json
"opt_out": true
```

---

## 12. Painel de contatos e ofertas

No `/admin`, criar area `Contatos e Ofertas Inteligentes` com:

- cadastrar contato autorizado;
- importar contatos apenas com confirmacao de consentimento;
- ver preferencias por busca;
- ver ultima oferta enviada;
- bloquear cliente por opt-out;
- revisar fila de ofertas do dia;
- enviar oferta manualmente;
- ativar/desativar robo;
- exportar relatorio.

Relatorios obrigatorios:

- `saida/relatorio_ofertas_dia.json`
- `saida/relatorio_contatos_sem_consentimento.json`
- `saida/relatorio_opt_out.json`
- `saida/relatorio_conversoes_afiliado.csv`

---

## 13. Auto-start Windows

Criar automacao profissional para Windows 10 e Windows 11 usando Agendador de Tarefas.

Regras:

- Executar no logon do usuario atual, nao apenas na inicializacao bruta do sistema.
- Usar atraso de 30 segundos apos o logon.
- Iniciar o servidor com:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

- Abrir o navegador em:

```txt
http://localhost:5173
```

- Usar sempre a porta 5173.
- Nao alterar `package.json` sem necessidade.
- Nao remover robos existentes.
- Nao apagar arquivos do projeto.
- Nao exigir login em Mercado Livre, WhatsApp ou plataforma externa.

Criar estes arquivos na raiz do projeto:

1. `INICIAR-IMPACTO360-AUTOMATICO.ps1`
2. `INSTALAR-AUTO-START-IMPACTO360.ps1`
3. `REMOVER-AUTO-START-IMPACTO360.ps1`
4. `VERIFICAR-STATUS-IMPACTO360.ps1`
5. `INSTALAR-AUTO-START-IMPACTO360.bat`
6. `INICIAR-AGORA-IMPACTO360.bat`
7. `REMOVER-AUTO-START-IMPACTO360.bat`
8. `VERIFICAR-STATUS-IMPACTO360.bat`

Funcoes esperadas:

- `INICIAR-IMPACTO360-AUTOMATICO.ps1`: detectar a pasta do projeto, verificar Node.js/npm, instalar dependencias se `node_modules` nao existir, liberar a porta 5173 apenas quando estiver ocupada por Node/Vite antigo, iniciar servidor, salvar logs e abrir navegador.
- `INSTALAR-AUTO-START-IMPACTO360.ps1`: criar tarefa `Impacto360 - Iniciar Servidor dos Robos` no logon do usuario, com atraso de 30 segundos, recriando se ja existir.
- `REMOVER-AUTO-START-IMPACTO360.ps1`: remover a tarefa agendada.
- `VERIFICAR-STATUS-IMPACTO360.ps1`: verificar tarefa, porta 5173, processo Node e resposta de `http://localhost:5173`, exibindo diagnostico `ATIVO`, `DESLIGADO`, `ERRO`, `NODE NAO INSTALADO` ou `PORTA OCUPADA`.
- Arquivos `.bat`: permitir duplo clique para instalar, iniciar agora, remover e verificar status.

---

## 14. Saidas obrigatorias

Gerar/atualizar:

- `saida/catalogo_enriquecido.json`
- `saida/catalogo_enriquecido.csv`
- `saida/vitrine_afiliado_impacto360.html`
- `saida/relatorio_inconsistencias.json`
- `saida/relatorio_execucao.md`
- `saida/lojas_config.json`
- `saida/contatos_marketing.json`
- `saida/eventos_busca.json`
- `saida/fila_ofertas_whatsapp.json`
- `saida/relatorio_ofertas_dia.json`
- `saida/relatorio_contatos_sem_consentimento.json`
- `saida/relatorio_opt_out.json`
- `saida/relatorio_conversoes_afiliado.csv`

---

## 15. Scripts do package.json

Adicionar ao `package.json`, sem quebrar scripts existentes:

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

## 16. Comandos unificados de uso

Instalar dependencias:

```bash
npm install
npx playwright install chromium
```

Enriquecer catalogo:

```bash
npm run enriquecer:catalogo
```

Gerar fila de ofertas:

```bash
npm run ofertas:gerar
```

Enviar ofertas autorizadas:

```bash
npm run ofertas:enviar
```

Iniciar loja local:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Instalar auto-start no Windows:

```bat
INSTALAR-AUTO-START-IMPACTO360.bat
```

Iniciar manualmente:

```bat
INICIAR-AGORA-IMPACTO360.bat
```

Verificar status:

```bat
VERIFICAR-STATUS-IMPACTO360.bat
```

Remover auto-start:

```bat
REMOVER-AUTO-START-IMPACTO360.bat
```

Abrir no navegador:

```txt
http://localhost:5173
```

---

## 17. Criterio de aceite

A entrega so sera considerada pronta se:

1. A loja abrir bem no celular.
2. As imagens dos produtos aparecerem inteiras, sem cortes indevidos.
3. O botao `Entrar no Shopping Impacto 360` estiver claro e facil de tocar.
4. Lojas fechadas nao mostrarem vitrine vazia ao publico.
5. O botao `Abrir loja ao publico` aparecer somente no painel administrativo.
6. O WhatsApp puder ser configurado pelo administrador.
7. O robo de ofertas respeitar consentimento, opt-out e limite de uma oferta por dia.
8. O link de compra continuar usando sempre `link_original_preservado`.
9. O sistema gerar relatorios de auditoria, inconsistencias e ofertas.
10. Nenhum dado ausente for inventado.
11. O auto-start iniciar o servidor no logon do usuario e abrir `http://localhost:5173`.
12. O status mostrar diagnostico claro para tarefa, porta, Node e URL local.

