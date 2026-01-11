# Proje Durumu (Yarım Kalmış Proje Analizi)

## 1) “Nereye kadar gelmiş?” Özeti
Repo şu an çalışır durumda bir REST API iskeletine sahip ve temel işlevler tamamlandı:
- Customers CRUD (`/api/customers`)
- Products CRUD + fiyat türleri (`/api/products`, `/api/products/{id}/prices`)
- Orders oluşturma + durum güncelleme (`/api/orders`, `/api/orders/{id}/status`)
- ETL müşteri import (`scripts/etl/import-customers.js`)
- Migration, loglama, test altyapısı

## 2) Eski/Yeni Dosya Karışıklığı (Ne yapıldı)
- Eski `api/api.txt` güncellendi (gerçek uçlar ile uyumlu): `api/api.txt`
- “Model ↔ migration” uyumsuzlukları için düzeltici migration’lar eklendi: `migrations/20260104000000-fix-schema-alignment.js` ve devamı
- Testler “flaky” olmaması için sqlite in-memory test DB ile tasarlandı

## 3) Testler (hangileri çalışıyor?)
Test seti:
- Unit: `tests/validation.unit.test.js`
- Integration: `tests/customers.test.js`, `tests/products.test.js`, `tests/orders.test.js`
- Mock örneği: `tests/orderService.mock.test.js`

Minimum güvence koşumu:
- `npm run test:smoke`

## 4) Bilinen Eksikler / Sonraki Adımlar
- Sipariş kalem fiyatı şu an request’ten geliyor (`unitPrice`); fiyatın `product_prices` üzerinden seçilmesi/hesaplanması isteniyorsa ek iş kuralı gerekir.
- `orders` için daha zengin alanlar (kargo firması, takip no vb.) istenirse migration + model + API genişletilecek.
- ETL’de “not” alanı raporlanıyor ancak DB’ye yazılmıyor (modelde alan yok).

