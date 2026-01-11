# Konfigürasyon Kararları (Belirsizliklerin Çözümü)

## 1) Test vs Production farkları
Bu projede ortamlar `NODE_ENV` ile ayrılır:
- `development`: geliştirici makinesi, daha ayrıntılı log
- `test`: test koşumu, opsiyonel `sqlite` (in-memory)
- `production`: fail-fast (zorunlu env var kontrolü), JSON log, daha az request log

Uygulama: `src/config/index.js`

## 2) Şifreleri sisteme koymayın (secret yönetimi)
- Repo içine şifre yazılmaz.
- `.env.example` ve `.env.production.example` sadece **örnek** amaçlıdır.
- Production’da gerçek secret’lar:
  - CI/CD secret store (GitHub Actions Secrets vb.)
  - Sunucu environment variables
  - Secret manager (opsiyonel)

## 3) Bağlantı ayarları kolay değişsin
DB bağlantısı için iki seçenek desteklenir:
1. `DATABASE_URL` (önerilen): tek satır connection string
2. Ayrık alanlar: `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS`

Production’da:
- `DATABASE_URL` varsa onun formatı doğrulanır.
- `DATABASE_URL` yoksa DB alanları zorunlu kabul edilir.

## 4) İlgili dosyalar
- Config: `src/config/index.js`
- Dev env örneği: `.env.example`
- Prod env örneği: `.env.production.example`

