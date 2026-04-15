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

// --- 1. OTURUM KONTROLÜ (Sayfa açılınca çalışır) ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // Kullanıcı giriş yapmışsa paneli göster
        panelGuncelle(user.uid);
    } else {
        // Giriş yapmamışsa formları göster
        document.getElementById('auth-area').style.display = 'block';
        document.getElementById('user-panel').style.display = 'none';
    }
});

// --- 2. KAYIT OLMA ---
window.register = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const takmaAd = document.getElementById('takmaAd').value;
    const adSoyad = document.getElementById('ogrenciAdSoyad').value;

    if(!email || !password || !takmaAd) { alert("Boş alan bırakma kanka!"); return; }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return db.collection("users").doc(userCredential.user.uid).set({
                veliEmail: email,
                ogrenciAdSoyad: adSoyad,
                balonEtiketi: takmaAd,
                balonYuksekligi: 0,
                konum: { sehir: document.getElementById('sehir').value, ilce: document.getElementById('ilce').value },
                okulBilgisi: { okul: document.getElementById('okul').value, sinif: document.getElementById('sinif').value, sube: document.getElementById('sube').value },
                kayitTarihi: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .catch(error => alert("Hata: " + error.message));
};

// --- 3. GİRİŞ YAPMA ---
window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => console.log("Giriş yapıldı"))
        .catch(error => alert("Giriş hatalı: " + error.message));
};

// --- 4. PANELİ GÜNCELLEME (Verileri Çekme) ---
function panelGuncelle(uid) {
    db.collection("users").doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('auth-area').style.display = 'none';
            document.getElementById('user-panel').style.display = 'block';
            document.getElementById('welcome-msg').innerText = "Selam " + data.balonEtiketi + "! 🎈";
            document.getElementById('display-height').innerText = data.balonYuksekligi;
        }
    });
}

// --- 5. BALONU UÇURMA (Yükseklik Artırma) ---
window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById('sayfaSayisi').value);
    if (!sayfa || sayfa <= 0) { alert("Kaç sayfa okudun? Yazman lazım."); return; }

    const uid = auth.currentUser.uid;
    db.collection("users").doc(uid).update({
        balonYuksekligi: firebase.firestore.FieldValue.increment(sayfa)
    }).then(() => {
        alert("Harika! Balonun " + sayfa + " metre daha yükseldi! 🚀");
        document.getElementById('sayfaSayisi').value = "";
        panelGuncelle(uid); // Sayıyı ekranda hemen güncelle
    });
};

// --- 6. ÇIKIŞ YAPMA ---
window.logout = function() {
    auth.signOut().then(() => { location.reload(); });
};
