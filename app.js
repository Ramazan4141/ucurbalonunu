// --- 1. GLOBAL ARAYÜZ FONKSİYONLARI ---

window.showLoginForm = function() {
    const roleArea = document.getElementById('role-selection-area');
    const regArea = document.getElementById('dynamic-register-form');
    const loginArea = document.getElementById('login-form-area');
    if(roleArea) roleArea.style.display = 'none';
    if(regArea) regArea.style.display = 'none';
    if(loginArea) loginArea.style.display = 'block';
};

window.showRegisterForm = function(role) {
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
            doc.data().liste.filter(o => o !== "").sort((a, b) => a.localeCompare(b, 'tr')).forEach(o => {
                let opt = document.createElement("option");
                opt.value = o; opt.textContent = o;
                okulSelect.appendChild(opt);
            });
        }
    });
};

// --- 4. KAYIT VE GİRİŞ ---
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

// --- 5. OTURUM TAKİBİ ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.rol === 'superadmin' || data.rol === 'ogretmen') {
                    if (!window.location.pathname.includes('admin.html')) window.location.href = 'admin.html';
                    else window.adminSinifiniYukle();
                } else {
                    if (window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
                    window.panelGuncelle(user.uid);
                }
            }
        });
    }
});

// --- 6. PANELLER VE GİZLİLİK GÜNCELLEMELERİ ---

window.panelGuncelle = function(uid) {
    // 1. ÖNCE KENDİ VERİLERİMİZİ DİNLEYELİM (Hoş geldin mesajı ve kendi balonumuz için)
    db.collection("users").doc(uid).onSnapshot(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        
        // Temel paneli aç
        const up = document.getElementById('user-panel');
        if(up) up.style.display = 'block';
        const authArea = document.getElementById('auth-area');
        if(authArea) authArea.style.display = 'none';
        
        document.getElementById('welcome-msg').innerText = "Selam " + (d.balonEtiketi);
        document.getElementById('display-height').innerText = d.balonYuksekligi;
        
        // Hedef Gösterimi
        const targetArea = document.getElementById('target-area');
        if (d.haftalikHedef) {
            targetArea.style.display = 'block';
            document.getElementById('target-text').innerText = d.haftalikHedef;
        }

        // 2. ŞİMDİ TÜM SINIF ARKADAŞLARINI DİNLEYELİM (Kendi balonumuz dahil)
        db.collection("users")
            .where("okulBilgisi.okul", "==", d.okulBilgisi.okul)
            .where("okulBilgisi.sinif", "==", d.okulBilgisi.sinif)
            .where("okulBilgisi.sube", "==", d.okulBilgisi.sube)
            .where("rol", "==", "ogrenci")
            .onSnapshot(qs => {
                const bContainer = document.getElementById('balloon-container');
                if(!bContainer) return;
                
                bContainer.innerHTML = ""; // Önce gökyüzünü temizle

                qs.forEach(studentDoc => {
                    const s = studentDoc.data();
                    // Rastgele renk ve hafif sağ-sol kayması (Balonlar üst üste binmesin)
                    const color = s.balonEtiketi === d.balonEtiketi ? "#3498db" : `hsl(${Math.random() * 360}, 60%, 70%)`;
                    const leftPos = Math.random() * 80 + 10; // %10 ile %90 arası yatay yerleşim
                    
                    // Balonları çiz (Sadece Takma Adlar)
                    bContainer.innerHTML += `
                        <div class="balloon" style="bottom: ${Math.min(s.balonYuksekligi, 300)}px; background-color: ${color}; left: ${leftPos}%; transition: bottom 1s ease-in-out;">
                            <div class="balloon-label">${s.balonEtiketi}</div>
                        </div>`;
                });
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
                const sky = document.getElementById('admin-balloon-container');
                if(!list) return;
                list.innerHTML = ""; if(sky) sky.innerHTML = "";

                qs.forEach(doc => {
                    const s = doc.data();
                    // Öğretmen listede gerçek ismi görsün
                    list.innerHTML += `<div class="student-admin-card">
                        <span><strong>${s.ogrenciAdSoyad}</strong> (${s.balonYuksekligi}m)</span>
                    </div>`;
                    // Gökyüzünde sadece TAKMA AD görünsün
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

window.yukseklikArtir = function() {
    const sayfaInput = document.getElementById('sayfaSayisi');
    const sayfa = parseInt(sayfaInput.value);
    if(isNaN(sayfa) || sayfa <= 0) return alert("Geçerli bir sayı gir!");

    const user = auth.currentUser;
    const userRef = db.collection("users").doc(user.uid);
    const bugun = new Date().toLocaleDateString('tr-TR'); 

    userRef.get({source: 'server'}).then(doc => {
        const data = doc.data();
        if (data.sonKayitTarihi === bugun) {
            alert("Bugünlük balonunu zaten uçurdun! 🎈 Yarın tekrar gel.");
            sayfaInput.value = "";
            return;
        }
        return userRef.update({
            balonYuksekligi: firebase.firestore.FieldValue.increment(sayfa),
            sonKayitTarihi: bugun
        }).then(() => {
            alert(`Harika! Balonun yükseldi! 🚀`);
            sayfaInput.value = "";
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
