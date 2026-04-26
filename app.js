// ============================================================
//  UÇUR BALONUNU — MASTER APP ENGINE (V14.0 - BADGES & STELLAR LIST)
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

const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };

// --- TARİH VE RENK MOTORU ---
const bugunTarihiniAl = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const dunTarihiniAl = () => { 
    const d = new Date(); d.setDate(d.getDate() - 1); 
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; 
};
const getRandomColor = () => {
    const colors = ['#ff5e57', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff4757'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// --- ROZET HESAPLAMA MOTORU (Hem öğrenci hem öğretmen için ortak) ---
function rozetleriOlustur(streak, toplam) {
    let rozetler = "";
    if (streak >= 3)  rozetler += "🌱 "; // Başlangıç serisi
    if (streak >= 10) rozetler += "🔥 "; // 10 günlük seri
    if (streak >= 20) rozetler += "⚡ "; // 20 günlük seri
    if (streak >= 30) rozetler += "☄️ "; // 30 günlük seri
    if (toplam >= 100)  rozetler += "🎖️ "; // 100 sayfa
    if (toplam >= 500)  rozetler += "📚 "; // 500 sayfa
    if (toplam >= 1000) rozetler += "👑 "; // 1000 sayfa
    return rozetler || "🐣"; // Hiç yoksa yeni başlayan yumurtası
}

// --- AUTH TAKİBİ ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();

            if (data.rol === 'admin' || data.rol === 'superadmin' || data.email === 'admin@ucurbalonu.com') {
                if (!IS_SUPERADMIN_PAGE) window.location.href = 'superadmin.html';
                else { gosterGizle('superadmin-area', 'block'); window.illeriDoldur(); }
            } 
            else if (data.rol === 'ogretmen') {
                if (!IS_ADMIN_PAGE) window.location.href = 'admin.html';
                else { 
                    window.ogrenciListele(data.okul, data.sinif, data.sube); 
                    window.balonlariGoster('admin-balloon-container', data.okul, data.sinif, data.sube, true); 
                    window.illeriDoldur();
                }
            } 
            else {
                if (!IS_INDEX_PAGE) window.location.href = 'index.html';
                else {
                    gosterGizle('auth-area', 'none'); gosterGizle('user-panel', 'block');
                    document.getElementById('display-height').innerText = data.balonYuksekligi || 0;
                    document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                    
                    // Öğrenci Rozet Alanını Güncelle
                    const medalArea = document.getElementById('medalyalar');
                    if(medalArea) {
                        const r = rozetleriOlustur(data.streak || 0, data.toplamOkunanSayfa || 0);
                        medalArea.innerHTML = `<div class="medal-shelf"><span title="Okuma Serisi">🔥 ${data.streak || 0} Gün</span> | ${r}</div>`;
                    }
                    window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
                }
            }
        });
    } else {
        if (!IS_INDEX_PAGE) window.location.href = 'index.html';
        window.illeriDoldur();
    }
});

// --- YÜKSEKLİK VE SERİ MANTIĞI ---
window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const yeniSayfa = parseInt(input.value);
    if (!yeniSayfa || yeniSayfa <= 0) return alert("Kaç sayfa okudun?");

    const userRef = db.collection('users').doc(auth.currentUser.uid);
    const bugun = bugunTarihiniAl();
    const dun = dunTarihiniAl();

    userRef.get().then(doc => {
        const data = doc.data();
        if ((data.sonOkumaTarihi || "") === bugun) {
            alert("Bugün zaten uçurdun! Yarın tekrar bekliyoruz. 🎈");
            return;
        }

        let yeniStreak = data.streak || 0;
        if (data.sonOkumaTarihi === dun) yeniStreak += 1; 
        else yeniStreak = 1;

        const yeniToplam = (data.toplamOkunanSayfa || 0) + yeniSayfa;
        
        return userRef.update({
            toplamOkunanSayfa: yeniToplam,
            balonYuksekligi: yeniToplam * 1,
            sonOkumaTarihi: bugun,
            streak: yeniStreak
        });
    }).then(() => { input.value = ''; }).catch(e => alert("Hata: " + e.message));
};

// --- GÖRSEL LİSTELEME (Öğretmen ve Sınıf İçin) ---
window.ogrenciListele = (okul, sinif, sube) => {
    const list = document.getElementById('admin-student-list');
    if (!list) return;
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube).where('rol', '==', 'ogrenci').onSnapshot(qs => {
        list.innerHTML = '';
        qs.forEach(doc => { 
            const s = doc.data(); 
            const r = rozetleriOlustur(s.streak || 0, s.toplamOkunanSayfa || 0);
            list.innerHTML += `
                <div class="student-admin-card">
                    <div style="display:flex; flex-direction:column;">
                        <b>${s.ogrenciAdSoyad}</b>
                        <small style="color:#666;">🔥 Seri: ${s.streak || 0} gün</small>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px;">${r}</div>
                        <span style="color:#3498db; font-weight:bold;">${s.balonYuksekligi}m</span>
                    </div>
                </div>`; 
        });
    });
};

window.balonlariGoster = (containerId, okul, sinif, sube, isAdmin) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube).onSnapshot(qs => {
        container.innerHTML = '';
        qs.forEach(doc => {
            const s = doc.data(); if (s.rol === 'ogretmen') return;
            const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
            const bColor = s.balloonColor || (isMe ? '#ff5e57' : '#3498db');
            container.innerHTML += `<div class="balloon" style="bottom:${Math.min(s.balonYuksekligi || 0, 330)}px; left:${(isMe && !isAdmin) ? 50 : (Math.random() * 80 + 10)}%; background-color:${bColor}; transform:translateX(-50%) scale(${isAdmin?0.6:1});">
                <div class="balloon-label">${isAdmin ? s.ogrenciAdSoyad : (isMe ? 'Sen' : s.balonEtiketi)}</div></div>`;
        });
    });
};

// --- DİĞER TEMEL FONKSİYONLAR ---
window.login = () => { auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value).catch(e => alert(e.message)); };
window.logout = () => auth.signOut().then(() => window.location.href = 'index.html');
window.register = () => {
    const email = document.getElementById('email').value, pass = document.getElementById('password').value, rol = document.getElementById('rolSecimi').value;
    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value, balonEtiketi: document.getElementById('takmaAd').value || "Gezgin",
            okul: document.getElementById('okul').value, sinif: document.getElementById('sinif').value, sube: document.getElementById('sube').value,
            rol: (rol === 'admin' ? 'ogretmen' : 'ogrenci'), balonYuksekligi: 0, toplamOkunanSayfa: 0, balloonColor: getRandomColor(), streak: 0
        });
    }).then(() => location.reload()).catch(e => alert(e.message));
};
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
window.showRegisterForm = (r) => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = r; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };
