// 1. Firebase Yapılandırması
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

console.log("Uçan Balon Sistemi Hazır! 🚀");

// 3. Kayıt Ol Fonksiyonu
window.register = function() {
    console.log("Kayıt işlemi başlatılıyor...");

    // Form verilerini al
    const adSoyad = document.getElementById('ogrenciAdSoyad').value;
    const takmaAd = document.getElementById('takmaAd').value;
    const sehir = document.getElementById('sehir').value;
    const ilce = document.getElementById('ilce').value;
    const okul = document.getElementById('okul').value;
    const sinif = document.getElementById('sinif').value;
    const sube = document.getElementById('sube').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Temel kontrol
    if (!adSoyad || !takmaAd || !email || !password) {
        alert("Lütfen gerekli alanları doldur kanka! 🎈");
        return;
    }

    // Auth ile hesap oluştur
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Firestore'a detaylı kaydı yap
            return db.collection("users").doc(user.uid).set({
                veliEmail: email,
                ogrenciAdSoyad: adSoyad,
                balonEtiketi: takmaAd,
                konum: { sehir: sehir, ilce: ilce },
                okulBilgisi: { 
                    okul: okul, 
                    sinif: sinif,
                    sube: sube 
                },
                balonYuksekligi: 0,
                toplamOkunanSayfa: 0,
                kayitTarihi: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert("Harika! Kayıt başarılı. Balonun pistte seni bekliyor! 🎈🚀");
        })
        .catch((error) => {
            alert("Hata: " + error.message);
            console.error(error);
        });
};
