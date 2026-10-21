# Denge: Yapay zekâ destekli kalori ve makro takibi

Denge; yemek fotoğrafından kalori, protein, karbonhidrat ve yağ hesaplayan bir telefon uygulamasıdır
(iPhone, Android ve web).

## Özellikler

- **Kişisel plan:** cinsiyet, yaş, boy, kilo, aktivite, hedef ve hız sorularından günlük kalori ve makro
  hedefi (Mifflin-St Jeor veya Harris-Benedict).
- **Fotoğrafla yemek analizi:** kamera veya galeriden. Yapay zekâ malzemeleri, gramları ve makroları çıkarır.
- **Sonucu düzelt:** "pilav yarım porsiyondu, yanında ayran vardı" gibi bir açıklamayla düzeltme.
- **Besin etiketi okuma, barkod ile ürün bulma** (Open Food Facts) ve **yemek arama** (85 yaygın yiyecek, Open
  Food Facts ürünleri ve "AI ile hesapla").
- **Malzeme düzenleme:** gram değişince değerler orantılı güncellenir. Porsiyon çarpanı, kayıtlı yemekler, elle giriş.
- **Egzersiz:** hazır sporlar (MET formülü) veya serbest metinle AI tahmini.
- **Su takibi, aralıklı oruç** (13:11, 16:8, 18:6, 20:4, 36 saat, özel), **kilo ve VKİ**, haftalık grafikler,
  **seri (streak)**.
- **12 sağlıklı tarif** ve **AI diyetisyen** sohbeti (akışlı cevap, hedeflerini ve bugün yediklerini bilir).
- **Türkçe ve İngilizce** (cihaz diline göre, profilden değiştirilebilir), **metrik ve İngiliz birimleri**.
- Veriler **yalnızca telefonda** saklanır. Hesap, reklam ve izleme yok.

## Kurulum

Gerekenler: Node.js 20 veya üstü, iPhone'unda App Store'dan ücretsiz **Expo Go** uygulaması, bilgisayarla
telefonun aynı Wi-Fi ağında olması.

```bash
git clone https://github.com/erenaksoyy/Denge.git
cd Denge
npm install
```

### 1. Gemini API anahtarı

1. <https://aistudio.google.com/apikey> adresinden ücretsiz bir anahtar al.
2. Proje klasöründe `.env.example` dosyasını `.env.local` adıyla kopyala (`cp .env.example .env.local`)
   ve anahtarı yapıştır:

   ```
   GEMINI_API_KEY=buraya-anahtarin
   ```

   `.env.local` git'e eklenmez. Anahtar telefona gönderilmez, yalnızca geliştirme sunucusunda kalır.

Anahtar olmadan denemek istersen `.env.local` içinde `AI_MOCK=1` yap. Yapay zekâ özellikleri o zaman örnek
cevaplar döndürür.

### 2. Çalıştırma

```bash
npx expo start
```

- **iPhone:** Terminaldeki QR kodu iPhone kamerasıyla okut, uygulama Expo Go'da açılır.
- **Web:** Terminalde `w` tuşuna bas.
- `.env.local` dosyasını değiştirdiğinde sunucuyu yeniden başlat.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm test` | Kalori, makro, VKİ, zaman çizelgesi ve egzersiz hesaplarının birim testleri |
| `npm run typecheck` | TypeScript denetimi |
| `npm run lint` | ESLint (React Compiler kuralları dahil) |
| `npx expo-doctor` | Bağımlılık ve yapılandırma kontrolü |

## Nasıl çalışır?

```
Telefon (Expo Go)  ──►  Geliştirme sunucusu (Expo API rotaları)  ──►  Google Gemini
                        src/app/api/*+api.ts                    └──►  Open Food Facts
```

- **Modeller:** fotoğraf analizi ve diyetisyen için `gemini-3.8-flash`, metin tahminleri için
  `gemini-3.5-flash-lite`. `.env.local` içinde `GEMINI_MODEL` ve `GEMINI_TEXT_MODEL` ile değiştirilebilir.
- Yapay zekânın cevabı bir JSON şemasına uymak zorunda. Sunucu Zod ile doğrular, toplamları malzemelerden
  kendisi hesaplar.
- Fotoğraf analizi arka planda yürür. Öğün listede "Analiz ediliyor…" olarak görünür, bitince güncellenir.

## Proje yapısı

```
src/
  app/            Ekranlar (Expo Router) ve api/ altında sunucu rotaları
  components/     Arayüz parçaları (kartlar, halkalar, grafikler, sekme çubuğu…)
  lib/            Hesaplamalar (nutrition.ts), birimler, tarihler, yiyecek ve tarif verisi, API istemcisi
  store/          Telefonda saklanan veri (Zustand + AsyncStorage) ve fotoğraf analizi kuyruğu
  server/         Gemini istemcisi, şemalar, yapay zekâ talimatları, Open Food Facts
  i18n/           Türkçe ve İngilizce metinler
tests/            Birim testleri
```

## Sonraki adımlar

- **App Store / Google Play:** `npx eas-cli@latest build` ile derleme. Telefonun sunucuya internetten
  ulaşabilmesi için API rotalarını EAS Hosting'e yayımlayıp `app.json` içinde `expo-router` eklentisine
  `origin` vermek gerekir. Herkese açık yayında rotalara kimlik doğrulama ve kullanım sınırı eklenmeli.
- **Apple Health, ana ekran widget'ı ve bildirimler:** Expo Go'da çalışmaz, özel bir geliştirme derlemesi
  (development build) gerekir.

## Kaynaklar ve uyarı

Yiyecek değerleri yaklaşıktır. Ürün verileri [Open Food Facts](https://world.openfoodfacts.org) (ODbL)
kaynaklıdır. Denge genel bilgilendirme amaçlıdır ve tıbbi tavsiye yerine geçmez.
