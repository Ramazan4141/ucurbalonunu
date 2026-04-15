const firebaseConfig = {
  apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
  authDomain: "ucurbalonu.firebaseapp.com",
  projectId: "ucurbalonu",
  storageBucket: "ucurbalonu.firebasestorage.app",
  messagingSenderId: "677201903733",
  appId: "1:677201903733:web:f5708b28f410ae7036b83c",
  measurementId: "G-YYRX592P4Q"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

// --- OTURUM KONTROLÜ ---
auth.onAuthStateChanged((user) => {
    if (user) { panelGuncelle(user.uid); } 
    else { 
        document.getElementById('auth-area').style.display = 'block'; 
        document.getElementById('user-panel').style.display = 'none'; 
    }
});

// --- KAYIT OLMA (Tüm okul bilgileri dahil) ---
window.register = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const adSoyad = document.getElementById('ogrenciAdSoyad').value;
    const takmaAd = document.getElementById('takmaAd').value;
    const sehir = document.getElementById('sehir').value;
    const ilce = document.getElementById('ilce').value;
    const okul = document.getElementById('okul').value;
    const sinif = document.getElementById('sinif').value;
    const sube = document.getElementById('sube').value;

    if(!email || !password || !takmaAd || !adSoyad) { alert("Temel bilgileri boş bırakma kanka!"); return; }

    auth.createUserWithEmailAndPassword(email, password).then((u) => {
        return db.collection("users").doc(u.user.uid).set({
            veliEmail: email,
            ogrenciAdSoyad: adSoyad,
            balonEtiketi: takmaAd,
            konum: { sehir: sehir, ilce: ilce },
            okulBilgisi: { okul: okul, sinif: sinif, sube: sube },
            balonYuksekligi: 0,
            sonGirisTarihi: "",
            kayitTarihi: firebase.firestore.FieldValue.serverTimestamp()
        });
    }).catch(error => alert("Hata: " + error.message));
};

// --- GİRİŞ YAPMA ---
window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, password).catch(error => alert("Hata: " + error.message));
};

// --- PANEL GÜNCELLEME VE BALON HAREKETİ ---
function panelGuncelle(uid) {
    db.collection("users").doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('auth-area').style.display = 'none';
            document.getElementById('user-panel').style.display = 'block';
            document.getElementById('welcome-msg').innerText = "Selam " + data.balonEtiketi + "! 🎈";
            document.getElementById('display-height').innerText = data.balonYuksekligi;
            
            // Balon hareketi (Görselleştirme)
            const pxYukseklik = 30 + (data.balonYuksekligi * 2); 
            document.getElementById('balloon').style.bottom = Math.min(pxYukseklik, 250) + "px"; // Gökyüzünden çıkmasın diye sınır koyduk

            // Günlük Kilit Kontrolü
            const bugun = new Date().toLocaleDateString();
            if (data.sonGirisTarihi === bugun) {
                document.getElementById('action-area').style.display = 'none';
                document.getElementById('lock-msg').style.display = 'block';
            } else {
                document.getElementById('action-area').style.display = 'block';
                document.getElementById('lock-msg').style.display = 'none';
            }
        }
    });
}

// --- YÜKSEKLİK ARTIRMA ---
window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById('sayfaSayisi').value);
    if (!sayfa || sayfa <= 0) { alert("Sayfa sayısı girmelisin kanka!"); return; }

    const bugun = new Date().toLocaleDateString();
    const uid = auth.currentUser.uid;

    db.collection("users").doc(uid).update({
        balonYuksekligi: firebase.firestore.FieldValue.increment(sayfa),
        sonGirisTarihi: bugun
    }).then(() => {
        alert("Süper! Balonun yükseliyor... 🚀");
        document.getElementById('sayfaSayisi').value = "";
        panelGuncelle(uid);
    });
};

// --- ÇIKIŞ YAPMA ---
window.logout = function() { auth.signOut().then(() => location.reload()); };
