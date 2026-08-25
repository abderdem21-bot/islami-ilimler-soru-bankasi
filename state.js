// ========== GLOBAL STATE ==========
let masterQuestionPool = [];
let currentCategory = "";
let currentUnit = 1;
let unlockedUnits = {};
let completedUnits = {};
let currentQuestions = [];
let currentQuestionIndex = 0;
let hearts = 3;
let totalSolvedCount = 0;
let isAnswered = false;
let isTestMode = false;
let testTimer = null;
let testTimeLimit = 10;
let testQuestions = [];
let testCorrectCount = 0;
let categoryStats = {};
const categoryQuestions = {};

let gameResumeData = null;

// ========== REKLAM DEPOSU ==========
let adDeposu = [];
const MAX_AD_DEPO = 10;

// ========== KULLANICI STATE ==========
let userState = {
  email: '',
  nickname: '',
  password: '',
  uid: null,
  isAdmin: false,
  adRewardCounts: {
    hardQuestion: 0,
    hint: 0,
    wrongAnalysis: 0,
    wrongRetry: 0,
    dailyTestExtra: 0,
  },
  dailyTestDate: null,
  dailyTestCount: 0,
  hintCount: 0,
  featureUnlocked: {
    hardQuestion: false,
    hint: false,
    wrongAnalysis: false,
    wrongRetry: false,
  },
  favorites: [],
  wrongQuestions: [],
  vitalCardIndex: 0,
  totalTestsCompleted: 0,
  unitCompletionCount: 0,
  remainingUnitsForChest: 0,
  dailyLaunchCount: 0,
  lastLaunchDate: null,
  rememberMe: false,
  hearts: 3,
  lastHeartReset: null,
  shareRewardClaimed: false,
  statsAdWatchedToday: false,
  statsAdDate: null,
  streakCount: 0,
  lastStreakDate: null,
  leaderboardScore: 0,
  soundMode: 'sound',
  lastPage: 'screen-categories' // Varsayılan ana sayfa
};

function saveUserState() {
  localStorage.setItem('islami_user_state', JSON.stringify(userState));
}

function loadUserState() {
  const saved = localStorage.getItem('islami_user_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      userState = { ...userState, ...parsed };
      if (!userState.adRewardCounts) userState.adRewardCounts = { hardQuestion: 0, hint: 0, wrongAnalysis: 0, wrongRetry: 0, dailyTestExtra: 0 };
      if (!userState.featureUnlocked) userState.featureUnlocked = { hardQuestion: false, hint: false, wrongAnalysis: false, wrongRetry: false };
      if (!userState.favorites) userState.favorites = [];
      if (!userState.wrongQuestions) userState.wrongQuestions = [];
      if (userState.hintCount === undefined) userState.hintCount = 0;
      if (userState.vitalCardIndex === undefined) userState.vitalCardIndex = 0;
      if (!userState.email) userState.email = '';
      if (!userState.nickname) userState.nickname = '';
      if (!userState.password) userState.password = '';
      if (userState.totalTestsCompleted === undefined) userState.totalTestsCompleted = 0;
      if (userState.unitCompletionCount === undefined) userState.unitCompletionCount = 0;
      if (userState.remainingUnitsForChest === undefined) userState.remainingUnitsForChest = 0;
      if (userState.dailyLaunchCount === undefined) userState.dailyLaunchCount = 0;
      if (userState.lastLaunchDate === undefined) userState.lastLaunchDate = null;
      if (userState.rememberMe === undefined) userState.rememberMe = false;
      if (userState.hearts === undefined) userState.hearts = 3;
      if (userState.shareRewardClaimed === undefined) userState.shareRewardClaimed = false;
      if (userState.statsAdWatchedToday === undefined) userState.statsAdWatchedToday = false;
      if (userState.statsAdDate === undefined) userState.statsAdDate = null;
      if (userState.streakCount === undefined) userState.streakCount = 0;
      if (userState.lastStreakDate === undefined) userState.lastStreakDate = null;
      if (userState.leaderboardScore === undefined) userState.leaderboardScore = 0;
      if (userState.soundMode === undefined) userState.soundMode = 'sound';
      if (userState.uid === undefined) userState.uid = null;
      if (userState.isAdmin === undefined) userState.isAdmin = false;
      if (userState.lastPage === undefined) userState.lastPage = 'screen-categories';
    } catch (e) { console.warn('User state parse error', e); }
  }
  resetHeartsIfNeeded();
  resetStatsAdIfNeeded();
  checkStreak();
}

function resetHeartsIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (userState.lastHeartReset !== today) {
    userState.hearts = 3;
    userState.lastHeartReset = today;
    saveUserState();
  }
  hearts = userState.hearts;
}

function resetStatsAdIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (userState.statsAdDate !== today) {
    userState.statsAdWatchedToday = false;
    userState.statsAdDate = today;
    saveUserState();
  }
}

function setHearts(val) {
  hearts = Math.max(0, val);
  userState.hearts = hearts;
  saveUserState();
}

function addHearts(val) {
  setHearts(hearts + val);
}

// ========== STREAK ==========
function checkStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const last = userState.lastStreakDate;
  if (last === today) {
    return;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  if (last === yStr) {
    userState.streakCount += 1;
  } else {
    userState.streakCount = 1;
  }
  userState.lastStreakDate = today;
  saveUserState();
  if (userState.streakCount % 5 === 0) {
    addHearts(1);
    showToast(`🔥 ${userState.streakCount} günlük seri! +1 can kazandın.`);
  }
  updateStreakDisplay();
}

function updateStreakDisplay() {
  const el = document.getElementById('streak-display');
  if (el) el.innerText = '🔥 ' + (userState.streakCount || 0);
}

// ========== LİDERLİK ==========
function updateLeaderboard(scoreIncrement) {
  userState.leaderboardScore = (userState.leaderboardScore || 0) + scoreIncrement;
  saveUserState();
}

function getLeaderboardData() {
  const myName = userState.nickname && userState.nickname.trim() !== '' ? userState.nickname : 'İsimsiz';
  return [
    { name: myName, score: userState.leaderboardScore || 0 }
  ];
}
