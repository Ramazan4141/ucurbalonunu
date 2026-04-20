// ============================================================
//  UÇUR BALONUNU — KURŞUN GEÇİRMEZ (NULL-SAFE) VERSİYON
// ============================================================

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
const db   = firebase.firestore();

// --- YARDIMCI FONKSİYON (Hata almanı engelleyen sihirli değnek) ---
function gosterGizle(id, durum) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = durum;
    } else {
        console.warn(`⚠️ Uyarı: '${id}' ID'li eleman bu sayfada bulunamadı.`);
    }
}

// Sayfa Tespiti
const SAYFA = document.getElementById('yeniOkulIl') ? 'admin' : (document.getElementById('balloon-container') ? 'ogrenci' : 'giris');

// --- ARAYÜZ KONTROLLERİ ---

window.showRegisterForm = function(rol) {
    gosterGizle('role-selection-area', 'none');
    gosterGizle('login-area', 'none');
    gosterGizle('dynamic-register-form', 'block');
    
    const rolInput = document.getElementById('rolSecimi');
    if (rolInput) rolInput.value = rol;
    
    const title = document.getElementById('form-title');
    if (title) title.innerText = (rol === 'admin' ? 'Öğretmen Kaydı' : 'Öğrenci Kaydı');
    
    if (typeof window.illeriDoldur === 'function') window.illeriDoldur();
};

window.showLoginForm = function() {
    gosterGizle('role-selection-area', 'none');
    gosterGizle('dynamic-register-form', 'none');
    gosterGizle('login-area', 'block');
};

window.resetRoleSelection = function() {
    gosterGizle('dynamic-register-form', 'none');
    gosterGizle('login-area', 'none');
    gosterGizle('role-selection-area', 'block');
};

// --- İL / İLÇE / OKUL SİSTEMİ ---

window.illeriDoldur = function() {
    const ids = ["sehir", "yeniOkulIl"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && typeof ilVerisi !== 'undefined') {
            el.innerHTML = '<option value="">İl Seçiniz</option>';
            Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => {
                el.innerHTML += `<option value="${il}">${il}</option>`;
            });
        }
    });
};

window.ilceleriYukle = function(isChild = false) {
    const ilId = isChild ? "yeniOkulIl" : "sehir";
    const ilceId = isChild ? "yeniOkulIlce" : "ilce";
    const sehir = document.getElementById(ilId)?.value;
    const ilceSelect = document.getElementById(ilceId);
    if (!ilceSelect || !sehir || !ilVerisi[sehir]) return;

    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    ilVerisi[sehir].forEach(ilce => {
        ilceSelect.innerHTML += `<option value="${ilce}">${ilce}</option>`;
    });
};

window.okullariYukle = function() {
    const il = document.getElementById("sehir")?.value;
    const ilce = document.getElementById("ilce")?.value;
    const okulSelect = document.getElementById("okul");
    if (!okulSelect || !il || !ilce) return;

    db.collection("sistem").doc("okulListesi").get().then(doc => {
        okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists) {
            const okullar = doc.data()[`${il}_${ilce}`] || [];
            okullar.sort().forEach(o => okulSelect.innerHTML += `<option value="${o}">${o}</option>`);
        }
    });
};

// --- AUTH TAKİBİ ---

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            
            if (SAYFA === 'admin') {
                window.illeriDoldur();
                // Admin gökyüzü motoru buraya gelebilir
            } else {
                gosterGizle('auth-area', 'none');
                gosterGizle('user-panel', 'block');
                
                const welcome = document.getElementById('welcome-msg');
                if (welcome) welcome.innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                
                const heightDisp = document.getElementById('display-height');
                if (heightDisp) heightDisp.innerText = data.balonYuksekligi || 0;
            }
        });
    } else {
        if (SAYFA === 'giris') window.illeriDoldur();
    }
});

// --- KAYIT & GİRİŞ ---

window.login = function() {
    const email = document.getElementById('loginEmail')?.value;
    const pass = document.getElementById('loginPassword')?.value;
    if (!email || !pass) return alert("Bilgileri eksiksiz girin.");
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Hata: " + e.message));
};

window.register = function() {
    const email = document.getElementById('email')?.value;
    const pass = document.getElementById('password')?.value;
    const rol = document.getElementById('rolSecimi')?.value;

    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            balonEtiketi: document.getElementById('takmaAd').value || "Gezgin",
            okul: document.getElementById('okul').value,
            sinif: document.getElementById('sinif').value,
            sube: document.getElementById('sube').value,
            rol: (rol === 'admin' ? 'ogretmen' : 'ogrenci'),
            balonYuksekligi: 0,
            toplamOkunanSayfa: 0
        });
    }).then(() => {
        alert("Kayıt Başarılı!");
        location.reload();
    }).catch(e => alert(e.message));
};

window.logout = function() {
    auth.signOut().then(() => { window.location.href = 'index.html'; });
};
