# Geliştirme Rehberi (Kod Standardı + Branch Stratejisi)

## 1) Kod Standardı
- `npm run lint`: ESLint ile statik kontrol
- `npm run format`: Prettier ile otomatik format
- PR açmadan önce: `npm run format` → `npm run lint` → `npm test`

## 2) Branch Stratejisi (Öneri)
- Varsayılan branch: `main`
- Günlük geliştirme: feature branch
  - `feature/<kisa-konu>` (örn. `feature/orders-post`)
- Hata düzeltme: `fix/<kisa-konu>`
- Acil hotfix: `hotfix/<kisa-konu>`

Akış:
1. `main` güncel alınır.
2. Branch açılır, küçük ve odaklı commit’ler atılır.
3. PR açılır, en az 1 reviewer atanır.
4. Review sonrası squash-merge (tercih) veya merge.

## 3) PR Checklist
- [ ] Açıklama: Ne değişti, neden değişti?
- [ ] API değiştiyse: endpoint listesi / örnek istek
- [ ] Migration varsa: nasıl çalıştırılacağı
- [ ] Test eklendi/güncellendi
- [ ] Lint/format temiz (`npm run lint`, `npm run format:check`)

## 4) Code Review Rehberi
- İş kuralı doğruluğu (gereksinime uygunluk)
- Hata durumları ve HTTP status code’lar
- Loglarda PII (telefon/email) sızması
- Migration/model uyumu
- Test kapsamı (kritik akışlar)



