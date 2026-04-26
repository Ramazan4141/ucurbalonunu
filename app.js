// ============================================================
//  UÇUR BALONUNU — MASTER APP ENGINE (V22.1 - NO DELETIONS)
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

// SAYFA TESPİTİ
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

// YARDIMCI FONKSİYONLAR
const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };
const bugunTarihiniAl = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const dunTarihiniAl = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

// ROZET MOTORU (Tooltipli)
function rozetleriOlustur(streak, toplam) {
    let r = [];
    if (streak >= 3)  r.push({e: "🌱", t: "3 Günlük Seri: Harika başlangıç!"});
    if (streak >= 10) r.push({e: "🔥", t: "10 Günlük Seri: Durdurulamaz okuyucu!"});
    if (streak >= 30) r.push({e: "☄️", t: "30 Günlük Seri: Kitap Efsanesi!"});
    if (toplam >= 100)  r.push({e: "🎖️", t: "100 Sayfa: Büyük başarı!"});
    if (toplam >= 500)  r.push({e: "📚", t: "500 Sayfa: Kitap Dostu!"});
    if (toplam >= 1000) r.push({e: "👑", t: "1000 Sayfa: Okuma Kralı/Kraliçesi!"});
    return r.length === 0 ? `<span class="medal-icon" title="Okudukça gelecek!">🐣</span>` : r.map(i => `<span class="medal-icon" title="${i.t}">${i.e}</span>`).join("");
}

// ANA TAKİP & PARALLAX MOTORU
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            const h = data.balonYuksekligi || 0;

            // 1. ROL BAZLI YÖNLENDİRME
            if (data.rol === 'admin' || data.rol === 'superadmin') {
                if (IS_INDEX_PAGE) window.location.href = 'superadmin.html';
                else { gosterGizle('superadmin-area', 'block'); window.illeriDoldur(); }
            } else if (data.rol === 'ogretmen') {
                if (IS_INDEX_PAGE) window.location.href = 'admin.html';
                else { window.ogrenciListele(data.okul, data.sinif, data.sube); window.balonlariGoster('admin-balloon-container', data.okul, data.sinif, data.sube, true); window.illeriDoldur(); }
            } else {
                // ÖĞRENCİ PANELİ
                if (!IS_INDEX_PAGE) window.location.href = 'index.html';
                else {
                    gosterGizle('auth-area', 'none'); gosterGizle('user-panel', 'block');
                    document.getElementById('display-height').innerText = h;
                    document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                    
                    // --- 🏔️ PARALLAX (Dikey Resim Kaydırma) ---
                    const sky = document.querySelector('.sky');
                    const depth = document.getElementById('layer-depth');
                    if (sky) {
                        let pos = 100 - (h / 4); if (pos < 0) pos = 0;
                        sky.style.backgroundPosition = `center ${pos}%`;
                        if (depth) depth.style.transform = `translateY(${h * 1.5}px)`;
                    }

                    const m = document.getElementById('medalyalar');
                    if(m) m.innerHTML = `<div class="medal-shelf">🔥 ${data.streak || 0} GÜN | ${rozetleriOlustur(data.streak || 0, data.toplamOkunanSayfa || 0)}</div>`;
                    window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
                }
            }
        });
    } else { if (!IS_INDEX_PAGE) window.location.href = 'index.html'; window.illeriDoldur(); }
});

// 2. VERİ GİRİŞİ (1 Sayfa = 1 Metre & Seri & Günlük Limit)
window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const s = parseInt(input.value);
    if (!s || s <= 0) return alert("Kaç sayfa okudun?");
    const ref = db.collection('users').doc(auth.currentUser.uid);
    const bugun = bugunTarihiniAl();
    ref.get().then(doc => {
        const d = doc.data();
        if (d.sonOkumaTarihi === bugun) return alert("Bugün zaten uçurdun! Yarın gel. 🎈");
        let streak = (d.sonOkumaTarihi === dunTarihiniAl()) ? (d.streak || 0) + 1 : 1;
        let toplam = (d.toplamOkunanSayfa || 0) + s;
        return ref.update({ toplamOkunanSayfa: toplam, balonYuksekligi: toplam, sonOkumaTarihi: bugun, streak: streak });
    }).then(() => { input.value = ''; }).catch(e => alert(e.message));
};

// 3. SİSTEMSEL FONKSİYONLAR (Kayıt, Giriş, Okul Ekleme)
window.login = () => { auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value).catch(e => alert(e.message)); };
window.logout = () => auth.signOut().then(() => window.location.href = 'index.html');

window.register = () => {
    const e = document.getElementById('email').value, p = document.getElementById('password').value, r = document.getElementById('rolSecimi').value;
    const getRandomColor = () => ['#ff5e57', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff4757'][Math.floor(Math.random() * 8)];
    auth.createUserWithEmailAndPassword(e, p).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value, balonEtiketi: document.getElementById('takmaAd').value || "Gezgin",
            okul: document.getElementById('okul').value, sinif: document.getElementById('sinif').value, sube: document.getElementById('sube').value,
            rol: (r === 'admin' ? 'ogretmen' : 'ogrenci'), balonYuksekligi: 0, toplamOkunanSayfa: 0, balloonColor: getRandomColor(), streak: 0
        });
    }).then(() => location.reload()).catch(err => alert(err.message));
};

// --- OKUL VE KONUM MOTORU ---
window.illeriDoldur = () => {
    const target = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIl" : "sehir";
    const el = document.getElementById(target);
    if (el && typeof ilVerisi !== 'undefined') {
        el.innerHTML = '<option value="">İl Seçiniz</option>';
        Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => { el.innerHTML += `<option value="${il}">${il}</option>`; });
    }
};
window.ilceleriYukle = (f = false) => {
    const s = IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE || f;
    const sehir = document.getElementById(s ? "yeniOkulIl" : "sehir").value;
    const el = document.getElementById(s ? "yeniOkulIlce" : "ilce");
    if (!el || !sehir) return;
    el.innerHTML = '<option value="">İlçe Seçiniz</option>';
    ilVerisi[sehir].forEach(i => { el.innerHTML += `<option value="${i}">${i}</option>`; });
};
window.yeniOkulIlceleriYukle = () => window.ilceleriYukle(true);
window.okullariYukle = () => {
    const il = document.getElementById("sehir").value, ilce = document.getElementById("ilce").value, el = document.getElementById("okul");
    if(!el) return;
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        el.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists && doc.data()[`${il}_${ilce}`]) doc.data()[`${il}_${ilce}`].sort().forEach(o => { el.innerHTML += `<option value="${o}">${o}</option>`; });
    });
};
window.okulEkle = () => {
    const il = document.getElementById("yeniOkulIl").value, ilce = document.getElementById("yeniOkulIlce").value, ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik bilgi!");
    db.collection("sistem").doc("okulListesi").set({ [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad) }, {merge:true}).then(() => alert("Okul Eklendi!"));
};

// --- GÖRSEL LİSTELEME ---
window.balonlariGoster = (c, o, si, su, isAdmin) => {
    const container = document.getElementById(c); if (!container) return;
    db.collection('users').where('okul', '==', o).where('sinif', '==', si).where('sube', '==', su).onSnapshot(qs => {
        container.innerHTML = '';
        qs.forEach(doc => {
            const d = doc.data(); if (d.rol === 'ogretmen') return;
            const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
            container.innerHTML += `<div class="balloon" style="bottom:${Math.min(d.balonYuksekligi || 0, 330)}px; left:${(isMe && !isAdmin) ? 50 : (Math.random() * 80 + 10)}%; background-color:${d.balloonColor || '#3498db'}; transform:translateX(-50%) scale(${isAdmin?0.6:1});">
                <div class="balloon-label">${isAdmin ? d.ogrenciAdSoyad : (isMe ? 'Sen' : d.balonEtiketi)}</div></div>`;
        });
    });
};
window.ogrenciListele = (okul, sinif, sube) => {
    const list = document.getElementById('admin-student-list');
    if (!list) return;
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube).where('rol', '==', 'ogrenci').onSnapshot(qs => {
        list.innerHTML = '';
        qs.forEach(doc => {
            const s = doc.data();
            list.innerHTML += `<div class="student-admin-card" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; background:white; margin-bottom:5px; border-radius:10px;">
                <div><b>${s.ogrenciAdSoyad}</b><br><small>🔥 Seri: ${s.streak || 0} gün</small></div>
                <div style="text-align:right;"><div>${rozetleriOlustur(s.streak || 0, s.toplamOkunanSayfa || 0)}</div><span style="color:#3498db; font-weight:bold;">${s.balonYuksekligi}m</span></div>
            </div>`;
        });
    });
};

// PANEL GEÇİŞLERİ
window.showRegisterForm = (r) => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = r; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };
