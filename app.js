// ============================================================
//  UÇUR BALONUNU — MASTER APP ENGINE (V8.0 - ALL-IN-ONE)
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

// 1. SAYFA TESPİTİ
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

// YARDIMCI FONKSİYONLAR
const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };

// ============================================================
// --- 2. ARAYÜZ VE AUTH KONTROLLERİ ---
// ============================================================

window.showRegisterForm = (rol) => {
    gosterGizle('role-selection-area', 'none');
    gosterGizle('login-area', 'none');
    gosterGizle('dynamic-register-form', 'block');
    document.getElementById('rolSecimi').value = rol;
    if(document.getElementById('form-title')) 
        document.getElementById('form-title').innerText = (rol === 'admin' ? 'Öğretmen Kaydı' : 'Öğrenci Kaydı');
    window.illeriDoldur();
};

window.showLoginForm = () => {
    gosterGizle('role-selection-area', 'none');
    gosterGizle('dynamic-register-form', 'none');
    gosterGizle('login-area', 'block');
};

window.resetRoleSelection = () => {
    gosterGizle('dynamic-register-form', 'none');
    gosterGizle('login-area', 'none');
    gosterGizle('role-selection-area', 'block');
};

// --- AUTH TAKİBİ ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists) return;
            const data = doc.data();

            if (data.rol === 'admin' || data.email === 'admin@ucurbalonu.com') {
                if (!IS_SUPERADMIN_PAGE) window.location.href = 'superadmin.html';
                else { gosterGizle('superadmin-area', 'block'); window.illeriDoldur(); }
            } 
            else if (data.rol === 'ogretmen') {
                if (!IS_ADMIN_PAGE) window.location.href = 'admin.html';
                else { window.ogrenciListele(data.okul, data.sinif, data.sube); window.balonlariGoster('admin-balloon-container', data.okul, data.sinif, data.sube, true); }
            } 
            else {
                if (!IS_INDEX_PAGE) window.location.href = 'index.html';
                else {
                    gosterGizle('auth-area', 'none');
                    gosterGizle('user-panel', 'block');
                    document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                    document.getElementById('display-height').innerText = data.balonYuksekligi || 0;
                    window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
                }
            }
        });
    } else {
        if (!IS_INDEX_PAGE) window.location.href = 'index.html';
        window.illeriDoldur();
    }
});

// ============================================================
// --- 3. VERİ MOTORU (İL/İLÇE/OKUL) ---
// ============================================================

window.illeriDoldur = function() {
    const target = IS_INDEX_PAGE ? "sehir" : "yeniOkulIl";
    const el = document.getElementById(target);
    if (el && typeof ilVerisi !== 'undefined') {
        el.innerHTML = '<option value="">İl Seçiniz</option>';
        Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => {
            el.innerHTML += `<option value="${il}">${il}</option>`;
        });
    }
};

window.ilceleriYukle = function(isChild = false) {
    const ilId = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIl" : "sehir";
    const ilceId = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIlce" : "ilce";
    const sehir = document.getElementById(ilId).value;
    const ilceSelect = document.getElementById(ilceId);
    if (!ilceSelect || !sehir) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    ilVerisi[sehir].forEach(ilce => {
        ilceSelect.innerHTML += `<option value="${ilce}">${ilce}</option>`;
    });
};

window.okullariYukle = function() {
    const il = document.getElementById("sehir").value;
    const ilce = document.getElementById("ilce").value;
    const okulSelect = document.getElementById("okul");
    if(!okulSelect) return;
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists && doc.data()[`${il}_${ilce}`]) {
            doc.data()[`${il}_${ilce}`].sort().forEach(o => okulSelect.innerHTML += `<option value="${o}">${o}</option>`);
        }
    });
};

// ============================================================
// --- 4. BALON VE LİSTE MANTIĞI ---
// ============================================================

window.balonlariGoster = function(containerId, okul, sinif, sube, isAdmin) {
    const container = document.getElementById(containerId);
    if (!container) return;
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube)
        .onSnapshot(qs => {
            container.innerHTML = '';
            qs.forEach(doc => {
                const s = doc.data(); if (s.rol === 'ogretmen') return;
                const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
                const bottomPos = Math.min(s.balonYuksekligi || 0, 330);
                const leftPos = (isMe && !isAdmin) ? 50 : (Math.random() * 80 + 10);
                container.innerHTML += `
                    <div class="balloon" style="bottom:${bottomPos}px; left:${leftPos}%; background-color:${isMe ? '#ff5e57' : '#3498db'}; transform:translateX(-50%) scale(${isAdmin?0.6:1});">
                        <div class="balloon-label">${isAdmin ? s.ogrenciAdSoyad : (isMe ? 'Sen' : s.balonEtiketi)}</div>
                    </div>`;
            });
        });
};

window.ogrenciListele = function(okul, sinif, sube) {
    const listDiv = document.getElementById('admin-student-list');
    if (!listDiv) return;
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube).where('rol', '==', 'ogrenci')
        .onSnapshot(qs => {
            listDiv.innerHTML = '';
            qs.forEach(doc => {
                const s = doc.data();
                listDiv.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                    <b>${s.ogrenciAdSoyad}</b> <span>${s.balonYuksekligi}m</span>
                </div>`;
            });
        });
};

// --- AKSİYONLAR ---
window.login = () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Giriş Hatası: " + e.message));
};

window.register = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const rol = document.getElementById('rolSecimi').value;
    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            balonEtiketi: document.getElementById('takmaAd').value || "Gezgin",
            okul: document.getElementById('okul').value, sinif: document.getElementById('sinif').value,
            sube: document.getElementById('sube').value, rol: (rol === 'admin' ? 'ogretmen' : 'ogrenci'),
            balonYuksekligi: 0, toplamOkunanSayfa: 0
        });
    }).then(() => location.reload()).catch(e => alert(e.message));
};

window.yukseklikArtir = () => {
    const sayfa = parseInt(document.getElementById('sayfaSayisi').value);
    if (!sayfa || sayfa <= 0) return;
    const userRef = db.collection('users').doc(auth.currentUser.uid);
    userRef.get().then(doc => {
        const yeni = (doc.data().balonYuksekligi || 0) + (sayfa * 2);
        userRef.update({ balonYuksekligi: yeni, toplamOkunanSayfa: (doc.data().toplamOkunanSayfa || 0) + sayfa });
        document.getElementById('sayfaSayisi').value = '';
    });
};

window.okulEkle = () => {
    const il = document.getElementById("yeniOkulIl").value;
    const ilce = document.getElementById("yeniOkulIlce").value;
    const ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik bilgi!");
    db.collection("sistem").doc("okulListesi").set({ [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad) }, {merge:true}).then(() => { alert("Okul Eklendi!"); location.reload(); });
};

window.logout = () => auth.signOut().then(() => window.location.href = 'index.html');
