// --- 12. KAYIT / GİRİŞ / ÇIKIŞ ---
window.register = function() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const rol = document.getElementById('rolSecimi').value;
    
    if (!email || !pass) return alert("E-posta ve şifre gerekli!");
    
    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        // rol: 'user' ise 'ogrenci', 'admin' ise 'ogretmen'
        const finalRol = (rol === 'admin' ? 'ogretmen' : 'ogrenci');
        
        const userData = {
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            okul: document.getElementById('okul').value,
            sinif: document.getElementById('sinif').value,
            sube: document.getElementById('sube').value,
            rol: finalRol
        };
        
        // ÖĞRETMEN değilse balon verisi ekle
        if (finalRol === 'ogrenci') {
            userData.balonEtiketi = document.getElementById('takmaAd').value || "Anonim";
            userData.balonYuksekligi = 0;
            userData.toplamOkunanSayfa = 0;
            userData.rozet = '';
        }
        
        return db.collection("users").doc(res.user.uid).set(userData);
    }).then(() => { 
        alert("Kayıt Başarılı!"); 
        location.reload(); 
    }).catch(e => alert("Hata: " + e.message));
};
