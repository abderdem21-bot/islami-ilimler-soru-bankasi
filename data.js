// ========== DATA ==========
const ALLOWED_CATEGORIES = [
  'TEFSİR', 'HADİS', 'KELAM', 'TASAVVUF', 'FIKIH', 
  'MEZHEPLER TARİHİ', 'KURAN VE TECVİT', 'SİYER', 'DİNLER TARİHİ', 'GENEL TEKRAR',
  'ZOR SORULAR', 'BİLGİ KARTLARI'
];

const categoryFileMap = {
    'TEFSİR': 'tefsir.json',
    'HADİS': 'hadis.json',
    'KELAM': 'kelam.json',
    'TASAVVUF': 'tasavvuf.json',
    'FIKIH': 'fikih.json',
    'MEZHEPLER TARİHİ': 'mezhepler_tarihi.json',
    'KURAN VE TECVİT': 'kuran_ve_tecvıt.json',
    'SİYER': 'siyer.json',
    'DİNLER TARİHİ': 'dinlertarihi.json',
    'GENEL TEKRAR': null
};

let knowledgeData = [];
let zorSoruData = [];
let mecelleData = []; // Mecelle kaideleri

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getUnitCount(category) {
    return categoryQuestions[category] ? categoryQuestions[category].length : 0;
}

function prepareCategoryData(category, sourcePool) {
    const unitSize = 20;
    const units = [];
    for (let i = 0; i < sourcePool.length; i += unitSize) {
        const chunk = sourcePool.slice(i, i + unitSize);
        units.push(chunk.map((q, idx) => ({
            ...q,
            _uid: category + '-' + i + '-' + idx + '-' + Math.random().toString(36).slice(2),
            category: category
        })));
    }
    categoryQuestions[category] = units;
}

function loadKnowledgeBox() {
    return fetch('bilgikartları.json')
        .then(res => res.json())
        .then(data => { knowledgeData = data; })
        .catch(() => { knowledgeData = []; });
}

function loadZorSorular() {
    return fetch('zorsorular.json')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                zorSoruData = data.map(item => {
                    let answerIndex = item.answer;
                    if (typeof answerIndex === 'string') {
                        const mapChar = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                        answerIndex = mapChar[answerIndex.toUpperCase()] !== undefined ? mapChar[answerIndex.toUpperCase()] : 0;
                    }
                    return { ...item, answer: answerIndex };
                });
            } else {
                zorSoruData = [];
            }
        })
        .catch(() => { zorSoruData = []; });
}

// Mecelle yükleme – dosya adı güncellendi
function loadMecelle() {
    return fetch('mecellekaideleri.json')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                mecelleData = data;
            } else {
                mecelleData = [];
            }
        })
        .catch(() => { mecelleData = []; });
}

function loadAllCategoryData() {
    const promises = ALLOWED_CATEGORIES
        .filter(cat => cat !== 'GENEL TEKRAR' && categoryFileMap[cat])
        .map(cat => {
            return fetch(categoryFileMap[cat])
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status} for ${categoryFileMap[cat]}`);
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        const normalizedData = data.map(item => {
                            let questionText = item.q || item.soru;
                            let optionsList = item.options || item.siklar || item.secenekler;
                            let answerIndex = item.answer !== undefined ? item.answer : 
                                              (item.dogru_cevap !== undefined ? item.dogru_cevap : item.dogruCevap);

                            if (typeof answerIndex === 'string') {
                                const mapChar = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                                answerIndex = mapChar[answerIndex.toUpperCase()] !== undefined ? mapChar[answerIndex.toUpperCase()] : 0;
                            }

                            return {
                                ...item,
                                q: questionText,
                                options: optionsList || [],
                                answer: answerIndex !== undefined ? answerIndex : 0
                            };
                        });

                        prepareCategoryData(cat, normalizedData);
                    } else {
                        categoryQuestions[cat] = [];
                    }
                })
                .catch(err => {
                    console.warn(`Failed to load ${cat} from ${categoryFileMap[cat]}, skipping.`, err);
                    categoryQuestions[cat] = [];
                });
        });

    return Promise.all(promises).then(() => {
        console.log('All category data loaded.');
        if (!categoryQuestions['TEFSİR'] || categoryQuestions['TEFSİR'].length === 0) {
            categoryQuestions['TEFSİR'] = [];
        }
        ALLOWED_CATEGORIES.forEach(cat => {
            if (cat !== 'GENEL TEKRAR' && (!categoryQuestions[cat] || categoryQuestions[cat].length === 0)) {
                categoryQuestions[cat] = [];
            }
        });
        // Admin'den gelen bilgi kartlarını yükle
        const adminKart = localStorage.getItem('admin_bilgi_kartlari');
        if (adminKart) {
            try {
                const kartlar = JSON.parse(adminKart);
                if (Array.isArray(kartlar) && kartlar.length > 0) {
                    knowledgeData = knowledgeData.concat(kartlar);
                }
            } catch(e) {}
        }
        // Mecelle verisini yükle
        loadMecelle();
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    loadUserState();
    updateStats();
    loadKnowledgeBox();
    loadZorSorular();
    loadAllCategoryData().then(() => {
        if (typeof loadMetinler === 'function') loadMetinler();
        const adminData = localStorage.getItem('admin_custom_questions');
        if (adminData) {
            try {
                const custom = JSON.parse(adminData);
                Object.keys(custom).forEach(cat => {
                    if (ALLOWED_CATEGORIES.includes(cat) && custom[cat].length > 0) {
                        prepareCategoryData(cat, custom[cat]);
                    }
                });
            } catch(e) {}
        }
        updateStreakDisplay();
    });
    const savedEmail = userState.email;
    if (savedEmail) {
        const emailInput = document.getElementById('login-email');
        if (emailInput) emailInput.value = savedEmail;
    }
});