# Veri Geçişi (ETL) - Müşteri Import

## 1) Amaç
Eski Excel/CSV müşteri verisini sisteme alırken:
- Eksik/bozuk verileri tespit etmek
- Telefon/email gibi alanları normalize etmek
- Hatalı kayıtları raporlamak
- Duplicate kayıtları önlemek veya kontrollü birleştirmek

## 2) Girdi Formatı
ETL scripti CSV bekler. Excel dosyasını CSV olarak dışa aktarın.

Desteklenen kolon adları (case-insensitive):
- Ad: `Ad`, `Isim`, `FirstName`, `first_name`
- Soyad: `Soyad`, `LastName`, `last_name`
- Ad Soyad (tek kolon): `Ad Soyad`, `AdSoyad`, `Name`
- Telefon: `Telefon`, `Phone`, `Tel`
- Email: `Email`, `E-posta`, `Eposta`
- Adres: `Adres`, `Address`
- Not: `Not`, `Note` (raporlanır; DB’ye yazılmaz)

## 3) Çalıştırma
```bash
# dry run + rapor
npm run etl:customers -- data/customers.csv --dry-run --report etl-report.json

# import (duplicate skip)
npm run etl:customers -- data/customers.csv --report etl-report.json

# import (duplicate upsert)
npm run etl:customers -- data/customers.csv --mode upsert --report etl-report.json
```

> Not: Script DB’ye bağlanır; `.env` ayarları doğru olmalıdır ve migration’lar uygulanmış olmalıdır (`npm run migrate`).

Örnek veri:
- `data/musteriler-ornek.csv`

## 4) Temizleme/Validasyon Kuralları
- `firstName`: eksikse satır içe alınır, isim **tahmin edilir** (rapora “warning” düşer).
- `email`: normalize (trim + lowercase). Geçersizse DB’ye yazılmaz, rapora “warning” düşer.
- `phone`: sadece rakama indirgenir ve TR formatları tek tipe çekilir:
  - `0XXXXXXXXXX` → `90XXXXXXXXXX`
  - `+90...`/`90...` → `90XXXXXXXXXX`
  - `XXXXXXXXXX` → `90XXXXXXXXXX`
  - Çok kısa ise DB’ye yazılmaz, rapora “warning” düşer.
- Tırnaklar ve fazla boşluklar temizlenir.

## 5) Duplicate Yönetimi
Öncelik sırası:
1. Telefon eşleşmesi (`phone`)
2. Email eşleşmesi (`email`)
3. Telefon/email yoksa heuristik: `firstName|lastName|address` aynı ise duplicate sayılır (satır bazlı)

Davranış:
- `--mode skip` (default): duplicate kayıt eklenmez, rapora yazılır.
- `--mode upsert`: duplicate ise mevcut kayıt güncellenir (email/phone boşsa eskisi korunur).

## 6) Rapor (JSON)
Rapor ya stdout’a basılır ya da `--report` ile dosyaya yazılır.
Alanlar:
- `totals`: created/updated/skippedDuplicate/invalid/warnings
- `invalidRows`: zorunlu alan eksikleri (örn. firstName)
- `warnings`: normalize sırasında düşürülen alanlar (email/phone)
- `duplicates`: phone/email/heuristic kaynaklı duplicate tespitleri

## 7) Dosyalar
- Script: `scripts/etl/import-customers.js`
