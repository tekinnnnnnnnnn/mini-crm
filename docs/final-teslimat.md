# Final Teslimatı (Checklist)

Bu doküman, final tesliminde istenen çıktıları repo içinde nerede bulacağınızı ve nasıl üreteceğinizi özetler.

## 1) Çalışır durumda proje
- Başlatma: `npm install` → `copy .env.example .env` → `npm run migrate` → `npm run dev`
- Sağlık kontrolü (örnek): `GET http://localhost:3000/api/customers`

Windows PowerShell’de `npm` script policy hatası alırsanız:
- `cmd /c npm install`
- `cmd /c npm run migrate`
- `cmd /c npm run dev`

## 2) Test raporu (kapsam dahil)
- Test dokümanı: `docs/test-raporu.md`
- Coverage üretimi: `npm run test:coverage`
- Çıktı klasörü: `coverage/`
- `docs/test-raporu.md` içindeki “Kapsam” bölümüne `All files` satırını yapıştırın.

## 3) Migration dosyaları
- Migration klasörü: `migrations/`
- Düzeltici migration: `migrations/20260104000000-fix-schema-alignment.js`
- Migration raporu: `docs/migration-raporu.md`

## 4) ETL scriptleri ve sonuç raporu
- ETL scripti: `scripts/etl/import-customers.js`
- Kullanım dokümanı: `docs/etl.md`
- Örnek sonuç raporu üretimi:
  - `npm run etl:customers -- data/customers.csv --dry-run --report etl-report.json`
  - (DB’ye yazmak için `--dry-run` kaldırın)

## 5) Tamamlanmış dokümantasyon
- Gereksinim: `docs/gereksinim-analizi.md`
- Mimari: `docs/mimari-tasarim.md`
- Teknik: `docs/teknik-dokumantasyon.md`
- Kurulum: `docs/kurulum.md`
- Kullanıcı kılavuzu: `docs/kullanici-kilavuzu.md`
- API (OpenAPI): `docs/api/openapi.yaml`
- Loglama: `docs/loglama.md`
- Geliştirme rehberi: `docs/gelistirme-rehberi.md`

## 6) PR ve code review geçmişi
- Branch stratejisi + PR checklist: `docs/gelistirme-rehberi.md`


