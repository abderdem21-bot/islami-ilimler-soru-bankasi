// ========== FIREBASE YAPILANDIRMASI ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update, push, query, orderByChild, limitToLast, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ========== HAFTA NUMARASI ==========
function getWeekNumber() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now - startOfYear;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function getCurrentWeekKey() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber();
    return `${year}_W${String(week).padStart(2, '0')}`;
}

// Hafta başlangıcını (Pazartesi 00:00) hesapla
function getWeekStartDate() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

// Hafta bitişini (Pazar 23:59) hesapla
function getWeekEndDate() {
    const start = getWeekStartDate();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

// ========== LİDERLİK TABLOSU ==========

// Kullanıcı puanını kaydet (haftalık)
async function addScoreToFirebase(email, nickname, points = 1) {
  try {
    const weekKey = getCurrentWeekKey();
    const sanitizedEmail = email.replace(/[.#$\/\[\]]/g, '_');
    const userRef = ref(database, `leaderboard/${weekKey}/${sanitizedEmail}`);
    
    const snapshot = await get(userRef);
    let currentScore = 0;
    let currentNickname = nickname || 'İsimsiz';
    
    if (snapshot.exists()) {
      currentScore = snapshot.val().score || 0;
      currentNickname = snapshot.val().nickname || nickname || 'İsimsiz';
    }
    
    const newScore = currentScore + points;
    
    await set(userRef, {
      email: email,
      nickname: currentNickname,
      score: newScore,
      lastUpdated: new Date().toISOString()
    });
    
    return newScore;
  } catch (error) {
    console.error('❌ Puan ekleme hatası:', error);
    return 0;
  }
}

// Liderlik tablosunu oku (haftalık)
async function getLeaderboardFromFirebase(limit = 100) {
  try {
    const weekKey = getCurrentWeekKey();
    const leaderboardRef = ref(database, `leaderboard/${weekKey}`);
    const snapshot = await get(leaderboardRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const users = Object.keys(data).map(key => ({
        id: key,
        email: data[key].email || key,
        nickname: data[key].nickname || 'İsimsiz',
        score: data[key].score || 0,
        lastUpdated: data[key].lastUpdated || new Date().toISOString()
      }));
      users.sort((a, b) => b.score - a.score);
      return users.slice(0, limit);
    }
    return [];
  } catch (error) {
    console.error('❌ Liderlik okuma hatası:', error);
    return [];
  }
}

// ========== HAFTA SONU ÖDÜL DAĞITIMI ==========

// Haftanın kazananlarını belirle ve ödülleri dağıt
async function distributeWeeklyRewards() {
  try {
    const weekKey = getCurrentWeekKey();
    const leaderboardRef = ref(database, `leaderboard/${weekKey}`);
    const snapshot = await get(leaderboardRef);
    
    if (!snapshot.exists()) {
      console.log('📊 Bu hafta liderlik verisi yok.');
      return;
    }
    
    const data = snapshot.val();
    const users = Object.keys(data).map(key => ({
      id: key,
      email: data[key].email || key,
      nickname: data[key].nickname || 'İsimsiz',
      score: data[key].score || 0
    }));
    users.sort((a, b) => b.score - a.score);
    
    // İlk 3'ü seç
    const winners = users.slice(0, 3);
    
    // Ödülleri tanımla
    const rewards = [
      { rank: 1, badge: '🥇 Altın Rozet', hearts: 3 },
      { rank: 2, badge: '🥈 Gümüş Rozet', hearts: 2 },
      { rank: 3, badge: '🥉 Bronz Rozet', hearts: 1 }
    ];
    
    // Her kazanan için ödülü kaydet
    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const reward = rewards[i];
      
      const rewardRef = ref(database, `rewards/${winner.id}/${weekKey}`);
      await set(rewardRef, {
        rank: reward.rank,
        badge: reward.badge,
        hearts: reward.hearts,
        awardedAt: new Date().toISOString()
      });
      
      console.log(`🎁 ${winner.nickname} -> ${reward.badge} + ${reward.hearts} Can`);
    }
    
    // Haftanın kazananlarını ayrı bir node'da sakla
    const winnersRef = ref(database, `weekly_winners/${weekKey}`);
    await set(winnersRef, {
      winners: winners.map((w, idx) => ({
        ...w,
        rank: idx + 1,
        badge: rewards[idx].badge,
        hearts: rewards[idx].hearts
      })),
      awardedAt: new Date().toISOString()
    });
    
    console.log('✅ Haftalık ödüller dağıtıldı!');
    return winners;
    
  } catch (error) {
    console.error('❌ Ödül dağıtım hatası:', error);
    return null;
  }
}

// Kullanıcının ödüllerini getir
async function getUserRewards(email) {
  try {
    const sanitizedEmail = email.replace(/[.#$\/\[\]]/g, '_');
    const rewardsRef = ref(database, `rewards/${sanitizedEmail}`);
    const snapshot = await get(rewardsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const rewards = Object.keys(data).map(week => ({
        week: week,
        ...data[week]
      }));
      return rewards;
    }
    return [];
  } catch (error) {
    console.error('❌ Ödül okuma hatası:', error);
    return [];
  }
}

// Toplam ödül sayısını getir
async function getTotalRewards(email) {
  try {
    const rewards = await getUserRewards(email);
    return {
      gold: rewards.filter(r => r.rank === 1).length,
      silver: rewards.filter(r => r.rank === 2).length,
      bronze: rewards.filter(r => r.rank === 3).length,
      totalHearts: rewards.reduce((sum, r) => sum + (r.hearts || 0), 0)
    };
  } catch (error) {
    console.error('❌ Toplam ödül okuma hatası:', error);
    return { gold: 0, silver: 0, bronze: 0, totalHearts: 0 };
  }
}

// ========== HAFTALIK RESET KONTROLÜ ==========
function checkWeeklyReset() {
    const now = new Date();
    const day = now.getDay(); // 0=Pazar, 1=Pazartesi
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Pazartesi 00:00'da reset
    if (day === 1 && hours === 0 && minutes === 0) {
        return true;
    }
    return false;
}

// Eski haftaların verilerini temizle (4 haftadan eski)
async function cleanOldLeaderboardData() {
  try {
    const leaderboardRef = ref(database, 'leaderboard');
    const snapshot = await get(leaderboardRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const weeks = Object.keys(data);
      const currentWeek = getCurrentWeekKey();
      
      for (const week of weeks) {
        if (week < currentWeek) {
          const weekParts = week.split('_W');
          const year = parseInt(weekParts[0]);
          const weekNum = parseInt(weekParts[1]);
          const currentYear = new Date().getFullYear();
          const currentWeekNum = getWeekNumber();
          
          if (year < currentYear - 1 || (year === currentYear - 1 && weekNum < currentWeekNum - 4)) {
            const oldRef = ref(database, `leaderboard/${week}`);
            await set(oldRef, null);
            console.log(`🗑️ Eski hafta verisi silindi: ${week}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Eski veri temizleme hatası:', error);
  }
}

// ========== EXPORT ==========
window.firebaseDB = {
  addScore: addScoreToFirebase,
  getLeaderboard: getLeaderboardFromFirebase,
  getWeekKey: getCurrentWeekKey,
  getWeekStart: getWeekStartDate,
  getWeekEnd: getWeekEndDate,
  distributeRewards: distributeWeeklyRewards,
  getUserRewards: getUserRewards,
  getTotalRewards: getTotalRewards,
  checkWeeklyReset: checkWeeklyReset,
  cleanOldData: cleanOldLeaderboardData
};

console.log('✅ Firebase bağlantısı başarılı!');
console.log(`📊 Bu hafta: ${getCurrentWeekKey()}`);
console.log('🎁 Haftalık ödül sistemi aktif!');
