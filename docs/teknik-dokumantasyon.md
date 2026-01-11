# Teknik Dokümantasyon (Kısa - Ekip İçin)

## 1) Mimari
- Katmanlar: Route → Service → Model
- ORM/migration: Sequelize + versioned migrations
- DB: PostgreSQL (testte opsiyonel sqlite)

Detay: `docs/mimari-tasarim.md`

## 2) Konfigürasyon
- `.env` tabanlı config: `src/config/index.js`
- Prod’da `DATABASE_URL` (önerilen) veya `DB_*` alanları zorunlu

Detay: `docs/konfigurasyon.md`, `docs/kurulum.md`

## 3) Loglama (gürültü kontrolü)
- `traceId` request/response header: `x-trace-id`
- Request log seviyesi: `LOG_REQUESTS=off|debug|info|warn`
- Yavaş istek işareti: `SLOW_REQUEST_MS` → `slow_request` (`warn`)

Detay: `docs/loglama.md`

## 4) Test Stratejisi (minimum güvence)
- Unit: normalize/validasyon yardımcıları
- Integration: customers/orders/products API akışları
- Smoke test: `npm run test:smoke`

Detay: `docs/test-raporu.md`

## 5) Uygulanan İş Kuralı Kararları
### 5.1 Ürün/Stok/Fiyat
- `trackStock=false` ise `stockQuantity=null`
- Çoklu fiyat türü: `product_prices` + `(productId, priceType)` upsert

### 5.2 Sipariş
- Müşteri yokken sipariş: `guestCustomer` ile oluşturma
- Stok yetersizse default: `409`; backorder: `ORDER_ALLOW_BACKORDER=true`
- Durumlar: `draft → preparing → shipped → delivered` (+ `cancelled`)

Detay: `docs/migration-raporu.md`, `docs/migration-stratejisi.md`

