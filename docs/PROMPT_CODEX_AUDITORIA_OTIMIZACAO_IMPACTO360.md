PROMPT MESTRE PARA O CODEX

Auditoria, correção e otimização da loja Impacto360 Afiliado

Versão atualizada com redução estratégica de lojas e imagens de capa

Preparado para copiar e executar no ambiente do Codex

24 de julho de 2026

Decisão recomendada sobre lojas e imagens de capa

A orientação foi incorporada ao prompt abaixo, com a regra de preservar todos os parceiros no sistema e reduzir apenas a poluição visual e a exposição excessiva.

Como utilizar este documento

1. Abra o repositório da Impacto360 no Codex.
2. Crie uma branch de trabalho antes de alterar o projeto.
3. Cole todo o conteúdo da seção PROMPT MESTRE no Codex.
4. Solicite que o Codex execute primeiro a auditoria e apresente o mapa da arquitetura.
5. Não publique alterações até receber o relatório dos testes.

PROMPT MESTRE — AUDITORIA, CORREÇÃO E OTIMIZAÇÃO DA IMPACTO360 AFILIADO

Atue como engenheiro de software sênior, especialista em comércio eletrônico, plataformas de afiliados, SEO técnico, UX/UI, acessibilidade, segurança, desempenho web e rastreamento de conversões.

Você está trabalhando no repositório da loja Impacto360 Afiliado, publicada no domínio impacto360afiliado.com.br.

Sua missão é auditar, corrigir e melhorar a loja completa, priorizando funcionamento, confiança, experiência mobile, integridade dos produtos, SEO, rastreamento e conversão.

REGRA PRINCIPAL

Não faça uma reconstrução desnecessária e não altere a identidade visual de maneira aleatória.

Preserve:

- tecnologias e arquitetura existentes, quando estiverem adequadas;
- banco de dados;
- produtos já cadastrados;
- links de afiliado;
- integrações existentes;
- identidade visual;
- logotipo;
- domínio;
- funcionalidades válidas;
- configurações de produção;
- variáveis de ambiente;
- dados de usuários;
- histórico da aplicação.

Não exclua arquivos, produtos, tabelas, integrações ou funcionalidades sem comprovar que estão obsoletos e sem criar uma alternativa segura.

Antes de modificar qualquer arquivo, examine todo o projeto.

1. PROCEDIMENTO OBRIGATÓRIO ANTES DAS ALTERAÇÕES

Execute primeiro as seguintes etapas:

1. Identifique a stack utilizada: framework, linguagem, gerenciador de pacotes, banco de dados, ORM, hospedagem, autenticação, APIs, CMS, serviços externos, bibliotecas de interface, analytics e integrações de afiliados.
2. Analise package.json, configurações, rotas, componentes, modelos do banco, migrations, serviços, APIs, middlewares, ambiente, importação de produtos, busca, favoritos, geração de links, rastreamento de cliques, páginas legais, SEO e deploy.
3. Crie uma branch de trabalho ou um ponto seguro de restauração.
4. Registre o estado atual: build, testes, TypeScript, lint, rotas quebradas, 404, console, rede, hidratação, desempenho e mobile.
5. Antes de mudanças grandes, apresente internamente um mapa da arquitetura e dos riscos.
6. Faça mudanças incrementais.

2. PROBLEMAS PRIORITÁRIOS A INVESTIGAR

Na auditoria pública, foram observados indícios dos seguintes problemas:

- páginas de categorias apresentando conteúdo básico repetido;
- busca sem produtos visíveis no HTML indexável;
- ofertas, lojas e favoritos repetindo a página inicial;
- Como comprar aparentemente retornando à página inicial;
- Política de Privacidade e Termos de Uso retornando 404;
- possível dependência excessiva de renderização no navegador;
- títulos diferentes nas rotas, mas conteúdo principal repetido;
- possível falha de roteamento ou fallback;
- e-mail do rodapé com domínio diferente do site.

Confirme cada problema diretamente no código e em execução local.

3. CORRIGIR O SISTEMA DE ROTAS

Revise todas as rotas públicas: início, ofertas, busca, favoritos, lojas, como comprar, contato, política de privacidade, termos, aviso de afiliado, categorias, produtos, lojas, guias, comparações e 404.

Cada rota deve retornar o status correto, conteúdo próprio, H1 e metadados próprios, dados correspondentes, acesso direto, atualização do navegador, menu, mobile, estado vazio e tratamento de erro. Não use a página inicial como fallback para URLs inexistentes.

4. RENDERIZAÇÃO E INDEXAÇÃO DOS PRODUTOS

Investigue se os produtos são carregados apenas no cliente. Garanta conteúdo interpretável por buscadores e tecnologias assistivas, utilizando SSR, SSG, ISR, pré-renderização ou solução equivalente compatível.

Cada categoria deve apresentar no HTML inicial nome, introdução, quantidade, produtos, nomes, imagens com alt, preços atualizados, loja parceira, links internos e paginação rastreável.

5. REPOSICIONAMENTO DA PÁGINA INICIAL

Posicionamento principal:

Impacto360 — Compare produtos, encontre boas ofertas e compre em lojas confiáveis.

Prioridades:
1. Casa, cozinha e eletroportáteis;
2. Tecnologia com bom custo-benefício;
3. Moda, calçados e artigos esportivos;
4. Ferramentas;
5. Guias e comparações;
6. Ofertas verificadas.

Serviços digitais devem ficar em seção ou rota separada.

Hero:
Título: Encontre o produto certo sem perder horas pesquisando
Descrição: Compare opções para casa, tecnologia e vida prática e compre diretamente em lojas parceiras confiáveis.
Botões: Ver produtos para casa; Ver tecnologia; Ver moda e calçados; Conferir ofertas.

6. ORGANIZAÇÃO DA PÁGINA INICIAL

Ordem recomendada: hero; compre pelo que você precisa; categorias principais; ofertas verificadas; mais procurados; guias e comparações; como funciona; transparência.

7. REDUÇÃO ESTRATÉGICA DAS LOJAS E IMAGENS DE CAPA

O excesso de lojas e imagens grandes de capa prejudica foco, velocidade e clareza. Corrija sem apagar parceiros, produtos ou links legítimos.

Regras:
- preservar todas as lojas no banco;
- exibir apenas 5 a 8 lojas prioritárias na página inicial;
- manter as demais em Todas as lojas;
- escolher destaques por confiabilidade, disponibilidade, cliques, conversões e comissões aprovadas;
- substituir capas grandes por cards compactos com logotipo, nome e categorias;
- usar capa grande apenas em página exclusiva ou campanha especial;
- priorizar produtos, categorias, ofertas e comparações;
- não apagar imagens originais antes de confirmar que não são utilizadas;
- otimizar imagens com WebP/AVIF, dimensões adequadas e lazy loading;
- criar configuração administrativa para ativar ou desativar destaque da loja;
- limitar carrosséis para não comprometer desempenho e acessibilidade.

8. MENU E NAVEGAÇÃO

Organize: Início; Casa e Cozinha; Tecnologia; Moda e Calçados; Ferramentas; Guias e Comparações; Ofertas; Lojas; Como comprar.

No mobile, garantir menu acessível, busca, fechamento, foco, rolagem e áreas de toque adequadas.

9. INTEGRIDADE DOS PRODUTOS

Auditar nome, slug, categoria, imagens, descrição, preços, desconto, parceiro, URL, identificador, disponibilidade, atualização, origem e parâmetros de afiliado.

A imagem, título, descrição, preço e link devem representar o mesmo produto. Criar status: validado, aguardando validação, divergente, link quebrado, indisponível, redirecionamento suspeito e preço desatualizado.

10. LINKS DE AFILIADO

Preservar identificadores. Usar rel sponsored noopener noreferrer quando aplicável, registrar clique antes do redirecionamento, evitar URLs genéricas e validar destino final. Criar testes de correspondência, URL, parâmetros e registro.

11. PREÇOS E OFERTAS

Não inventar valores. Todo preço deve incluir atualização, moeda, origem e disponibilidade. Confirmar preço anterior e desconto. Quando não confiável, mostrar Consultar preço na loja parceira.

12. CARDS DE PRODUTO

Padronizar imagem, alt, nome, descrição, loja, preço ou consulta, desconto validado, data, botão, favorito, compartilhamento e aviso de afiliado. Evitar deformação, sobreposição, desalinhamento e excesso de botões.

13. BUSCA E FILTROS

Busca por nome, marca, categoria, descrição, sinônimos, loja, preço e características. Implementar normalização, tolerância a erros, sugestões, estado vazio, URL compartilhável, paginação e filtros mobile.

14. FAVORITOS

Garantir adicionar, remover, persistir, sincronizar quando aplicável, evitar duplicação, identificar removidos e apresentar estado vazio.

15. PÁGINA DE LOJAS

Apresentar apenas parceiros cadastrados, com nome, logotipo autorizado, descrição, categorias, quantidade, link e aviso de responsabilidade do parceiro. Não afirmar parceria oficial sem documentação.

16. PÁGINAS LEGAIS E LGPD

Criar ou corrigir Política de Privacidade, Termos, Cookies, Aviso de Afiliado, Contato e Como comprar. Não inventar CNPJ, endereço ou encarregado. Implementar consentimento real para cookies necessários, análise e marketing.

17. VERIFICAÇÃO DO E-MAIL

Não alterar automaticamente. Confirmar em ambiente, configurações e documentação se o e-mail .com é válido ou se deve ser .com.br.

18. SEO TÉCNICO

Títulos, descriptions, H1, canonical, Open Graph, breadcrumbs, alt, status HTTP, robots, sitemap, 404, redirects, prevenção de duplicidade, paginação, parâmetros e dados estruturados reais. Não declarar a Impacto360 como vendedora quando a compra ocorre no parceiro.

19. CONTEÚDO ORIGINAL

Criar valor editorial: resumo, vantagens, limitações, indicação, contraindicação, critérios, alternativas, cuidados, comparação, FAQ e data de revisão. Não copiar textos integrais nem inventar testes.

20. RASTREAMENTO E ANALYTICS

Evitar duplicação de ferramentas. Criar eventos: view_item_list, view_item, search, select_item, add_to_favorites, remove_from_favorites, share_product, outbound_affiliate_click, view_guide, select_partner, filter_products e no_search_results.

21. DESEMPENHO E MOBILE

Auditar Core Web Vitals, JavaScript, imagens, fontes, cache, scripts e hidratação. Implementar formatos modernos, srcset, lazy loading, divisão de código, cache e prevenção de layout shift. Testar 320, 360, 390, 412, 768, 1024 e desktop amplo.

22. ACESSIBILIDADE

Buscar WCAG AA: teclado, foco, contraste, títulos, labels, erros, alt, botões, menus, modais, busca, favoritos, compartilhamento e redução de movimento.

23. SEGURANÇA

Auditar dependências, XSS, CSRF, injeções, redirecionamentos, URLs externas, upload, autenticação, segredos, logs, headers, spam e rate limiting. Não expor chaves nem variáveis privadas.

24. PAINEL ADMINISTRATIVO

Melhorar pesquisa, filtros, edição, validação, prévia, status, atualização, histórico, parceiro, preço, duplicidade, importação, exportação e logs. Em importações, validar, gerar prévia, detectar duplicados, campos ausentes, links genéricos e imagens inválidas.

25. TESTES OBRIGATÓRIOS

Criar ou atualizar testes unitários, integração, ponta a ponta e matriz de rotas. Confirmar build, lint, navegação, busca, produto, favorito, ofertas, lojas, páginas legais, 404, menu mobile, link externo, parâmetros de afiliado e ausência de erros no console.

26. CRITÉRIOS DE ACEITAÇÃO

Concluir somente quando build, TypeScript, lint e testes estiverem aprovados; páginas legais retornarem 200; URLs inexistentes retornarem 404; categorias, busca, favoritos, lojas e ofertas funcionarem; produtos forem indexáveis; conteúdo não se repetir indevidamente; imagens, links, parâmetros e preços estiverem consistentes; mobile, analytics, cookies, sitemap, robots e metadados funcionarem.

27. O QUE NÃO FAZER

Não apagar produtos em massa, trocar links indiscriminadamente, remover integrações, alterar credenciais, DNS, hospedagem, domínio ou stack sem justificativa. Não inventar avaliações, preços, descontos, estoque, lojas, CNPJ ou dados. Não publicar sem testes nem usar dados simulados em produção.

28. FORMA DE EXECUÇÃO

Fase 1: auditoria e mapa da arquitetura.
Fase 2: correções críticas.
Fase 3: integridade dos produtos.
Fase 4: posicionamento e experiência.
Fase 5: SEO, analytics, desempenho e segurança.
Fase 6: testes e revisão.

29. RELATÓRIO FINAL OBRIGATÓRIO

Apresente em português: resumo, problemas, causas, arquivos, mudanças, migrations, produtos e links corrigidos, páginas, testes, desempenho, pendências, deploy, rollback, checklist e recomendações. Classifique pendências em crítico, alto, médio e baixo. Não declare correção sem evidência.

Comece agora pela auditoria completa do repositório. Trabalhe exclusivamente na branch codex/auditoria-otimizacao-impacto360. Não faça mudanças destrutivas. Não publique diretamente em main. Ao concluir cada fase, faça commits claros e abra um pull request em modo draft para revisão humana antes de qualquer merge.