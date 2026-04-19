// --- 1. FIREBASE YAPILANDIRMASI ---
const firebaseConfig = {
    apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
    authDomain: "ucurbalonu.firebaseapp.com",
    projectId: "ucurbalonu",
    storageBucket: "ucurbalonu.firebasestorage.app",
    messagingSenderId: "677201903733",
    appId: "1:677201903733:web:f5708b28f410ae7036b83c"
};

// Firebase başlatma (Compat modunda v8 syntaxı için)
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

// --- 2. GLOBAL ARAYÜZ FONKSİYONLARI ---
window.showLoginForm = function() {
    ['role-selection-area', 'dynamic-register-form'].forEach(id => { 
        if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; 
    });
    if(document.getElementById('login-form-area')) document.getElementById('login-form-area').style.display = 'block';
};

window.showRegisterForm = function(role) {
    ['role-selection-area', 'login-form-area'].forEach(id => { 
        if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; 
    });
    if(document.getElementById('dynamic-register-form')) document.getElementById('dynamic-register-form').style.display = 'block';
    const rolInput = document.getElementById('rolSecimi');
    if(rolInput) rolInput.value = role;
    
    window.illeriDoldur();
};

window.resetRoleSelection = function() {
    if(document.getElementById('role-selection-area')) document.getElementById('role-selection-area').style.display = 'block';
    if(document.getElementById('dynamic-register-form')) document.getElementById('dynamic-register-form').style.display = 'none';
    if(document.getElementById('login-form-area')) document.getElementById('login-form-area').style.display = 'none';
};

// --- 3. VERİ DOLDURMA (İLLER / İLÇELER / OKULLAR) ---
window.illeriDoldur = function() {
    // Hem kayıt formundaki hem de admin panelindeki il kutularını doldurur
    const ids = ["sehir", "yeniOkulIl"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<option value="">İl Seçiniz</option>';
            Object.keys(ilVerisi).sort((a, b) => a.localeCompare(b, 'tr')).forEach(il => {
                let opt = document.createElement("option");
                opt.value = il; opt.textContent = il;
                el.appendChild(opt);
            });
        }
    });
};

window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    if (!ilceSelect) return;
    
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(ilce => {
            let opt = document.createElement("option");
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    }
};

window.yeniOkulIlceleriYukle = function() {
    const sehir = document.getElementById("yeniOkulIl").value;
    const ilceSelect = document.getElementById("yeniOkulIlce");
    if (!ilceSelect) return;
    
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(ilce => {
            let opt = document.createElement("option");
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    }
};

window.okullariYukle = function() {
    const il = document.getElementById("sehir").value;
    const ilce = document.getElementById("ilce").value;
    const okulSelect = document.getElementById("okul");
    if (!okulSelect || !il || !ilce) return;

    db.collection("sistem").doc("okulListesi").get().then((doc) => {
        okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists) {
            const data = doc.data();
            const anahtar = `${il}_${ilce}`;
            const okullar = data[anahtar] || [];
            okullar.sort((a, b) => a.localeCompare(b, 'tr')).forEach(o => {
                let opt = document.createElement("option");
                opt.value = o; opt.textContent = o;
                okulSelect.appendChild(opt);
            });
        }
    });
};

// --- 4. SUPERADMIN: OKUL EKLEME ---
window.okulEkle = function() {
    const il = document.getElementById("yeniOkulIl").value;
    const ilce = document.getElementById("yeniOkulIlce").value;
    const okulAd = document.getElementById("yeniOkulAd").value.trim();

    if(!il || !ilce || !okulAd) {
        alert("Lütfen tüm alanları doldurun!");
        return;
    }

    const anahtar = `${il}_${ilce}`;
    db.collection("sistem").doc("okulListesi").set({
        [anahtar]: firebase.firestore.FieldValue.arrayUnion(okulAd)
    }, { merge: true })
    .then(() => {
        alert("Okul başarıyla eklendi!");
        document.getElementById("yeniOkulAd").value = "";
    }).catch(e => alert("Hata: " + e.message));
};

// --- 5. ÖĞRETMEN: DUYURU YAYINLA ---
window.duyuruYayinla = function() {
    const mesaj = document.getElementById("haftalikHedef").value;
    if(!mesaj) return alert("Lütfen bir mesaj yazın!");

    db.collection("sistem").doc("duyuru").set({
        mesaj: mesaj,
        tarih: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Duyuru tüm sınıfa yayınlandı!");
        document.getElementById("haftalikHedef").value = "";
    });
};

// --- 6. ÖĞRENCİ: SAYFA SAYISI VE BALON UÇURMA ---
window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById("sayfaSayisi").value);
    if(isNaN(sayfa) || sayfa <= 0) return alert("Lütfen geçerli bir sayfa sayısı girin!");

    const user = auth.currentUser;
    if(!user) return;

    db.collection("users").doc(user.uid).update({
        toplamOkunanSayfa: firebase.firestore.FieldValue.increment(sayfa),
        balonYuksekligi: firebase.firestore.FieldValue.increment(sayfa * 2) // Her sayfa 2 metre
    }).then(() => {
        alert("Tebrikler! Balonun yükseldi. 🚀");
        document.getElementById("sayfaSayisi").value = "";
    });
};

// --- 7. AUTH İŞLEMLERİ (KAYIT / GİRİŞ / ÇIKIŞ) ---
window.register = function() {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const rolSecimi = document.getElementById('rolSecimi').value;

    if(!email || !pass) return alert("E-posta ve şifre zorunludur!");

    auth.createUserWithEmailAndPassword(email, pass)
    .then(res => {
        const userObj = {
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            balonEtiketi: document.getElementById('takmaAd').value || "Gizli Balon",
            okul: document.getElementById('okul').value,
            sinif: document.getElementById('sinif').value,
            sube: document.getElementById('sube').value,
            rol: (rolSecimi === 'admin') ? 'ogretmen' : 'ogrenci',
            balonYuksekligi: 0,
            toplamOkunanSayfa: 0
        };
        return db.collection("users").doc(res.user.uid).set(userObj);
    })
    .then(() => alert("Kayıt Başarılı!"))
    .catch(e => alert("Kayıt Hatası: " + e.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, pass)
    .then(res => {
        return db.collection("users").doc(res.user.uid).get();
    })
    .then(doc => {
        if(doc.exists && doc.data().rol === 'ogretmen') {
            window.location.href = "admin.html";
        } else {
            document.getElementById('auth-area').style.display = 'none';
            document.getElementById('user-panel').style.display = 'block';
            // Kullanıcı bilgilerini yükle (Opsiyonel: UI güncelleme eklenebilir)
        }
    })
    .catch(e => alert("Giriş Hatası: " + e.message));
};

window.logout = function() {
    auth.signOut().then(() => location.reload());
};

// --- 8. SAYFA YÜKLENDİĞİNDE OTOMATİK ÇALIŞACAKLAR ---
window.addEventListener('DOMContentLoaded', () => {
    // Sayfa hazır olduğunda illeri doldur
    window.illeriDoldur();
    
    // Eğer admin panelindeyse okul ekleme alanını göster (Örn: SuperAdmin e-postası kontrolü eklenebilir)
    auth.onAuthStateChanged(user => {
        if(user && document.getElementById('okul-ekleme-alani')) {
            // Eğer özel bir admin e-postası ise alanı göster
            if(user.email === "admin@test.com") { // Buraya kendi e-postanı yazabilirsin
                document.getElementById('okul-ekleme-alani').style.display = 'block';
            } else {
                // Şimdilik test için herkese açık kalsın istersen 'block' yapabilirsin
                document.getElementById('okul-ekleme-alani').style.display = 'block';
            }
        }
    });
});
