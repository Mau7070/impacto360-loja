# Implementação premium — 28/07/2026

## Resultado

A primeira evolução aprovada foi implementada sobre o storefront estático existente, preservando o modelo de afiliados e a publicação por GitHub Pages. Não foi criada intermediação de pagamento, autenticação fictícia ou integração não autorizada.

## Entregas

- quarentena automática de imagens compartilhadas entre variações incompatíveis;
- allowlist HTTPS para os domínios parceiros atualmente presentes no catálogo;
- relatório de integridade de publicação em JSON;
- consentimento granular antes de carregar medição ou publicidade;
- política de privacidade, cookies, termos, transparência e como comprar em rotas HTTP 200;
- PWA com manifesto, service worker e atalhos;
- modo claro/escuro;
- central de acessibilidade com texto ampliado, contraste, movimento reduzido e leitura em voz alta quando suportada;
- busca por voz com alternativa textual;
- fluxo assistido por imagem sem upload ou falsa análise visual;
- navegação inferior no celular;
- favoritos, histórico, exportação/limpeza de dados locais e acompanhamento local de preço;
- compartilhamento nativo nas páginas de produto;
- CSP e política de referência em metadados como proteção compatível com hospedagem estática;
- sitemap ampliado e conteúdo inicial com H1 nas novas rotas.

## Integridade do catálogo

O gerador avaliou 2.491 produtos deduplicados e publicou 2.489. Dois produtos foram bloqueados porque compartilhavam a mesma imagem apesar de representarem duchas de 6.800 W e 7.500 W.

O cadastro mestre não foi reescrito. Os itens bloqueados permanecem disponíveis para revisão humana e podem voltar à publicação quando cada variação receber imagem comprovadamente correspondente.

## Validação

- 99 verificações de storefront;
- 26 verificações de busca e filtros;
- 125 verificações automatizadas no total;
- 2.489 páginas de produto existentes para os itens públicos;
- zero IDs duplicados;
- zero links duplicados na projeção pública;
- zero imagens compartilhadas por variações incompatíveis na projeção pública;
- catálogo com aproximadamente 305 KB em gzip;
- páginas legais, manifesto e service worker respondendo HTTP 200;
- validação manual em 320 × 800 e 1440 × 900;
- ausência de rolagem horizontal nas duas larguras;
- controles principais de toque com 44 × 44 px;
- navegação, consentimento, tema, acessibilidade, busca assistida e acompanhamento local exercitados no navegador.

## Limitações e próximos lotes

As proteções implementadas são compatíveis com GitHub Pages. HSTS e demais cabeçalhos HTTP completos exigem configuração na borda, CDN ou migração de hospedagem.

Login por e-mail, passkeys, sincronização, notificações reais de preço, redirecionamento `/go/:offerId`, painel administrativo, RBAC, banco transacional e adaptadores oficiais dependem de backend seguro. Eles não foram simulados no navegador.

A busca por imagem mantém o arquivo somente no dispositivo e usa a descrição textual. Uma futura análise visual deverá ter consentimento, retenção mínima, limitação de tamanho, proteção contra abuso e revisão de correspondências.

Antes da publicação, revisar o diff, validar a hospedagem de homologação e executar verificação pós-deploy dos arquivos estáticos, catálogo, rotas legais e service worker.
