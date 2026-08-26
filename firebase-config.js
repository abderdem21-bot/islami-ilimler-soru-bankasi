// ========== FIREBASE YAPILANDIRMASI ==========
// Bu dosyayı www klasörüne kaydet

// Firebase SDK'ları yükle
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child, update, push, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyBNAgdFlkdkNLEO-fG_QNjU-xKpL1X4HJw",
  authDomain: "islamiilimlersorubankasi.firebaseapp.com",
  databaseURL: "https://islamiilimlersorubankasi-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "islamiilimlersorubankasi",
  storageBucket: "islamiilimlersorubankasi.firebasestorage.app",
  messagingSenderId: "239296154537",
  appId: "1:239296154537:web:f18881789f9f94c5dcb8",
  measurementId: "G-0WE1ESX4TM"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ========== LİDERLİK TABLOSU FONKSİYONLARI ==========

// Kullanıcı puanını Firebase'e kaydet
async function saveUserScoreToFirebase(email, nickname, score) {
  try {
    const userRef = ref(database, 'leaderboard/' + email.replace(/[.#$\/\[\]]/g, '_'));
    await set(userRef, {
      email: email,
      nickname: nickname || 'İsimsiz',
      score: score || 0,
      lastUpdated: new Date().toISOString()
    });
    console.log('✅ Skor Firebase\'e kaydedildi:', email, score);
    return true;
  } catch (error) {
    console.error('❌ Firebase kayıt hatası:', error);
    return false;
  }
}

// Liderlik tablosunu Firebase'den oku
async function getLeaderboardFromFirebase(limit = 100) {
  try {
    const leaderboardRef = ref(database, 'leaderboard');
    const snapshot = await get(leaderboardRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Objeyi diziye çevir
      const users = Object.keys(data).map(key => ({
        id: key,
        email: data[key].email || key,
        nickname: data[key].nickname || 'İsimsiz',
        score: data[key].score || 0,
        lastUpdated: data[key].lastUpdated || new Date().toISOString()
      }));
      
      // Skora göre sırala (yüksekten düşüğe)
      users.sort((a, b) => b.score - a.score);
      
      // Limit uygula
      return users.slice(0, limit);
    } else {
      console.log('📊 Liderlik tablosu boş');
      return [];
    }
  } catch (error) {
    console.error('❌ Liderlik okuma hatası:', error);
    return [];
  }
}

// Kullanıcının mevcut skorunu Firebase'den oku
async function getUserScoreFromFirebase(email) {
  try {
    const userRef = ref(database, 'leaderboard/' + email.replace(/[.#$\/\[\]]/g, '_'));
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val().score || 0;
    } else {
      return 0;
    }
  } catch (error) {
    console.error('❌ Kullanıcı skoru okuma hatası:', error);
    return 0;
  }
}

// Puan ekle (doğru cevap başına +1)
async function addScoreToFirebase(email, nickname, points = 1) {
  try {
    const sanitizedEmail = email.replace(/[.#$\/\[\]]/g, '_');
    const userRef = ref(database, 'leaderboard/' + sanitizedEmail);
    
    // Önce mevcut skoru al
    const snapshot = await get(userRef);
    let currentScore = 0;
    let currentNickname = nickname || 'İsimsiz';
    
    if (snapshot.exists()) {
      currentScore = snapshot.val().score || 0;
      currentNickname = snapshot.val().nickname || nickname || 'İsimsiz';
    }
    
    // Yeni skor
    const newScore = currentScore + points;
    
    // Güncelle
    await set(userRef, {
      email: email,
      nickname: currentNickname,
      score: newScore,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`✅ +${points} puan eklendi! Yeni skor: ${newScore}`);
    return newScore;
  } catch (error) {
    console.error('❌ Puan ekleme hatası:', error);
    return 0;
  }
}

// ========== EXPORT ==========
window.firebaseDB = {
  saveUserScore: saveUserScoreToFirebase,
  getLeaderboard: getLeaderboardFromFirebase,
  getUserScore: getUserScoreFromFirebase,
  addScore: addScoreToFirebase
};

console.log('✅ Firebase bağlantısı başarılı!');
console.log('📊 Liderlik tablosu hazır!');
