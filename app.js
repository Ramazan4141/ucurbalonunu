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
        konum: { sehir: document.getElementById('sehir').value, ilce: document.getElementById('ilce').value },
        balonYuksekligi: 0,
        sonGirisTarihi: "",
        veliEmail: email
    };

    auth.createUserWithEmailAndPassword(email, password).then((u) => {
        return db.collection("users").doc(u.user.uid).set(data);
    }).catch(e => alert(e.message));
};

window.login = function() {
    auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
};

function panelGuncelle(uid) {
    db.collection("users").doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('auth-area').style.display = 'none';
            document.getElementById('user-panel').style.display = 'block';
            document.getElementById('welcome-msg').innerText = "Selam " + data.balonEtiketi + "! 🎈";
            document.getElementById('display-height').innerText = data.balonYuksekligi;

            const bugun = new Date().toLocaleDateString();
            if (data.sonGirisTarihi === bugun) {
                document.getElementById('action-area').style.display = 'none';
                document.getElementById('lock-msg').style.display = 'block';
            }

            // Sınıf Arkadaşlarını hem listele hem gökyüzüne çiz
            arkadaslariGoster(data.okulBilgisi.sinif, data.okulBilgisi.sube, uid);
        }
    });
}

function arkadaslariGoster(sinif, sube, myUid) {
    const sky = document.getElementById('balloon-container');
    const list = document.getElementById('leaderboard-list');

    db.collection("users")
        .where("okulBilgisi.sinif", "==", sinif)
        .where("okulBilgisi.sube", "==", sube)
        .get().then((querySnapshot) => {
            sky.innerHTML = "";
            list.innerHTML = "";
            let items = [];
            querySnapshot.forEach(doc => items.push({id: doc.id, ...doc.data()}));
            
            // Sıralama
            items.sort((a,b) => b.balonYuksekligi - a.balonYuksekligi);

            items.forEach((a, index) => {
                // 1. Listeye Ekle
                const li = document.createElement('div');
                li.className = "leader-item" + (a.id === myUid ? " me" : "");
                li.innerHTML = `<span>${index+1}. ${a.balonEtiketi}</span> <span>${a.balonYuksekligi} m</span>`;
                list.appendChild(li);

                // 2. Gökyüzüne Ekle
                const bDiv = document.createElement('div');
                bDiv.className = "remote-balloon";
                
                // Balonları yan yana dağıt (çakışmasınlar)
                const spacing = Math.floor(sky.offsetWidth / (items.length + 1));
                bDiv.style.left = (spacing * (index + 0.5)) + "px";
                
                // Yükseklik: 25px(yer) + (sayfa * 2px). Max 350px.
                const bBottom = 25 + (a.balonYuksekligi * 2);
                bDiv.style.bottom = Math.min(bBottom, 350) + "px";

                const img = a.id === myUid ? 
                    "https://cdn-icons-png.flaticon.com/512/1350/1350100.png" : 
                    "https://cdn-icons-png.flaticon.com/512/1113/1113821.png";

                bDiv.innerHTML = `<span class="balloon-label">${a.balonEtiketi}</span><img src="${img}">`;
                sky.appendChild(bDiv);
            });
        });
}

window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById('sayfaSayisi').value);
    if (!sayfa || sayfa <= 0) return;
    const uid = auth.currentUser.uid;
    db.collection("users").doc(uid).update({
        balonYuksekligi: firebase.firestore.FieldValue.increment(sayfa),
        sonGirisTarihi: new Date().toLocaleDateString()
    }).then(() => panelGuncelle(uid));
};

window.logout = function() { auth.signOut().then(() => location.reload()); };
