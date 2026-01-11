# Migration Problemleri ve Raporu

## 1) Tespit Edilen Problemler (Mevcut Repo)
- `migrations/20240101000000-create-customer.js` içinde `customers.is_active` yok; modelde `isActive` mevcut.
- `migrations/20240102000000-create-order.js` içinde:
  - `orders.status` nullable; modelde NOT NULL + default `pending`.
  - `orders.customer_id` için foreign key constraint yok.

## 2) Uygulanan Düzeltmeler (Versioned Migration)
Eski migration dosyalarını “geriye dönük düzenlemek” yerine (prod ortamda uygulanmış olabilir), yeni bir **düzeltici migration** eklendi:
- `migrations/20260104000000-fix-schema-alignment.js`

Bu migration:
- `customers` tablosuna `is_active` ekler (yoksa).
- `orders.status` alanını NOT NULL + default `pending` yapar (gerekliyse).
- `orders.customer_id` için FK constraint eklemeyi dener (best-effort).
- `orders.customer_id` için index eklemeyi dener (best-effort).

## 3) Versioned Migration Akışı (Repo Standardı)
- Yeni her şema değişikliği için yeni migration dosyası eklenir (mevcut dosyalar “tarihi kayıt” gibi düşünülür).
- Migration ismi: `YYYYMMDDHHmmss-kisa-aciklama.js`
- Uygulama:
  - `npm run migrate` (en son sürüm)
  - `npm run migrate:status` (durum)
  - `npm run migrate:undo` (son migration geri al)

## 4) Notlar / Riskler
- Constraint/index ekleme adımları, dialect/ortam farklarında hata verebilir; migration içinde bu adımlar “best-effort” olarak try/catch ile korunmuştur.
- Prod ortamda constraint eklemeden önce mevcut verinin tutarlılığı kontrol edilmelidir (özellikle `orders.customer_id`).

## 5) Belirsizlik Kararları (Migration Talepleri)
- “Mevcut veritabanını çok bozmadan”: additive migration yaklaşımı benimsendi (kolon ekle → backfill → gerekirse constraint).
- İsimlendirme kararı: repo mevcut yapıya uygun şekilde İngilizce + çoğul + snake_case (`customers`, `orders`, `products`...).
- Dolu tablolar (özellikle `orders`): status backfill gibi veri-korumalı adımlar eklendi ve yeni tablo eklemeleri “varsa dokunma” mantığıyla korundu.

Detay: `docs/migration-stratejisi.md`
