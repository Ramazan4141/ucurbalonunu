// --- 5. GÜNDE 1 KEZ GİRİŞ KONTROLİ ---
function kontorGirisSaatiBilgisi(uid) {
    const userRef = db.collection('users').doc(uid);
    
    userRef.get().then(doc => {
        if (!doc.exists) return;
        
        const userData = doc.data();
        const sonGirisTarihi = userData.sonGirisTarihi ? new Date(userData.sonGirisTarihi) : null;
        const bugun = bugunuSifirla(new Date());
        
        // Eğer bugün giriş yapılmışsa çık
        if (sonGirisTarihi && bugunuSifirla(sonGirisTarihi).getTime() === bugun.getTime()) {
            return;
        }
        
        // Haftalık sıfırlama kontrol (PAZARTESİ SABAHI SIFIRLA)
        const sonHaftaBasi = userData.haftalikBaslangic ? new Date(userData.haftalikBaslangic) : sonGirisTarihi;
        const buHaftaBasi = haftalikSifirla(bugun);
        
        const updates = {
            sonGirisTarihi: bugun,
            girisGecmisi: firebase.firestore.FieldValue.arrayUnion(bugun.toISOString())
        };
        
        // Haftalık balon SİFIRLA (yeni hafta başladıysa)
        if (!sonHaftaBasi || haftalikSifirla(sonHaftaBasi).getTime() !== buHaftaBasi.getTime()) {
            updates.haftalikBaslangic = buHaftaBasi;
            updates.balonYuksekligi = 0; // Pazardan sonra SİFIRLA
            updates.haftalikSayfa = 0; // Haftalık sayfa da sıfırla
        }
        
        // Aylık ve yıllık tutmaya devam et
        if (!userData.aylikSayfa) updates.aylikSayfa = 0;
        if (!userData.dort_aylikSayfa) updates.dort_aylikSayfa = 0;
        if (!userData.yillikSayfa) updates.yillikSayfa = 0;
        
        userRef.update(updates);
        
        // Seri rozet kontrol
        kontorSeriRozet(uid);
        // Haftalık sıralama rozetlerini kontrol
    });
}

// --- 16. YÜKSEKLİK ARTIRMA (GÜNDE 1 KEZ - BİRİKİMLİ) ---
window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById('sayfaSayisi').value);
    if (!sayfa || sayfa <= 0) return alert("Lütfen geçerli sayfa gir.");
    
    const user = auth.currentUser;
    const ref = db.collection('users').doc(user.uid);
    
    db.runTransaction(transaction => {
        return transaction.get(ref).then(doc => {
            const userData = doc.data();
            
            // Günde 1 kez kontrolü
            const sonGirisTarihi = userData.sonGirisTarihi ? new Date(userData.sonGirisTarihi) : null;
            const bugun = bugunuSifirla(new Date());
            
            if (sonGirisTarihi && bugunuSifirla(sonGirisTarihi).getTime() === bugun.getTime()) {
                return alert("⏰ Bugün zaten sayfa girdin! Yarın tekrar deneyebilirsin.");
            }
            
            // HAFTALIK BİRİKİMLİ (bir önceki gün üzerine ekle)
            const mevcutHaftalikSayfa = userData.haftalikSayfa || 0;
            const yeniHaftalikSayfa = mevcutHaftalikSayfa + sayfa;
            
            // AYLIK (tüm ayı tutmaya devam et)
            const yeniAylikSayfa = (userData.aylikSayfa || 0) + sayfa;
            
            // 4-AYLIK
            const yeni4AylikSayfa = (userData.dort_aylikSayfa || 0) + sayfa;
            
            // YILLIK
            const yeniYillikSayfa = (userData.yillikSayfa || 0) + sayfa;
            
            // BALON YÜKSEKLİĞİ = haftalık birikimli sayfa * 1 (1 sayfa = 1 metre)
            const yeniYukseklik = yeniHaftalikSayfa;
            
            transaction.update(ref, { 
                haftalikSayfa: yeniHaftalikSayfa,
                aylikSayfa: yeniAylikSayfa,
                dort_aylikSayfa: yeni4AylikSayfa,
                yillikSayfa: yeniYillikSayfa,
                balonYuksekligi: yeniYukseklik,  // BİRİKİMLİ
                toplamOkunanSayfa: (userData.toplamOkunanSayfa || 0) + sayfa,
                sonGirisTarihi: bugun,
                girisGecmisi: firebase.firestore.FieldValue.arrayUnion(bugun.toISOString())
            });
        });
    }).then(() => {
        document.getElementById('sayfaSayisi').value = '';
        kontorSeriRozet(user.uid);
        kontorHaftaliSiralamaBadge(auth.currentUser.uid);
    }).catch(e => alert("Hata: " + e.message));
};
