// --- 1. GLOBAL ARAYÜZ FONKSİYONLARI ---
window.showLoginForm = function() {
    const ids = ['role-selection-area', 'dynamic-register-form'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
    if(document.getElementById('login-form-area')) document.getElementById('login-form-area').style.display = 'block';
};

window.showRegisterForm = function(role) {
    const ids = ['role-selection-area', 'login-form-area'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
    if(document.getElementById('dynamic-register-form')) document.getElementById('dynamic-register-form').style.display = 'block';
    
    const rolInput = document.getElementById('rolSecimi');
    if(rolInput) rolInput.value = role;
    const formTitle = document.getElementById('form-title');
    if(formTitle) formTitle.innerText = (role === 'admin') ? "👨‍🏫 Öğretmen Kaydı" : "🎈 Öğrenci Kaydı";
    if(window.illeriDoldur) window.illeriDoldur();
    if(window.okullariYukle) window.okullariYukle();
};

window.resetRoleSelection = function() {
    document.getElementById('role-selection-area').style.display = 'block';
    document.getElementById('dynamic-register-form').style.display = 'none';
    document.getElementById('login-form-area').style.display = 'none';
};

// --- 2. FIREBASE YAPILANDIRMASI ---
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
const db = firebase.firestore();

// --- 3. VERİ YÜKLEME ---
window.illeriDoldur = function() {
    const sehirSelect = document.getElementById("sehir");
    if (!sehirSelect || typeof ilVerisi === 'undefined') return;
    sehirSelect.innerHTML = '<option value="">İl Seçiniz</option>';
    Object.keys(ilVerisi).sort((a, b) => a.localeCompare(b, 'tr')).forEach(il => {
        let opt = document.createElement("option");
        opt.value = il; opt.textContent = il;
        sehirSelect.appendChild(opt);
    });
};

window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    if (!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilceSelect.disabled = false;
        ilVerisi[sehir].forEach(ilce => {
            let opt = document.createElement("option");
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    } else { ilceSelect.disabled = true; }
};

window.okullariYukle = function() {
    const okulSelect = document.getElementById("okul");
    if (!okulSelect) return;
    db.collection("sistem").doc("okulListesi").get().then((doc) => {
        if (doc.exists && doc.data().liste) {
            okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
            doc.data().liste.filter(o => o !== "").sort((a, b) => a.localeCompare(b, 'tr')).forEach(o => {
                let opt = document.createElement("option");
                opt.value = o; opt.textContent = o;
                okulSelect.appendChild(opt);
            });
        }
    });
};

// --- 4. KAYIT VE GİRİŞ (YENİ ALANLAR EKLENDİ) ---
window.register = function() {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const roleInput = document.getElementById('rolSecimi').value;
    const finalRole = (roleInput === 'admin') ? 'ogretmen' : 'ogrenci';

    const userObj = {
        ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
        balonEtiketi: document.getElementById('takmaAd').value || "Gizli Balon",
        okulBilgisi: { 
            okul: document.getElementById('okul').value, 
            sinif: document.getElementById('sinif').value, 
            sube: document.getElementById('sube').value 
        },
        balonYuksekligi: 0,
        toplamOkunanSayfa: 0, // İstatistik alanı
        gunlukSeri: 0,        // Streak alanı
        madalyalar: [],       // Onur madalyaları dizisi
        rol: finalRole,
        sonKayitTarihi: ""
    };

    auth.createUserWithEmailAndPassword(email, pass)
        .then(res => db.collection("users").doc(res.user.uid).set(userObj))
        .then(() => alert("Kayıt Başarılı! 🎈"))
        .catch(e => alert("Kayıt Hatası: " + e.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Giriş Hatası: " + e.message));
};

window.logout = function() { auth.signOut().then(() => window.location.href = 'index.html'); };

// --- 5. OTURUM VE YETKİ ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.rol === 'superadmin' || data.rol === 'ogretmen') {
                    if (!window.location.pathname.includes('admin.html')) window.location.href = 'admin.html';
                    else {
                        const adminEkran = document.getElementById('okul-ekleme-alani');
                        if (adminEkran) adminEkran.style.display = (data.rol === 'superadmin') ? 'block' : 'none';
                        window.adminSinifiniYukle();
                    }
                } else {
                    if (window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
                    window.panelGuncelle(user.uid);
                }
            }
        });
    }
});

// --- 6. OKUL EKLEME (SUPERADMIN) ---
window.okulEkle = function() {
    const ilceSelect = document.getElementById('yeniOkulIlce');
    const okulInput = document.getElementById('yeniOkulAd');
    
    const secilenIlce = ilceSelect.value;
    const okulAd = okulInput.value.trim();

    if(!secilenIlce || !okulAd) return alert("Lütfen önce ilçe seçin ve okul adını yazın!");

    // Firestore'da 'okullar' dökümanı içinde, ilçe ismine göre bir array güncelliyoruz
    db.collection("sistem").doc("okulListesi").set({
        [secilenIlce]: firebase.firestore.FieldValue.arrayUnion(okulAd)
    }, { merge: true }).then(() => {
        alert(`${secilenIlce} ilçesine ${okulAd} başarıyla eklendi! 🏫`);
        okulInput.value = "";
    }).catch(e => alert("Hata: " + e.message));
};

// --- 7. PANEL VE BALONLAR (MADALYA GÖRÜNÜMÜ EKLENDİ) ---
window.panelGuncelle = function(uid) {
    db.collection("users").doc(uid).onSnapshot(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        document.getElementById('user-panel').style.display = 'block';
        document.getElementById('auth-area').style.display = 'none';
        
        // Madalyaları yan yana dizen "Onur Köşesi"
        let madalyaHtml = "";
        if(d.madalyalar && d.madalyalar.length > 0) {
            d.madalyalar.forEach(m => {
                madalyaHtml += `<span class="medal-icon" style="font-size:20px; margin-right:5px;" title="Başarı Nişanı">${m}</span>`;
            });
        }

        document.getElementById('welcome-msg').innerHTML = `Selam ${d.balonEtiketi} <div class="medal-shelf">${madalyaHtml}</div>`;
        document.getElementById('display-height').innerText = d.balonYuksekligi;
        
        // Sınıf Arkadaşları
        db.collection("users")
            .where("okulBilgisi.okul", "==", d.okulBilgisi.okul)
            .where("okulBilgisi.sinif", "==", d.okulBilgisi.sinif)
            .where("okulBilgisi.sube", "==", d.okulBilgisi.sube)
            .where("rol", "==", "ogrenci")
            .onSnapshot(qs => {
                const bContainer = document.getElementById('balloon-container');
                if(!bContainer) return;
                bContainer.innerHTML = "";
                qs.forEach(studentDoc => {
                    const s = studentDoc.data();
                    const color = s.balonEtiketi === d.balonEtiketi ? "#3498db" : `hsl(${Math.random() * 360}, 60%, 70%)`;
                    // Balonun yanındaki madalyaları da gösterelim (Sadece Ateş simgesi gibi önemli olanlar)
                    let balonMadalya = s.madalyalar && s.madalyalar.includes("🔥") ? "🔥" : "";
                    
                    bContainer.innerHTML += `
                        <div class="balloon" style="bottom: ${Math.min(s.balonYuksekligi, 300)}px; background-color: ${color}; left: ${Math.random() * 80 + 10}%; transition: bottom 1s;">
                            <div class="balloon-label">${balonMadalya} ${s.balonEtiketi}</div>
                        </div>`;
                });
            });
    });
};

// --- 8. SAYFA EKLEME VE SERİ TAKİBİ (KRİTİK GÜNCELLEME) ---
window.yukseklikArtir = function() {
    const sayfaInput = document.getElementById('sayfaSayisi');
    const sayfa = parseInt(sayfaInput.value);
    if(isNaN(sayfa) || sayfa <= 0) return alert("Geçerli bir sayı gir!");

    const user = auth.currentUser;
    const userRef = db.collection("users").doc(user.uid);
    const bugunStr = new Date().toLocaleDateString('tr-TR'); 

    // Önce kullanıcının mevcut verisini alıp seri (streak) kontrolü yapalım
    userRef.get().then(doc => {
        const d = doc.data();
        if (d.sonKayitTarihi === bugunStr) {
            alert("Bugünlük balonunu zaten uçurdun! 🎈 Yarın tekrar gel.");
            sayfaInput.value = "";
            return;
        }

        // Seri Hesaplama
        const dun = new Date();
        dun.setDate(dun.getDate() - 1);
        const dunStr = dun.toLocaleDateString('tr-TR');
        
        let yeniSeri = (d.sonKayitTarihi === dunStr) ? (d.gunlukSeri + 1) : 1;
        let madalyalar = d.madalyalar || [];

        // Seri Madalyaları Kontrolü
        if (yeniSeri >= 3 && !madalyalar.includes("🔥")) madalyalar.push("🔥");
        if (yeniSeri === 10) madalyalar.push("🎖️");
        if (yeniSeri === 20) {
            madalyalar = madalyalar.filter(m => m !== "🎖️"); // 10'u çıkar
            madalyalar.push("🛡️"); // 20'yi ekle
        }

        // VERİTABANI GÜNCELLEME
        return userRef.update({
            balonYuksekligi: firebase.firestore.FieldValue.increment(sayfa),
            toplamOkunanSayfa: firebase.firestore.FieldValue.increment(sayfa), // Toplam istatistik
            gunlukSeri: yeniSeri,
            madalyalar: madalyalar,
            sonKayitTarihi: bugunStr
        }).then(() => {
            alert(`Harika! Balonun yükseldi! 🚀 (Seri: ${yeniSeri}. gün)`);
            sayfaInput.value = "";
        });
    });
};

window.adminSinifiniYukle = function() {
    const user = auth.currentUser;
    db.collection("users").doc(user.uid).get().then(tDoc => {
        const t = tDoc.data();
        db.collection("users")
            .where("okulBilgisi.okul", "==", t.okulBilgisi.okul)
            .where("okulBilgisi.sinif", "==", t.okulBilgisi.sinif)
            .where("okulBilgisi.sube", "==", t.okulBilgisi.sube)
            .where("rol", "==", "ogrenci")
            .onSnapshot(qs => {
                const list = document.getElementById('admin-student-list');
                if(!list) return;
                list.innerHTML = "";
                qs.forEach(doc => {
                    const s = doc.data();
                    let madalyaDizisi = (s.madalyalar || []).join(" ");
                    list.innerHTML += `<div class="student-admin-card">
                        <span><strong>${s.ogrenciAdSoyad}</strong> ${madalyaDizisi} (${s.balonYuksekligi}m)</span>
                    </div>`;
                });
            });
    });
};

window.duyuruYayinla = function() {
    const hedef = document.getElementById('haftalikHedef').value;
    const user = auth.currentUser;
    db.collection("users").doc(user.uid).get().then(tDoc => {
        const t = tDoc.data();
        db.collection("users")
            .where("okulBilgisi.okul", "==", t.okulBilgisi.okul)
            .where("okulBilgisi.sinif", "==", t.okulBilgisi.sinif)
            .where("okulBilgisi.sube", "==", t.okulBilgisi.sube)
            .where("rol", "==", "ogrenci").get().then(qs => {
                let batch = db.batch();
                qs.forEach(d => batch.update(db.collection("users").doc(d.id), { haftalikHedef: hedef }));
                batch.commit().then(() => alert("Hedef Duyuruldu!"));
            });
    });
};
