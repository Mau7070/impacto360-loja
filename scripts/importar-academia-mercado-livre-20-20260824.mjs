import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const date = "2026-08-24";
const checkedAt = "2026-08-24T12:00:00-03:00";
const validUntil = "2026-08-31T12:00:00-03:00";
const rows = [
  ["MLB23557714","Multi Estação De Musculação Academia Completa Cor do estofamento Cinza/Vinho","https://www.mercadolivre.com.br/multi-estacao-de-musculacao-academia-completa-cor-do-estofamento-cinzavinho/p/MLB23557714","https://meli.la/29oaj64","https://http2.mlstatic.com/D_NQ_NP_827652-MLA99498065400_112025-O.webp",9776.62],
  ["MLB26462436","Estação De Musculação Academia Podiumfit Me200 65kg","https://www.mercadolivre.com.br/estacao-de-musculacao-academia-podiumfit-me200-65kg/p/MLB26462436","https://meli.la/2yfkRG8","https://http2.mlstatic.com/D_NQ_NP_952967-MLA99998051575_112025-O.webp",2414],
  ["MLB24423814","Estação Musculação 45Kg Completa Academia Treino WCT Fitness","https://www.mercadolivre.com.br/estacao-musculacao-45kg-completa-academia-treino-wct-fitness/p/MLB24423814","https://meli.la/1z7chpE","https://http2.mlstatic.com/D_NQ_NP_921183-MLA99990715977_112025-O.webp",1648.99],
  ["MLB61263214","Estação De Musculação De 45kg Mbx Fitness Academia Ginástica Braço Perna Cor Preto","https://www.mercadolivre.com.br/estacao-de-musculacao-de-45kg-mbx-fitness-academia-ginastica-braco-perna-cor-preto/p/MLB61263214","https://meli.la/19wLHNR","https://http2.mlstatic.com/D_NQ_NP_804594-MLA115669453453_082026-O.webp",2424],
  ["MLB60052470","Banco Musculação Para Academia Regulável 120cm 300kg Fortshape Equipamentos Fitness","https://www.mercadolivre.com.br/banco-musculacao-para-academia-regulavel-120cm-300kg-fortshape-equipamentos-fitness/p/MLB60052470","https://meli.la/2WBNfnM","https://http2.mlstatic.com/D_NQ_NP_639926-MLA112492571869_052026-O.webp",373.18],
  ["MLB46208152","Banco Regulável 3 Em 1 Para Exercícios Academia Declinado Up","https://www.mercadolivre.com.br/banco-regulavel-3-em-1-para-exercicios-academia-declinado-up/p/MLB46208152","https://meli.la/1HceBYp","https://http2.mlstatic.com/D_NQ_NP_897953-MLA99503505792_112025-O.webp",596.99],
  ["MLB52065666","Banco Academia Regulável Supino Musculação Reclinável Livre Cor Preto Com Listras Vermelhas","https://www.mercadolivre.com.br/banco-academia-regulavel-supino-musculacao-reclinavel-livre-cor-preto-com-listras-vermelhas/p/MLB52065666","https://meli.la/2TmoHF1","https://http2.mlstatic.com/D_NQ_NP_926371-MLA112990685503_062026-O.webp",474.57],
  ["MLB23566572","Banco De Supino Aparelho de Musculação Academia Em Casa Ginástica Wct Fitness","https://www.mercadolivre.com.br/banco-de-supino-aparelho-de-musculacao-academia-em-casa-ginastica-wct-fitness/p/MLB23566572","https://meli.la/1dhgfdd","https://http2.mlstatic.com/D_NQ_NP_832843-MLA106839362276_022026-O.webp",678.99],
  ["MLB73130697","Banco Musculação Fitness Treino Academia 1 Metro 250kg","https://www.mercadolivre.com.br/banco-musculacao-fitness-treino-academia-1-metro-250kg/p/MLB73130697","https://meli.la/1ygRn3b","https://http2.mlstatic.com/D_NQ_NP_839841-MLA111930475200_062026-O.webp",160.79],
  ["MLB28814147","Barra Fixa De Porta Para Exercícios Ajustável 63 A 96 Cm Cor Prateado","https://www.mercadolivre.com.br/barra-fixa-de-porta-para-exercicios-ajustavel-63-a-96-cm-cor-prateado/p/MLB28814147","https://meli.la/2TjQhc5","https://http2.mlstatic.com/D_NQ_NP_720621-MLA115255020455_072026-O.webp",42.95],
  ["MLB28014788","Barra Fixa De Porta Para Exercícios Ajustável 63 A 96 Cm","https://www.mercadolivre.com.br/barra-fixa-de-porta-para-exercicios-ajustavel-63-a-96-cm/p/MLB28014788","https://meli.la/1k1wATy","https://http2.mlstatic.com/D_NQ_NP_639613-MLA99630648582_122025-O.webp",48.34],
  ["MLB32081318","Barra Porta Fixa Exercício Flexão Malhar Treino Musculação Cor Prata","https://www.mercadolivre.com.br/barra-porta-fixa-exercicio-flexao-malhar-treino-musculacao-cor-prata/p/MLB32081318","https://meli.la/2SpMjJ8","https://http2.mlstatic.com/D_NQ_NP_697509-MLA115382550663_072026-O.webp",69],
  ["MLB46208681","Barra Fixa de Parede para Musculação e Crossfit Cor Preto","https://www.mercadolivre.com.br/barra-fixa-de-parede-para-musculacao-e-crossfit-cor-preto/p/MLB46208681","https://meli.la/15KX735","https://http2.mlstatic.com/D_NQ_NP_624259-MLA99563283790_122025-O.webp",92],
  ["MLB58555511","Anilha Bumper Crossfit 10kg Olímpica Emborrachada Touch and Go","https://www.mercadolivre.com.br/anilha-bumper-crossfit-10kg-olimpica-emborrachada-touch-and-go/p/MLB58555511","https://meli.la/2dEEg5k","https://http2.mlstatic.com/D_NQ_NP_625721-MLA109817854076_042026-O.webp",216],
  ["MLB27633447","Estação Musculação Carga De Peso Até 45kg Preto","https://www.mercadolivre.com.br/estacao-musculacao-carga-de-peso-ate-45kg-preto/p/MLB27633447","https://meli.la/2s55Biz","https://http2.mlstatic.com/D_NQ_NP_922194-MLA108913049088_032026-O.webp",1979.99],
  ["MLB23758234","Estação Musculação Supino com Voador Academia Residencial Completa WCT Fitness","https://www.mercadolivre.com.br/estacao-musculacao-supino-com-voador-academia-residencial-completa-wct-fitness/p/MLB23758234","https://meli.la/1d1ZqGs","https://http2.mlstatic.com/D_NQ_NP_844099-MLA96126332791_102025-O.webp",3492],
  ["MLB27071946","Estação De Musculação Completa Com 66kg Aparelho Ginastica Preto Academia","https://www.mercadolivre.com.br/estacao-de-musculacao-completa-com-66kg-aparelho-ginastica-preto-academia/p/MLB27071946","https://meli.la/2FSqecd","https://http2.mlstatic.com/D_NQ_NP_881584-MLA101374955146_122025-O.webp",2521.90],
  ["MLB26901811","Estação De Musculação Bonafit 45kg Preta Aparelho Academia Ginastica","https://www.mercadolivre.com.br/estacao-de-musculacao-bonafit-45kg-preta-aparelho-academia-ginastica/p/MLB26901811","https://meli.la/2gKpJx9","https://http2.mlstatic.com/D_NQ_NP_619761-MLA101803856913_122025-O.webp",2046],
  ["MLB76529192","Estação Musculação MBX 45kg Carga Efetiva 90kg Academia Braço Perna","https://www.mercadolivre.com.br/estacao-musculacao-mbx-45kg-carga-efetiva-90kg-academia-braco-perna/p/MLB76529192","https://meli.la/2hoLpCs","https://http2.mlstatic.com/D_NQ_NP_613930-MLA114432305856_082026-O.webp",2397],
  ["MLB36108753","Estação Musculação Academia Completa DSRSshop 100kg Estofamento e Estrutura Cor Preto","https://www.mercadolivre.com.br/estacao-musculacao-academia-completa-dsrsshop-100kg-estofamento-e-estrutura-cor-preto/p/MLB36108753","https://meli.la/28sAEBZ","https://http2.mlstatic.com/D_NQ_NP_823107-MLA99451839314_112025-O.webp",4971.05]
];

const slugify = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const brl = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value).replace(/\u00a0/g, " ");
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const productsPath = path.join(root, "dados", "products.json");
const mirrorPath = path.join(root, "pacote-github-pages-pronto", "dados", "products.json");
const imageDir = path.join(root, "public", "images", "anuncios", "academia-mercado-livre-20260824");
const mirrorImageDir = path.join(root, "pacote-github-pages-pronto", "public", "images", "anuncios", "academia-mercado-livre-20260824");
fs.mkdirSync(imageDir, { recursive: true });
fs.mkdirSync(mirrorImageDir, { recursive: true });

const products = read(productsPath);
const existingIds = new Set(products.map(item => item?.marketplace?.externalId).filter(Boolean));
const imported = [];
for (const [externalId, title, sourceUrl, affiliateUrl, imageUrl, price] of rows) {
  if (existingIds.has(externalId)) continue;
  const id = `academia-20260824-mercado-livre-${externalId.toLowerCase()}`;
  const fileName = `${id}.webp`;
  const response = await fetch(imageUrl, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Falha ao baixar imagem ${externalId}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 5000) throw new Error(`Imagem muito pequena para ${externalId}`);
  fs.writeFileSync(path.join(imageDir, fileName), bytes);
  fs.copyFileSync(path.join(imageDir, fileName), path.join(mirrorImageDir, fileName));
  const image = `public/images/anuncios/academia-mercado-livre-20260824/${fileName}`;
  const formattedPrice = brl(price);
  const product = {
    id, storeId: "impacto-sport", name: title, nome: title, title,
    slug: slugify(title), brand: "Mercado Livre", marca: "Mercado Livre",
    creator: "Mercado Livre", produtor: "Mercado Livre",
    description: `${title}. Confira preço, frete, estoque, medidas e condições diretamente no Mercado Livre antes da compra.`,
    descricaoCurta: `${title}. Consulte as condições atuais no parceiro.`,
    fullDescription: `${title}. As informações comerciais podem mudar; confirme preço, frete, estoque, dimensões e condições no Mercado Livre.`,
    price: formattedPrice, preco: formattedPrice, precoPromocional: formattedPrice, precoAnterior: null,
    image, imagemPrincipal: image, fotoPrincipal: image, imagem: image, galeria: [image], fotosExtras: [image],
    fonteMidia: "Mercado Livre - imagem real do anúncio armazenada localmente em 2026-08-24",
    category: "Esportes e Fitness", categoria: "Esportes e Fitness", subcategoria: "Academia e musculação",
    badge: "", buttonLabel: "Ver oferta", chamadaCompra: "Ver oferta no Mercado Livre", actionType: "buy",
    affiliateLink: affiliateUrl, linkAfiliado: affiliateUrl, linkComissionado: affiliateUrl, linkCompra: affiliateUrl,
    linkPlataforma: affiliateUrl, urlProduto: affiliateUrl, linkOriginal: affiliateUrl,
    linkPrincipalFonte: sourceUrl, linkProdutoApenasLeitura: sourceUrl, sourceProductLink: sourceUrl,
    tipoLink: "mercado_livre_afiliados", linkStatus: "link oficial gerado no painel de afiliados", statusLink: "confirmado",
    statusImagem: "imagem real verificada e armazenada localmente", source: "Mercado Livre", origem: "Mercado Livre Afiliados", plataformaOrigem: "Mercado Livre",
    status: "ativo", statusAnuncio: "ativo", aprovadoParaPublicacao: true, publicar: true,
    publicarNaHome: false, destaqueHome: false, geraComissao: true, atualizadoEm: date, publicadoEm: date, ultimaRevisao: date,
    rating: null, nota: null, reviewCount: null, vendidos: null,
    avisoComissao: "A Impacto360 pode receber comissão pela indicação, sem custo adicional.",
    marketplace: { platform: "Mercado Livre", externalId, affiliateUrl, sourceUrl, priceSeen: formattedPrice, curatedAt: date, priceUpdatedAt: checkedAt },
    precoAtual: formattedPrice, priceUpdatedAt: checkedAt, ultimaVerificacaoPreco: checkedAt,
    priceValidUntil: validUntil, precoValidoAte: validUntil, priceStatus: "current", statusPreco: "confirmado",
    auditoriaPreco: { status: "confirmado", verificadoEm: checkedAt, validoAte: validUntil, fonte: sourceUrl, tituloConferido: true, precoAnteriorRemovido: true, motivo: "Preço atual confirmado na página do parceiro." },
    rotationGroup: "academia-mercado-livre-20-20260824",
    observacoesInternas: "Selecionado, validado e afiliado no painel oficial do Mercado Livre em 2026-08-24."
  };
  products.push(product);
  existingIds.add(externalId);
  imported.push({ id, externalId, title, affiliateUrl, sourceUrl, image, price: formattedPrice });
}

write(productsPath, products);
write(mirrorPath, products);
write(path.join(root, "dados", "relatorio-importacao-academia-mercado-livre-20-20260824.json"), { generatedAt: new Date().toISOString(), requested: 20, importedCount: imported.length, imported });
console.log(JSON.stringify({ importedCount: imported.length, totalProducts: products.length }, null, 2));
