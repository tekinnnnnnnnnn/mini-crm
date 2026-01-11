# Loglama Sistemi

## 1) Amaç
- İsteklerin uçtan uca izlenebilmesi (traceId)
- Hataların hızlı bulunabilmesi (stack + bağlam)
- Gürültüsüz ama yeterli detay (PII sızıntısını azaltma)

## 2) Trace ID Mekanizması
- Her request için `traceId` üretilir.
- İstek `x-trace-id` header’ı ile gelirse aynı değer kullanılır; yoksa sunucu üretir.
- Response header’ına `x-trace-id` eklenir.

Uygulama: `src/app.js`

## 3) Request/Response Logları
Her istek tamamlandığında `info` seviyesinde tek satır log basılır:
- `method`, `path`, `status`
- `durationMs`
- `traceId`

Uygulama: `src/app.js`

Gürültü kontrolü (konfig):
- `LOG_REQUESTS=off|debug|info|warn` (varsayılan: prod `warn`, dev `info`)
- `SLOW_REQUEST_MS=1000` üzerindeki istekler `slow_request` olarak `warn` seviyesinde loglanır.

## 4) Hata Logları
- `4xx` hatalar: `warn` seviyesinde (client kaynaklı)
- `5xx` hatalar: `error` seviyesinde ve stack dahil
- Log meta: `traceId`, `method`, `path`

Uygulama: `src/app.js`, `src/lib/logger.js`

## 5) Log Seviyeleri
- `debug`: SQL logları (opsiyonel, `LOG_SQL`)
- `info`: normal akış / request tamamlanma logu
- `warn`: doğrulama/iş kuralı hataları (4xx)
- `error`: beklenmeyen hatalar (5xx)

## 6) Örnek Log Çıktıları

### Development (human-readable)
```
2026-01-04T12:00:00.000Z [info] request {"method":"GET","path":"/api/customers","status":200,"durationMs":12,"traceId":"3f7b0d9a-3e2c-4f9e-bc2f-9b7c6f2f2f1a"}
2026-01-04T12:00:00.500Z [warn] slow_request {"method":"GET","path":"/api/products?limit=50&offset=0","status":200,"durationMs":1500,"traceId":"..."}
2026-01-04T12:00:01.000Z [warn] Request error {"message":"firstName is required","traceId":"...","method":"POST","path":"/api/customers"}
2026-01-04T12:00:02.000Z [error] Unhandled error - Error: boom ... {"traceId":"...","method":"GET","path":"/api/orders"}
```

### Production (JSON)
```json
{"level":"info","message":"request","timestamp":"2026-01-04T12:00:00.000Z","method":"GET","path":"/api/customers","status":200,"durationMs":12,"traceId":"..."}
```
