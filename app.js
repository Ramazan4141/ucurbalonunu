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
    const takmaAd = document.getElementById('takmaAd').value;
    auth.createUserWithEmailAndPassword(email, password).then((u) => {
        return db.collection("users").doc(u.user.uid).set({
            balonEtiketi: takmaAd,
            balonYuksekligi: 0,
            sonGirisTarihi: "" // Başta boş
        });
    });
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
            
            // --- BALON HAREKETİ ---
            const pxYukseklik = 30 + (data.balonYuksekligi * 2); // Her sayfa 2px yükseltir
            document.getElementById('balloon').style.bottom = pxYukseklik + "px";

            // --- GÜNLÜK KİLİT KONTROLÜ ---
            const bugun = new Date().toLocaleDateString();
            if (data.sonGirisTarihi === bugun) {
                document.getElementById('action-area').style.display = 'none'; // Input ve butonu gizle
                document.getElementById('lock-msg').style.display = 'block';   // Uyarıyı göster
            }
        }
    });
}

window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById('sayfaSayisi').value);
    if (!sayfa || sayfa <= 0) return;

    const bugun = new Date().toLocaleDateString();
    const uid = auth.currentUser.uid;

    db.collection("users").doc(uid).update({
        balonYuksekligi: firebase.firestore.FieldValue.increment(sayfa),
        sonGirisTarihi: bugun // Tarihi bugüne damgalıyoruz
    }).then(() => {
        panelGuncelle(uid);
    });
};

window.logout = function() { auth.signOut().then(() => location.reload()); };
