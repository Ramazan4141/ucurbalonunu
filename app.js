// --- 1. FIREBASE YAPILANDIRMASI ---
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

// --- 2. VERİ YÜKLEME SİSTEMİ (İL / İLÇE / OKUL) ---

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
    } else {
        ilceSelect.disabled = true;
    }
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

// --- 3. FORM KONTROLLERİ ---

window.showRegisterForm = function(role) {
    document.getElementById('role-selection-area').style.display = 'none';
    document.getElementById('login-form-area').style.display = 'none';
    document.getElementById('dynamic-register-form').style.display = 'block';
    document.getElementById('rolSecimi').value = role;
    
    document.getElementById('form-title').innerText = (role === 'admin') ? "👨‍🏫 Öğretmen Kaydı" : "🎈 Öğrenci Kaydı";
    
    window.illeriDoldur();
    window.okullariYukle();
};

window.showLoginForm = function() {
    document.getElementById('role-selection-area').style.display = 'none';
    document.getElementById('dynamic-register-form').style.display = 'none';
    document.getElementById('login-form-area').style.display = 'block';
};

window.resetRoleSelection = function() {
    document.getElementById('role-selection-area').style.display = 'block';
    document.getElementById('dynamic-register-form').style.display = 'none';
    document.getElementById('login-form-area').style.display = 'none';
};

// --- 4. KAYIT VE GİRİŞ ---

window.register = function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const roleInput = document.getElementById('rolSecimi').value;
    const finalRole = (roleInput === 'admin') ? 'ogretmen' : 'ogrenci';

    if(!email || password.length < 6) { alert("Lütfen geçerli bir e-posta ve en az 6 haneli şifre girin."); return; }

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

    auth.createUserWithEmailAndPassword(email, password)
        .then(res => db.collection("users").doc(res.user.uid).set(userObj))
        .then(() => alert("Kayıt Başarılı!"))
        .catch(e => alert("Hata: " + e.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    if(!email || !pass) return;

    auth.signInWithEmailAndPassword(email, pass)
        .catch(e => alert("Giriş Başarısız: " + e.message));
};

// --- 5. YETKİ KONTROLÜ VE YÖNLENDİRME ---

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                console.log("Giriş Yapıldı. Rol:", data.rol);

                if (data.rol === 'superadmin' || data.rol === 'ogretmen') {
                    if (!window.location.pathname.includes('admin.html')) {
                        window.location.href = 'admin.html';
                    } else {
                        // Süper Admin Paneli Görünürlüğü
                        const adminEkran = document.getElementById('okul-ekleme-alani');
                        if (adminEkran) {
                            adminEkran.style.display = (data.rol === 'superadmin') ? 'block' : 'none';
                        }
                        adminSinifiniYukle();
                    }
                } else {
                    if (window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
                    panelGuncelle(user.uid);
                }
            }
        });
    } else {
        const authArea = document.getElementById('auth-area');
        if (authArea) authArea.style.display = 'block';
    }
});

// --- 6. PANEL İŞLEMLERİ ---

function panelGuncelle(uid) {
    db.collection("users").doc(uid).get().then(doc => {
        const d = doc.data();
        const up = document.getElementById('user-panel');
        if(!up) return;
        up.style.display = 'block';
        document.getElementById('auth-area').style.display = 'none';
        document.getElementById('welcome-msg').innerText = "Selam " + d.balonEtiketi;
        document.getElementById('display-height').innerText = d.balonYuksekligi;
    });
}

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
            .get().then(qs => {
                const list = document.getElementById('admin-student-list');
                if(!list) return;
                list.innerHTML = "";
                qs.forEach(doc => {
                    const s = doc.data();
                    list.innerHTML += `<div class="student-admin-card" style="padding:10px; border-bottom:1px solid #eee;">
                        <span><strong>${s.ogrenciAdSoyad}</strong> (${s.balonYuksekligi}m)</span>
                    </div>`;
                });
            });
    });
};

window.okulEkle = function() {
    const okulAd = document.getElementById('yeniOkulAd').value.trim();
    if(!okulAd) return;
    db.collection("sistem").doc("okulListesi").update({
        liste: firebase.firestore.FieldValue.arrayUnion(okulAd)
    }).then(() => { 
        alert("Okul Başarıyla Eklendi!"); 
        document.getElementById('yeniOkulAd').value = "";
        window.okullariYukle(); // Listeyi güncelle
    }).catch(e => alert("Hata: " + e.message));
};

window.logout = function() { 
    auth.signOut().then(() => window.location.href = 'index.html'); 
};
window.duyuruYayinla = function() {
    const hedefText = document.getElementById('haftalikHedef')?.value;
    if (!hedefText) {
        alert("Lütfen bir hedef veya duyuru yazın!");
        return;
    }

    const user = auth.currentUser;
    if (!user) return;

    // 1. Önce öğretmenin hangi sınıfa duyuru yapacağını buluyoruz
    db.collection("users").doc(user.uid).get().then(tDoc => {
        const t = tDoc.data();
        
        // 2. O sınıftaki TÜM öğrencileri buluyoruz
        db.collection("users")
            .where("okulBilgisi.okul", "==", t.okulBilgisi.okul)
            .where("okulBilgisi.sinif", "==", t.okulBilgisi.sinif)
            .where("okulBilgisi.sube", "==", t.okulBilgisi.sube)
            .where("rol", "==", "ogrenci")
            .get().then(qs => {
                
                if (qs.empty) {
                    alert("Bu sınıfta henüz kayıtlı öğrenci yok. Duyuru yapılacak kimse bulunamadı!");
                    return;
                }

                // 3. Her öğrencinin dökümanına duyuruyu yazıyoruz
                let batch = db.batch(); // Toplu işlem (Hızlı olması için)
                qs.forEach(doc => {
                    const studentRef = db.collection("users").doc(doc.id);
                    batch.update(studentRef, { haftalikHedef: hedefText });
                });

                batch.commit().then(() => {
                    alert("Duyuru tüm öğrencilere başarıyla iletildi! 🎈");
                    document.getElementById('haftalikHedef').value = ""; // Kutuyu temizle
                });
            });
    }).catch(e => alert("Duyuru hatası: " + e.message));
};
