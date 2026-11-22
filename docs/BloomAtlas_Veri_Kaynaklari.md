# BloomAtlas - Veri Kaynakları (Doğrulanmış Liste)

**Hazırlayan:** Samira Porduğan (Tuğçe'nin kaynak listesi üzerine)
**Tarih:** 10 Kasım 2026
**Bağlı olduğu dosyalar:** Ana Proje Takip Dosyası (v5), Yol Haritası

## 1. Tuğçe'nin Listesinin Doğrulaması

| Kaynak | Tuğçe'nin notu | Sonuç | Eklenen not |
|---|---|---|---|
| iNaturalist API | Yaklaşık 1 istek/sn | **Doğru** | Üst sınır dakikada 100 istek; dakikada 60 ve günde 10.000 isteğin altında kalınması isteniyor. API uygulama geliştirmek içindir, toplu veri çekmek için değil. Büyük veri için iNaturalist'in hazır dışa aktarımları kullanılır. |
| iNaturalist fotoğraf lisansları | Fotoğraf ve gözlem lisansları ayrı | **Doğru** | Varsayılan lisans CC BY-NC'dir ve kullanıcıların çoğu bunu değiştirmez. Kural 4 (yalnızca CC0, CC BY, CC BY-SA) bu fotoğrafları zaten eler. Uygun fotoğraf sayısı az çıkabilir, tür seçerken bu kontrol edilmeli. |
| iNaturalist çiçek anotasyonu | Açık çiçek anotasyonu | **Doğru** | `term_id=12` (Plant Phenology), `term_value_id=13` (Flowering). Kullanıcılar anotasyonu tutarlı girmiyor; bazı türlerde kayıt çok az olabilir (bkz. Kural 15). |
| Kew WCVP | CC BY 4.0, Darwin Core arşivi | **Doğru** | GBIF'te ve Kew SFTP sunucusunda indirilebilir. **Önemli:** Doğal yayılış koordinatla değil, "botanik ülke" kodlarıyla (TDWG WGSRPD Level 3) verilir. Haritada göstermek için WGSRPD geometrisi gerekir (bkz. Bölüm 3). |
| Natural Earth | Public domain | **Doğru** | Ek kontrol gerekmez. |
| RESOLVE Ecoregions 2017 | CC BY 4.0; 846 ekobölge, 14 biyom, 8 realm | **Doğru** | Shapefile yaklaşık 150 MB. Yalnızca build aşamasında kullanılır, repoya girmez (Kural 11 ile uyumlu). |
| Kew SEPASAL | CC BY 4.0, CSV, 2020'den beri statik | **Doğru, ama kapsamı dar** | SEPASAL'ın tam adı "Survey of Economic Plants for **Arid and Semi-Arid Lands**". Yalnızca kurak ve yarı kurak bölgelerin faydalı bitkilerini kapsar. Tropik ve ılıman bölge çiçeklerinin çoğu burada yok. Yetiştirme bilgisi de içerir ama aynı dar kapsamla. |
| USDA Dr. Duke | CC0, CSV | **Doğru** | Dosya boyutu ve tablo sayısı ayrıca kontrol edilmedi; önemli değil. |
| GBIF Occurrence API | Kayıt lisansları karışık | **Doğru** | NC lisanslı kayıtlar ticari sürümde kullanılmaz. |
| MPNS (plan dışı) | Bulk/API yok | **Karar doğru** | Herkese açık arama portalı var; toplu veri yalnızca ortaklık yoluyla. Manuel doğrulamada kullanılabilir. |

---

## 2. Veri Modelindeki Her Alanın Kaynağı

Bu tablo, `bloomatlas.json` içindeki her alanın nereden doldurulacağını gösterir.

| Alan | Kaynak | Durum |
|---|---|---|
| `scientificName`, `family`, eş adlar | Kew WCVP | Hazır |
| `nativeRange` | Kew WCVP (botanik ülke kodları) | Hazır |
| Doğal yayılış haritası | WCVP kodları + TDWG WGSRPD geometrisi | `[ÖNERİ]` Geometrinin lisansı kontrol edilecek |
| `commonName` | iNaturalist taxa (tercih edilen yaygın ad) | `[ÖNERİ]` Doğrulanmadı, ilk denemede kontrol edilecek |
| `observations` (koordinat, tarih, ülke) | iNaturalist, yedek GBIF | Hazır |
| Fotoğraf, lisans, attribution | iNaturalist (yalnızca CC0, CC BY, CC BY-SA), yedek Wikimedia Commons | Hazır |
| `bloomMonths` | iNaturalist histogram + çiçek anotasyonu | Hazır, eşik kuralıyla (Kural 15) |
| `biomes` | RESOLVE (gözlem koordinatından, build aşamasında) | Hazır |
| `culturalStory` | Wikipedia REST API özet ucu | `[ÖNERİ]` **v5'te kaynağı yoktu** |
| `traditionalUse` | Önce SEPASAL, yoksa Dr. Duke | Hazır, SEPASAL kapsamı dar |
| `cultivation` (ışık, su, toprak) | Açık ve küresel bir kaynak bulunamadı | **Boşluk** (Bölüm 4) |
| `toxicityLevel` | Açık, yapılandırılmış ve lisanslı kaynak bulunamadı | **Boşluk** (Bölüm 4) |

---

## 3. Eklenmesi Önerilen Kaynaklar `[ÖNERİ]`

### Wikipedia REST API (kültürel hikâye)

- Uç: `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
- Anahtar gerekmez. Açıklayıcı bir `User-Agent` başlığı gönderilmesi zorunludur.
- Lisans: CC BY-SA 4.0. Ticari kullanım serbesttir, ama atıf (sayfa bağlantısı ve lisans adı) ve aynı lisansla paylaşma şartı vardır.
- Kullanım biçimi: Kısa özet kendi cümlelerimizle yazılır, altında kaynak sayfa bağlantısı ve "CC BY-SA 4.0" gösterilir. Uzun metin kopyalanmaz.

### Wikimedia Commons (yedek fotoğraf)

- iNaturalist'te uygun lisanslı fotoğraf bulunamayan türler için.
- Yine yalnızca CC0, CC BY, CC BY-SA veya public domain fotoğraflar.

### TDWG WGSRPD (doğal yayılış haritası)

- WCVP'nin kullandığı botanik ülke kodlarının sınır geometrisi.
- Flower Story'deki "doğal yayılış haritası" bunsuz çizilemez.
- Lisansı ve dosya boyutu kontrol edilecek. Natural Earth ile aynı yöntemle sadeleştirilip plugin içine gömülür.

### Trefle Plant API (yetiştirme bilgisi adayı)

- Ücretsiz token ile günde yaklaşık 1.000 istek; ışık, toprak ve çiçeklenme bilgisi bazı türlerde var.
- Kapsam türden türe değişir. Servisin şu anda çalışıp çalışmadığı ve kullanım şartları **doğrulanmadı**; ilk hafta küçük bir denemeyle kontrol edilecek.

---

## 4. Boşluklar İçin Kararlar `[ÖNERİ]`

### Yetiştirme bilgisi (`cultivation`)

1. Tür SEPASAL'da varsa oradan alınır.
2. Yoksa Trefle denenir (çalışıyorsa ve şartları uygunsa).
3. İkisinde de yoksa alan `null` kalır ve "How it grows" bölümü gizlenir. v5'teki "15-20 türde yetiştirme bilgisi" hedefi bu sırayla doldurulur.

Kaynaksız, tahmine dayalı yetiştirme bilgisi yazılmaz.

### Zehirlilik (`toxicityLevel`)

- Açık, yapılandırılmış ve lisansı net bir kaynak bulunamadı.
- MVP'de bütün türler için `unknown` kalır ve rozet gösterilmez.
- Yalnızca güvenilir bir kaynağa bağlantı verilebilen türlerde elle doldurulur.
- Öneri: bu alanı MVP kapsamından çıkarmak, zaman kalırsa geri getirmek.

---

## 5. Lisans ve Ticari Kullanım Özeti

Hocanın şirketinde ürüne dönüşme ihtimali için:

| Kaynak | Lisans | Ticari kullanım | Şart |
|---|---|---|---|
| iNaturalist fotoğrafları (filtreli) | CC0 / CC BY / CC BY-SA | Evet | Atıf; CC BY-SA'da aynı lisansla paylaşma |
| iNaturalist API | Kullanım şartları | Sınırlı | Uygulama içindir; ticari ölçekte dışa aktarım kullanılır |
| Kew WCVP | CC BY 4.0 | Evet | Atıf |
| Natural Earth | Public domain | Evet | Yok |
| RESOLVE | CC BY 4.0 | Evet | Atıf |
| Kew SEPASAL | CC BY 4.0 | Evet | Atıf |
| Dr. Duke | CC0 | Evet | Yok (atıf yine de yapılır) |
| GBIF | Kayda göre | Kayda göre | NC kayıtlar ticari sürümde kullanılmaz |
| Wikipedia | CC BY-SA 4.0 | Evet | Atıf + aynı lisansla paylaşma |
| Trefle | Doğrulanmadı | Doğrulanmadı | Şartlar okunacak |

Fotoğraf kuralı (yalnızca CC0, CC BY, CC BY-SA) uygulandığı sürece ayrı bir `commercialSafe` alanına gerek kalmaz. CC BY-SA'nın paylaşma şartı `data/SOURCES.md` içinde not edilir.

---

## 6. Tuğçe'nin 12 Kuralına Eklenen Kurallar `[ÖNERİ]`

13. iNaturalist'e dakikada 60 istekten fazla atılmaz. Build betiği istekleri sıraya koyar ve sonuçları önbelleğe alır. Canlı akış birkaç dakikada bir sorar.
14. Bütün API isteklerinde projeyi tanıtan bir `User-Agent` başlığı gönderilir.
15. `bloomMonths` yalnızca yeterli sayıda çiçek anotasyonlu kayıt varsa hesaplanır (eşik ilk denemede belirlenir, örneğin 20 kayıt). Yetersizse arayüzde "Not enough flowering records" gösterilir.
16. Wikipedia metni kendi cümlelerimizle kısa özet olarak yazılır; altında sayfa bağlantısı ve lisans gösterilir.
17. CC BY-SA içerik gösterilen her yerde lisans adı ve bağlantısı görünür.

---

## 7. 12 Türü Seçerken Kontrol Listesi `[ÖNERİ]`

Bir tür ancak şu şartları sağlıyorsa seçilir:

- [ ] WCVP'de `Accepted` kaydı var.
- [ ] iNaturalist'te CC0, CC BY veya CC BY-SA lisanslı, research kalite, koordinatlı en az birkaç gözlem var.
- [ ] Çiçeklenme ayları için yeterli anotasyonlu kayıt var (Kural 15).
- [ ] İngilizce Wikipedia sayfası var.
- [ ] Artı puan: SEPASAL veya Dr. Duke'ta geleneksel kullanım kaydı var.

İpucu: Elle aramak yerine, aday tür listesini alıp bu şartları otomatik kontrol eden küçük bir betik yazmak zaman kazandırır. Betik her tür için "geçti / kaldı ve neden" raporu üretir.

---

## 8. Kaynak Bağlantıları

- iNaturalist geliştirici sayfası: https://www.inaturalist.org/pages/developers
- Kew WCVP (GBIF): https://www.gbif.org/dataset/f382f0ce-323a-4091-bb9f-add557f3a9a2
- Kew WCVP (SFTP): http://sftp.kew.org/pub/data-repositories/WCVP/
- Natural Earth kullanım şartları: https://www.naturalearthdata.com/about/terms-of-use/
- RESOLVE Ecoregions 2017: https://developers.google.com/earth-engine/datasets/catalog/RESOLVE_ECOREGIONS_2017
- Kew SEPASAL: https://sftp.kew.org/pub/data-repositories/sepasal/
- USDA Dr. Duke: https://doi.org/10.15482/USDA.ADC/1239279
- GBIF Occurrence API: https://techdocs.gbif.org/en/openapi/v1/occurrence
- Wikipedia REST API: https://en.wikipedia.org/api/rest_v1/
- MPNS: https://mpns.kew.org/mpns-portal/

## 9. Hafta 1 Deneme Sonuçları

### 9.1 Tür İçeriği

Test türü: Rosa canina (iNaturalist taxon_id 55884)

| Kaynak | Sonuç | Bulgu | İndirme / Adres |
|---|---|---|---|
| iNaturalist | Çalışıyor | ~1.835 uygun lisanslı gözlem, ~212 çiçek anotasyonlu kayıt, en yoğun aylar Mayıs-Haziran, yaygın ad "Dog-rose" geliyor, örnek koordinat 48.8598655096,23.0865194202 | api.inaturalist.org/v1 |
| Wikipedia | Çalışıyor | Özet metni ve makale linki geliyor | en.wikipedia.org/api/rest_v1 |
| Trefle | Çalışıyor | Token gerekiyor, Rosa canina bulundu, growth alanlarının çoğu dolu, Trefle ve JSON'daki kaynaklar belirtilmeli, istek sınırı dakikada 60 istek | trefle.io/api/v1 |
| SEPASAL | Çalışıyor, tür yok | Rosa canina yok, cinsten yalnızca Rosa rubiginosa var, veri kurak bölge bitkilerini kapsıyor, lisans CC BY 4.0 | sftp.kew.org/pub/data-repositories/sepasal/data/ |
| Dr. Duke | Çalışıyor | ETHNOBOT.csv içinde 20 kayıt (ör. Kusburnu, Türkiye, Astringent), her kayıtta kaynak var, lisans CC0 | ndownloader.figshare.com/files/43363335 |
