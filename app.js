window.register = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const adSoyad = document.getElementById('ogrenciAdSoyad').value;
    const takmaAd = document.getElementById('takmaAd').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Kullanıcı oluşturuldu, UID:", user.uid);
            
            // 🔥 DEĞİŞİKLİK BURADA: Veriyi 'set' ile doğrudan basıyoruz
            return db.collection("users").doc(user.uid).set({
                ogrenciAdSoyad: adSoyad,
                balonEtiketi: takmaAd,
                veliEmail: email,
                balonYuksekligi: 0,
                kayitTarihi: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert("Vee işte bu! Veritabanı kaydı da tamam kanka. 🎈");
        })
        .catch((error) => {
            console.error("Hata Detayı:", error.code, error.message);
            alert("Eyvah! Bir hata: " + error.message);
        });
};
