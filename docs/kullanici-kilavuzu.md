# Kullanıcı Kılavuzu (MVP)

Bu proje şu an yalnızca REST API sağlar (UI yok).

## 1) Müşteri Yönetimi (Özet)
- Oluştur: `POST /api/customers`
- Listele: `GET /api/customers?limit=50&offset=0`
- Detay: `GET /api/customers/{id}`
- Güncelle: `PUT /api/customers/{id}`
- Sil: `DELETE /api/customers/{id}`

Örnek oluşturma:
```json
{ "firstName": "Ahmet", "lastName": "Yılmaz", "phone": "+90 532 111 2233", "email": "ahmet@mail.com" }
```

## 2) Sipariş Yönetimi (Özet)
- Oluştur: `POST /api/orders` (müşteri veya misafir)
- Listele: `GET /api/orders?limit=20&offset=0&status=draft&customerId=1`
- Detay: `GET /api/orders/{id}`
- Durum güncelle: `POST /api/orders/{id}/status`

Örnek sipariş oluşturma (müşteri ile):
```json
{
  "customerId": 1,
  "requiresShipping": true,
  "shippingAddress": "Kadıköy",
  "items": [{ "productId": 1, "quantity": 2, "unitPrice": 10 }]
}
```

Örnek sipariş oluşturma (misafir):
```json
{
  "guestCustomer": { "firstName": "Guest", "phone": "05321112233" },
  "items": [{ "productId": 1, "quantity": 1, "unitPrice": 99 }]
}
```

## 3) ETL (Müşteri içe aktarma)
Bkz: `docs/etl.md`

## 4) Trace ID
İsteklere opsiyonel `x-trace-id` header'ı ekleyebilirsiniz; response'ta aynı header döner.
