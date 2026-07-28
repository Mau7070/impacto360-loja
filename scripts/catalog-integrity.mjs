function text(value) {
  return String(value ?? "").trim();
}

function normalize(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueMatches(value, pattern, formatter = match => match[1]) {
  const matches = new Set();
  for (const match of normalize(value).matchAll(pattern)) {
    matches.add(formatter(match));
  }
  return [...matches].sort();
}

export function variationSignals(product) {
  const source = [
    product?.name,
    product?.nome,
    product?.title,
    product?.model,
    product?.modelo,
  ].filter(Boolean).join(" ");

  return {
    voltage: uniqueMatches(source, /\b(110|127|220|230|240)\s*v\b/g),
    wattage: uniqueMatches(source, /\b(\d{3,5})\s*w\b/g),
    capacity: uniqueMatches(
      source,
      /\b(\d+(?:[.,]\d+)?)\s*(ml|l|litros?|kg|g|gb|tb|cm|mm|pol(?:egadas?)?)\b/g,
      match => `${match[1].replace(",", ".")}${match[2]}`,
    ),
  };
}

function normalizedImage(product) {
  return normalize(product?.image || product?.imagem || product?.fotoPrincipal).replace(/#.*$/, "");
}

function conflictingDimension(entries, dimension) {
  const observed = new Set(entries.flatMap(entry => entry.signals[dimension]));
  return observed.size > 1 ? [...observed] : [];
}

export function findIncompatibleSharedImages(products) {
  const groups = new Map();
  for (const product of products) {
    const image = normalizedImage(product);
    if (!image) continue;
    if (!groups.has(image)) groups.set(image, []);
    groups.get(image).push({
      id: text(product.id),
      name: text(product.name || product.nome || product.title),
      signals: variationSignals(product),
    });
  }

  const conflicts = [];
  for (const [image, entries] of groups) {
    if (entries.length < 2) continue;
    const dimensions = {};
    for (const dimension of ["voltage", "wattage", "capacity"]) {
      const values = conflictingDimension(entries, dimension);
      if (values.length) dimensions[dimension] = values;
    }
    if (!Object.keys(dimensions).length) continue;
    conflicts.push({ image, dimensions, products: entries });
  }
  return conflicts;
}

export function quarantineIncompatibleSharedImages(products) {
  const conflicts = findIncompatibleSharedImages(products);
  const blockedIds = new Set(conflicts.flatMap(conflict => conflict.products.map(product => product.id)));
  return {
    accepted: products.filter(product => !blockedIds.has(text(product.id))),
    blockedIds: [...blockedIds],
    conflicts,
  };
}
