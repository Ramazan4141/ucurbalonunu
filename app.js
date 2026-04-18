// --- 1. GLOBAL ARAYÜZ FONKSİYONLARI (Hata Almamak İçin En Üstte) ---

window.showLoginForm = function() {
    console.log("Giriş ekranına geçiliyor...");
    const roleArea = document.getElementById('role-selection-area');
    const regArea = document.getElementById('dynamic-register-form');
    const loginArea = document.getElementById('login-form-area');

    if(roleArea) roleArea.style.display = 'none';
    if(regArea) regArea.style.display = 'none';
    if(loginArea) loginArea.style.display = 'block';
};

window.showRegisterForm = function(role) {
    console.log("Kayıt ekranına geçiliyor, rol:", role);
    const roleArea = document.getElementById('role-selection-area');
    const loginArea = document.getElementById('login-form-area');
    const regArea = document.getElementById('dynamic-register-form');

    if(roleArea) roleArea.style.display = 'none';
    if(loginArea) loginArea.style.display = 'none';
    if(regArea) regArea.style.display = 'block';
    
    const rolInput = document.getElementById('rolSecimi');
    if(rolInput) rolInput.value = role;

    const formTitle = document.getElementById('form-title');
    if(formTitle) formTitle.innerText = (role === 'admin') ? "👨‍🏫 Öğretmen Kaydı" : "🎈 Öğrenci Kaydı";
    
    if(window.illeriDoldur) window.illeriDoldur();
    if(window.okullariYukle) window.okullariYukle();
};

window.resetRoleSelection = function() {
    const roleArea = document.getElementById('role-selection-area');
    const regArea = document.getElementById('dynamic-register-form');
    const loginArea = document.getElementById('login-form-area');

    if(roleArea) roleArea.style.display = 'block';
    if(regArea) regArea.style.display = 'none';
    if(loginArea) loginArea.style.display = 'none';
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

// --- 3. VERİ YÜKLEME (İL / İLÇE / OKUL) ---

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
            const temizListe = doc.data().liste.filter(o => o !== "");
            temizListe.sort((a, b) => a.localeCompare(b, 'tr'));
            temizListe.forEach(o => {
                let opt = document.createElement("option");
                opt.value = o; opt.textContent = o;
                okulSelect.appendChild(opt);
            });
        }
    }).catch(e => console.error("Okul yükleme hatası:", e));
};

// --- 4. KAYIT VE GİRİŞ İŞLEMLERİ ---

window.register = function() {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const roleInput = document.getElementById('rolSecimi').value;
    const finalRole = (roleInput === 'admin') ? 'ogretmen' : 'ogrenci';

    if(!email || pass.length < 6) return alert("E-posta geçersiz veya şifre 6 karakterden kısa!");

    const userObj = {
        ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
        balonEtiketi: document.getElementById('takmaAd').value,
        okulBilgisi: { 
            okul: document.getElementById('okul').value, 
            sinif: document.getElementById('sinif').value, 
            sube: document.getElementById('sube').value 
        },
        balonYuksekligi: 0,
        rol: finalRole,
        rozetler: []
    };

    auth.createUserWithEmailAndPassword(email, pass)
        .then(res => db.collection("users").doc(res.user.uid).set(userObj))
        .then(() => alert("Kayıt Başarılı! 🎈"))
        .catch(e => alert("Kayıt Hatası: " + e.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    if(!email || !pass) return alert("E-posta ve şifre girin!");

    auth.signInWithEmailAndPassword(email, pass)
        .catch(e => alert("Giriş Hatası: " + e.message));
};

window.logout = function() { 
    auth.signOut().then(() => window.location.href = 'index.html'); 
};

// --- 5. YETKİ KONTROLÜ VE OTURUM TAKİBİ ---

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.rol === 'superadmin' || data.rol === 'ogretmen') {
                    if (!window.location.pathname.includes('admin.html')) {
                        window.location.href = 'admin.html';
                    } else {
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

// --- 6. ÖĞRENCİ VE ÖĞRETMEN PANEL FONKSİYONLARI ---

window.panelGuncelle = function(uid) {
    console.log("Öğrenci paneli dinleniyor: ", uid);
    
    db.collection("users").doc(uid).onSnapshot(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        
        // Paneli görünür yap
        const up = document.getElementById('user-panel');
        if(up) up.style.display = 'block';
        
        const authArea = document.getElementById('auth-area');
        if(authArea) authArea.style.display = 'none';

        // Verileri bas
        if(document.getElementById('welcome-msg')) 
            document.getElementById('welcome-msg').innerText = "Selam " + (d.balonEtiketi || "Öğrenci");
        
        if(document.getElementById('display-height')) 
            document.getElementById('display-height').innerText = d.balonYuksekligi;

        // --- HEDEF KONTROLÜ ---
        const targetArea = document.getElementById('target-area');
        const targetText = document.getElementById('target-text');
        
        console.log("Veritabanından gelen hedef:", d.haftalikHedef); // Konsola bak!

        if (d.haftalikHedef && d.haftalikHedef.trim() !== "") {
            if(targetArea) targetArea.style.display = 'block';
            if(targetText) targetText.innerText = d.haftalikHedef;
        } else {
            if(targetArea) targetArea.style.display = 'none';
        }

        // Balon güncelleme
        const bContainer = document.getElementById('balloon-container');
        if(bContainer) {
            bContainer.innerHTML = `<div class="balloon" style="bottom: ${Math.min(d.balonYuksekligi, 300)}px; background: #3498db; left: 50%; transform: translateX(-50%);">
                <div class="balloon-label">${d.balonEtiketi}</div>
            </div>`;
        }
    }, error => {
        console.error("Panel güncelleme hatası:", error);
    });
};

window.adminSinifiniYukle = function() {
    const user = auth.currentUser;
    if(!user) return;
    db.collection("users").doc(user.uid).get().then(tDoc => {
        const t = tDoc.data();
        db.collection("users")
            .where("okulBilgisi.okul", "==", t.okulBilgisi.okul)
            .where("okulBilgisi.sinif", "==", t.okulBilgisi.sinif)
            .where("okulBilgisi.sube", "==", t.okulBilgisi.sube)
            .where("rol", "==", "ogrenci")
            .onSnapshot(qs => {
                const list = document.getElementById('admin-student-list');
                const sky = document.getElementById('admin-balloon-container');
                if(!list) return;
                list.innerHTML = ""; if(sky) sky.innerHTML = "";

                qs.forEach(doc => {
                    const s = doc.data();
                    list.innerHTML += `<div class="student-admin-card">
                        <span><strong>${s.ogrenciAdSoyad}</strong> (${s.balonYuksekligi}m)</span>
                    </div>`;
                    if(sky) {
                        const color = `hsl(${Math.random() * 360}, 70%, 60%)`;
                        sky.innerHTML += `
                            <div class="balloon" style="bottom: ${Math.min(s.balonYuksekligi, 350)}px; background-color: ${color}; left: ${Math.random() * 80 + 10}%">
                                <div class="balloon-label">${s.balonEtiketi}</div>
                            </div>`;
                    }
                });
            });
    });
};

window.duyuruYayinla = function() {
    const hedef = document.getElementById('haftalikHedef').value;
    if(!hedef) return alert("Duyuru boş olamaz!");
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

window.okulEkle = function() {
    const okulAd = document.getElementById('yeniOkulAd').value;
    if(!okulAd) return;
    db.collection("sistem").doc("okulListesi").update({
        liste: firebase.firestore.FieldValue.arrayUnion(okulAd)
    }).then(() => {
        alert("Okul Eklendi!");
        document.getElementById('yeniOkulAd').value = "";
    });
};

window.yukseklikArtir = function() {
    const sayfaInput = document.getElementById('sayfaSayisi');
    const sayfa = parseInt(sayfaInput.value);
    
    if(isNaN(sayfa) || sayfa <= 0) {
        alert("Lütfen geçerli bir sayfa sayısı gir kanka! 😊");
        return;
    }

    const user = auth.currentUser;
    const userRef = db.collection("users").doc(user.uid);

    // BUGÜNÜN TARİHİNİ AL (Örn: "2026-04-19")
    const bugun = new Date().toISOString().split('T')[0];

    // ÖNCE KONTROL ET: Bugün kayıt yapılmış mı?
    userRef.get().then(doc => {
        const data = doc.data();
        
        if (data.sonKayitTarihi === bugun) {
            alert("Bugünlük balonunu zaten uçurdun! 🎈 Yarın okuduğun sayfalarla daha da yükseğe çıkabilirsin. ✨");
            sayfaInput.value = "";
            return;
        }

        // EĞER BUGÜN KAYIT YAPILMAMIŞSA İŞLEMİ YAP
        userRef.update({
            balonYuksekligi: firebase.firestore.FieldValue.increment(sayfa),
            sonKayitTarihi: bugun // Tarihi damgala
        }).then(() => {
            alert(`Harika! ${sayfa} sayfa okudun ve balonun havalandı! 🚀`);
            sayfaInput.value = "";
        }).catch(e => {
            alert("Bir hata oluştu: " + e.message);
        });
    });
};
