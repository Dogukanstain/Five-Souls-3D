# Five Souls — 3D Dungeon RPG

Tarayıcıda çalışan üçüncü şahıs 3D fantastik zindan oyunu. Three.js ile 3D sahne ve görsel yetenek efektleri, Express + Socket.IO ile oda tabanlı çok oyunculu altyapı kullanır.

## Karakterler
- Doğukan — Warrior (kırmızı): kılıç saldırısı, kılıç dalgası ve dönen ulti
- Yaren — Healer (sarı): yakındaki takım arkadaşlarına can veren şifa halkası; ulti daha geniş ve güçlü
- Aysima — Archer (mor): ok saldırısı ve ok yağmuru
- Berken — Mage (pembe): alev küresi ve meteor ulti
- Emre — Fighter (yeşil): yumruk ve sismik şok dalgası

Yetenekler ekranda renkli 3D parçacıklar, halkalar, mermi/ok hareketleri ve darbe efektleriyle görünür.

## 5 bölüm
1. Fısıltı Mahzeni — balçıklar ve iskeletler
2. Yarasa Yuvası — yarasalar ve orklar
3. Unutulmuş Ruhlar — hayaletler ve muhafızlar
4. Kara Kale — karanlık şövalyeler
5. Kadim Muhafız — boss savaşı

## Yerelde çalıştırma
Node.js 18+ gerekir.

```bash
npm install
npm start
```

Tarayıcıda `http://localhost:3000` aç.

## GitHub + Render
1. ZIP'i çıkart.
2. İçindeki `package.json`, `server.js`, `README.md` ve `public/` klasörünü GitHub deposunun kök dizinine yükle.
3. Render'da **New → Web Service** ile GitHub deposunu bağla.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Root Directory boş kalsın.

## Arkadaşlarla oynama
Bir oyuncu boş oda koduyla girerek yeni oda açar. Oda kodunu sağ üstten kopyalayıp arkadaşlarına gönder; herkes aynı kodu ve farklı karakteri seçerek katılır. En fazla 5 oyuncu.

## Kontroller
- WASD: hareket
- Space: temel saldırı
- Q: sınıf yeteneği
- R: ulti
- E: temizlenen bölümden sonraki bölüme geçiş

## Notlar
- Three.js, Google Fonts ve Socket.IO istemci kütüphanesi tarayıcıda yüklenir; ilk açılışta internet bağlantısı gerekir.
- Bu bir oynanabilir prototiptir; animasyonlar ve modeller kodla oluşturulan stilize 3D primitive modellerdir, harici model dosyası gerektirmez.
- Render'da canlı dağıtım bu ZIP'ten otomatik yapılmış değildir; GitHub'a yükleyip Render'da deploy etmek gerekir.
