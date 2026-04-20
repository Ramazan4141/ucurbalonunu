// ============================================================
//  UÇUR BALONUNU — Birleşik Uygulama Dosyası
// ============================================================

// --- 1. FIREBASE YAPILANDIRMASI (tek seferlik) ---
const firebaseConfig = {
    apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
    authDomain: "ucurbalonu.firebaseapp.com",
    projectId: "ucurbalonu",
    storageBucket: "ucurbalonu.firebasestorage.app",
    messagingSenderId: "677201903733",
    appId: "1:677201903733:web:f5708b28f410ae7036b83c"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db   = firebase.firestore();

// --- 2. SAYFA TESPİTİ ---
const SAYFA = (() => {
    if (document.getElementById('yeniOkulIl'))        return 'admin';
    if (document.getElementById('balloon-container')) return 'ogrenci';
    return 'giris';
})();

// --- 3. ARAYÜZ FONKSİYONLARI ---
window.showLoginForm = function () {
    setDisplay('role-selection-area',   'none');
    setDisplay('dynamic-register-form', 'none');
    setDisplay('login-form-area',       'block');
};

window.showRegisterForm = function (role) {
    setDisplay('role-selection-area',   'none');
    setDisplay('login-form-area',       'none');
    setDisplay('dynamic-register-form', 'block');
    setValue('rolSecimi', role);
    illeriDoldur();
};

window.resetRoleSelection = function () {
    setDisplay('dynamic-register-form', 'none');
    setDisplay('login-form-area',       'none');
    setDisplay('role-selection-area',   'block');
};

// --- 4. IL / ILCE / OKUL YUKLEME ---
function illeriDoldur() {
    if (typeof ilVerisi === 'undefined') {
        console.error('ilVerisi bulunamadi! data.js yuklendi mi?');
        return;
    }
    const hedefler = ['sehir', 'yeniOkulIl'];
    const siralanmisIller = Object.keys(ilVerisi).sort((a, b) => a.localeCompare(b, 'tr'));

    hedefler.forEach(function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '<option value="">Il Seciniz</option>';
        siralanmisIller.forEach(function(il) {
            const opt = document.createElement('option');
            opt.value = il;
            opt.textContent = il;
            el.appendChild(opt);
        });
    });
}
window.illeriDoldur = illeriDoldur;

window.ilceleriYukle = function () {
    const sehir = getValue('sehir');
    const ilceSelect = document.getElementById('ilce');
    if (!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">Ilce Seciniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(function(ilce) {
            const opt = document.createElement('option');
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    }
    const okulSelect = document.getElementById('okul');
    if (okulSelect) okulSelect.innerHTML = '<option value="">Okul Seciniz</option>';
};

window.yeniOkulIlceleriYukle = function () {
    const sehir = getValue('yeniOkulIl');
    const ilceSelect = document.getElementById('yeniOkulIlce');
    if (!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">Ilce Seciniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(function(ilce) {
            const opt = document.createElement('option');
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    }
};

window.okullariYukle = function () {
    const il   = getValue('sehir');
    const ilce = getValue('ilce');
    const okulSelect = document.getElementById('okul');
    if (!okulSelect || !il || !ilce) return;

    db.collection('sistem').doc('okulListesi').get().then(function(doc) {
        okulSelect.innerHTML = '<option value="">Okul Seciniz</option>';
        if (doc.exists) {
            const okullar = doc.data()[il + '_' + ilce] || [];
            okullar.sort(function(a, b) { return a.localeCompare(b, 'tr'); }).forEach(function(o) {
                const opt = document.createElement('option');
                opt.value = o; opt.textContent = o;
                okulSelect.appendChild(opt);
            });
        }
    }).catch(function(e) { console.error('Okullar yuklenemedi:', e); });
};

// --- 5. ADMIN: OKUL EKLEME & DUYURU ---
window.okulEkle = function () {
    const il     = getValue('yeniOkulIl');
    const ilce   = getValue('yeniOkulIlce');
    const okulAd = (document.getElementById('yeniOkulAd') ? document.getElementById('yeniOkulAd').value.trim() : '');
    if (!il || !ilce || !okulAd) {
        alert('Lutfen il, ilce ve okul adini eksiksiz doldurun!');
        return;
    }
    const anahtar = il + '_' + ilce;
    db.collection('sistem').doc('okulListesi').set(
        { [anahtar]: firebase.firestore.FieldValue.arrayUnion(okulAd) },
        { merge: true }
    ).then(function() {
        alert('"' + okulAd + '" basariyla sisteme eklendi!');
        document.getElementById('yeniOkulAd').value = '';
    }).catch(function(e) { alert('Hata: ' + e.message); });
};

window.duyuruYayinla = function () {
    const mesaj = getValue('haftalikHedef');
    if (!mesaj) { alert('Lutfen duyuru metnini yazin!'); return; }
    db.collection('sistem').doc('duyuru').set({
        mesaj: mesaj,
        tarih: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() { alert('Duyuru yayinlandi!'); });
};

// --- 6. ADMIN: OGRENCI LISTESI ---
function ogrenciListele() {
    const liste = document.getElementById('admin-student-list');
    if (!liste) return;

    db.collection('users').where('rol', '==', 'ogrenci')
        .orderBy('balonYuksekligi', 'desc')
        .get()
        .then(function(snapshot) {
            if (snapshot.empty) {
                liste.innerHTML = '<p style="color:#999">Henuz kayitli ogrenci yok.</p>';
                return;
            }
            liste.innerHTML = '';
            snapshot.forEach(function(doc) {
                const d = doc.data();
                liste.innerHTML += '<div class="student-admin-card">' +
                    '<span>🎈 <strong>' + (d.balonEtiketi || d.ogrenciAdSoyad) + '</strong>' +
                    '<small style="color:#999"> — ' + (d.okul || '?') + ' / ' + (d.sinif || '?') + (d.sube || '') + '</small></span>' +
                    '<span style="font-weight:bold;color:#3498db">' + (d.balonYuksekligi || 0) + ' m</span>' +
                    '</div>';
            });
        })
        .catch(function(e) {
            liste.innerHTML = '<p style="color:red">Liste yuklenemedi: ' + e.message + '</p>';
        });
}

// --- 7. OGRENCI: BALON UCURMA ---
window.yukseklikArtir = function () {
    const sayfa = parseInt(document.getElementById('sayfaSayisi') ? document.getElementById('sayfaSayisi').value : '0');
    if (isNaN(sayfa) || sayfa <= 0) { alert('Gecerli bir sayfa sayisi girin!'); return; }
    const user = auth.currentUser;
    if (!user) { alert('Oturum bulunamadi.'); return; }

    db.collection('users').doc(user.uid).update({
        toplamOkunanSayfa: firebase.firestore.FieldValue.increment(sayfa),
        balonYuksekligi:   firebase.firestore.FieldValue.increment(sayfa * 2)
    }).then(function() {
        document.getElementById('sayfaSayisi').value = '';
        alert('Balonun yukseldi!');
        kullaniciyiGoster(user.uid);
    });
};

// --- 8. AUTH ---
window.register = function () {
    const email = getValue('email');
    const pass  = getValue('password');
    const rol   = getValue('rolSecimi');
    if (!email || !pass) { alert('E-posta ve sifre zorunludur.'); return; }

    auth.createUserWithEmailAndPassword(email, pass).then(function(res) {
        const userObj = {
            ogrenciAdSoyad:    getValue('ogrenciAdSoyad'),
            balonEtiketi:      getValue('takmaAd') || 'Gizli Balon',
            il:                getValue('sehir'),
            ilce:              getValue('ilce'),
            okul:              getValue('okul'),
            sinif:             getValue('sinif'),
            sube:              getValue('sube'),
            rol:               (rol === 'admin') ? 'ogretmen' : 'ogrenci',
            balonYuksekligi:   0,
            toplamOkunanSayfa: 0
        };
        return db.collection('users').doc(res.user.uid).set(userObj);
    }).then(function() {
        alert('Kayit basarili!');
    }).catch(function(e) { alert('Kayit hatasi: ' + e.message); });
};

window.login = function () {
    const email = getValue('loginEmail');
    const pass  = getValue('loginPassword');

    auth.signInWithEmailAndPassword(email, pass).then(function(res) {
        return db.collection('users').doc(res.user.uid).get();
    }).then(function(doc) {
        if (!doc.exists) throw new Error('Kullanici verisi bulunamadi.');
        const rol = doc.data().rol;
        const yetkiliRoller = ['ogretmen', 'admin', 'superadmin'];
        if (yetkiliRoller.includes(rol)) {
            window.location.href = 'admin.html';
        } else {
            setDisplay('auth-area',  'none');
            setDisplay('user-panel', 'block');
            kullaniciyiGoster(doc.id);
        }
    }).catch(function(e) { alert('Giris hatasi: ' + e.message); });
};

window.logout = function () {
    auth.signOut().then(function() { window.location.href = 'index.html'; });
};

// --- 9. KULLANICI PANELI ---
function kullaniciyiGoster(uid) {
    db.collection('users').doc(uid).get().then(function(doc) {
        if (!doc.exists) return;
        const d = doc.data();
        const hosgeldin = document.getElementById('welcome-msg');
        const display   = document.getElementById('display-height');
        if (hosgeldin) hosgeldin.textContent = 'Merhaba, ' + (d.balonEtiketi || d.ogrenciAdSoyad) + '!';
        if (display)   display.textContent   = d.balonYuksekligi || 0;
    });
}

function duyuruyuYukle() {
    const alan = document.getElementById('target-area');
    if (!alan) return;
    db.collection('sistem').doc('duyuru').get().then(function(doc) {
        if (doc.exists && doc.data().mesaj) {
            alan.innerHTML = '<strong>Haftalik Hedef:</strong> ' + doc.data().mesaj;
            alan.style.display = 'block';
        }
    });
}

// --- 10. OTURUM DEGISIKLIGI DINLEYICISI ---
auth.onAuthStateChanged(function(user) {
    if (SAYFA === 'admin') {
        if (!user) { window.location.href = 'index.html'; return; }

        db.collection('users').doc(user.uid).get().then(function(doc) {
            if (!doc.exists) { window.location.href = 'index.html'; return; }

            const rol = doc.data().rol;
            const yetkiliRoller = ['ogretmen', 'admin', 'superadmin'];

            if (!yetkiliRoller.includes(rol)) {
                window.location.href = 'index.html';
                return;
            }

            illeriDoldur();
            ogrenciListele();

            // Okul ekleme: sadece admin ve superadmin gorur
            const okulAlani = document.getElementById('okul-ekleme-alani');
            if (okulAlani) {
                okulAlani.style.display = (rol === 'admin' || rol === 'superadmin') ? 'block' : 'none';
            }
        });

    } else if (SAYFA === 'ogrenci' || SAYFA === 'giris') {
        if (user && document.getElementById('auth-area')) {
            setDisplay('auth-area',  'none');
            setDisplay('user-panel', 'block');
            kullaniciyiGoster(user.uid);
            duyuruyuYukle();
        }
    }
});

// --- 11. SAYFA YUKLENDIGINDE ---
window.addEventListener('DOMContentLoaded', function() {
    if (SAYFA !== 'admin') {
        illeriDoldur();
    }
});

// --- YARDIMCI FONKSİYONLAR ---
function setDisplay(id, val) {
    const el = document.getElementById(id);
    if (el) el.style.display = val;
}
function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}
function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}
window.kullaniciyiGoster = function(uid) {
    db.collection('users').doc(uid).get().then(userDoc => {
        if (!userDoc.exists) return;
        const currentUser = userDoc.data();
        const container = document.getElementById('balloon-container');
        if (!container) return;

        // Kendi bilgilerini güncelle
        if(document.getElementById('welcome-msg')) 
            document.getElementById('welcome-msg').innerText = `Selam, ${currentUser.ogrenciAdSoyad}!`;
        if(document.getElementById('display-height')) 
            document.getElementById('display-height').innerText = currentUser.balonYuksekligi || 0;

        // SINIFTAKİ TÜM BALONLARI ÇEK
        db.collection('users')
            .where('okul', '==', currentUser.okul)
            .where('sinif', '==', currentUser.sinif)
            .where('sube', '==', currentUser.sube)
            .get().then(querySnapshot => {
                container.innerHTML = ''; // Gökyüzünü temizle
                
                querySnapshot.forEach(doc => {
                    const student = doc.data();
                    const isMe = doc.id === uid;
                    const h = student.balonYuksekligi || 0;
                    const bottomPos = Math.min(h, 330);
                    // Rastgele yatay pozisyon (balonlar üst üste binmesin diye)
                    const leftPos = isMe ? 50 : (Math.random() * 80 + 10); 

                    container.innerHTML += `
                        <div class="balloon" style="bottom: ${bottomPos}px; left: ${leftPos}%; background-color: ${isMe ? '#ff5e57' : '#3498db'}; opacity: ${isMe ? 1 : 0.8};">
                            <div class="balloon-label">${isMe ? 'Sen' : student.balonEtiketi}</div>
                        </div>
                    `;
                });
            });
    });
};
