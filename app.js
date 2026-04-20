// ============================================================
//  UÇUR BALONUNU — Birleşik Uygulama Dosyası
//  (app.js + admin.js tek dosyada birleştirildi)
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

// ============================================================
// --- 2. SAYFA TESPİTİ ---
// Hangi sayfada olduğumuzu anlıyoruz; böylece her iki sayfada
// da aynı dosya çalışabilir.
// ============================================================
const SAYFA = (() => {
    if (document.getElementById('yeniOkulIl'))   return 'admin';
    if (document.getElementById('balloon-container')) return 'ogrenci';
    return 'giris';
})();

// ============================================================
// --- 3. ARAYÜZ FONKSİYONLARI (Giriş / Kayıt ekranı) ---
// ============================================================
window.showLoginForm = function () {
    setDisplay('role-selection-area',   'none');
    setDisplay('dynamic-register-form', 'none');
    setDisplay('login-form-area',       'block');
};

window.showRegisterForm = function (role) {
    setDisplay('role-selection-area', 'none');
    setDisplay('login-form-area',     'none');
    setDisplay('dynamic-register-form', 'block');
    setValue('rolSecimi', role);
    illeriDoldur();          // il listesini doldur
};

window.resetRoleSelection = function () {
    setDisplay('dynamic-register-form', 'none');
    setDisplay('login-form-area',       'none');
    setDisplay('role-selection-area',   'block');
};

// ============================================================
// --- 4. İL / İLÇE / OKUL YÜKLEME ---
// ============================================================

/**
 * Sayfadaki tüm il <select> elemanlarını doldurur.
 * (Hem kayıt formu #sehir hem de admin paneli #yeniOkulIl)
 */
function illeriDoldur() {
    if (typeof ilVerisi === 'undefined') {
        console.error('ilVerisi bulunamadı! data.js yüklendi mi?');
        return;
    }

    const hedefler = ['sehir', 'yeniOkulIl'];
    const siralanmisIller = Object.keys(ilVerisi).sort((a, b) =>
        a.localeCompare(b, 'tr')
    );

    hedefler.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '<option value="">İl Seçiniz</option>';
        siralanmisIller.forEach(il => {
            const opt = document.createElement('option');
            opt.value   = il;
            opt.textContent = il;
            el.appendChild(opt);
        });
    });
}
window.illeriDoldur = illeriDoldur;

/** Kayıt formundaki #sehir seçimine bağlı ilçeleri doldurur */
window.ilceleriYukle = function () {
    const sehir     = getValue('sehir');
    const ilceSelect = document.getElementById('ilce');
    if (!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(ilce => {
            const opt = document.createElement('option');
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    }
    // İlçe değişince okul listesini sıfırla
    const okulSelect = document.getElementById('okul');
    if (okulSelect) okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
};

/** Admin panelindeki #yeniOkulIl seçimine bağlı ilçeleri doldurur */
window.yeniOkulIlceleriYukle = function () {
    const sehir     = getValue('yeniOkulIl');
    const ilceSelect = document.getElementById('yeniOkulIlce');
    if (!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(ilce => {
            const opt = document.createElement('option');
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    }
};

/** Kayıt formunda il+ilçe seçilince Firebase'den okulları çeker */
window.okullariYukle = function () {
    const il   = getValue('sehir');
    const ilce = getValue('ilce');
    const okulSelect = document.getElementById('okul');
    if (!okulSelect || !il || !ilce) return;

    db.collection('sistem').doc('okulListesi').get().then(doc => {
        okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists) {
            const okullar = doc.data()[`${il}_${ilce}`] || [];
            okullar.sort((a, b) => a.localeCompare(b, 'tr')).forEach(o => {
                const opt = document.createElement('option');
                opt.value = o; opt.textContent = o;
                okulSelect.appendChild(opt);
            });
        }
    }).catch(e => console.error('Okullar yüklenemedi:', e));
};

// ============================================================
// --- 5. ADMİN: OKUL EKLEME & ÖĞRENCİ LİSTESİ & DUYURU ---
// ============================================================

/** Yeni okul Firestore'a kaydeder */
window.okulEkle = function () {
    const il     = getValue('yeniOkulIl');
    const ilce   = getValue('yeniOkulIlce');
    const okulAd = (document.getElementById('yeniOkulAd')?.value || '').trim();

    if (!il || !ilce || !okulAd) {
        return alert('Lütfen il, ilçe ve okul adını eksiksiz doldurun!');
    }

    const anahtar = `${il}_${ilce}`;
    db.collection('sistem').doc('okulListesi').set({
        [anahtar]: firebase.firestore.FieldValue.arrayUnion(okulAd)
    }, { merge: true })
    .then(() => {
        alert(`"${okulAd}" başarıyla sisteme eklendi! ✅`);
        document.getElementById('yeniOkulAd').value = '';
        // İlçe seçimini koru, sadece okul alanını sıfırla
    })
    .catch(e => alert('Hata oluştu: ' + e.message));
};

/** Tüm öğrencileri admin panelinde listeler */
function ogrenciListele() {
    const liste = document.getElementById('admin-student-list');
    if (!liste) return;

    db.collection('users').where('rol', '==', 'ogrenci')
        .orderBy('balonYuksekligi', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                liste.innerHTML = '<p style="color:#999">Henüz kayıtlı öğrenci yok.</p>';
                return;
            }
            liste.innerHTML = '';
            snapshot.forEach(doc => {
                const d = doc.data();
                liste.innerHTML += `
                    <div class="student-admin-card">
                        <span>🎈 <strong>${d.balonEtiketi || d.ogrenciAdSoyad}</strong>
                            <small style="color:#999"> — ${d.okul || '?'} / ${d.sinif || '?'}${d.sube || ''}</small>
                        </span>
                        <span style="font-weight:bold; color:#3498db">${d.balonYuksekligi || 0} m</span>
                    </div>`;
            });
        })
        .catch(e => {
            liste.innerHTML = `<p style="color:red">Liste yüklenemedi: ${e.message}</p>`;
        });
}

/** Haftalık hedef / duyuru yayınlar */
window.duyuruYayinla = function () {
    const mesaj = getValue('haftalikHedef');
    if (!mesaj) return alert('Lütfen duyuru metnini yazın!');
    db.collection('sistem').doc('duyuru').set({
        mesaj: mesaj,
        tarih: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => alert('Duyuru tüm sınıfa yayınlandı! 📢'));
};

// ============================================================
// --- 6. ÖĞRENCİ: BALON UÇURMA ---
// ============================================================
window.yukseklikArtir = function () {
    const sayfa = parseInt(document.getElementById('sayfaSayisi')?.value || '0');
    if (isNaN(sayfa) || sayfa <= 0) return alert('Geçerli bir sayfa sayısı girin!');
    const user = auth.currentUser;
    if (!user) return alert('Oturum bulunamadı, lütfen tekrar giriş yapın.');

    db.collection('users').doc(user.uid).update({
        toplamOkunanSayfa: firebase.firestore.FieldValue.increment(sayfa),
        balonYuksekligi:   firebase.firestore.FieldValue.increment(sayfa * 2)
    }).then(() => {
        document.getElementById('sayfaSayisi').value = '';
        alert('Balonun yükseldi! 🚀');
        // Ekrandaki yüksekliği güncelle
        const user2 = auth.currentUser;
        if (user2) kullaniciyiGoster(user2.uid);
    });
};

// ============================================================
// --- 7. AUTH İŞLEMLERİ ---
// ============================================================
window.register = function () {
    const email = getValue('email');
    const pass  = getValue('password');
    const rol   = getValue('rolSecimi');

    if (!email || !pass) return alert('E-posta ve şifre zorunludur.');

    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        const userObj = {
            ogrenciAdSoyad:   getValue('ogrenciAdSoyad'),
            balonEtiketi:     getValue('takmaAd') || 'Gizli Balon',
            il:               getValue('sehir'),
            ilce:             getValue('ilce'),
            okul:             getValue('okul'),
            sinif:            getValue('sinif'),
            sube:             getValue('sube'),
            rol:              (rol === 'admin') ? 'ogretmen' : 'ogrenci',
            balonYuksekligi:  0,
            toplamOkunanSayfa: 0
        };
        return db.collection('users').doc(res.user.uid).set(userObj);
    })
    .then(() => alert('Kayıt başarılı! Giriş yapabilirsiniz. 🎉'))
    .catch(e => alert('Kayıt hatası: ' + e.message));
};

window.login = function () {
    const email = getValue('loginEmail');
    const pass  = getValue('loginPassword');

    auth.signInWithEmailAndPassword(email, pass).then(res => {
        return db.collection('users').doc(res.user.uid).get();
    }).then(doc => {
        if (!doc.exists) throw new Error('Kullanıcı verisi bulunamadı.');
        if (doc.data().rol === 'ogretmen') {
            window.location.href = 'admin.html';
        } else {
            setDisplay('auth-area',  'none');
            setDisplay('user-panel', 'block');
            kullaniciyiGoster(doc.id);
        }
    }).catch(e => alert('Giriş hatası: ' + e.message));
};

window.logout = function () {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
};

// ============================================================
// --- 8. KULLANICI PANELİ ---
// ============================================================
function kullaniciyiGoster(uid) {
    db.collection('users').doc(uid).get().then(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        const hosgeldin = document.getElementById('welcome-msg');
        const display   = document.getElementById('display-height');
        if (hosgeldin) hosgeldin.textContent = `Merhaba, ${d.balonEtiketi || d.ogrenciAdSoyad}! 👋`;
        if (display)   display.textContent   = d.balonYuksekligi || 0;
    });
}

// Duyuruyu öğrenci panelinde göster
function duyuruyuYukle() {
    const alan = document.getElementById('target-area');
    if (!alan) return;
    db.collection('sistem').doc('duyuru').get().then(doc => {
        if (doc.exists && doc.data().mesaj) {
            alan.innerHTML = `📢 <strong>Haftalık Hedef:</strong> ${doc.data().mesaj}`;
            alan.style.display = 'block';
        }
    });
}

// ============================================================
// --- 9. OTURUM DEĞİŞİKLİĞİ DİNLEYİCİSİ ---
// ============================================================
auth.onAuthStateChanged(user => {
    if (SAYFA === 'admin') {
        // Admin sayfasında oturum yoksa index'e yönlendir
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists || doc.data().rol !== 'ogretmen') {
                window.location.href = 'index.html';
            } else {
                illeriDoldur();   // ← İL LİSTESİNİ DOLDUR (düzeltilen satır)
                ogrenciListele();
            }
        });
    } else if (SAYFA === 'ogrenci' || SAYFA === 'giris') {
        if (user) {
            // Giriş yapmış kullanıcı index'teyse paneli göster
            if (document.getElementById('auth-area')) {
                setDisplay('auth-area',  'none');
                setDisplay('user-panel', 'block');
                kullaniciyiGoster(user.uid);
                duyuruyuYukle();
            }
        }
    }
});

// ============================================================
// --- 10. SAYFA YÜKLENDİĞİNDE ---
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    // Yalnızca giriş/kayıt sayfasında il listesini önceden doldur
    if (SAYFA !== 'admin') {
        illeriDoldur();
    }
});

// ============================================================
// --- YARDIMCI FONKSİYONLAR ---
// ============================================================
function setDisplay(id, val) {
    const el = document.getElementById(id);
    if (el) el.style.display = val;
}
function getValue(id) {
    return document.getElementById(id)?.value?.trim() || '';
}
function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}
