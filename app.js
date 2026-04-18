// --- 1. CONFIG ---
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

// --- 2. VERİ YÜKLEME ---
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
    });
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

// --- 4. KAYIT & GİRİŞ ---
window.register = function() {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const roleInput = document.getElementById('rolSecimi').value;
    const finalRole = (roleInput === 'admin') ? 'ogretmen' : 'ogrenci';

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
        .then(() => alert("Kayıt Başarılı!"))
        .catch(e => alert("Hata: " + e.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Hata: " + e.message));
};

// --- 5. YÖNLENDİRME ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.rol === 'superadmin' || data.rol === 'ogretmen') {
                    if (!window.location.pathname.includes('admin.html')) window.location.href = 'admin.html';
                } else {
                    if (window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
                    panelGuncelle(user.uid);
                }
            }
        });
    }
});

function panelGuncelle(uid) {
    document.getElementById('auth-area').style.display = 'none';
    document.getElementById('user-panel').style.display = 'block';
    // Buraya balon yükleme ve diğer panel kodlarını ekleyebilirsin...
}

window.logout = function() { auth.signOut().then(() => window.location.href = 'index.html'); };
