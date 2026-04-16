const firebaseConfig = {
    apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
    authDomain: "ucurbalonu.firebaseapp.com",
    projectId: "ucurbalonu",
    storageBucket: "ucurbalonu.firebasestorage.app",
    messagingSenderId: "677201903733",
    appId: "1:677201903733:web:f5708b28f410ae7036b83c",
    measurementId: "G-YYRX592P4Q"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.data().rol !== 'admin') { window.location.href = "index.html"; }
            else { okulListele(); }
        });
    } else { window.location.href = "index.html"; }
});

window.okulEkle = function() {
    const ad = document.getElementById("yeniOkulInput").value;
    if(!ad) return;
    db.collection("sistem").doc("okulListesi").set({
        liste: firebase.firestore.FieldValue.arrayUnion(ad)
    }, { merge: true }).then(() => location.reload());
};

function okulListele() {
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        if(doc.exists) {
            const ul = document.getElementById("mevcutOkullar");
            ul.innerHTML = "";
            doc.data().liste.forEach(o => {
                ul.innerHTML += `<li style="background:#eee; margin:5px; padding:10px; border-radius:5px;">${o}</li>`;
            });
        }
    });
}
