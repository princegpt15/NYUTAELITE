export const PRODUCTS = Object.freeze({
  'premium-100g': { name: 'Premium Makhana', quality: 'Premium', weightGrams: 100, pricePaise: 16000 },
  'premium-200g': { name: 'Premium Makhana', quality: 'Premium', weightGrams: 200, pricePaise: 31000 },
  'premium-250g': { name: 'Premium Makhana', quality: 'Premium', weightGrams: 250, pricePaise: 38000 },
  'normal-100g': { name: 'Normal Makhana', quality: 'Normal', weightGrams: 100, pricePaise: 12000 },
  'normal-200g': { name: 'Normal Makhana', quality: 'Normal', weightGrams: 200, pricePaise: 23000 },
  'normal-250g': { name: 'Normal Makhana', quality: 'Normal', weightGrams: 250, pricePaise: 28000 },
});

export function getConfiguredPrice(productId) {
  const rawPrices = process.env.PRODUCT_PRICES_PAISE_JSON;
  if (rawPrices) {
    try {
      const price = JSON.parse(rawPrices)[productId];
      if (Number.isSafeInteger(price) && price > 0) return price;
    } catch {
      // Fallback to default catalog price
    }
  }
  return PRODUCTS[productId]?.pricePaise ?? null;
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}
