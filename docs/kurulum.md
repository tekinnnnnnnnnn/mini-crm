# Kurulum Rehberi

## 1) Ön Koşullar
- Node.js 18+ (öneri: 20)
- PostgreSQL 14+ (development/production için)

> Testler SQLite (in-memory) ile çalışacak şekilde ayarlıdır; Postgres gerektirmez.

## 2) Ortam Değişkenleri
```bash
copy .env.example .env
```

Önemli değişkenler:
- `NODE_ENV`: `development|test|production`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- `DB_SSL`: production ortamında gerekebilir
- `LOG_LEVEL`, `LOG_SQL`

## 3) Bağımlılıklar
```bash
npm install
```

## 4) Migration
```bash
npm run migrate
```

## 5) Çalıştırma
```bash
npm run dev
```

## 6) Doğrulama
```bash
curl http://localhost:3000/api/customers
```

