// ============================================================
//  UÇUR BALONUNU — MASTER APP ENGINE (V15.1 - ALL FEATURES INCLUDED)
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

// 1. SAYFA VE YARDIMCI ARAÇLAR
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };
const bugunTarihiniAl = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const dunTarihiniAl = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

// Rastgele Renk Üretici
const getRandomColor = () => {
    const colors = ['#ff5e57', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff4757', '#ffa502'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// --- 2. ROZET VE AÇIKLAMA MOTORU (TOOLTIP DESTEKLİ) ---
function rozetleriOlustur(streak, toplam) {
    let rozetler = [];
    // Seri Rozetleri
    if (streak >= 3)  rozetler.push({emoji: "🌱", text: "3 Günlük Seri: Harika başladın!"});
    if (streak >= 10) rozetler.push({emoji: "🔥", text: "10 Günlük Seri: Kitaplar seni çok seviyor!"});
    if (streak >= 20) rozetler.push({emoji: "⚡", text: "20 Günlük Seri: Gerçek bir okuma fırtınası!"});
    if (streak >= 30) rozetler.push({emoji: "☄️", text: "30 Günlük Seri: Kitap Efsanesi!"});
    
    // Toplam Sayfa Rozetleri
    if (toplam >= 100)  rozetler.push({emoji: "🎖️", text: "100 Sayfa: İlk büyük başarı!"});
    if (toplam >= 500)  rozetler.push({emoji: "📚", text: "500 Sayfa: Kütüphane Dostu!"});
    if (toplam >= 1000) rozetler.push({emoji: "👑", text: "1000 Sayfa: Okuma Kralı/Kraliçesi!"});

    if (rozetler.length === 0) return `<span class="medal-icon" title="Okumaya devam et, madalyalar yolda!">🐣</span>`;

    // Tooltip için 'title' özelliğini kullanıyoruz
    return rozetler.map(r => `<span class="medal-icon" title="${r.text}" style="cursor:help;">${r.emoji}</span>`).join("");
}

// --- 3. AUTH TAKİBİ VE CANLI PANEL YÖNETİMİ ---
// ... Firebase config kısımları aynı ...

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            const h = data.balonYuksekligi || 0;

            if (IS_INDEX_PAGE && data.rol === 'ogrenci') {
                // --- 🚀 GÖRSEL MOTOR (KAMERA TAKİBİ) ---
                const sky = document.querySelector('.sky');
                const mountain = document.getElementById('mountain-layer');
                const stars = document.getElementById('stars-layer');

                // 1. DAĞLARIN HAREKETİ (0-200m arası dağlar aşağı kayar)
                if (mountain) {
                    let mPos = h * 0.8; // Balon yükseldikçe dağ aşağı iner
                    mountain.style.transform = `translateY(${mPos}px)`;
                    if (h > 250) mountain.style.opacity = "0"; // Çok yükselince dağ silinir
                    else mountain.style.opacity = "0.8";
                }

                // 2. GÖKYÜZÜ RENGİ VE YILDIZLAR (150m'den sonra hava kararır)
                if (sky && stars) {
                    if (h < 150) {
                        sky.style.background = "#4facfe"; // Gün yüzü
                        stars.style.opacity = "0";
                    } else if (h >= 150 && h < 300) {
                        sky.style.background = "#1e3799"; // Akşam/Atmosfer dışı
                        stars.style.opacity = "0.5";
                        stars.style.top = "0";
                    } else {
                        sky.style.background = "#000000"; // TAM UZAY
                        stars.style.opacity = "1";
                        if (!document.querySelector('.planet')) addPlanets(sky);
                    }
                }

                // Standart Panel Güncellemeleri
                document.getElementById('display-height').innerText = h;
                document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                
                const m = document.getElementById('medalyalar');
                if(m) {
                    const r = rozetleriOlustur(data.streak || 0, data.toplamOkunanSayfa || 0);
                    m.innerHTML = `<div class="medal-shelf">🔥 SERİ: ${data.streak || 0} | ${r}</div>`;
                }
                window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
            }
        });
    }
});

function addPlanets(sky) {
    const planets = ['🪐', '🚀', '🌙', '☄️'];
    planets.forEach((p, i) => {
        const span = document.createElement('span');
        span.className = 'planet';
        span.innerText = p;
        span.style.cssText = `position:absolute; left:${Math.random()*80}%; top:${i*70}px; font-size:30px; z-index:2;`;
        sky.appendChild(span);
    });
}

// --- 4. YÜKSEKLİK VE SERİ GÜNCELLEME (1 Sayfa = 1 Metre) ---
window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const yeniSayfa = parseInt(input.value);
    if (!yeniSayfa || yeniSayfa <= 0) return alert("Lütfen sayfa sayısını gir!");

    const userRef = db.collection('users').doc(auth.currentUser.uid);
    const bugun = bugunTarihiniAl();
    const dun = dunTarihiniAl();

    userRef.get().then(doc => {
        const data = doc.data();
        if ((data.sonOkumaTarihi || "") === bugun) return alert("Bugün zaten uçurdun! Yarın tekrar bekliyoruz. 🎈");

        // Seri Hesabı
        let yeniStreak = (data.sonOkumaTarihi === dun) ? (data.streak || 0) + 1 : 1;
        const yeniToplam = (data.toplamOkunanSayfa || 0) + yeniSayfa;

        return userRef.update({
            toplamOkunanSayfa: yeniToplam,
            balonYuksekligi: yeniToplam * 1, // 1 Sayfa = 1 Metre
            sonOkumaTarihi: bugun,
            streak: yeniStreak
        });
    }).then(() => { input.value = ''; }).catch(e => alert(e.message));
};

// --- 5. GÖRSEL LİSTELEME VE BALON MOTORU ---
window.ogrenciListele = (okul, sinif, sube) => {
    const list = document.getElementById('admin-student-list');
    if (!list) return;
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube).where('rol', '==', 'ogrenci').onSnapshot(qs => {
        list.innerHTML = '';
        qs.forEach(doc => {
            const s = doc.data();
            const r = rozetleriOlustur(s.streak || 0, s.toplamOkunanSayfa || 0);
            list.innerHTML += `
                <div class="student-admin-card" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; background:white; margin-bottom:5px; border-radius:10px;">
                    <div><b>${s.ogrenciAdSoyad}</b><br><small>🔥 Seri: ${s.streak || 0} gün</small></div>
                    <div style="text-align:right;"><div>${r}</div><span style="color:#3498db; font-weight:bold;">${s.balonYuksekligi}m</span></div>
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
            const d = doc.data(); if (d.rol === 'ogretmen') return;
            const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
            const bColor = d.balloonColor || (isMe ? '#ff5e57' : '#3498db');
            container.innerHTML += `<div class="balloon" style="bottom:${Math.min(d.balonYuksekligi || 0, 330)}px; left:${(isMe && !isAdmin) ? 50 : (Math.random() * 80 + 10)}%; background-color:${bColor}; transform:translateX(-50%) scale(${isAdmin?0.6:1});">
                <div class="balloon-label">${isAdmin ? d.ogrenciAdSoyad : (isMe ? 'Sen' : d.balonEtiketi)}</div></div>`;
        });
    });
};

// --- 6. FORM VE OKUL YÖNETİMİ ---
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
    ilVerisi[sehir].forEach(i => { ilceSelect.innerHTML += `<option value="${i}">${i}</option>`; });
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

// --- 7. AUTH AKSİYONLARI ---
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

window.showRegisterForm = (r) => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = r; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };

window.okulEkle = () => {
    const il = document.getElementById("yeniOkulIl").value, ilce = document.getElementById("yeniOkulIlce").value, ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik bilgi!");
    db.collection("sistem").doc("okulListesi").set({ [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad) }, {merge:true}).then(() => alert("Okul Eklendi!"));
};
