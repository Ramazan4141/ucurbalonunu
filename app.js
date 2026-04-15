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
// Kayıt Olma Fonksiyonu (Hata veren 'register' ismiyle aynı olmalı)
window.register = function() {
    // HTML'deki input id'lerinin 'email' ve 'password' olduğunu varsayıyorum
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email === "" || password === "") {
        alert("Lütfen tüm alanları doldur kanka! 🎈");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("Kayıt Başarılı! Hoş geldin. 🚀");
            console.log("Kullanıcı:", userCredential.user);
        })
        .catch((error) => {
            alert("Hata: " + error.message);
        });
};
