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

// Şehirleri data.js'den çekip dolduran fonksiyon
function illeriDoldur() {
    const sehirSelect = document.getElementById("sehir");
    if(!sehirSelect) return;
    sehirSelect.innerHTML = '<option value="">İl Seçiniz</option>';
    // ilVerisi değişkeni data.js'den geliyor
    Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => {
        let opt = document.createElement("option"); opt.value = il; opt.textContent = il;
        sehirSelect.appendChild(opt);
    });
}

window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    if(!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilceSelect.disabled = false;
        ilVerisi[sehir].forEach(i => {
            let opt = document.createElement("option"); opt.value = i; opt.textContent = i;
            ilceSelect.appendChild(opt);
        });
    } else {
        ilceSelect.disabled = true;
    }
};

function okullariYukle() {
    const os = document.getElementById("okul");
    if(!os) return;
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        if(doc.exists) {
            os.innerHTML = '<option value="">Okul Seçiniz</option>';
            doc.data().liste.forEach(o => {
                let opt = document.createElement("option"); opt.value = o; opt.textContent = o;
                os.appendChild(opt);
            });
        }
    });
}

// OTURUM TAKİBİ
auth.onAuthStateChanged(user => {
    if (user) {
        panelGuncelle(user.uid);
    } else {
        document.getElementById('auth-area').style.display = 'block';
        document.getElementById('user-panel').style.display = 'none';
        illeriDoldur(); 
        okullariYukle();
    }
});

window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    if(!email || !pass) { alert("E-posta ve şifre girin."); return; }
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Hata: " + e.message));
};

window.register = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userObj = {
        ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
        balonEtiketi: document.getElementById('takmaAd').value,
        konum: { il: document.getElementById('sehir').value, ilce: document.getElementById('ilce').value },
        okulBilgisi: { 
            okul: document.getElementById('okul').value, 
            sinif: document.getElementById('sinif').value, 
            sube: document.getElementById('sube').value 
        },
        balonYuksekligi: 0,
        lastUpdate: "",
        rol: "ogrenci"
    };
    auth.createUserWithEmailAndPassword(email, password)
        .then(res => db.collection("users").doc(res.user.uid).set(userObj))
        .catch(e => alert("Hata: " + e.message));
};

window.yukseklikArtir = function() {
    const s = parseInt(document.getElementById('sayfaSayisi').value);
    if(!s || s <= 0) { alert("Geçerli bir sayı girin."); return; }
    const user = auth.currentUser;
    const today = new Date().toLocaleDateString('tr-TR'); 

    db.collection("users").doc(user.uid).get().then(doc => {
        const userData = doc.data();
        if (userData.lastUpdate && userData.lastUpdate === today) {
            alert("Bugün zaten uçurdun! Yarın gel. 😊");
        } else {
            db.collection("users").doc(user.uid).update({
                balonYuksekligi: firebase.firestore.FieldValue.increment(s),
                lastUpdate: today
            }).then(() => { location.reload(); });
        }
    });
};

function panelGuncelle(uid) {
    db.collection("users").doc(uid).get().then(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        document.getElementById('auth-area').style.display = 'none';
        document.getElementById('user-panel').style.display = 'block';
        document.getElementById('welcome-msg').innerText = "Selam " + data.balonEtiketi;
        document.getElementById('display-height').innerText = data.balonYuksekligi;
        if(data.rol === 'admin') {
            document.getElementById('admin-link-area').innerHTML = `<button onclick="window.location.href='admin.html'" style="background:black; color:white; width:100%; border-radius:8px; padding:10px; margin-bottom:10px;">⚙️ Admin Paneli</button>`;
        }
        siralamayiGetir(data.okulBilgisi.sinif, data.okulBilgisi.sube);
    });
}

function siralamayiGetir(sinif, sube) {
    db.collection("users").where("okulBilgisi.sinif", "==", sinif).where("okulBilgisi.sube", "==", sube).get().then(qs => {
        const list = document.getElementById('leaderboard-list');
        const sky = document.getElementById('balloon-container');
        list.innerHTML = ""; sky.innerHTML = "";
        let users = [];
        qs.forEach(doc => users.push({id: doc.id, ...doc.data()}));
        users.sort((a,b) => b.balonYuksekligi - a.balonYuksekligi);
        users.forEach((d, index) => {
            list.innerHTML += `<p>${index+1}. ${d.balonEtiketi}: ${d.balonYuksekligi}m</p>`;
            const bDiv = document.createElement('div');
            bDiv.className = "remote-balloon";
            bDiv.style.left = (index * 55 + 15) + "px";
            bDiv.style.bottom = Math.min(d.balonYuksekligi * 1.5, 240) + "px";
            bDiv.innerHTML = `<span class="balloon-label">${d.balonEtiketi}</span><img src="https://cdn-icons-png.flaticon.com/512/1350/1350100.png">`;
            sky.appendChild(bDiv);
        });
    });
}

window.logout = function() { auth.signOut().then(() => location.reload()); };
