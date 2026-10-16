import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const storage = new Map();
const holders = [];
const status = { textContent:'', hidden:true };
let fetchCalls = 0;
let response;
const copiedLinks = [];
const nativeShares = [];
const navigatorMock = {clipboard:{writeText:async url=>copiedLinks.push(url)}};
const source = fs.readFileSync('src/storefront/product-engagement.js','utf8').replace(/\}\)\(\);\s*$/, 'globalThis.testApi={validMetric,controls,changeLike,changeReaction,shareItem,vote,save,setConfig:value=>{config=value;}};})();');
function instance() {
  const context=vm.createContext({console,URL,Intl,Date,Number,Object,Map,Set,JSON,AbortSignal,crypto:globalThis.crypto,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    document:{readyState:'loading',addEventListener:()=>{},querySelectorAll:()=>holders,getElementById:()=>status},
    window:{addEventListener:()=>{}},location:new URL('https://impacto360afiliado.com.br/'),navigator:navigatorMock,
    setTimeout:()=>1,clearTimeout:()=>{},fetch:async()=>{fetchCalls++;return response;}});
  vm.runInContext(source,context);return context.testApi;
}
const api=instance();
const product={dataset:{engagementProduct:'real-id',engagementName:'<img src=x onerror=alert(1)>'},innerHTML:''};holders.push(product);
api.controls(product);
assert.match(product.innerHTML,/Avaliar/);assert.match(product.innerHTML,/Curtir/);
api.changeReaction('real-id','love');assert.equal(api.vote('real-id').reaction,'love');
api.changeReaction('real-id','want');assert.equal(api.vote('real-id').reaction,'want');
api.changeReaction('real-id','want');assert.equal(api.vote('real-id').reaction,'');
api.changeReaction('real-id','invalid');assert.equal(api.vote('real-id').reaction,'');
assert.match(product.innerHTML,/data-engagement-share/);
assert.doesNotMatch(product.innerHTML,/i360-local-note|Suas interações ficam salvas neste dispositivo/);
const storefrontSource = fs.readFileSync('src/storefront/storefront.js','utf8');
const listSource = storefrontSource.slice(storefrontSource.indexOf('const affiliateLists ='),storefrontSource.indexOf('function renderHome()'));
const listResult = vm.runInNewContext(listSource+'\n({markup:affiliateListCards(),lists:affiliateLists})',{SITE_URL:'https://impacto360afiliado.com.br',escapeAttr:value=>String(value)});
const sharedListLinks = [...listResult.markup.matchAll(/data-engagement-url="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(listResult.lists.map(list=>list.url)).size,listResult.lists.length);
for (const list of listResult.lists) {
  assert.ok(fs.existsSync('.'+list.image),`Capa ausente: ${list.title}`);
  assert.deepEqual(fs.readFileSync('pacote-github-pages-pronto'+list.image),fs.readFileSync('.'+list.image),`Capa não sincronizada: ${list.title}`);
}
for (const category of new Set(listResult.lists.map(list=>list.category))) {
  const markup = vm.runInNewContext(listSource+`\naffiliateListCards(${JSON.stringify(category)})`,{SITE_URL:'https://impacto360afiliado.com.br',escapeAttr:value=>String(value)});
  for (const list of listResult.lists) assert.equal(markup.includes(`href="${list.url}"`),list.category===category,`Categoria incorreta: ${list.title}`);
}
assert.equal(vm.runInNewContext(listSource+'\naffiliateListCards("categoria-sem-listas")',{SITE_URL:'https://impacto360afiliado.com.br',escapeAttr:value=>String(value)}),'');
assert.equal(sharedListLinks.length,listResult.lists.length);
for (const [index,link] of sharedListLinks.entries()) {
  const url = new URL(link);
  assert.equal(url.origin,'https://impacto360afiliado.com.br');
  assert.equal(url.pathname,'/');
  assert.ok(listResult.markup.includes(`id="${url.hash.slice(1)}"`));
  assert.ok(listResult.markup.includes(`href="${listResult.lists[index].url}"`));
  await api.shareItem({dataset:{engagementUrl:link,engagementName:listResult.lists[index].title}});
}
assert.deepEqual(copiedLinks,sharedListLinks);
navigatorMock.share = async payload=>nativeShares.push(payload);
for (const [index,link] of sharedListLinks.entries()) await api.shareItem({dataset:{engagementUrl:link,engagementName:listResult.lists[index].title}});
assert.deepEqual(nativeShares.map(payload=>payload.url),sharedListLinks);
assert.deepEqual(nativeShares.map(payload=>payload.title),Array.from(listResult.lists,list=>list.title));
assert.ok(!product.innerHTML.includes('vendidos'));assert.ok(!product.innerHTML.includes('0 curtidas'));assert.ok(!product.innerHTML.includes('<img src=x'));
await api.changeLike('real-id');assert.equal(api.vote('real-id').liked,true);assert.equal(fetchCalls,0);assert.match(status.textContent,/neste dispositivo/);
await api.changeLike('real-id');assert.equal(api.vote('real-id').liked,false);
api.save('real-id',{rating:4,liked:true});assert.equal(instance().vote('real-id').rating,4);api.controls(product);assert.match(product.innerHTML,/Sua nota 4\/5/);
assert.equal(api.validMetric({likes:-1,ratingCount:4,ratingAverage:8}).likes,null);
assert.equal(api.validMetric({likes:2,ratingCount:4,ratingAverage:8}).ratingCount,0);
const sale={quantity:120,scope:'partner_units',source:'Mercado Livre',sourceUrl:'https://www.mercadolivre.com.br/p/MLB123',verifiedAt:new Date().toISOString()};
assert.equal(api.validMetric({sales:sale}).sales.quantity,120);
assert.equal(api.validMetric({sales:{...sale,sourceUrl:'https://mercadolivre.com.br.evil.test/'}}).sales,null);
assert.equal(api.validMetric({sales:{...sale,quantity:-4}}).sales,null);
assert.equal(api.validMetric({sales:{...sale,verifiedAt:'2020-01-01'}}).sales,null);
assert.equal(api.validMetric({sales:{...sale,scope:'clicks'}}).sales,null);
api.setConfig({enabled:true,apiBase:'https://example.test'});
response={ok:false,status:503};const before=api.vote('real-id').liked;await api.changeLike('real-id');assert.equal(api.vote('real-id').liked,before);assert.match(status.textContent,/Tente novamente/);
response={ok:true,json:async()=>({metric:{likes:8,ratingCount:2,ratingAverage:4.5,sales:sale}})};await api.changeLike('real-id');
assert.equal(api.vote('real-id').liked,!before);assert.match(product.innerHTML,/4,5 \(2\)/);assert.match(product.innerHTML,/120 vendidos no parceiro/);
for(const extension of ['js','css'])assert.equal(fs.readFileSync(`assets/product-engagement.${extension}`,'utf8'),fs.readFileSync(`src/storefront/product-engagement.${extension}`,'utf8'));
const html=fs.readFileSync('index.html','utf8');assert.ok(html.includes('product-engagement.js'));assert.ok(html.includes('connect-src \'self\' https://impacto360-engajamento.mauricio3010.chatgpt.site'));
const catalog=JSON.parse(fs.readFileSync('dados/catalogo-publico.json','utf8'));
const p=fs.readFileSync('.'+catalog[0].shortPath+'index.html','utf8');assert.ok(p.includes('data-engagement-product='));assert.ok(p.includes('product-engagement.js'));
console.log('Engajamento aprovado: persistência, reversão, falha de rede, notas locais identificadas, totais reais, fonte/data de vendas, escape de conteúdo e integração das fichas.');
