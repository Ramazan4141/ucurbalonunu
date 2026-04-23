// ============================================================
//  UÇUR BALONUNU — MASTER APP ENGINE (FINAL ROBUST VERSION)
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

// 1. SAYFA TESPİTİ VE YARDIMCI ARAÇLAR
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };
const bugunTarihiniAl = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

// 2. AUTH TAKİBİ VE ROL TABANLI CANLI YÖNETİM
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();

            // ROL 1: SUPERADMIN (Okul Ekleme Yetkisi)
            if (data.rol === 'admin' || data.rol === 'superadmin' || data.email === 'admin@ucurbalonu.com') {
                if (!IS_SUPERADMIN_PAGE) window.location.href = 'superadmin.html';
                else { gosterGizle('superadmin-area', 'block'); window.illeriDoldur(); }
            } 
            // ROL 2: ÖĞRETMEN (Sınıf Yönetimi)
            else if (data.rol === 'ogretmen') {
                if (!IS_ADMIN_PAGE) window.location.href = 'admin.html';
                else { 
                    window.ogrenciListele(data.okul, data.sinif, data.sube); 
                    window.balonlariGoster('admin-balloon-container', data.okul, data.sinif, data.sube, true); 
                    window.illeriDoldur();
                }
            } 
            // ROL 3: ÖĞRENCİ (Ana Panel)
            else {
                if (!IS_INDEX_PAGE) window.location.href = 'index.html';
                else {
                    gosterGizle('auth-area', 'none'); 
                    gosterGizle('user-panel', 'block');
                    const disp = document.getElementById('display-height');
                    if(disp) disp.innerText = data.balonYuksekligi || 0;
                    const welcome = document.getElementById('welcome-msg');
                    if(welcome) welcome.innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                    window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
                }
            }
        });
    } else {
        if (!IS_INDEX_PAGE) window.location.href = 'index.html';
        window.illeriDoldur();
    }
});

// 3. ÖĞRENCİ PANELİ: YÜKSEKLİK ARTIRMA (Günde 1 kez & Birikimli)
window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const yeniSayfa = parseInt(input.value);
    if (!yeniSayfa || yeniSayfa <= 0) return alert("Lütfen okuduğun sayfa sayısını gir!");

    const userRef = db.collection('users').doc(auth.currentUser.uid);
    const bugun = bugunTarihiniAl();

    userRef.get().then(doc => {
        const data = doc.data();
        if ((data.sonOkumaTarihi || "") === bugun) {
            alert("Bugün zaten balonunu uçurdun! Yarın yeni kitaplarla tekrar gel. 🎈");
            return (input.value = '');
        }
        
        // Birikimli yükseklik hesabı: Eski toplam + Yeni sayfa
        const yeniToplam = (data.toplamOkunanSayfa || 0) + yeniSayfa;
        return userRef.update({
            toplamOkunanSayfa: yeniToplam,
            balonYuksekligi: yeniToplam * 2, // 1 sayfa = 2 metre
            sonOkumaTarihi: bugun
        });
    }).then(() => { 
        if(input) input.value = ''; 
        alert("Harika! Sayfalar eklendi ve balonun yükseldi! 🚀");
    }).catch(e => alert("Hata: " + e.message));
};

// 4. BALON VE LİSTE MOTORLARI (Canlı Güncelleme)
window.balonlariGoster = (containerId, okul, sinif, sube, isAdmin) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube).onSnapshot(qs => {
        container.innerHTML = '';
        qs.forEach(doc => {
            const s = doc.data(); if (s.rol === 'ogretmen') return;
            const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
            container.innerHTML += `<div class="balloon" style="bottom:${Math.min(s.balonYuksekligi || 0, 330)}px; left:${(isMe && !isAdmin) ? 50 : (Math.random() * 80 + 10)}%; background-color:${isMe ? '#ff5e57' : '#3498db'}; transform:translateX(-50%) scale(${isAdmin?0.6:1});">
                <div class="balloon-label">${isAdmin ? s.ogrenciAdSoyad : (isMe ? 'Sen' : s.balonEtiketi)}</div></div>`;
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
            list.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; background:white; margin-bottom:5px; border-radius:8px;">
                <b>${s.ogrenciAdSoyad}</b> <span>${s.balonYuksekligi}m (${s.toplamOkunanSayfa || 0} sayfa)</span></div>`; 
        });
    });
};

// 5. İL / İLÇE / OKUL MOTORU (Merkezi Yapı)
window.illeriDoldur = () => {
    const target = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIl" : "sehir";
    const el = document.getElementById(target);
    if (el && typeof ilVerisi !== 'undefined') {
        el.innerHTML = '<option value="">İl Seçiniz</option>';
        Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => { el.innerHTML += `<option value="${il}">${il}</option>`; });
    }
};

window.ilceleriYukle = (forceAdmin = false) => {
    const isSpecial = IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE || forceAdmin;
    const sehir = document.getElementById(isSpecial ? "yeniOkulIl" : "sehir").value;
    const ilceSelect = document.getElementById(isSpecial ? "yeniOkulIlce" : "ilce");
    if (!ilceSelect || !sehir) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    ilVerisi[sehir].forEach(ilce => { ilceSelect.innerHTML += `<option value="${ilce}">${ilce}</option>`; });
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

// 6. GİRİŞ, ÇIKIŞ VE KAYIT
window.login = () => { auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value).catch(e => alert(e.message)); };
window.logout = () => auth.signOut().then(() => window.location.href = 'index.html');

window.register = () => {
    const email = document.getElementById('email').value, pass = document.getElementById('password').value, rol = document.getElementById('rolSecimi').value;
    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value, balonEtiketi: document.getElementById('takmaAd').value || "Gezgin",
            okul: document.getElementById('okul').value, sinif: document.getElementById('sinif').value, sube: document.getElementById('sube').value,
            rol: (rol === 'admin' ? 'ogretmen' : 'ogrenci'), balonYuksekligi: 0, toplamOkunanSayfa: 0
        });
    }).then(() => location.reload()).catch(e => alert(e.message));
};

// 7. OKUL EKLEME (Superadmin Yetkisi)
window.okulEkle = () => {
    const il = document.getElementById("yeniOkulIl").value, ilce = document.getElementById("yeniOkulIlce").value, ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik bilgi!");
    db.collection("sistem").doc("okulListesi").set({ [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad) }, {merge:true}).then(() => alert("Okul Eklendi!"));
};

// 8. PANEL GEÇİŞLERİ
window.showRegisterForm = (rol) => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = rol; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };
