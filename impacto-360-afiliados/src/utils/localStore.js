const productsKey = 'impacto360.products'
const logsKey = 'impacto360.logs'
const queueKey = 'impacto360.mlQueue'

export function loadProducts(fallback) {
  try {
    const saved = localStorage.getItem(productsKey)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export function saveProducts(products) {
  localStorage.setItem(productsKey, JSON.stringify(products))
}

export function appendLog(entry) {
  const logs = getLogs()
  const next = [{ ...entry, createdAt: new Date().toISOString() }, ...logs].slice(0, 80)
  localStorage.setItem(logsKey, JSON.stringify(next))
  return next
}

export function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(logsKey) || '[]')
  } catch {
    return []
  }
}

export function addToSyncQueue(item) {
  const queue = getSyncQueue()
  const next = [{ ...item, queuedAt: new Date().toISOString() }, ...queue].slice(0, 100)
  localStorage.setItem(queueKey, JSON.stringify(next))
  return next
}

export function getSyncQueue() {
  try {
    return JSON.parse(localStorage.getItem(queueKey) || '[]')
  } catch {
    return []
  }
}
