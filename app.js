const firebaseConfig = {
    apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
    authDomain: "ucurbalonu.firebaseapp.com",
    projectId: "ucurbalonu",
    storageBucket: "ucurbalonu.firebasestorage.app",
    messagingSenderId: "677201903733",
    appId: "1:677201903733:web:f5708b28f410ae7036b83c"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

// --- GİRİŞ & KAYIT ---
window.showRegisterForm = function(role) {
    document.getElementById('role-selection-area').style.display = 'none';
    document.getElementById('dynamic-register-form').style.display = 'block';
    document.getElementById('rolSecimi').value = role;
    illeriDoldur(); okullariYukle();
};

window.login = function() {
    const e = document.getElementById('loginEmail').value.trim();
    const p = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(e, p).catch(err => alert("Hata: " + err.message));
};

window.register = function() {
    const roleInput = document.getElementById('rolSecimi').value;
    const finalRole = (roleInput === 'admin') ? 'ogretmen' : 'ogrenci';
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;

    const userObj = {
        ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
        balonEtiketi: document.getElementById('takmaAd').value,
        okulBilgisi: { 
            okul: document.getElementById('okul').value, 
            sinif: document.getElementById('sinif').value, 
            sube: document.getElementById('sube').value 
        },
        balonYuksekligi: 0,
        rol: finalRole,
        rozetler: []
    };

    auth.createUserWithEmailAndPassword(email, pass)
        .then(res => db.collection("users").doc(res.user.uid).set(userObj))
        .then(() => alert("Kayıt Başarılı!"))
        .catch(e => alert(e.message));
};

// --- YETKİ KONTROLÜ ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.rol === 'superadmin' || data.rol === 'ogretmen') {
                    if (!window.location.pathname.includes('admin.html')) {
                        window.location.href = 'admin.html';
                    } else {
                        // Süper Adminse okul ekleme alanını göster
                        if(data.rol === 'superadmin') document.getElementById('okul-ekleme-alani').style.display = 'block';
                        adminSinifiniYukle();
                    }
                } else {
                    if(window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
                    panelGuncelle(user.uid);
                }
            }
        });
    } else {
        if(document.getElementById('auth-area')) document.getElementById('auth-area').style.display = 'block';
    }
});

// --- YÖNETİM FONKSİYONLARI ---
window.okulEkle = function() {
    const ad = document.getElementById('yeniOkulAd').value.trim();
    if(!ad) return;
    db.collection("sistem").doc("okulListesi").update({
        liste: firebase.firestore.FieldValue.arrayUnion(ad)
    }).then(() => { alert("Okul eklendi!"); location.reload(); });
};

// ... Diğer yardımcı fonksiyonlar (illeriDoldur, adminSinifiniYukle, logout vb.) buraya gelecek ...
window.logout = function() { auth.signOut().then(() => window.location.href = 'index.html'); };

// (Not: Sayfa uzunluğu nedeniyle geri kalan standart görselleştirme kodlarını önceki app.js ile aynı tutabilirsin kanka)
