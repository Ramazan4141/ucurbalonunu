/**
 * ============================================================
 * UÇUR BALONUNU — MASTER APP ENGINE (V20.1)
 * TÜM ÖZELLİKLER DAHİL - EKSİKSİZ SÜRÜM
 * ============================================================
 */

// 1. FIREBASE YAPILANDIRMASI
const firebaseConfig = {
    apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
    authDomain: "ucurbalonu.firebaseapp.com",
    projectId: "ucurbalonu",
    storageBucket: "ucurbalonu.firebasestorage.app",
    messagingSenderId: "677201903733",
    appId: "1:677201903733:web:f5708b28f410ae7036b83c"
};

// Firebase Başlatma
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// 2. SAYFA TESPİTİ VE YARDIMCI ARAÇLAR
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

// UI Yardımcıları
const gosterGizle = (id, durum) => {
    const el = document.getElementById(id);
    if (el) el.style.display = durum;
};

const bugunTarihiniAl = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const dunTarihiniAl = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const getRandomColor = () => {
    const colors = ['#ff5e57', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff4757'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// 3. ROZET VE TOOLTIP MOTORU
function rozetleriOlustur(streak, toplam) {
    let rozetler = [];

    // Seri Rozetleri
    if (streak >= 3)  rozetler.push({emoji: "🌱", text: "3 Günlük Seri: Harika başlangıç!"});
    if (streak >= 10) rozetler.push({emoji: "🔥", text: "10 Günlük Seri: Kitaplar seni seviyor!"});
    if (streak >= 30) rozetler.push({emoji: "☄️", text: "30 Günlük Seri: Tam bir Kitap Efsanesi!"});

    // Sayfa Rozetleri
    if (toplam >= 100)  rozetler.push({emoji: "🎖️", text: "100 Sayfa: İlk büyük başarı!"});
    if (toplam >= 500)  rozetler.push({emoji: "📚", text: "500 Sayfa: Gerçek bir kitap dostu!"});
    if (toplam >= 1000) rozetler.push({emoji: "👑", text: "1000 Sayfa: Okuma Kralı/Kraliçesi!"});

    if (rozetler.length === 0) {
        return `<span class="medal-icon" title="Okumaya devam et, madalyalar yolda!">🐣</span>`;
    }

    return rozetler.map(r => `<span class="medal-icon" title="${r.text}">${r.emoji}</span>`).join("");
}

// 4. KULLANICI TAKİBİ VE GÖRSEL KATMAN YÖNETİMİ
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            const h = data.balonYuksekligi || 0;

            // ROL KONTROLLERİ
            if (data.rol === 'admin' || data.rol === 'superadmin' || data.email === 'admin@ucurbalonu.com') {
                if (!IS_SUPERADMIN_PAGE) window.location.href = 'superadmin.html';
                else {
                    gosterGizle('superadmin-area', 'block');
                    window.illeriDoldur();
                }
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
                // ÖĞRENCİ PANELİ İŞLEMLERİ
                if (!IS_INDEX_PAGE) {
                    window.location.href = 'index.html';
                } else {
                    gosterGizle('auth-area', 'none');
                    gosterGizle('user-panel', 'block');

                    // Yazıları Güncelle
                    document.getElementById('display-height').innerText = h;
                    document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;

                    // --- 4 KATMANLI PARALLAX (GÖRSEL ŞÖLEN) ---
                    const sky = document.querySelector('.sky');
                    const l1 = document.getElementById('layer-1');
                    const l2 = document.getElementById('layer-2');
                    const l3 = document.getElementById('layer-3');
                    const l4 = document.getElementById('layer-4');

                    if (sky) {
                        // Katman 1: Zemin (0-150m arası kayar ve silinir)
                        if (l1) {
                            l1.style.transform = `translateY(${h * 1.5}px)`;
                            l1.style.opacity = h > 180 ? 0 : 1;
                        }
                        // Katman 2: Zirveler (50m-250m arası görünür)
                        if (l2) {
                            l2.style.opacity = (h > 50 && h < 280) ? 1 : 0;
                            l2.style.transform = `translateY(${(h - 100) * 0.8}px)`;
                        }
                        // Katman 3: Atmosfer (200m-400m arası görünür)
                        if (l3) {
                            l3.style.opacity = (h > 200 && h < 450) ? 1 : 0;
                            l3.style.transform = `translateY(${(h - 250) * 0.5}px)`;
                        }
                        // Katman 4: Uzay (350m sonrası kalıcı olur)
                        if (l4) {
                            l4.style.opacity = h > 350 ? 1 : 0;
                            // Gökyüzü Kararması
                            if (h > 350) sky.style.background = "#000";
                            else sky.style.background = "#4facfe";
                        }
                    }

                    // Rozetleri Ekrana Bas
                    const mArea = document.getElementById('medalyalar');
                    if (mArea) {
                        const rHtml = rozetleriOlustur(data.streak || 0, data.toplamOkunanSayfa || 0);
                        mArea.innerHTML = `<div class="medal-shelf">🔥 SERİ: ${data.streak || 0} GÜN | ${rHtml}</div>`;
                    }

                    // Balonları Canlı Göster
                    window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
                }
            }
        });
    } else {
        if (!IS_INDEX_PAGE) window.location.href = 'index.html';
        window.illeriDoldur();
    }
});

// 5. YÜKSEKLİK ARTIRMA (1 Sayfa = 1 Metre & Günlük Limit & Seri)
window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const sayfa = parseInt(input.value);

    if (!sayfa || sayfa <= 0) {
        return alert("Lütfen okuduğun sayfa sayısını gir!");
    }

    const userRef = db.collection('users').doc(auth.currentUser.uid);
    const bugun = bugunTarihiniAl();
    const dun = dunTarihiniAl();

    userRef.get().then(doc => {
        const d = doc.data();

        // Günlük Giriş Sınırı
        if (d.sonOkumaTarihi === bugun) {
            alert("Bugün zaten balonunu uçurdun! Yarın yeni maceralarla tekrar bekliyoruz. 🎈");
            return;
        }

        // Seri (Streak) Hesaplama
        let yeniStreak = (d.sonOkumaTarihi === dun) ? (d.streak || 0) + 1 : 1;
        
        // Birikimli Toplam Hesaplama (1 Sayfa = 1 Metre)
        let yeniToplam = (d.toplamOkunanSayfa || 0) + sayfa;

        // Veritabanı Güncelleme
        return userRef.update({
            toplamOkunanSayfa: yeniToplam,
            balonYuksekligi: yeniToplam,
            sonOkumaTarihi: bugun,
            streak: yeniStreak
        });
    }).then(() => {
        input.value = '';
        alert("Harika! Balonun yükseldi! 🚀");
    }).catch(err => {
        alert("Bir hata oluştu: " + err.message);
    });
};

// 6. GÖRSEL BALON VE LİSTE MOTORLARI
window.balonlariGoster = (cId, okul, sinif, sube, isAdmin) => {
    const container = document.getElementById(cId);
    if (!container) return;

    db.collection('users')
        .where('okul', '==', okul)
        .where('sinif', '==', sinif)
        .where('sube', '==', sube)
        .onSnapshot(qs => {
            container.innerHTML = '';
            qs.forEach(doc => {
                const d = doc.data();
                if (d.rol === 'ogretmen') return;

                const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
                const color = d.balloonColor || (isMe ? '#ff5e57' : '#3498db');
                
                // Balon HTML Oluşturma
                container.innerHTML += `
                <div class="balloon" style="bottom:${Math.min(d.balonYuksekligi || 0, 330)}px; left:${(isMe && !isAdmin) ? 50 : (Math.random() * 80 + 10)}%; background-color:${color}; transform:translateX(-50%) scale(${isAdmin ? 0.6 : 1});">
                    <div class="balloon-label">${isAdmin ? d.ogrenciAdSoyad : (isMe ? 'Sen' : d.balonEtiketi)}</div>
                </div>`;
            });
        });
};

window.ogrenciListele = (okul, sinif, sube) => {
    const list = document.getElementById('admin-student-list');
    if (!list) return;

    db.collection('users')
        .where('okul', '==', okul)
        .where('sinif', '==', sinif)
        .where('sube', '==', sube)
        .where('rol', '==', 'ogrenci')
        .onSnapshot(qs => {
            list.innerHTML = '';
            qs.forEach(doc => {
                const s = doc.data();
                const rHtml = rozetleriOlustur(s.streak || 0, s.toplamOkunanSayfa || 0);
                
                list.innerHTML += `
                <div class="student-admin-card">
                    <div>
                        <b>${s.ogrenciAdSoyad}</b><br>
                        <small>🔥 Seri: ${s.streak || 0} gün</small>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px;">${rHtml}</div>
                        <span style="color:#3498db; font-weight:bold;">${s.balonYuksekligi}m</span>
                    </div>
                </div>`;
            });
        });
};

// 7. SİSTEMSEL FONKSİYONLAR (Giriş, Kayıt, Okul Seçimi)
window.login = () => {
    const e = document.getElementById('loginEmail').value;
    const p = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(e, p).catch(err => alert("Hata: " + err.message));
};

window.logout = () => {
    auth.signOut().then(() => window.location.href = 'index.html');
};

window.register = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const rol = document.getElementById('rolSecimi').value;

    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            balonEtiketi: document.getElementById('takmaAd').value || "Gezgin",
            okul: document.getElementById('okul').value,
            sinif: document.getElementById('sinif').value,
            sube: document.getElementById('sube').value,
            rol: (rol === 'admin' ? 'ogretmen' : 'ogrenci'),
            balonYuksekligi: 0,
            toplamOkunanSayfa: 0,
            balloonColor: getRandomColor(),
            streak: 0
        });
    }).then(() => {
        location.reload();
    }).catch(err => alert("Kayıt Hatası: " + err.message));
};

// Konum ve Okul Motoru
window.illeriDoldur = () => {
    const target = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIl" : "sehir";
    const el = document.getElementById(target);
    if (el && typeof ilVerisi !== 'undefined') {
        el.innerHTML = '<option value="">İl Seçiniz</option>';
        Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => {
            el.innerHTML += `<option value="${il}">${il}</option>`;
        });
    }
};

window.ilceleriYukle = (force = false) => {
    const isSpecial = IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE || force;
    const sehir = document.getElementById(isSpecial ? "yeniOkulIl" : "sehir").value;
    const el = document.getElementById(isSpecial ? "yeniOkulIlce" : "ilce");
    if (!el || !sehir) return;
    el.innerHTML = '<option value="">İlçe Seçiniz</option>';
    ilVerisi[sehir].forEach(i => { el.innerHTML += `<option value="${i}">${i}</option>`; });
};

window.okullariYukle = () => {
    const il = document.getElementById("sehir").value;
    const ilce = document.getElementById("ilce").value;
    const el = document.getElementById("okul");
    if(!el) return;
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        el.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists && doc.data()[`${il}_${ilce}`]) {
            doc.data()[`${il}_${ilce}`].sort().forEach(o => {
                el.innerHTML += `<option value="${o}">${o}</option>`;
            });
        }
    });
};

window.okulEkle = () => {
    const il = document.getElementById("yeniOkulIl").value;
    const ilce = document.getElementById("yeniOkulIlce").value;
    const ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik bilgi!");
    db.collection("sistem").doc("okulListesi").set({
        [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad)
    }, {merge:true}).then(() => alert("Okul Başarıyla Eklendi!"));
};

// Panel Geçişleri
window.showRegisterForm = (r) => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = r; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };
