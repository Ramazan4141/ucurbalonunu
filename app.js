// 1. Firebase Yapılandırması (Senin Proje Bilgilerin)
const firebaseConfig = {
  apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
  authDomain: "ucurbalonu.firebaseapp.com",
  projectId: "ucurbalonu",
  storageBucket: "ucurbalonu.firebasestorage.app",
  messagingSenderId: "677201903733",
  appId: "1:677201903733:web:f5708b28f410ae7036b83c",
  measurementId: "G-YYRX592P4Q"
};

// 2. Firebase'i Başlat
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase ve app.js başarıyla yüklendi! 🚀");

// 3. Kayıt Ol Fonksiyonu (Veli Kaydı + Detaylı Öğrenci Profili)
window.register = function() {
    console.log("Kayıt butonuna basıldı...");

    // HTML'deki input id'lerini yakalıyoruz
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const adSoyadInput = document.getElementById('ogrenciAdSoyad');
    const takmaAdInput = document.getElementById('takmaAd');
    const sehirInput = document.getElementById('sehir');
    const ilceInput = document.getElementById('ilce');
    const okulInput = document.getElementById('okul');
    const sinifInput = document.getElementById('sinif');

    // Bilgileri değişkenlere atıyoruz
    const email = emailInput.value;
    const password = passwordInput.value;
    const adSoyad = adSoyadInput.value;
    const takmaAd = takmaAdInput.value;
    const sehir = sehirInput ? sehirInput.value : "";
    const ilce = ilceInput ? ilceInput.value : "";
    const okul = okulInput ? okulInput.value : "";
    const sinif = sinifInput ? sinifInput.value : "";

    // Boş alan kontrolü
    if (email === "" || password === "" || adSoyad === "" || takmaAd === "") {
        alert("Lütfen öğrenci adı, takma ad, e-posta ve şifre kısımlarını boş bırakma kanka! 🎈");
        return;
    }

    // A. Önce Kullanıcı Hesabını (Auth) Oluşturuyoruz
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Hesap oluşturuldu, UID:", user.uid);
            
            // B. Şimdi Firestore Veritabanına Detayları Yazıyoruz
            return db.collection("users").doc(user.uid).set({
                veliEmail: email,
                ogrenciAdSoyad: adSoyad,
                balonEtiketi: takmaAd, 
                konum: { sehir: sehir, ilce: ilce },
                okulBilgisi: { okul: okul, sinif: sinif },
                balonYuksekligi: 0, // Başlangıçta balon yerde (0 sayfa)
                kayitTarihi: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // C. Her şey bittiğinde kullanıcıya haber veriyoruz
            alert("Vee işte bu! Kayıt başarılı ve veritabanına eklendi. 🎈🚀");
            console.log("Firestore kaydı tamamlandı!");
        })
        .catch((error) => {
            // Bir hata olursa burada yakalıyoruz
            console.error("Hata Detayı:", error.code, error.message);
            alert("Bir sorun çıktı: " + error.message);
        });
};
