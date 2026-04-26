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

const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };
const bugunTarihiniAl = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const dunTarihiniAl = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

// ROZETLER
function rozetleriOlustur(streak, toplam) {
    let r = [];
    if (streak >= 3)  r.push({e: "🌱", t: "3 Günlük Seri!"});
    if (streak >= 10) r.push({e: "🔥", t: "10 Günlük Seri!"});
    if (toplam >= 100)  r.push({e: "🎖️", t: "100 Sayfa Kulübü!"});
    return r.length === 0 ? `🐣` : r.map(i => `<span class="medal-icon" title="${i.t}">${i.e}</span>`).join("");
}

// ANA TAKİP & PARALLAX
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            const h = data.balonYuksekligi || 0;

            if (data.rol === 'admin' || data.rol === 'superadmin' || data.email === 'admin@ucurbalonu.com') {
                if (!IS_SUPERADMIN_PAGE) window.location.href = 'superadmin.html';
                else { gosterGizle('superadmin-area', 'block'); window.illeriDoldur(); }
            } else if (data.rol === 'ogretmen') {
                if (IS_INDEX_PAGE) window.location.href = 'admin.html';
                else { window.ogrenciListele(data.okul, data.sinif, data.sube); window.balonlariGoster('admin-balloon-container', data.okul, data.sinif, data.sube, true); }
            } else {
                if (!IS_INDEX_PAGE) window.location.href = 'index.html';
                else {
                    gosterGizle('auth-area', 'none'); gosterGizle('user-panel', 'block');
                    if(document.getElementById('display-height')) document.getElementById('display-height').innerText = h;
                    if(document.getElementById('welcome-msg')) document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                    
                    const sky = document.getElementById('main-sky');
                    if (sky) {
                        let pos = 100 - (h / 5); if (pos < 0) pos = 0;
                        sky.style.backgroundPosition = `center ${pos}%`;
                    }
                    const m = document.getElementById('medalyalar');
                    if(m) m.innerHTML = `<div class="medal-shelf">🔥 ${data.streak || 0} GÜN | ${rozetleriOlustur(data.streak || 0, data.toplamOkunanSayfa || 0)}</div>`;
                    window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
                }
            }
        });
    } else { if (!IS_INDEX_PAGE) window.location.href = 'index.html'; window.illeriDoldur(); }
});

// YÜKSEKLİK & GÜNLÜK SINIR
window.yukseklikArtir = function() {
    const s = parseInt(document.getElementById('sayfaSayisi').value);
    if (!s || s <= 0) return alert("Kaç sayfa okudun?");
    const ref = db.collection('users').doc(auth.currentUser.uid);
    const bugun = bugunTarihiniAl();
    ref.get().then(doc => {
        const d = doc.data();
        if (d.sonOkumaTarihi === bugun) return alert("Bugün zaten uçurdun! Yarın gel. 🎈");
        let streak = (d.sonOkumaTarihi === dunTarihiniAl()) ? (d.streak || 0) + 1 : 1;
        let t = (d.toplamOkunanSayfa || 0) + s;
        return ref.update({ toplamOkunanSayfa: t, balonYuksekligi: t, sonOkumaTarihi: bugun, streak: streak });
    }).then(() => document.getElementById('sayfaSayisi').value = '');
};

// SİSTEMSEL FONKSİYONLAR
window.illeriDoldur = () => {
    const t = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIl" : "sehir";
    const el = document.getElementById(t);
    if (el && typeof ilVerisi !== 'undefined') {
        el.innerHTML = '<option value="">İl Seçiniz</option>';
        Object.keys(ilVerisi).sort().forEach(il => { el.innerHTML += `<option value="${il}">${il}</option>`; });
    }
};

window.ilceleriYukle = () => {
    const isS = IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE;
    const s = document.getElementById(isS ? "yeniOkulIl" : "sehir").value;
    const el = document.getElementById(isS ? "yeniOkulIlce" : "ilce");
    if (el && s && ilVerisi[s]) {
        el.innerHTML = '<option value="">İlçe Seçiniz</option>';
        ilVerisi[s].forEach(i => { el.innerHTML += `<option value="${i}">${i}</option>`; });
    }
};
window.yeniOkulIlceleriYukle = () => window.ilceleriYukle();

window.okullariYukle = () => {
    const il = document.getElementById("sehir").value, ilce = document.getElementById("ilce").value, el = document.getElementById("okul");
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        el.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists && doc.data()[`${il}_${ilce}`]) doc.data()[`${il}_${ilce}`].sort().forEach(o => { el.innerHTML += `<option value="${o}">${o}</option>`; });
    });
};

window.okulEkle = () => {
    const il = document.getElementById("yeniOkulIl").value, ilce = document.getElementById("yeniOkulIlce").value, ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik!");
    db.collection("sistem").doc("okulListesi").set({ [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad) }, {merge:true}).then(() => alert("Okul Eklendi!"));
};

window.balonlariGoster = (c, o, si, su, isAdmin) => {
    const container = document.getElementById(c); if (!container) return;
    db.collection('users').where('okul', '==', o).where('sinif', '==', si).where('sube', '==', su).onSnapshot(qs => {
        container.innerHTML = '';
        qs.forEach(doc => {
            const d = doc.data(); if (d.rol === 'ogretmen') return;
            const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
            let visH = Math.min(d.balonYuksekligi || 0, 350);
            container.innerHTML += `<div class="balloon" style="bottom:${visH}px; left:${Math.random()*80+10}%; background-color:${d.balloonColor || '#3498db'};"><div class="balloon-label">${d.ogrenciAdSoyad}</div></div>`;
        });
    });
};

window.ogrenciListele = (okul, sinif, sube) => {
    const list = document.getElementById('admin-student-list');
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube).where('rol', '==', 'ogrenci').onSnapshot(qs => {
        list.innerHTML = '';
        qs.forEach(doc => {
            const s = doc.data();
            list.innerHTML += `<div style="display:flex; justify-content:space-between; background:#f9f9f9; padding:10px; margin-top:5px; border-radius:10px;"><b>${s.ogrenciAdSoyad}</b> <span>${s.balonYuksekligi}m</span></div>`;
        });
    });
};

window.login = () => auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value).catch(e => alert(e.message));
window.logout = () => auth.signOut().then(() => window.location.href = 'index.html');
window.register = () => {
    const e = document.getElementById('email').value, p = document.getElementById('password').value, r = document.getElementById('rolSecimi').value;
    const getRandomColor = () => ['#ff5e57', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff4757'][Math.floor(Math.random() * 8)];
    auth.createUserWithEmailAndPassword(e, p).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            okul: document.getElementById('okul').value, sinif: document.getElementById('sinif').value, sube: document.getElementById('sube').value,
            rol: (r === 'admin' ? 'ogretmen' : 'ogrenci'), balonYuksekligi: 0, toplamOkunanSayfa: 0, streak: 0, balloonColor: getRandomColor()
        });
    }).then(() => location.reload()).catch(err => alert(err.message));
};

window.showRegisterForm = (r) => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = r; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };
