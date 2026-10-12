# Avaliações, curtidas e vendas

Os cards e fichas compartilham assets/product-engagement.js e CSS isolado. Favoritos e curtidas são ações distintas. Notas de 1 a 5 podem ser alteradas/removidas. Quando o serviço está desativado, a interface identifica votos como locais e não os apresenta como totais públicos.

O serviço do banco é https://impacto360-engajamento.mauricio3010.chatgpt.site e permanece privado até autorização para acesso público aos visitantes do shopping. Depois da alteração de audiência, definir enabled=true em dados/engajamento-config.json. A administração de vendas exige autenticação do proprietário mesmo com o serviço público.

O banco possui chave composta produto/visitante, grava o estado desejado e não soma requisições repetidas. O identificador aleatório do navegador é armazenado como hash no servidor. Há limite de escrita por minuto. Isso reduz duplicação comum, mas não prova identidade: limpar armazenamento ou usar outro navegador permite nova interação.

POST /api/engagement registra curtida ou nota. GET /api/engagement?ids=... retorna totais. POST /api/sales, exclusivo do proprietário autenticado, importa totais confirmados com produto, quantidade, fonte, URL e data. Quantidade de vendas nunca é inferida de cliques, curtidas ou visitas.

Vendas em partner_units aparecem como vendidos no parceiro. affiliate_confirmed aparece como vendas confirmadas atribuídas à Impacto360. Sem dados comprovados ou depois de 30 dias sem nova conferência, não há alegação de vendas. O JSON estático dados/engajamento-publico.json também aceita esses totais documentados.

O workflow publicar-loja.yml gera fichas completas e publica o pacote no GitHub Pages. Isso mantém a implantação reproduzível sem versionar milhares de fichas regeneradas a cada ajuste. O domínio, catálogo, fotos, links de afiliados e layout principal são preservados.
