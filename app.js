// ============================================================
//  UÇUR BALONUNU — TAM GÜNCEL & TEMİZLENMİŞ DOSYA (140 Satır)
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

// Sayfa Tespiti
const SAYFA = (() => {
    if (document.getElementById('yeniOkulIl')) return 'admin';
    if (document.getElementById('balloon-container')) return 'ogrenci';
    return 'giris';
})();

// --- 1. İL / İLÇE / OKUL MOTORU (Sorunsuz Versiyon) ---
window.illeriDoldur = function() {
    const ids = ["sehir", "yeniOkulIl"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && typeof ilVerisi !== 'undefined') {
            el.innerHTML = '<option value="">İl Seçiniz</option>';
            Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => {
                el.innerHTML += `<option value="${il}">${il}</option>`;
            });
        }
    });
};

window.ilceleriYukle = function(isChild = false) {
    const ilId = isChild ? "yeniOkulIl" : "sehir";
    const ilceId = isChild ? "yeniOkulIlce" : "ilce";
    const sehir = document.getElementById(ilId).value;
    const ilceSelect = document.getElementById(ilceId);
    if (!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(ilce => {
            ilceSelect.innerHTML += `<option value="${ilce}">${ilce}</option>`;
        });
    }
};

window.okullariYukle = function() {
    const il = document.getElementById("sehir").value;
    const ilce = document.getElementById("ilce").value;
    const okulSelect = document.getElementById("okul");
    if (!okulSelect || !il || !ilce) return;
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists) {
            const okullar = doc.data()[`${il}_${ilce}`] || [];
            okullar.sort().forEach(o => okulSelect.innerHTML += `<option value="${o}">${o}</option>`);
        }
    });
};

// --- 2. GÖKYÜZÜ VE BALON MOTORU ---
window.gokyuzunuYukle = function(uid, userData) {
    const container = document.getElementById(SAYFA === 'admin' ? 'admin-balloon-container' : 'balloon-container');
    if (!container) return;

    db.collection('users')
        .where('okul', '==', userData.okul)
        .where('sinif', '==', userData.sinif)
        .where('sube', '==', userData.sube)
        .onSnapshot(qs => {
            container.innerHTML = '';
            qs.forEach(doc => {
                const s = doc.data();
                if (s.rol === 'ogretmen' && SAYFA !== 'admin') return;
                const isMe = doc.id === uid;
                const bottomPos = Math.min(s.balonYuksekligi || 0, 330);
                const leftPos = (isMe && SAYFA !== 'admin') ? 50 : (Math.random() * 80 + 10);
                container.innerHTML += `
                    <div class="balloon" style="bottom:${bottomPos}px; left:${leftPos}%; background-color:${isMe ? '#ff5e57' : '#3498db'}; transform:translateX(-50%) scale(${SAYFA==='admin'?0.6:1});">
                        <div class="balloon-label">${SAYFA === 'admin' ? s.ogrenciAdSoyad : (isMe ? 'Sen' : s.balonEtiketi)}</div>
                    </div>`;
            });
        });
};

// --- 3. KAYIT / GİRİŞ / ÇIKIŞ ---
window.register = function() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const rol = document.getElementById('rolSecimi').value;
    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            balonEtiketi: document.getElementById('takmaAd').value || "Anonim",
            okul: document.getElementById('okul').value,
            sinif: document.getElementById('sinif').value,
            sube: document.getElementById('sube').value,
            rol: (rol === 'admin' ? 'ogretmen' : 'ogrenci'),
            balonYuksekligi: 0, toplamOkunanSayfa: 0
        });
    }).then(() => alert("Kayıt Başarılı!")).catch(e => alert(e.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Hata: " + e.message));
};

window.logout = function() { auth.signOut().then(() => location.reload()); };

// --- 4. ADMIN VE ÖĞRENCİ TETİKLEYİCİLERİ ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            const data = doc.data();
            if (SAYFA === 'admin' && data.rol === 'ogretmen') {
                window.illeriDoldur();
                window.gokyuzunuYukle(user.uid, data);
            } else if (SAYFA === 'ogrenci') {
                document.getElementById('auth-area').style.display = 'none';
                document.getElementById('user-panel').style.display = 'block';
                document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                document.getElementById('display-height').innerText = data.balonYuksekligi || 0;
                window.gokyuzunuYukle(user.uid, data);
            }
        });
    } else {
        window.illeriDoldur();
    }
});

window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById('sayfaSayisi').value);
    if (!sayfa || sayfa <= 0) return;
    const userRef = db.collection('users').doc(auth.currentUser.uid);
    userRef.get().then(doc => {
        const yeniS = (doc.data().toplamOkunanSayfa || 0) + sayfa;
        userRef.update({ toplamOkunanSayfa: yeniS, balonYuksekligi: yeniS * 2 });
        document.getElementById('sayfaSayisi').value = '';
    });
};

window.okulEkle = function() {
    const il = document.getElementById("yeniOkulIl").value;
    const ilce = document.getElementById("yeniOkulIlce").value;
    const ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik bilgi!");
    db.collection("sistem").doc("okulListesi").set({
        [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad)
    }, {merge:true}).then(() => alert("Okul Eklendi!"));
};

// UI Yardımcıları
window.showRegisterForm = (r) => { 
    document.getElementById('role-selection-area').style.display='none';
    document.getElementById('dynamic-register-form').style.display='block';
    document.getElementById('rolSecimi').value = r;
};
