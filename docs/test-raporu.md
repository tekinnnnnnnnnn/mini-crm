# Test Süreci ve Sonuç Raporu

## 1) Test Türleri
### Birim testleri
- `tests/validation.unit.test.js`: input normalize/validasyon yardımcıları

### Entegrasyon testleri (API)
- `tests/customers.test.js`: customer CRUD akışı
- `tests/orders.test.js`: order oluşturma + status güncelleme + filtreli listeleme

### Mock/Stub
- `tests/orderService.mock.test.js`: `src/lib/logger` mock’lanarak servis testi örneği

## 2) Çalıştırma
```bash
npm install
npm run lint
npm run test:smoke
npm run test:coverage
```

> Testler `NODE_ENV=test` ve `sqlite` (in-memory) ile çalışacak şekilde ayarlanmıştır; harici Postgres gerektirmez.

## 3) CI Pipeline
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Adımlar: `npm ci` → `npm run lint` → `npm run test:coverage`
- Coverage çıktısı artifact olarak yüklenir (`coverage/`).

## 4) Kapsam (Coverage) Sonuçları
Bu rapor, `npm run test:coverage` çıktısındaki `All files` satırı ile güncellenmelidir.

Örnek format:
```
All files | % Stmts | % Branch | % Funcs | % Lines
```
