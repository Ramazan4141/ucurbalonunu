// FIREBASE CONFIG
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
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !window.location.pathname.includes('superadmin.html');

const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };
const bugunTarihiniAl = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const dunTarihiniAl = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

// ROZET MOTORU
function rozetleriOlustur(streak, toplam) {
    let r = [];
    if (streak >= 3)  r.push({e: "🌱", t: "3 Günlük Seri!"});
    if (streak >= 10) r.push({e: "🔥", t: "10 Günlük Seri!"});
    if (toplam >= 100)  r.push({e: "🎖️", t: "100 Sayfa!"});
    if (toplam >= 1000) r.push({e: "👑", t: "1000 Sayfa Kralı!"});
    return r.length === 0 ? `🐣` : r.map(i => `<span class="medal-icon" title="${i.t}">${i.e}</span>`).join("");
}

// ANA TAKİP
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            const h = data.balonYuksekligi || 0;

            if (data.rol === 'admin' || data.rol === 'superadmin') {
                if (IS_INDEX_PAGE) window.location.href = 'superadmin.html';
            } else if (data.rol === 'ogretmen') {
                if (IS_INDEX_PAGE) window.location.href = 'admin.html';
            } else {
                if (!IS_INDEX_PAGE) window.location.href = 'index.html';
                else {
                    gosterGizle('auth-area', 'none'); gosterGizle('user-panel', 'block');
                    document.getElementById('display-height').innerText = h;
                    document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                    
                    // --- 🏔️ ARKA PLAN KAYDIRMA (Sihirli Kısım) ---
                    const sky = document.getElementById('main-sky');
                    if (sky) {
                        // Resim çok dikey olduğu için % değerini yüksekliğe göre ayarlıyoruz
                        // 0 metrede %100 (en alt), 500+ metrede %0 (en üst)
                        let pos = 100 - (h / 5); 
                        if (pos < 0) pos = 0;
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

// YÜKSEKLİK ARTIRMA
window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const s = parseInt(input.value);
    if (!s || s <= 0) return alert("Kaç sayfa okudun?");
    const ref = db.collection('users').doc(auth.currentUser.uid);
    const bugun = bugunTarihiniAl();
    ref.get().then(doc => {
        const d = doc.data();
        if (d.sonOkumaTarihi === bugun) return alert("Bugün zaten uçurdun!");
        let streak = (d.sonOkumaTarihi === dunTarihiniAl()) ? (d.streak || 0) + 1 : 1;
        let toplam = (d.toplamOkunanSayfa || 0) + s;
        return ref.update({ toplamOkunanSayfa: toplam, balonYuksekligi: toplam, sonOkumaTarihi: bugun, streak: streak });
    }).then(() => { input.value = ''; }).catch(e => alert(e.message));
};

// YARDIMCI GÖRSEL FONKSİYONLAR
window.balonlariGoster = (c, o, si, su, isAdmin) => {
    const container = document.getElementById(c); if (!container) return;
    db.collection('users').where('okul', '==', o).where('sinif', '==', si).where('sube', '==', su).onSnapshot(qs => {
        container.innerHTML = '';
        qs.forEach(doc => {
            const d = doc.data(); if (d.rol === 'ogretmen') return;
            const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
            // Balonun kutu dışına taşmaması için yüksekliği sınırlıyoruz (max 350px)
            let visualH = Math.min(d.balonYuksekligi || 0, 350);
            container.innerHTML += `<div class="balloon" style="bottom:${visualH}px; left:${(isMe && !isAdmin) ? 50 : (Math.random() * 80 + 10)}%; background-color:${d.balloonColor || '#3498db'}; transform:translateX(-50%) scale(${isAdmin?0.6:1});">
                <div class="balloon-label">${isAdmin ? d.ogrenciAdSoyad : (isMe ? 'Sen' : d.balonEtiketi)}</div></div>`;
        });
    });
};

// AUTH & UI FLOW
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
window.illeriDoldur = () => { const el = document.getElementById("sehir"); if (el && typeof ilVerisi !== 'undefined') { el.innerHTML = '<option value="">İl Seçiniz</option>'; Object.keys(ilVerisi).sort().forEach(il => { el.innerHTML += `<option value="${il}">${il}</option>`; }); } };
window.ilceleriYukle = () => { const sehir = document.getElementById("sehir").value; const el = document.getElementById("ilce"); if (!el || !sehir) return; el.innerHTML = '<option value="">İlçe Seçiniz</option>'; ilVerisi[sehir].forEach(i => { el.innerHTML += `<option value="${i}">${i}</option>`; }); };
window.okullariYukle = () => { const il = document.getElementById("sehir").value, ilce = document.getElementById("ilce").value, el = document.getElementById("okul"); if(!el) return; db.collection("sistem").doc("okulListesi").get().then(doc => { el.innerHTML = '<option value="">Okul Seçiniz</option>'; if (doc.exists && doc.data()[`${il}_${ilce}`]) doc.data()[`${il}_${ilce}`].sort().forEach(o => { el.innerHTML += `<option value="${o}">${o}</option>`; }); }); };
window.showRegisterForm = (r) => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = r; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };
