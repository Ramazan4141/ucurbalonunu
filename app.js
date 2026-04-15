// Firebase Yapılandırması (v8 Uyumlu Hale Getirildi)
const firebaseConfig = {
  apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
  authDomain: "ucurbalonu.firebaseapp.com",
  projectId: "ucurbalonu",
  storageBucket: "ucurbalonu.firebasestorage.app",
  messagingSenderId: "677201903733",
  appId: "1:677201903733:web:f5708b28f410ae7036b83c",
  measurementId: "G-YYRX592P4Q"
};

// Firebase'i Başlat
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // Zaten başlatılmışsa olanı kullan
}

// Kolay Erişim Değişkenleri
const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase bağlantısı başarılı! 🚀");

// --- BURADAN SONRASI SENİN FONKSİYONLARIN (Kayıt, Giriş, Veri Ekleme vb.) ---
// Not: Fonksiyonların silindiyse buraya tekrar eklememiz gerekebilir.
