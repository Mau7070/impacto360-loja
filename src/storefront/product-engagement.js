/* Shared by storefront cards and permanent product pages. No simulated counters. */
(() => {
  const STORAGE = 'impacto360Engagement';
  const VISITOR = 'impacto360EngagementVisitor';
  const metrics = new Map();
  const pending = new Set();
  const loaded = new Set();
  let config = { enabled: false, apiBase: '' };
  let scheduled;
  let dialog;
  let current;
  let returnFocus;
  let ready = false;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const count = value => new Intl.NumberFormat('pt-BR', { notation: Number(value) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
  function localVotes() {
    try { const data = JSON.parse(localStorage.getItem(STORAGE) || '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; } catch { return {}; }
  }
  function vote(id) { const data = localVotes(); return Object.hasOwn(data, id) ? data[id] : {}; }
  function save(id, value) {
    const data = localVotes();
    Object.defineProperty(data, id, { value, enumerable: true, configurable: true, writable: true });
    try { localStorage.setItem(STORAGE, JSON.stringify(data)); return true; } catch { return false; }
  }
  function visitor() {
    try {
      let id = localStorage.getItem(VISITOR);
      if (!/^[a-f0-9-]{36}$/.test(id || '')) { id = crypto.randomUUID(); localStorage.setItem(VISITOR, id); }
      return id;
    } catch { throw new Error('Permita o armazenamento necessário para registrar sua interação.'); }
  }
  function validMetric(value) {
    if (!value || typeof value !== 'object') return null;
    const likes = Number.isSafeInteger(value.likes) && value.likes >= 0 ? value.likes : null;
    const ratings = Number.isSafeInteger(value.ratingCount) && value.ratingCount >= 0 ? value.ratingCount : 0;
    const average = ratings && typeof value.ratingAverage === 'number' && value.ratingAverage >= 1 && value.ratingAverage <= 5 ? value.ratingAverage : null;
    let sales = null;
    const s = value.sales;
    if (s && Number.isSafeInteger(s.quantity) && s.quantity > 0 && ['partner_units', 'affiliate_confirmed'].includes(s.scope)
      && typeof s.source === 'string' && s.source.length <= 80 && s.source.trim()
      && Number.isFinite(Date.parse(s.verifiedAt)) && Date.parse(s.verifiedAt) <= Date.now() + 300000
      && Date.now() - Date.parse(s.verifiedAt) <= 30 * 86400000) {
      try {
        const u = new URL(s.sourceUrl);
        if (u.protocol === 'https:' && ['mercadolivre.com.br', 'shopee.com.br', 'amazon.com.br', 'hotmart.com'].some(h => u.hostname === h || u.hostname.endsWith('.' + h))) sales = s;
      } catch {}
    }
    return { likes, ratingCount: average ? ratings : 0, ratingAverage: average, sales };
  }
  function controls(holder) {
    const id = holder.dataset.engagementProduct;
    const name = holder.dataset.engagementName || 'este produto';
    const own = vote(id);
    const shared = metrics.get(id);
    const ratingLabel = shared?.ratingCount ? `${shared.ratingAverage.toFixed(1).replace('.', ',')} (${count(shared.ratingCount)})`
      : own.rating ? `Sua nota ${own.rating}/5` : 'Avaliar';
    const likeLabel = shared?.likes !== null && shared?.likes !== undefined ? count(shared.likes) : own.liked ? 'Curtido' : 'Curtir';
    const sales = shared?.sales;
    holder.innerHTML = `<div class="i360-engagement-actions">
      <button class="i360-rating" type="button" data-engagement-rate="${escape(id)}" aria-label="Avaliar ${escape(name)}${shared?.ratingCount ? `: média ${shared.ratingAverage.toFixed(1)} de 5, ${shared.ratingCount} avaliações da comunidade Impacto360` : ''}"><span aria-hidden="true">★</span> <span>${escape(ratingLabel)}</span></button>
      <button class="i360-like" type="button" data-engagement-like="${escape(id)}" aria-pressed="${Boolean(own.liked)}" aria-label="${own.liked ? 'Remover curtida de' : 'Curtir'} ${escape(name)}${shared?.likes != null ? `: ${shared.likes} curtidas na Impacto360` : ''}" ${pending.has(id) ? 'disabled' : ''}><span aria-hidden="true">👍</span> <span>${escape(likeLabel)}</span></button>
    </div>${sales ? `<span class="i360-sales" title="${escape(sales.source)} · conferido em ${escape(new Date(sales.verifiedAt).toLocaleDateString('pt-BR'))}">${count(sales.quantity)} ${sales.scope === 'partner_units' ? 'vendidos no parceiro' : 'vendas confirmadas'}</span>` : ''}`;
  }
  function refresh(id) {
    document.querySelectorAll('[data-engagement-product]').forEach(holder => { if (holder.dataset.engagementProduct === id) controls(holder); });
  }
  async function request(path, body) {
    const response = await fetch(config.apiBase + path, {
      method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'omit',
      headers: body ? { 'Content-Type':'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(response.status === 429 ? 'Aguarde um minuto antes de tentar novamente.' : 'Não foi possível registrar agora. Tente novamente.');
    return response.json();
  }
  async function loadVisible() {
    if (!ready) return;
    const holders = [...document.querySelectorAll('[data-engagement-product]')];
    holders.forEach(holder => { if (!holder.querySelector('.i360-engagement-actions')) controls(holder); });
    if (!config.enabled) return;
    const ids = [...new Set(holders.map(h => h.dataset.engagementProduct))].filter(id => !loaded.has(id));
    for (let i = 0; i < ids.length; i += 60) {
      const batch = ids.slice(i, i + 60); batch.forEach(id => loaded.add(id));
      try {
        const result = await request('/api/engagement?ids=' + encodeURIComponent(batch.join(',')));
        batch.forEach(id => { const data = validMetric(result.products?.[id]); if (data) metrics.set(id, data); refresh(id); });
      } catch { batch.forEach(id => loaded.delete(id)); }
    }
  }
  function notify(message) {
    let area = document.getElementById('i360-engagement-status');
    if (!area) { area = document.createElement('div'); area.id = 'i360-engagement-status'; area.className = 'i360-engagement-status'; area.setAttribute('role', 'status'); document.body.appendChild(area); }
    area.textContent = message; area.hidden = false;
    clearTimeout(notify.timer); notify.timer = setTimeout(() => { area.hidden = true; }, 4500);
  }
  async function changeLike(id) {
    if (pending.has(id)) return;
    const previous = vote(id);
    const liked = !previous.liked;
    pending.add(id); refresh(id);
    try {
      if (config.enabled) {
        const result = await request('/api/engagement', { productId:id, visitorId:visitor(), action:'like', liked });
        const data = validMetric(result.metric); if (!data) throw new Error('Resposta inválida. Tente novamente.'); metrics.set(id, data);
      }
      if (!save(id, { ...previous, liked })) throw new Error('Não foi possível salvar neste navegador.');
      notify(config.enabled ? (liked ? 'Curtida registrada.' : 'Curtida removida.') : (liked ? 'Sua curtida foi salva neste dispositivo.' : 'Sua curtida foi removida deste dispositivo.'));
    } catch (error) { notify(error.message); }
    finally { pending.delete(id); refresh(id); }
  }
  function openRating(holder, trigger) {
    const id = holder.dataset.engagementProduct;
    if (pending.has(id)) return;
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.className = 'i360-rating-dialog'; dialog.setAttribute('aria-labelledby', 'i360-rating-title');
      dialog.innerHTML = `<form><div class="i360-dialog-heading"><h2 id="i360-rating-title">Avaliar produto</h2><button type="button" data-engagement-close aria-label="Fechar avaliação">×</button></div><p data-rating-name></p><p class="i360-rating-context" data-rating-context></p><fieldset><legend>Sua nota, de 1 a 5 estrelas</legend><div class="i360-stars">${[1,2,3,4,5].map(n => `<label><input type="radio" name="rating" value="${n}" required><span aria-hidden="true">★</span><span class="i360-sr-only">${n} ${n === 1 ? 'estrela' : 'estrelas'}</span></label>`).join('')}</div></fieldset><p class="i360-rating-context">Avaliação da comunidade Impacto360. A nota não comprova uma compra.</p><p data-rating-status role="status"></p><div class="i360-dialog-footer"><button type="button" data-engagement-delete>Remover minha nota</button><button type="submit">Salvar avaliação</button></div></form>`;
      document.body.appendChild(dialog);
      dialog.querySelector('[data-engagement-close]').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => returnFocus?.isConnected && returnFocus.focus());
      dialog.querySelector('form').addEventListener('submit', event => { event.preventDefault(); submitRating(Number(new FormData(event.currentTarget).get('rating'))); });
      dialog.querySelector('[data-engagement-delete]').addEventListener('click', () => submitRating(0));
    }
    current = id; returnFocus = trigger;
    dialog.querySelector('form').reset();
    dialog.querySelector('[data-rating-name]').textContent = holder.dataset.engagementName || 'Produto';
    dialog.querySelector('[data-rating-context]').textContent = config.enabled ? 'Uma nota por produto neste navegador. Você pode alterá-la.' : 'Sua nota fica salva neste dispositivo. O contador público aguarda ativação.';
    dialog.querySelector('[data-rating-status]').textContent = '';
    const own = vote(id);
    dialog.querySelector('[data-engagement-delete]').hidden = !own.rating;
    if (own.rating) dialog.querySelector(`input[value="${own.rating}"]`).checked = true;
    dialog.showModal();
  }
  async function submitRating(rating) {
    const id = current;
    if (pending.has(id) || !Number.isInteger(rating) || rating < 0 || rating > 5) return;
    const previous = vote(id);
    const status = dialog.querySelector('[data-rating-status]');
    pending.add(id); dialog.querySelectorAll('button').forEach(b => { b.disabled = true; });
    try {
      if (config.enabled) {
        const result = await request('/api/engagement', { productId:id, visitorId:visitor(), action:'rate', rating });
        const data = validMetric(result.metric); if (!data) throw new Error('Resposta inválida. Tente novamente.'); metrics.set(id, data);
      }
      if (!save(id, { ...previous, rating })) throw new Error('Não foi possível salvar neste navegador.');
      dialog.close(); notify(config.enabled ? 'Avaliação atualizada.' : 'Sua avaliação foi salva neste dispositivo.');
    } catch (error) { status.textContent = error.message; }
    finally { pending.delete(id); dialog.querySelectorAll('button').forEach(b => { b.disabled = false; }); refresh(id); }
  }
  async function init() {
    try {
      const response = await fetch('/dados/engajamento-config.json?v=20261012', { cache:'no-store', signal:AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json();
        const u = new URL(data.apiBase || location.origin);
        if (u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash && u.pathname === '/' && (u.origin === location.origin || u.hostname === 'impacto360-engajamento.mauricio3010.chatgpt.site')) config = { enabled:data.enabled === true, apiBase:u.origin };
      }
      const snapshot = await fetch('/dados/engajamento-publico.json?v=20261012', { cache:'no-store', signal:AbortSignal.timeout(5000) });
      if (snapshot.ok) {
        const data = await snapshot.json();
        Object.entries(data.products || {}).forEach(([id, item]) => { const m = validMetric(item); if (m?.sales) metrics.set(id, { ...m, likes:null, ratingCount:0, ratingAverage:null }); });
      }
    } catch {}
    ready = true; loadVisible();
    const observer = new MutationObserver(records => {
      if (!records.some(r => [...r.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('[data-engagement-product]') || n.querySelector?.('[data-engagement-product]'))))) return;
      clearTimeout(scheduled); scheduled = setTimeout(loadVisible, 50);
    });
    observer.observe(document.body, { childList:true, subtree:true });
    document.addEventListener('click', event => {
      const like = event.target.closest('[data-engagement-like]');
      const rate = event.target.closest('[data-engagement-rate]');
      if (like) { event.preventDefault(); changeLike(like.dataset.engagementLike); }
      if (rate) { event.preventDefault(); openRating(rate.closest('[data-engagement-product]'), rate); }
    });
    window.addEventListener('storage', event => { if (event.key === STORAGE || event.key === null) document.querySelectorAll('[data-engagement-product]').forEach(controls); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
