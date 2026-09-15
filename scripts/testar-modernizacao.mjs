import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parsePage, productIds } from './auditar-precos-publicos-20260914.mjs';

const source = fs.readFileSync('src/storefront/storefront.js', 'utf8').replace(/\nboot\(\);\s*$/, '\n');
const context = vm.createContext({ console, URL, URLSearchParams, Intl, Date, setTimeout, clearTimeout,
  location: new URL('https://impacto360afiliado.com.br/'), window: {},
  localStorage: { getItem: () => null, setItem: () => {} } });
vm.runInContext(source, context);
const evaluate = code => vm.runInContext(code, context);
assert.equal(evaluate(`priceFreshness({priceUpdatedAt:new Date().toISOString()}).current`), true);
assert.equal(evaluate(`priceFreshness({priceUpdatedAt:new Date(Date.now()-8*86400000).toISOString()}).current`), false);
assert.equal(evaluate(`priceFreshness({priceUpdatedAt:new Date(Date.now()+86400000).toISOString()}).current`), false);
assert.equal(evaluate(`priceFreshness({}).current`), false);
assert.equal(evaluate(`validDiscount({priceUpdatedAt:'2020-01-01',priceValue:100,previousPriceValue:200})`), false);
const card = evaluate(`productCard({id:'probe',name:'Produto de teste',image:'',link:'https://www.amazon.com.br/dp/B07JQ9G1BD?tag=910556142-20',priceValue:9876.54,price:'R$ 9.876,54',priceUpdatedAt:'2020-01-01'})`);
assert.ok(card.includes('Consulte o preço'));
assert.ok(!card.includes('9.876,54'));
const fallback = evaluate(`state.marketplaces=[{id:'amazon',url:'https://amazon.com.br.evil.example/',type:'affiliate'}]; homeMarketplaces().find(x=>x.id==='amazon')`);
assert.equal(fallback.url, 'https://www.amazon.com.br/');
assert.equal(fallback.type, 'official');
const product = { name:'Furadeira modelo XT20 127V', linkPrincipalFonte:'https://shopee.com.br/product/123/456' };
const page = (name, offers) => `<script type="application/ld+json">${JSON.stringify({'@type':'Product',name,offers})}</script>`;
const offer = { '@type':'Offer', price:100, priceCurrency:'BRL' };
assert.equal(parsePage(product,page(product.name,offer),product.linkPrincipalFonte,200).status,'confirmed');
assert.equal(parsePage(product,page('Furadeira modelo XT20 220V',offer),product.linkPrincipalFonte,200).status,'review_identity');
assert.equal(parsePage(product,page(product.name,offer),'https://shopee.com.br/product/123/789',200).status,'review_identity');
assert.equal(parsePage(product,page(product.name,{'@type':'AggregateOffer',lowPrice:100,highPrice:200,priceCurrency:'BRL'}),product.linkPrincipalFonte,200).status,'review_price');
assert.equal(parsePage(product,page(product.name,{...offer,priceCurrency:'USD'}),product.linkPrincipalFonte,200).status,'review_price');
assert.equal(parsePage(product,page(product.name,offer),product.linkPrincipalFonte,403).status,'blocked');
assert.equal(parsePage(product,'<title>Robot Check</title>',product.linkPrincipalFonte,200).status,'blocked');
assert.deepEqual(productIds(product.linkPrincipalFonte), ['shopee:123:456']);
console.log('Modernização aprovada: expiração, preço antigo, destino dos atalhos, identidade, variante, moeda, faixa de preços e bloqueios.');
