# Gereksinim Analizi (Proje 2 - MiniCRM)

## 1) Amaç ve Kapsam
Bu projenin amacı, e-ticaret firmasının dağınık şekilde (Excel + WhatsApp) yürüttüğü müşteri/ürün/sipariş süreçlerini tek bir MiniCRM sistemi altında toplayarak:
- Sipariş kaybını azaltmak
- Hatalı/eksik kayıtları yönetmek
- Stok ve sipariş durumlarını izlenebilir kılmak
- Veri geçişini (ETL) kontrollü yapmak

Kapsam:
- Müşteri yönetimi
- Ürün ve stok yönetimi
- Sipariş yönetimi
- Excel/CSV müşteri verisi içe aktarma (ETL)
- Test, loglama, konfigürasyon ve migration iyileştirmeleri
- Dokümantasyon

## 2) Paydaşlar ve Roller
- **Müşteri (firma sahibi/operasyon):** İş kuralları ve süreç onayı
- **Operasyon personeli:** Günlük müşteri/sipariş işlemleri
- **Geliştirici ekip:** Uygulama, test, CI, migration, dokümantasyon
- **Sistem yöneticisi/DevOps:** Ortam konfigürasyonu, secret yönetimi

## 3) Mevcut Durum ve Sorunlar
- Müşteri verileri: Excel dosyalarında
- Ürün/sipariş: WhatsApp mesajlarında
- Repo durumu: ~%40, eksik API uçları, yarım şema, config sorunları, bozuk test/migration, dağınık loglama

## 4) Varsayımlar
- Sistem tek firma (multi-tenant değil) olarak çalışır.
- İlk aşamada WhatsApp mesajlarının otomatik import’u yok; siparişler UI/API ile sisteme girilir.
- ETL yalnızca müşteri verisini içe aktarır (ürün/sipariş ETL’i kapsam dışı).

## 5) Fonksiyonel Gereksinimler

### 5.1 Müşteri Yönetimi
- Müşteri oluşturma, listeleme, detay görüntüleme, güncelleme, silme (soft delete tercih edilebilir).
- Alanlar:
  - Ad (zorunlu)
  - Soyad (opsiyonel; yoksa boş kalabilir)
  - Telefon (opsiyonel ama önerilen; validasyon + normalize)
  - Email (opsiyonel; format validasyonu)
  - Adres (opsiyonel; kargo gerekiyorsa siparişte zorunlu hale gelebilir)
  - Not (opsiyonel)
- Duplicate önleme:
  - Aynı müşteri iki kere eklenmemeli; ancak isim aynı kişiler olabilir.
  - Sistem, **eşleşme/tekilleştirme** için en azından telefon ve/veya email üzerinden benzersizlik kuralları uygular.
  - Telefon/email yoksa, sistem “muhtemel duplicate” uyarısı üretir (hard-block değil).

### 5.2 Ürün ve Stok Yönetimi
- Ürün oluşturma, listeleme, güncelleme, pasife alma (silme yerine).
- Stok takibi:
  - Bazı ürünlerde stok takip edilmez (ör. hizmet ürünleri). Bu ürünlerde stok alanı görünse bile iş kuralı stok düşümü uygulamaz.
  - Stok takibi yapılan ürünlerde mevcut stok görülebilir.
- Fiyat yapısı:
  - Ürün birim bazında fiyat tutar.
  - Bazı ürünlerde birden fazla fiyat türü olabilir (ör. perakende/toptan, kampanya). Fiyat türlerinin tanımı konfigüre edilebilir olmalı.

### 5.3 Sipariş Yönetimi
- Sipariş oluşturma:
  - Müşteri sistemde yoksa da sipariş verilebilmeli.
    - Çözüm: Sipariş “misafir müşteri” bilgileri ile oluşturulabilir veya sipariş sırasında müşteri hızlıca oluşturulabilir.
- Sipariş kalemleri:
  - Her siparişte 1+ ürün kalemi bulunur.
  - Kalemde ürün, adet, birim fiyat, satır toplamı saklanır.
- Stok yoksa ne olur:
  - Stok takip edilen ürünlerde, stok yetersizse sistem varsayılan olarak siparişi engeller **veya** backorder (stok eksiye düşme) seçeneği sunar.
  - Bu karar konfigürasyonla yönetilebilir (varsayılan: engelle).
- Sipariş durumları:
  - En az: `Taslak`, `Hazırlanıyor`, `Kargoya Verildi`, `Teslim Edildi`, `İptal`
  - Durum geçişleri loglanır ve zaman damgası tutulur.

## 5.4 Yetkilendirme (MVP)
- MVP için tek rol: `admin` (tüm işlemler).
- Eğer rol ayrımı istenirse: `operator` (CRUD + sipariş), `viewer` (salt okuma).

## 6) Veri Gereksinimleri (ETL)
Giriş: Excel/CSV müşteri dosyası (kolonlar eksik olabilir).

### 6.1 Kolon Eşlemesi (Öneri)
- `Ad` + `Soyad`: ad/soyad ayrıştırması; tek kolonda gelirse parçalanır.
- `Telefon`: normalize edilir (Türkiye odaklı):
  - `+90`, `90`, `0` önekleri normalize edilerek tek formata getirilir (örn. `+905xxxxxxxxx` veya `05xxxxxxxxx` seçilecek).
  - Boşluk, parantez, tire gibi karakterler temizlenir.
- `Email`: lowercase, trim; basit format kontrolü (örn. `@` ve domain).
- `Adres`: opsiyonel; tırnak vb. karakterler temizlenebilir.
- `Not`: ham metin olarak saklanır.

### 6.2 Temizleme ve Hata Yönetimi
- Eksik kolon varsa: mümkün olan alanlar içe alınır, eksikler “uyarı” olarak raporlanır.
- Hatalı email: kayıt yine alınır ancak email alanı boş bırakılır ve rapora yazılır.
- Telefon eksik/çok kısa: kayıt alınır, telefon boş bırakılır ve rapora yazılır.
- Duplicate yönetimi:
  - Telefon veya email eşleşiyorsa “muhtemel aynı kişi” olarak işaretlenir.
  - Tam otomatik birleştirme yerine rapor + manuel onay tercih edilir (varsayılan).

### 6.3 ETL Çıktıları
- Başarılı içe aktarılan kayıt sayısı
- Hatalı/şüpheli kayıt listesi (satır no + sorun)
- Duplicate şüpheli listesi (eşleşme kriteri ile)

## 7) Non-Functional Gereksinimler
- **Güvenlik:** Şifre/secret’lar repoya yazılmayacak, `.env` üzerinden yönetilecek.
- **Performans:** Listeleme uçları sayfalama (pagination) desteklemeli; yavaş ekranlar için ölçüm (baseline) yapılmalı.
- **Loglama:** Gürültüsüz ama izlenebilir; request/response meta, hata stack, traceId.
- **Test:** Kritik akışlar için birim + entegrasyon testleri (minimum güvence seviyesi).
- **Konfigürasyon:** Test/üretim ayrımı; bağlantı ayarları kolay değişebilir.

## 8) Kabul Kriterleri (Özet)
- Müşteri CRUD çalışır, soyad opsiyoneldir.
- Duplicate yönetimi telefon/email temelli çalışır.
- Ürünlerde stok takip seçeneği vardır; stok takip edilmezse stok düşümü uygulanmaz.
- Sipariş oluşturma, durum yönetimi ve stok politikası kararı uygulanır.
- ETL içe aktarma: normalize/temizleme + rapor üretimi.
- Loglama ve temel testler çalışır.

## 9) Açık Sorular (Müşteriye Sorulacak Liste)
### Müşteri
1. Soyadı olmayan müşterilerde fatura/kargo süreçlerinde nasıl bir çıktı bekleniyor (tek isim mi, “-” mi)?
2. Duplicate kuralı ne olmalı: telefon mu, email mi, ikisi de mi? Telefon/email yoksa ne yapılmalı?
3. Adres opsiyonel denmiş; **sipariş aşamasında** kargo gerekiyorsa adres zorunlu mu?

### Ürün/Stok
4. “Stok takibi yapılmayan ürün” kategorileri neler (hizmet/dijital vb.)?
5. Stok yetersizse sipariş engellensin mi, yoksa backorder kabul edilsin mi?
6. Birden fazla fiyat türü için gerekli türler neler (perakende/toptan/kampanya)? Kullanıcı seçimi nasıl olacak?

### Sipariş
7. “Müşteri yoksa sipariş verilebilmesi” için tercih: misafir müşteri mi, yoksa sipariş ekranında hızlı müşteri oluşturma mı?
8. Sipariş durumları kesin listesi ve olası geçişler (iptal/iadeler var mı)?
9. Siparişe kargo firması/ takip no gibi alanlar eklenecek mi?

### ETL
10. Excel dosyası formatı değişken mi? Örnek dosyada kolon adları sabit mi?
11. Telefon format standardı ne olsun: `+905...` mı `05...` mı?
12. Hatalı email/eksik telefon durumunda kayıt alınsın mı yoksa reddedilsin mi?
13. Duplicate şüphelileri otomatik birleştirelim mi, manuel onayla mı?

### Test/Log/Config
14. “Çok detaylı test gerek yok” minimum beklenti nedir? Kritik akışlar hangileri?
15. Log saklama/retention beklentisi var mı? Kişisel veri (KVKK) açısından loglarda neler maskelenmeli?
16. Test ve gerçek ortam farkları neler (DB, baseURL, cache, rate limit, vs.)?

### Migration/Şema
17. Tablo isimleri dili tercihi: İngilizce mi Türkçe mi? Mevcut repo hangisine daha yakın?
18. “Mevcut DB’yi çok bozmadan” hangi tablolar üretimde aktif ve dolu?
19. Sipariş tablosundaki “karışıklık” ne? Hangi alanlar/ilişkiler problemli?
