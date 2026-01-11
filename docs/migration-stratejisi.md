# Migration Stratejisi (Belirsizliklerin Çözümü)

## 1) “Mevcut DB’yi çok bozmadan” yaklaşımı
- Mevcut tabloları silmek/yeniden adlandırmak yerine **additive** ilerlenir:
  - Yeni kolon ekle (mümkünse `NULL` ile başlat)
  - Gerekirse backfill/update ile veri doldur
  - Son adımda constraint/default/NOT NULL (risk değerlendirmesi ile)
- Veri kaybı yaratabilecek işlemler (DROP/RENAME) ancak plan + onay + yedek sonrası yapılır.

## 2) Tablo isimlendirme kararı
Repo mevcut yapısı zaten **İngilizce, çoğul, snake_case** kullanıyor:
- `customers`, `orders`, `products`, `product_prices`, `order_items`

Bu yüzden standart olarak:
- Tablo isimleri: İngilizce + çoğul + snake_case
- Kolon isimleri: snake_case (`customer_id`, `created_at` vb.)

## 3) Dolu tablolarla migration (özellikle orders)
- Dolu tablolarda `NOT NULL`/FK gibi kısıtlar migration’ı kilitleyebilir.
- Bu repo için uygulanan yaklaşım:
  - Kolon ekleme ve default/backfill adımlarını **best-effort** ve kontrollü yapmak
  - Kısıt/indeks eklemelerini try/catch ile korumak (ortam/dialect farkları için)

## 4) Uygulanan migration seti
- `migrations/20260104000000-fix-schema-alignment.js` (customers/is_active, orders/status + FK/index)
- `migrations/20260104001000-add-customer-phone-unique-and-order-shipping.js` (customers phone unique, orders shipping)
- `migrations/20260104002000-create-products.js`
- `migrations/20260104002100-create-product-prices.js`
- `migrations/20260104003000-orders-guest-items-stock-status.js` (orders guest + order_items)

