const firebaseConfig = {
  apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
  authDomain: "ucurbalonu.firebaseapp.com",
  projectId: "ucurbalonu",
  storageBucket: "ucurbalonu.firebasestorage.app",
  messagingSenderId: "677201903733",
  appId: "1:677201903733:web:f5708b28f410ae7036b83c",
  measurementId: "G-YYRX592P4Q"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

// --- İL VE İLÇE SİSTEMİ BAŞLANGIÇ ---
const ilVerisi = {
    "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
    "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
    "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktebe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
    // Buraya diğer iller de benzer formatta eklenecek (Kısaltıldı)
    "Zonguldak": ["Alaplı", "Çaycuma", "Devrek", "Gökçebey", "Kilimli", "Kozlu", "Merkez", "Ereğli"]
};

// Sayfa yüklenince illeri seçeneğe ekle
window.addEventListener('DOMContentLoaded', () => {
    const sehirSelect = document.getElementById("sehir");
    if(sehirSelect) {
        Object.keys(ilVerisi).sort().forEach(il => {
            let opt = document.createElement("option");
            opt.value = il; opt.textContent = il;
            sehirSelect.appendChild(opt);
        });
    }
});

window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir) {
        ilceSelect.disabled = false;
        ilVerisi[sehir].forEach(ilce => {
            let opt = document.createElement("option");
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    } else { ilceSelect.disabled = true; }
};
// --- İL VE İLÇE SİSTEMİ BİTİŞ ---

auth.onAuthStateChanged((user) => {
    if (user) { panelGuncelle(user.uid); } 
    else { document.getElementById('auth-area').style.display = 'block'; document.getElementById('user-panel').style.display = 'none'; }
});

window.register = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const data = {
        ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
        balonEtiketi: document.getElementById('takmaAd').value,
        okulBilgisi: { 
            sinif: document.getElementById('sinif').value, 
            sube: document.getElementById('sube').value,
            okul: document.getElementById('okul').value
        },
        konum: { 
            sehir: document.getElementById('sehir').value, 
            ilce: document.getElementById('ilce').value 
        },
        balonYuksekligi: 0,
        sonGirisTarihi: "",
        veliEmail: email
    };

    auth.createUserWithEmailAndPassword(email, password).then((u) => {
        return db.collection("users").doc(u.user.uid).set(data);
    }).catch(e => alert(e.message));
};

// ... Geri kalan fonksiyonların (login, panelGuncelle, arkadaslariGoster vb.) aynen devam eder ...
