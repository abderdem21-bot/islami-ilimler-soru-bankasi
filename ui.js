// ========== SCREEN MANAGEMENT ==========
let policySourceScreen = null;
function hideAllScreens() {
    const screens = [
        "screen-login", "screen-categories", "screen-units", "screen-game",
        "screen-gameover", "screen-victory", "screen-results",
        "screen-settings", "screen-privacy", "screen-terms", "screen-about",
        "screen-test-result", "screen-contact", "screen-rewards", "screen-favorites",
        "screen-register", "screen-bilgic", "screen-user-guide", "screen-leaderboard",
        "screen-fiqh-submenu", "screen-mecelle", "screen-mecelle-card"
    ];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
}

// ========== OTURUM KALICILIĞI (Sayfa Yenileme) ==========
function restoreUserSession() {
    // Önce userState'i yeniden yükle
    loadUserState();
    
    // Eğer kullanıcı giriş yapmışsa ve bir sayfada kaydı varsa
    if (userState && userState.email) {
        const lastPage = userState.lastPage || 'screen-categories';
        // Eğer kayıtlı sayfa geçerli bir ekran ID'siyse
        const validScreens = ['screen-categories', 'screen-units', 'screen-game', 'screen-bilgic', 'screen-rewards', 'screen-favorites', 'screen-results', 'screen-settings', 'screen-leaderboard', 'screen-mecelle', 'screen-mecelle-card', 'screen-fiqh-submenu'];
        if (validScreens.includes(lastPage)) {
            // Tüm ekranları gizle
            hideAllScreens();
            // Kayıtlı ekranı göster
            const screenElement = document.getElementById(lastPage);
            if (screenElement) {
                screenElement.classList.remove('hidden');
                // Alt navigasyonu göster
                document.getElementById("bottom-nav-bar").classList.remove("hidden");
                // Doğru sekme aktif olsun
                const navMap = {
                    'screen-categories': 'home',
                    'screen-units': 'home',
                    'screen-game': 'home',
                    'screen-bilgic': 'bilgic',
                    'screen-rewards': 'rewards',
                    'screen-favorites': 'favorites',
                    'screen-results': 'results',
                    'screen-settings': 'settings',
                    'screen-leaderboard': 'leaderboard',
                    'screen-mecelle': 'home',
                    'screen-mecelle-card': 'home',
                    'screen-fiqh-submenu': 'home'
                };
                setActiveNav(navMap[lastPage] || 'home');
                
                // Eğer son sayfa units ise, içeriği yeniden oluştur
                if (lastPage === 'screen-units' && currentCategory) {
                    renderUnits();
                }
                if (lastPage === 'screen-game' && currentQuestions.length > 0) {
                    renderQuestion();
                }
                if (lastPage === 'screen-bilgic') {
                    // Bilgiç sayfası içeriği varsa yeniden oluştur
                }
                if (lastPage === 'screen-rewards') {
                    renderRewardScreen();
                }
                if (lastPage === 'screen-favorites') {
                    renderFavorites();
                }
                if (lastPage === 'screen-results') {
                    updateStats();
                }
                if (lastPage === 'screen-leaderboard') {
                    renderLeaderboard();
                }
                if (lastPage === 'screen-mecelle') {
                    renderMecelleGroups();
                }
                if (lastPage === 'screen-fiqh-submenu') {
                    // Fıkıh alt menüsü zaten açık
                }
                updateHeartsAndHints();
                updateStreakDisplay();
                showBannerAd();
                return true; // Başarıyla geri yüklendi
            }
        }
    }
    return false; // Geri yüklenemedi
}

// ========== BANNER REKLAM ==========
function showBannerAd() {
    const banner = document.getElementById('banner-ad');
    const textEl = document.getElementById('banner-ad-text');
    if (!banner || !textEl) return;
    if (adDeposu.length > 0) {
        const ad = adDeposu[0];
        textEl.textContent = '📢 ' + (ad.content || 'Reklam');
    } else {
        fetch('reklamlar.json')
            .then(res => {
                if (!res.ok) throw new Error('Reklam yüklenemedi');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    adDeposu.push(...data.slice(0, MAX_AD_DEPO));
                    const ad = adDeposu[0];
                    textEl.textContent = '📢 ' + (ad.content || 'Reklam');
                } else {
                    textEl.textContent = '📢 Özel teklif: İslami kitaplar %20 indirimli!';
                }
            })
            .catch(() => {
                textEl.textContent = '📢 Özel teklif: İslami kitaplar %20 indirimli!';
            });
    }
}

// ===== SES / TİTREŞİM KONTROLÜ =====
function playSound(type) {
    const mode = userState.soundMode || 'sound';
    if (mode === 'silent') return;

    try {
        if (mode === 'vibration' && navigator.vibrate) {
            if (type === 'click') navigator.vibrate(15);
            else if (type === 'success') navigator.vibrate([15, 50, 15]);
            return;
        }

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'click') {
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.08);
        } else if (type === 'success') {
            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.15);
            setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.frequency.value = 1200;
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
                osc2.start(audioCtx.currentTime);
                osc2.stop(audioCtx.currentTime + 0.12);
            }, 120);
        }
    } catch(e) { /* sessiz */ }
}

// Butonlara ses ekleme (global click listener)
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-primary') || e.target.closest('.btn-danger') || 
        e.target.closest('.category-btn') || e.target.closest('.unit-btn') ||
        e.target.closest('.circle-btn') || e.target.closest('.back-btn') ||
        e.target.closest('.auth-link-btn') || e.target.closest('.nav-item') ||
        e.target.closest('.drawer-item') || e.target.closest('.menu-burger-btn')) {
        playSound('click');
    }
    if (e.target.closest('.option-btn.correct') || e.target.closest('.btn-success') ||
        e.target.closest('.success-gradient')) {
        playSound('success');
    }
});

// ===== SES MODU DEĞİŞTİRME =====
function changeSoundMode(mode) {
    userState.soundMode = mode;
    saveUserState();
    showToast(`🔊 Ses modu: ${mode === 'sound' ? 'Sesli' : mode === 'vibration' ? 'Titreşim' : 'Sessiz'}`);
}

// ===== METİN YÜKLEME =====
function loadMetinler() {
    return fetch('metinler.json')
        .then(res => {
            if (!res.ok) throw new Error('metinler.json yüklenemedi');
            return res.json();
        })
        .then(data => {
            metinVerileri = data;
            fillScreenWithContent('screen-user-guide', metinVerileri.kullanımRehberi, 'rehber');
            fillScreenWithContent('screen-privacy', metinVerileri.gizlilikPolitikasi, 'gizlilik');
            fillScreenWithContent('screen-about', metinVerileri.hakkimizda, 'hakkimizda');
            fillScreenWithContent('screen-terms', metinVerileri.kullanimKosullari, 'terms');
        })
        .catch(err => {
            console.warn('Metinler yüklenemedi, varsayılan metinler kullanılacak.', err);
        });
}

function fillScreenWithContent(screenId, contentData, type) {
    const screen = document.getElementById(screenId);
    if (!screen) return;

    let container = screen.querySelector('.content-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'content-container';
        const headerRow = screen.querySelector('.header-row');
        if (headerRow) {
            headerRow.after(container);
        } else {
            screen.prepend(container);
        }
    }
    container.innerHTML = '';

    if (!contentData) {
        container.innerHTML = '<p class="profile-card">İçerik yüklenemedi.</p>';
        return;
    }

    if (type === 'rehber') {
        if (contentData.icerik && Array.isArray(contentData.icerik)) {
            contentData.icerik.forEach(item => {
                const div = document.createElement('div');
                div.className = 'profile-card';
                const h3 = document.createElement('h3');
                h3.textContent = item.baslik;
                const p = document.createElement('p');
                p.style.whiteSpace = 'pre-wrap';
                p.textContent = item.metin;
                div.appendChild(h3);
                div.appendChild(p);
                container.appendChild(div);
            });
        } else {
            container.innerHTML = '<p class="profile-card">Rehber içeriği yüklenemedi.</p>';
        }
    } else if (type === 'gizlilik' || type === 'hakkimizda' || type === 'terms') {
        if (contentData.altBaslik) {
            const sub = document.createElement('p');
            sub.style.fontWeight = '600';
            sub.style.marginBottom = '16px';
            sub.textContent = contentData.altBaslik;
            container.appendChild(sub);
        }
        if (contentData.paragraflar && Array.isArray(contentData.paragraflar)) {
            contentData.paragraflar.forEach(text => {
                const p = document.createElement('p');
                p.style.whiteSpace = 'pre-wrap';
                p.textContent = text;
                container.appendChild(p);
            });
        } else {
            container.innerHTML = '<p class="profile-card">İçerik yüklenemedi.</p>';
        }
    }
}

// ===== GİRİŞ =====
function performLogin() {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value.trim();
    const remember = document.getElementById("remember-me").checked;
    if (!email || !pass) {
        showCustomModal("Uyarı", "Lütfen email ve şifre girin!");
        return;
    }

    if (typeof window.firebaseLogin === 'function') {
        window.firebaseLogin(email, pass)
            .then((userCredential) => {
                const user = userCredential.user;
                userState.email = user.email;
                userState.uid = user.uid;
                userState.isAdmin = user.isAdmin || false;
                userState.lastPage = 'screen-categories';
                
                // E-posta adresini HER ZAMAN hafızada tut
                localStorage.setItem('saved_email', email);

                // Şifreyi sadece "Şifreyi Hatırla" seçiliyse tut
                if (remember) {
                    userState.rememberMe = true;
                    localStorage.setItem('saved_password', pass);
                } else {
                    userState.rememberMe = false;
                    localStorage.removeItem('saved_password');
                }
                
                hideAllScreens();
                document.getElementById("screen-categories").classList.remove("hidden");
                document.getElementById("bottom-nav-bar").classList.remove("hidden");
                setActiveNav('home');
                initCategoryButtons();
                updateStreakDisplay();
                showBannerAd();
                updateHeartsAndHints();
                showToast("✅ Giriş başarılı!");
                
                checkDailyLaunchAd();
            })
            .catch((error) => {
                let msg = "Hatalı e-posta veya şifre!";
                if (error.code === 'auth/user-not-found') msg = "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.";
                else if (error.code === 'auth/wrong-password') msg = "Şifre yanlış.";
                else if (error.code === 'auth/invalid-email') msg = "Geçersiz e-posta formatı.";
                else if (error.code === 'auth/too-many-requests') msg = "Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.";
                else msg = error.message || "Beklenmeyen bir hata oluştu.";
                showCustomModal("Giriş Hatası", msg);
            });
    } else {
        showCustomModal("Hata", "Kimlik doğrulama sistemi başlatılamadı. Lütfen sayfayı yenileyin.");
    }
}

// ===== KAYIT =====
function performRegister() {
    const nick = document.getElementById("reg-nick").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const pass = document.getElementById("reg-password").value.trim();
    const passConfirm = document.getElementById("reg-password-confirm").value.trim();
    const termsCheck = document.getElementById("terms-checkbox");
    if (!nick || !email || !pass || !passConfirm) {
        showCustomModal("Uyarı", "Tüm alanları doldurun!");
        return;
    }
    if (pass !== passConfirm) {
        showCustomModal("Uyarı", "Şifreler eşleşmiyor!");
        return;
    }
    if (!termsCheck.checked) {
        showCustomModal("Uyarı", "Kullanım Şartları ve Gizlilik Politikası'nı kabul etmelisiniz.");
        return;
    }

    if (typeof window.firebaseRegister === 'function') {
        window.firebaseRegister(email, pass)
            .then((userCredential) => {
                const user = userCredential.user;
                userState.nickname = nick;
                userState.email = user.email;
                userState.uid = user.uid;
                userState.isAdmin = user.isAdmin || false;
                userState.lastPage = 'screen-categories';
                saveUserState();
                showCustomModal("Başarılı", "Kayıt başarılı! Giriş yapılıyor...");
                document.getElementById("login-email").value = email;
                document.getElementById("login-password").value = pass;
                performLogin();
            })
            .catch((error) => {
                let msg = "Kayıt sırasında bir hata oluştu.";
                if (error.code === 'auth/email-already-in-use') {
                    msg = "Bu e-posta adresi zaten kullanımda.";
                } else if (error.code === 'auth/weak-password') {
                    msg = "Şifre en az 6 karakter olmalıdır.";
                } else if (error.code === 'auth/invalid-email') {
                    msg = "Geçersiz e-posta formatı.";
                } else {
                    msg = error.message || "Beklenmeyen bir hata oluştu.";
                }
                showCustomModal("Kayıt Hatası", msg);
            });
    } else {
        showCustomModal("Hata", "Kimlik doğrulama sistemi başlatılamadı. Lütfen sayfayı yenileyin.");
    }
}

function openRegister() {
    // Kayıt sayfasına geçmeden önce mevcut ekranı kaydet
    userState._previousScreen = 'screen-login';
    saveUserState();
    hideAllScreens();
    document.getElementById("screen-register").classList.remove("hidden");
}

function closeRegister() {
    hideAllScreens();
    // Kayıt sayfasından geri dönüş
    const prevScreen = userState._previousScreen || 'screen-login';
    document.getElementById(prevScreen).classList.remove("hidden");
    // Eğer giriş sayfasına dönüyorsa, formları temizleme
    if (prevScreen === 'screen-login') {
        document.getElementById("reg-nick").value = '';
        document.getElementById("reg-email").value = '';
        document.getElementById("reg-password").value = '';
        document.getElementById("reg-password-confirm").value = '';
        document.getElementById("terms-checkbox").checked = false;
    }
}

function openForgotPasswordModal() {
    const modal = document.getElementById("forgot-password-modal");
    modal.classList.remove("hidden");
    document.getElementById("reset-email").value = userState.email || '';
}

function closeForgotPasswordModal() {
    document.getElementById("forgot-password-modal").classList.add("hidden");
}

function closeForgotPasswordModalOutside(e) {
    if (e.target.id === "forgot-password-modal") closeForgotPasswordModal();
}

function sendResetLink() {
    const email = document.getElementById("reset-email").value.trim();
    if (!email) {
        showCustomModal("Uyarı", "Lütfen e-posta adresinizi girin.");
        return;
    }
    const users = JSON.parse(localStorage.getItem('islami_app_users') || '{}');
    if (!users[email]) {
        showCustomModal("Uyarı", "Bu e-posta ile kayıtlı kullanıcı bulunamadı.");
        return;
    }
    showCustomModal("Başarılı", "📤 Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (demo).");
    closeForgotPasswordModal();
}

function sendContactMessage() {
    const msg = document.getElementById("contact-message").value.trim();
    if (!msg) {
        showCustomModal("Uyarı", "Lütfen bir mesaj yazın.");
        return;
    }
    if (msg.length > 500) {
        showCustomModal("Uyarı", "Mesaj 500 karakteri geçemez.");
        return;
    }
    const email = userState.email || 'kullanici@example.com';
    const subject = encodeURIComponent("İletişim Formu Mesajı");
    const body = encodeURIComponent(`Gönderen: ${email}\n\nMesaj:\n${msg}`);
    window.location.href = `mailto:sorunvedestek@gmail.com?subject=${subject}&body=${body}`;
    showToast("📧 Mesajınız gönderildi (e-posta istemciniz açılacak).");
    document.getElementById("contact-message").value = "";
    document.getElementById("contact-char-count").innerText = "0";
}

// ========== NAVIGATION ==========
function navigateToTab(tabName, source = null) {
    if (source) {
        policySourceScreen = source;
    }
    hideAllScreens();
    if (tabName === 'logout') {
        showCustomModal("Çıkış", `
            <p>Oturumunuzu kapatmak istediğinize emin misiniz?</p>
            <div style="display:flex; gap:10px; justify-content:center; margin-top:16px;">
                <button class="btn-primary" style="flex:1; background:var(--danger);" onclick="confirmLogout()">Evet, Çık</button>
                <button class="btn-primary muted" style="flex:1;" onclick="closeCustomModal()">Vazgeç</button>
            </div>
        `);
        return;
    }
    if (tabName === 'admin') {
        window.location.href = 'admin.html?from=admin';
        return;
    }
    document.getElementById("bottom-nav-bar").classList.remove("hidden");
    setActiveNav(tabName);

    // Sayfa değişiminde son sayfayı kaydet
    const screenMap = {
        'home': 'screen-categories',
        'results': 'screen-results',
        'settings': 'screen-settings',
        'privacy': 'screen-privacy',
        'terms': 'screen-terms',
        'user-guide': 'screen-user-guide',
        'about': 'screen-about',
        'contact': 'screen-contact',
        'favorites': 'screen-favorites',
        'bilgic': 'screen-bilgic',
        'rewards': 'screen-rewards',
        'leaderboard': 'screen-leaderboard'
    };
    if (screenMap[tabName]) {
        userState.lastPage = screenMap[tabName];
        saveUserState();
    }

    if (tabName === 'home') {
        document.getElementById("screen-categories").classList.remove("hidden");
        updateStreakDisplay();
        updateHeartsAndHints();
    } else if (tabName === 'results') {
        if (!userState.statsAdWatchedToday) {
            showAdSimulation(() => {
                userState.statsAdWatchedToday = true;
                saveUserState();
                document.getElementById("screen-results").classList.remove("hidden");
                updateStats();
            });
        } else {
            document.getElementById("screen-results").classList.remove("hidden");
            updateStats();
        }
    } else if (tabName === 'settings') {
        document.getElementById("screen-settings").classList.remove("hidden");
        const soundSelect = document.getElementById('sound-mode-select');
        if (soundSelect && userState.soundMode) {
            soundSelect.value = userState.soundMode;
        }
    } else if (tabName === 'privacy') {
        document.getElementById("screen-privacy").classList.remove("hidden");
    } else if (tabName === 'terms') {
        document.getElementById("screen-terms").classList.remove("hidden");
    } else if (tabName === 'user-guide') {
        document.getElementById("screen-user-guide").classList.remove("hidden");
    } else if (tabName === 'about') {
        document.getElementById("screen-about").classList.remove("hidden");
    } else if (tabName === 'contact') {
        document.getElementById("screen-contact").classList.remove("hidden");
    } else if (tabName === 'favorites') {
        document.getElementById("screen-favorites").classList.remove("hidden");
        renderFavorites();
    } else if (tabName === 'bilgic') {
        document.getElementById("screen-bilgic").classList.remove("hidden");
    } else if (tabName === 'rewards') {
        document.getElementById("screen-rewards").classList.remove("hidden");
        renderRewardScreen();
    } else if (tabName === 'leaderboard') {
        document.getElementById("screen-leaderboard").classList.remove("hidden");
        renderLeaderboard();
    }
}

function setActiveNav(tabName) {
    ['home', 'test', 'results', 'favorites', 'rewards', 'bilgic', 'yanlislarim', 'leaderboard'].forEach(t => {
        const btn = document.getElementById(`nav-${t}`);
        if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`nav-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
}

function goBackToDrawer() {
    openDrawerMenu();
}

function closeBilgic() {
    navigateToTab('home');
}

// ===== ÇIKIŞ ONAYI =====
function confirmLogout() {
    const modal = document.getElementById('custom-modal');
    if (modal) modal.classList.add('hidden');
    
    const rememberCheck = document.getElementById("remember-me");
    if (rememberCheck && !rememberCheck.checked) {
        localStorage.removeItem('saved_email');
        localStorage.removeItem('saved_password');
        userState.rememberMe = false;
        saveUserState();
    }
    
    // Oturum bilgilerini temizle
    userState.email = '';
    userState.uid = null;
    userState.isAdmin = false;
    userState.lastPage = 'screen-login';
    saveUserState();
    
    document.getElementById("screen-login").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.add("hidden");
    
    document.getElementById("login-email").value = '';
    document.getElementById("login-password").value = '';
    if (rememberCheck) rememberCheck.checked = false;
    
    hideAllScreens();
    document.getElementById("screen-login").classList.remove("hidden");
    
    playSound('click');
}

// ===== ŞİFRE GÖSTER/GİZLE =====
function togglePasswordVisibility(inputId, buttonElement) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        buttonElement.textContent = '🙈';
    } else {
        input.type = 'password';
        buttonElement.textContent = '👁️';
    }
}
window.togglePasswordVisibility = togglePasswordVisibility;

// ===== KATEGORİ BUTONLARI =====
function initCategoryButtons() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const categories = ['TEFSİR', 'HADİS', 'KELAM', 'TASAVVUF', 'FIKIH', 'MEZHEPLER TARİHİ', 'KURAN VE TECVİT', 'SİYER', 'DİNLER TARİHİ', 'GENEL TEKRAR'];
    const emojis = {
        'TEFSİR': '📖',
        'HADİS': '📜',
        'KELAM': '🧠',
        'TASAVVUF': '❤️',
        'FIKIH': '⚖️',
        'MEZHEPLER TARİHİ': '🌍',
        'KURAN VE TECVİT': '⭐',
        'SİYER': '🏛️',
        'DİNLER TARİHİ': '🌐',
        'GENEL TEKRAR': '📚'
    };
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.innerHTML = `${emojis[cat] || '📌'} ${cat}`;
        btn.onclick = () => {
            if (cat === 'FIKIH') {
                openFiqhSubmenu();
            } else {
                openCategoryMenu(cat);
            }
        };
        grid.appendChild(btn);
    });
}

// ===== FIKIH ALT MENÜ =====
function openFiqhSubmenu() {
    hideAllScreens();
    document.getElementById("screen-fiqh-submenu").classList.remove("hidden");
    userState.lastPage = 'screen-fiqh-submenu';
    saveUserState();
}

function goBackFromFiqhSubmenu() {
    hideAllScreens();
    document.getElementById("screen-categories").classList.remove("hidden");
    setActiveNav('home');
    userState.lastPage = 'screen-categories';
    saveUserState();
}

function openFiqhUnits() {
    currentCategory = 'FIKIH';
    if (!categoryQuestions['FIKIH'] || categoryQuestions['FIKIH'].length === 0) {
        showToast('Fıkıh kategorisinde henüz soru yok.');
        return;
    }
    if (!unlockedUnits['FIKIH']) unlockedUnits['FIKIH'] = 1;
    if (!completedUnits['FIKIH']) completedUnits['FIKIH'] = {};
    renderUnits();
    hideAllScreens();
    document.getElementById("screen-units").classList.remove("hidden");
    userState.lastPage = 'screen-units';
    saveUserState();
}

// ===== MECELLE =====
let unlockedMecelleGroup = 1;
let completedMecelleGroup = 0;
let currentMecelleGroup = 1;
let currentMecelleIndexInGroup = 0;
const MECELLE_GROUP_SIZE = 10;

function openMecelle() {
    if (!mecelleData || mecelleData.length === 0) {
        showToast('Mecelle kaideleri yükleniyor...');
        loadMecelle().then(() => {
            if (mecelleData && mecelleData.length > 0) {
                loadMecelleProgress();
                renderMecelleGroups();
                hideAllScreens();
                document.getElementById("screen-mecelle").classList.remove("hidden");
                document.getElementById("mecelle-info-text").innerText = `Toplam kaide: ${mecelleData.length} (10 grup)`;
                userState.lastPage = 'screen-mecelle';
                saveUserState();
            } else {
                showToast('Mecelle verisi yüklenemedi.');
            }
        });
        return;
    }
    loadMecelleProgress();
    renderMecelleGroups();
    hideAllScreens();
    document.getElementById("screen-mecelle").classList.remove("hidden");
    document.getElementById("mecelle-info-text").innerText = `Toplam kaide: ${mecelleData.length} (10 grup)`;
    userState.lastPage = 'screen-mecelle';
    saveUserState();
}

function renderMecelleGroups() {
    const grid = document.getElementById("mecelle-grid-container");
    if (!grid) return;
    grid.innerHTML = "";
    const totalGroups = Math.ceil(mecelleData.length / MECELLE_GROUP_SIZE);

    for (let g = 1; g <= totalGroups; g++) {
        const btn = document.createElement("button");
        btn.className = "unit-btn";
        const startIdx = (g - 1) * MECELLE_GROUP_SIZE + 1;
        const endIdx = Math.min(g * MECELLE_GROUP_SIZE, mecelleData.length);
        const isUnlocked = g <= unlockedMecelleGroup;
        const isCompleted = g <= completedMecelleGroup;

        btn.onclick = function() {
            showAdSimulation(() => {
                if (g > unlockedMecelleGroup) {
                    unlockedMecelleGroup = g;
                    if (g > 1) {
                        completedMecelleGroup = g - 1;
                    }
                    saveMecelleProgress();
                    showToast(`📜 ${startIdx}-${endIdx}. grup açıldı!`);
                    renderMecelleGroups();
                }
                openMecelleGroup(g);
            });
        };

        if (isUnlocked) {
            if (isCompleted) {
                btn.style.background = "#22c55e";
                btn.style.borderColor = "#22c55e";
                btn.style.color = "#ffffff";
                btn.innerHTML = `✅ ${startIdx}-${endIdx}`;
            } else {
                btn.innerText = `${startIdx}-${endIdx}`;
            }
        } else {
            btn.classList.add("locked");
            btn.disabled = false;
            btn.innerHTML = `🔓 ${startIdx}-${endIdx}`;
            btn.title = "Reklam izleyerek açabilirsiniz";
        }
        grid.appendChild(btn);
    }
}

function openMecelleGroup(groupNum) {
    currentMecelleGroup = groupNum;
    currentMecelleIndexInGroup = 0;
    const firstIndex = (groupNum - 1) * MECELLE_GROUP_SIZE;
    if (firstIndex < mecelleData.length) {
        openMecelleCard(firstIndex);
    } else {
        showToast('Bu grupta kaide yok.');
    }
}

function openMecelleCard(index) {
    const kaide = mecelleData[index];
    if (!kaide) return;
    const groupNum = Math.floor(index / MECELLE_GROUP_SIZE) + 1;
    const inGroupIndex = index % MECELLE_GROUP_SIZE + 1;
    const totalInGroup = Math.min(MECELLE_GROUP_SIZE, mecelleData.length - (groupNum-1)*MECELLE_GROUP_SIZE);

    hideAllScreens();
    document.getElementById("screen-mecelle-card").classList.remove("hidden");
    document.getElementById("mecelle-card-title").innerText = `${kaide.id}. Kaide`;
    document.getElementById("mecelle-card-front-arapca").innerText = kaide.arapca || '';
    document.getElementById("mecelle-card-front-turkiye").innerText = kaide.turkiye || '';
    document.getElementById("mecelle-card-back-ornek").innerText = kaide.ornek || '';
    const cardInner = document.querySelector('#mecelle-flip-card .flip-card-inner');
    if (cardInner) cardInner.style.transform = 'rotateY(0deg)';
    document.getElementById("mecelle-card-progress").innerText = `${inGroupIndex} / ${totalInGroup}`;

    document.getElementById("mecelle-prev-btn").style.display = (index > (groupNum-1)*MECELLE_GROUP_SIZE) ? 'inline-block' : 'none';
    document.getElementById("mecelle-next-btn").style.display = (index < mecelleData.length - 1) ? 'inline-block' : 'none';

    const nextBtn = document.getElementById("mecelle-next-btn");
    nextBtn.onclick = function() {
        const nextIndex = index + 1;
        if (nextIndex < mecelleData.length && Math.floor(nextIndex / MECELLE_GROUP_SIZE) === groupNum - 1) {
            openMecelleCard(nextIndex);
            playSound('click');
        } else if (nextIndex < mecelleData.length && Math.floor(nextIndex / MECELLE_GROUP_SIZE) === groupNum) {
            const nextGroup = groupNum + 1;
            showAdSimulation(() => {
                if (nextGroup > unlockedMecelleGroup) {
                    unlockedMecelleGroup = nextGroup;
                }
                completedMecelleGroup = groupNum;
                saveMecelleProgress();
                showToast(`🎉 ${groupNum}. grup tamamlandı! ${nextGroup}. grup açıldı.`);
                renderMecelleGroups();
                const newFirstIndex = (nextGroup - 1) * MECELLE_GROUP_SIZE;
                if (newFirstIndex < mecelleData.length) {
                    openMecelleCard(newFirstIndex);
                } else {
                    showAdSimulation(() => {
                        unlockedMecelleGroup = 1;
                        completedMecelleGroup = 0;
                        saveMecelleProgress();
                        showToast('🔄 Tüm kaideler tamamlandı, başa dönülüyor.');
                        renderMecelleGroups();
                        openMecelleCard(0);
                    });
                }
                playSound('success');
            });
        } else {
            showAdSimulation(() => {
                unlockedMecelleGroup = 1;
                completedMecelleGroup = 0;
                saveMecelleProgress();
                showToast('🔄 Tüm kaideler tamamlandı, başa dönülüyor.');
                renderMecelleGroups();
                openMecelleCard(0);
            });
        }
    };

    const prevBtn = document.getElementById("mecelle-prev-btn");
    prevBtn.onclick = function() {
        if (index > (groupNum-1)*MECELLE_GROUP_SIZE) {
            openMecelleCard(index - 1);
            playSound('click');
        }
    };

    const flipCard = document.getElementById("mecelle-flip-card");
    flipCard.onclick = function() {
        const inner = document.querySelector('#mecelle-flip-card .flip-card-inner');
        if (!inner) return;
        const currentTransform = inner.style.transform;
        if (currentTransform === 'rotateY(180deg)') {
            inner.style.transform = 'rotateY(0deg)';
        } else {
            inner.style.transform = 'rotateY(180deg)';
        }
        playSound('click');
    };
    
    userState.lastPage = 'screen-mecelle-card';
    saveUserState();
}

function goBackFromMecelle() {
    hideAllScreens();
    openFiqhSubmenu();
}

function goBackFromMecelleCard() {
    hideAllScreens();
    document.getElementById("screen-mecelle").classList.remove("hidden");
    renderMecelleGroups();
    userState.lastPage = 'screen-mecelle';
    saveUserState();
}

function saveMecelleProgress() {
    localStorage.setItem('mecelle_unlocked_group', unlockedMecelleGroup);
    localStorage.setItem('mecelle_completed_group', completedMecelleGroup);
}

function loadMecelleProgress() {
    const u = localStorage.getItem('mecelle_unlocked_group');
    const c = localStorage.getItem('mecelle_completed_group');
    if (u) unlockedMecelleGroup = parseInt(u) || 1;
    else unlockedMecelleGroup = 1;
    if (c) completedMecelleGroup = parseInt(c) || 0;
    else completedMecelleGroup = 0;
}

// ===== ÜNİTE SEÇİMİ =====
function openCategoryMenu(categoryName) {
    if (categoryName === 'GENEL TEKRAR') {
        const allUnlocked = [];
        Object.keys(categoryQuestions).forEach(cat => {
            const maxUnit = unlockedUnits[cat] || 1;
            const totalUnits = getUnitCount(cat);
            for (let u = 1; u <= Math.min(maxUnit, totalUnits); u++) {
                if (categoryQuestions[cat] && categoryQuestions[cat][u-1]) {
                    allUnlocked.push(...categoryQuestions[cat][u-1]);
                }
            }
        });
        if (allUnlocked.length === 0) {
            showCustomModal("Uyarı", "Henüz hiç ünite açmadınız. Önce bir kategori seçip ünite açın.");
            return;
        }
        currentCategory = "GENEL TEKRAR";
        currentQuestions = shuffleArray(allUnlocked).slice(0, 20);
        currentQuestionIndex = 0;
        isTestMode = false;
        isYanlislarimMode = false;
        isFromBilgic = false;
        generalReviewCorrectCount = 0;
        if (hearts <= 0) {
            showGameOverScreen();
            return;
        }
        document.getElementById("unit-title").innerText = "📚 GENEL TEKRAR";
        hideAllScreens();
        document.getElementById("screen-game").classList.remove("hidden");
        userState.lastPage = 'screen-game';
        saveUserState();
        renderQuestion();
        return;
    }

    currentCategory = categoryName;
    if (!categoryQuestions[categoryName] || categoryQuestions[categoryName].length === 0) {
        showToast('Bu kategoride henüz soru yok.');
        return;
    }
    if (!unlockedUnits[categoryName]) unlockedUnits[categoryName] = 1;
    if (!completedUnits[categoryName]) completedUnits[categoryName] = {};
    renderUnits();
    hideAllScreens();
    document.getElementById("screen-units").classList.remove("hidden");
    userState.lastPage = 'screen-units';
    saveUserState();
}

function renderUnits() {
    const grid = document.getElementById("unit-grid-container");
    if (!grid) return;
    grid.innerHTML = "";
    const maxUnlocked = unlockedUnits[currentCategory] || 1;
    const totalUnits = getUnitCount(currentCategory);
    document.getElementById("unit-info-text").innerText = `Toplam ünite: ${totalUnits}`;

    for (let i = 1; i <= totalUnits; i++) {
        const btn = document.createElement("button");
        btn.className = "unit-btn";
        const isCompleted = completedUnits[currentCategory] && completedUnits[currentCategory][i] === true;
        const isUnlocked = i <= maxUnlocked;
        const isNextLocked = (i === maxUnlocked + 1) && (completedUnits[currentCategory] && completedUnits[currentCategory][i-1] === true);

        if (isUnlocked) {
            btn.onclick = () => startUnit(i);
            if (isCompleted) {
                btn.style.background = "#22c55e";
                btn.style.borderColor = "#22c55e";
                btn.style.color = "#ffffff";
                btn.innerHTML = "✅ " + i;
            } else {
                btn.innerText = i;
            }
        } else if (isNextLocked) {
            btn.classList.add("locked");
            btn.disabled = false;
            btn.innerHTML = "🔓 " + i;
            btn.title = "Reklam izleyerek açabilirsiniz";
            btn.onclick = () => {
                currentUnit = i - 1;
                window._pendingUnit = i;
                hideAllScreens();
                document.getElementById("screen-victory").classList.remove("hidden");
                document.getElementById("victory-text").innerHTML = `
                    📢 ${currentCategory} - Ünite ${i} için reklam izleyerek açın!<br>
                    <span style="font-size:0.9rem; color:var(--text-muted);">Reklam izledikten sonra ünite açılacaktır.</span>
                `;
                const btn2 = document.querySelector("#screen-victory .btn-primary");
                if (btn2) {
                    btn2.innerText = "📺 Reklam İzle & Üniteyi Aç";
                    btn2.onclick = function() {
                        showAdSimulation(() => {
                            unlockedUnits[currentCategory] = i;
                            saveProgress();
                            showToast(`🎉 ${currentCategory} Ünite ${i} açıldı!`);
                            window._pendingUnit = null;
                            startUnit(i);
                        });
                    };
                }
            };
        } else {
            btn.classList.add("locked");
            btn.disabled = true;
            btn.innerHTML = "🔒 " + i;
        }
        grid.appendChild(btn);
    }
}

function openDrawerMenu() {
    document.getElementById("drawer-menu").classList.remove("hidden");
}

function closeDrawerOutside(e) {
    if (e.target.id === 'drawer-menu') {
        document.getElementById("drawer-menu").classList.add("hidden");
    }
}

function navigateToDrawer(dest) {
    document.getElementById("drawer-menu").classList.add("hidden");
    navigateToTab(dest);
}

function goBackFromUnits() {
    if (currentCategory === 'FIKIH') {
        openFiqhSubmenu();
    } else {
        hideAllScreens();
        document.getElementById("screen-categories").classList.remove("hidden");
        setActiveNav('home');
        userState.lastPage = 'screen-categories';
        saveUserState();
    }
}

function openRewardScreen() {
    navigateToTab('rewards');
}

function closeRewardScreen() {
    navigateToTab('home');
}

function updateRewardCounts() {
    const heartEl = document.getElementById("reward-heart-count");
    const hintEl = document.getElementById("reward-hint-count");
    if (heartEl) heartEl.innerText = hearts;
    if (hintEl) hintEl.innerText = userState.hintCount || 0;
}

function renderRewardScreen() {
    updateRewardCounts();
    const container = document.getElementById('reward-progress-container');
    if (!container) return;
    const filled = userState.unitCompletionCount || 0;
    let html = `
        <div class="reward-card">
            <span class="reward-icon">🎁</span>
            <p><strong>Beş Ünite Tamamla, Hediyeyi Kap!</strong></p>
            <div class="reward-progress">
    `;
    for (let i = 0; i < 5; i++) {
        html += `<div class="reward-step ${i < filled ? 'filled' : ''}">${i < filled ? '✅' : '⬜'}</div>`;
    }
    html += `</div>`;
    const disabled = filled < 5 ? 'disabled' : '';
    html += `<button class="btn-primary" id="claim-chest-btn" ${disabled} onclick="claimRewardChest()">🎁 Hediyeyi Kap (${filled}/5)</button>`;
    html += `</div>`;
    container.innerHTML = html;
}

function claimRewardChest() {
    let totalUnits = userState.unitCompletionCount + (userState.remainingUnitsForChest || 0);
    if (totalUnits < 5) {
        showToast("Henüz 5 ünite tamamlamadınız! (" + totalUnits + "/5)");
        return;
    }
    let used = 5;
    let remaining = totalUnits - used;
    userState.remainingUnitsForChest = remaining;
    userState.unitCompletionCount = 0;
    const rand = Math.random();
    let rewardType, rewardAmount;
    if (rand < 0.5) {
        rewardType = Math.random() < 0.5 ? 'heart' : 'hint';
        rewardAmount = 1;
    } else if (rand < 0.7) {
        rewardType = Math.random() < 0.5 ? 'heart' : 'hint';
        rewardAmount = 2;
    } else if (rand < 0.9) {
        rewardType = Math.random() < 0.5 ? 'heart' : 'hint';
        rewardAmount = 3;
    } else if (rand < 0.95) {
        rewardType = Math.random() < 0.5 ? 'heart' : 'hint';
        rewardAmount = 4;
    } else {
        rewardType = Math.random() < 0.5 ? 'heart' : 'hint';
        rewardAmount = 5;
    }
    let rewardText = '';
    if (rewardType === 'heart') {
        addHearts(rewardAmount);
        rewardText = `${rewardAmount} ❤️ Can kazandınız!`;
    } else {
        userState.hintCount = (userState.hintCount || 0) + rewardAmount;
        rewardText = `${rewardAmount} 💡 İpucu kazandınız!`;
    }
    saveUserState();
    showRewardClaimModal(rewardText);
    renderRewardScreen();
    updateRewardCounts();
    fireConfetti();
    playSound('success');
}

// ===== KONFETİ =====
function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = [];
    const colors = ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f', '#ffa500', '#ff69b4'];
    for (let i = 0; i < 150; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: 8,
            h: 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            vy: 2 + Math.random() * 4,
            vx: (Math.random() - 0.5) * 4,
        });
    }
    let frame = 0;
    const interval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        pieces.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.05;
            if (p.y < canvas.height) alive = true;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.w, p.h);
        });
        frame++;
        if (!alive || frame > 200) {
            clearInterval(interval);
            canvas.style.display = 'none';
        }
    }, 30);
}

// ===== FAVORİLER =====
function renderFavorites() {
    const container = document.getElementById('favorites-list');
    container.innerHTML = '';
    const favs = userState.favorites;
    if (favs.length === 0) {
        container.innerHTML = '<p class="profile-card">Henüz favori sorunuz yok.</p>';
        return;
    }
    const allQuestions = [];
    Object.keys(categoryQuestions).forEach(cat => {
        categoryQuestions[cat].forEach(unit => {
            unit.forEach(q => {
                allQuestions.push({ ...q, category: cat });
            });
        });
    });
    const grouped = {};
    favs.forEach(uid => {
        const q = allQuestions.find(q => q._uid === uid);
        if (q) {
            const cat = q.category || 'Genel';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(q);
        }
    });
    const categoryOrder = ['TEFSİR', 'HADİS', 'KELAM', 'TASAVVUF', 'FIKIH', 'MEZHEPLER TARİHİ', 'KURAN VE TECVİT', 'SİYER', 'DİNLER TARİHİ', 'GENEL TEKRAR', 'Genel'];
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
        const idxA = categoryOrder.indexOf(a);
        const idxB = categoryOrder.indexOf(b);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
    sortedCategories.forEach(cat => {
        const questions = grouped[cat];
        const header = document.createElement('div');
        header.className = 'profile-card';
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.innerHTML = `<h3>📂 ${cat} (${questions.length}) <span style="float:right;">▼</span></h3>`;
        const content = document.createElement('div');
        content.style.display = 'none';
        content.style.marginTop = '10px';
        content.style.borderTop = '1px solid var(--border)';
        content.style.paddingTop = '10px';
        questions.forEach(q => {
            const qDiv = document.createElement('div');
            qDiv.style.marginBottom = '12px';
            qDiv.style.paddingBottom = '8px';
            qDiv.style.borderBottom = '1px dashed var(--border)';
            qDiv.innerHTML = `
                <p><strong>${q.q}</strong></p>
                <p>Doğru: ${q.options[q.answer]}</p>
                <button class="btn-primary muted" onclick="removeFavorite('${q._uid}')">Favoriden Çıkar</button>
            `;
            content.appendChild(qDiv);
        });
        header.addEventListener('click', function(e) {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            const arrow = this.querySelector('span');
            if (arrow) arrow.textContent = isHidden ? '▲' : '▼';
        });
        container.appendChild(header);
        container.appendChild(content);
    });
}

function removeFavorite(uid) {
    const index = userState.favorites.indexOf(uid);
    if (index > -1) {
        userState.favorites.splice(index, 1);
        saveUserState();
        renderFavorites();
        showToast('Favoriden çıkarıldı.');
        playSound('click');
    }
}

// ===== TEST MODAL =====
function updateTestModalInfo() {
    const modal = document.getElementById('test-modal');
    if (modal.classList.contains('hidden')) return;
    const today = new Date().toISOString().slice(0,10);
    if (userState.dailyTestDate !== today) {
        userState.dailyTestDate = today;
        userState.dailyTestCount = 0;
        saveUserState();
    }
    const remaining = 1 - userState.dailyTestCount;
    const info = document.getElementById('test-modal-info');
    const startBtn = document.getElementById('test-start-btn');
    if (remaining > 0) {
        info.innerHTML = `✅ Bugün ${remaining} ücretsiz test hakkın var.`;
        startBtn.disabled = false;
    } else {
        const extra = userState.adRewardCounts.dailyTestExtra || 0;
        if (extra >= 1) {
            info.innerHTML = `📢 Reklam izledin, test başlatabilirsin. (${extra}/1 reklam)`;
            startBtn.disabled = false;
        } else {
            info.innerHTML = `📢 Bugünkü hakkın doldu. Reklam izleyerek test çözebilirsin. (0/1 reklam) <button class="btn-primary muted" onclick="watchAdForFeature('dailyTestExtra')">📺 Reklam İzle</button>`;
            startBtn.disabled = true;
        }
    }
}

function openTestModal() {
    const modal = document.getElementById('test-modal');
    modal.classList.remove('hidden');
    updateTestModalInfo();
    playSound('click');
}

function closeTestModal() {
    document.getElementById('test-modal').classList.add('hidden');
}

function closeTestModalOutside(e) {
    if (e.target.id === 'test-modal') closeTestModal();
}

function startTestFromModal() {
    const timeSelect = document.getElementById('test-time-select-modal');
    const timeLimit = parseInt(timeSelect.value);
    const today = new Date().toISOString().slice(0,10);
    if (userState.dailyTestDate !== today) {
        userState.dailyTestDate = today;
        userState.dailyTestCount = 0;
        saveUserState();
    }
    if (userState.dailyTestCount >= 1) {
        const extra = userState.adRewardCounts.dailyTestExtra || 0;
        if (extra < 1) {
            showToast('Lütfen önce reklam izleyin.');
            return;
        } else {
            userState.adRewardCounts.dailyTestExtra = (userState.adRewardCounts.dailyTestExtra || 0) - 1;
            saveUserState();
        }
    } else {
        userState.dailyTestCount += 1;
        saveUserState();
    }
    startTestInternal(timeLimit);
    closeTestModal();
    playSound('click');
}

// ========== PAYLAŞ ==========
function shareApp() {
    const modalBody = `
        <p>Uygulamayı paylaşarak <strong>5 can</strong> kazanın!</p>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
            <button class="btn-primary" style="background:#25D366;" onclick="shareVia('whatsapp')">📱 WhatsApp ile Paylaş</button>
            <button class="btn-primary" style="background:#34B7F1;" onclick="shareVia('telegram')">✈️ Telegram ile Paylaş</button>
            <button class="btn-primary" style="background:#1DA1F2;" onclick="shareVia('twitter')">🐦 Twitter ile Paylaş</button>
            <button class="btn-primary" style="background:#1877F2;" onclick="shareVia('facebook')">📘 Facebook ile Paylaş</button>
            <button class="btn-primary" style="background:#EA4335;" onclick="shareVia('email')">📧 E-posta ile Paylaş</button>
            <button class="btn-primary" style="background:#6c757d;" onclick="shareVia('copy')">📋 Linki Kopyala</button>
        </div>
    `;
    showCustomModal("📲 Uygulamayı Paylaş", modalBody);
}

function shareVia(method) {
    const url = window.location.href;
    const text = "İslami İlimler Soru Bankası ile kendini geliştir! 📚";
    let shareUrl = '';
    switch(method) {
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
            break;
        case 'email':
            shareUrl = `mailto:?subject=${encodeURIComponent('İslami İlimler Soru Bankası')}&body=${encodeURIComponent(text + '\n' + url)}`;
            break;
        case 'copy':
            navigator.clipboard.writeText(text + ' ' + url).then(() => {
                showToast('📋 Link kopyalandı!');
                giveShareReward();
            }).catch(() => {
                const dummy = document.createElement('textarea');
                dummy.value = text + ' ' + url;
                document.body.appendChild(dummy);
                dummy.select();
                document.execCommand('copy');
                document.body.removeChild(dummy);
                showToast('📋 Link kopyalandı!');
                giveShareReward();
            });
            return;
        default:
            return;
    }
    if (shareUrl) {
        window.open(shareUrl, '_blank');
        giveShareReward();
    }
}

function giveShareReward() {
    if (userState.shareRewardClaimed) {
        showToast("Bu ödülü zaten aldınız!");
        return;
    }
    addHearts(5);
    userState.shareRewardClaimed = true;
    saveUserState();
    updateRewardCounts();
    showToast('🎉 Paylaşım başarılı! 5 can kazandın.');
    closeCustomModal();
    playSound('success');
}

// ========== LİDERLİK ==========
function renderLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    if (!container) return;
    const data = getLeaderboardData();
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="profile-card">Henüz liderlik verisi yok.</p>';
        return;
    }
    let html = '<div style="margin-top:16px;">';
    data.forEach((item, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        html += `
            <div class="leaderboard-item">
                <span class="rank">${medal}</span>
                <span class="name">${item.name}</span>
                <span class="score">${item.score} puan</span>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ========== SORU BİLDİR ==========
function reportQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    if (!q) return;
    showCustomModal("🚨 Soru Bildir", `
        <p>Bu soruyu veya cevabını bildirmek istediğinize emin misiniz?</p>
        <p><strong>${q.q}</strong></p>
        <div style="display:flex; gap:10px; justify-content:center; margin-top:16px;">
            <button class="btn-primary" style="flex:1; background:var(--accent);" onclick="closeCustomModal(); confirmReport('${encodeURIComponent(q.q)}')">Evet, Bildir</button>
            <button class="btn-primary muted" style="flex:1;" onclick="closeCustomModal()">Vazgeç</button>
        </div>
    `);
    playSound('click');
}

function confirmReport(questionText) {
    const subject = encodeURIComponent("Soru Bildirimi");
    const body = encodeURIComponent(`Bildirilen Soru: ${decodeURIComponent(questionText)}\n\nKullanıcı: ${userState.nickname || 'İsimsiz'}\nE-posta: ${userState.email || 'Belirtilmemiş'}`);
    window.location.href = `mailto:sorunvedestek@gmail.com?subject=${subject}&body=${body}`;
    showToast('📧 Soru bildirimi gönderildi.');
    playSound('click');
}

// ===== CAN/İPUCU GÖSTERGESİ =====
function updateHeartsAndHints() {
    const heartsEl = document.getElementById('header-hearts');
    const hintsEl = document.getElementById('header-hints');
    if (heartsEl) heartsEl.textContent = hearts;
    if (hintsEl) hintsEl.textContent = userState.hintCount || 0;
}

// ===== GÜNLÜK GİRİŞ ÖDÜLÜ (Artık ilk girişte veriyor) =====
function checkDailyLaunchAd() {
    const today = new Date().toISOString().slice(0,10);
    // Eğer bugün ilk kez giriş yapıyorsa
    if (userState.lastLaunchDate !== today) {
        userState.lastLaunchDate = today;
        userState.dailyLaunchCount = 1;
        // İlk girişte +1 Can hediye et
        addHearts(1);
        showToast('🎁 Günlük giriş hediyesi: +1 Can kazandın!');
        updateHeartsAndHints();
        saveUserState();
    } else {
        // Aynı gün içinde tekrar giriş yapıyorsa sayaç artsın ama ödül vermesin
        userState.dailyLaunchCount = (userState.dailyLaunchCount || 0) + 1;
        saveUserState();
    }
}

// ===== REKLAM FONKSİYONLARI =====
function showInterstitialAd(onComplete) {
    showAdSimulation(onComplete);
}

function showRewardedAd(rewardType, onComplete) {
    showAdSimulation(() => {
        if (rewardType === 'heart') {
            addHearts(1);
            showToast('❤️ +1 Can kazandın!');
        } else if (rewardType === 'hint') {
            userState.hintCount = (userState.hintCount || 0) + 1;
            showToast('💡 +1 İpucu kazandın!');
        }
        saveUserState();
        updateRewardCounts();
        updateHeartsAndHints();
        if (onComplete) onComplete();
    });
}

function watchAdForHeart() {
    showRewardedAd('heart', () => {
        if (document.getElementById('screen-gameover') && !document.getElementById('screen-gameover').classList.contains('hidden')) {
            resumeGameAfterAd();
        }
        playSound('success');
    });
}

function watchAdForHint() {
    showRewardedAd('hint', () => {
        updateHintBadge();
        playSound('success');
    });
}

function watchAdForFeature(type) {
    showAdSimulation(() => {
        if (!userState.adRewardCounts[type]) userState.adRewardCounts[type] = 0;
        userState.adRewardCounts[type] += 1;
        if (type === 'hardQuestion') {
            userState.featureUnlocked.hardQuestion = true;
            showToast('🔓 Zor soru modu açıldı!');
            startHardQuestion();
        } else if (type === 'wrongAnalysis') {
            userState.featureUnlocked.wrongAnalysis = true;
            showToast('📊 Yanlış analiz açıldı!');
            showWrongAnalysisUI();
        } else if (type === 'wrongRetry') {
            userState.featureUnlocked.wrongRetry = true;
            showToast('🔄 Hatalı soru tekrarı aktif!');
            startWrongRetry();
        } else if (type === 'dailyTestExtra') {
            userState.adRewardCounts.dailyTestExtra = (userState.adRewardCounts.dailyTestExtra || 0) + 1;
            showToast('📢 Test hakkı kazandın!');
            if (typeof updateTestModalInfo === 'function') {
                updateTestModalInfo();
            }
        }
        saveUserState();
        playSound('success');
    });
}

// ===== WEB İNDİR BUTONU =====
function downloadApp() {
    showCustomModal("📱 Uygulama Yakında!", `
        <p style="font-size:1.2rem; margin:16px 0;">Uygulama şu an geliştirme aşamasındadır.</p>
        <p style="font-size:1.1rem; color:var(--accent); font-weight:700;">📲 Yakında mobil mağazalarda yayınlanacaktır.</p>
        <p style="font-size:0.9rem; color:var(--text-muted);">Bizi takipte kalın!</p>
        <button class="btn-primary" style="background:var(--accent); margin-top:16px;" onclick="closeCustomModal()">Tamam</button>
    `);
}

// ========== ÖZEL MODAL FONKSİYONLARI ==========
function showCustomModal(title, bodyHTML) {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('custom-modal-title');
    const bodyEl = document.getElementById('custom-modal-body');
    if (!modal || !titleEl || !bodyEl) return;
    titleEl.innerText = title;
    bodyEl.innerHTML = bodyHTML;
    modal.classList.remove('hidden');
    playSound('click');
}

function closeCustomModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) modal.classList.add('hidden');
}

function closeCustomModalOutside(e) {
    if (e.target.id === 'custom-modal') closeCustomModal();
}

function showRewardClaimModal(rewardText) {
    const modal = document.getElementById('reward-claim-modal');
    const body = document.getElementById('reward-claim-body');
    if (!modal || !body) return;
    body.innerHTML = `
        <p style="font-size:1.6rem; font-weight:800; color:#f59e0b;">🎁 Tebrikler!</p>
        <p style="font-size:1.3rem; margin:16px 0;">${rewardText}</p>
        <button class="btn-primary" style="background:var(--accent);" onclick="closeRewardClaimModal()">Tamam</button>
    `;
    modal.classList.remove('hidden');
}

function closeRewardClaimModal() {
    document.getElementById('reward-claim-modal').classList.add('hidden');
}

function closeRewardClaimModalOutside(e) {
    if (e.target.id === 'reward-claim-modal') closeRewardClaimModal();
}

// ========== DOMCONTENTLOADED ==========
document.addEventListener('DOMContentLoaded', function() {
    // Önce state'i yükle
    loadUserState();
    loadProgress();
    
    // Hatırlanan şifreyi doldur
    const savedEmail = localStorage.getItem('saved_email');
    const savedPass = localStorage.getItem('saved_password');
    const rememberMe = userState.rememberMe;
    
    if (savedEmail && rememberMe) {
        const emailField = document.getElementById("login-email");
        if (emailField) emailField.value = savedEmail;
        const passField = document.getElementById("login-password");
        if (passField) passField.value = savedPass;
        const rememberCheck = document.getElementById("remember-me");
        if (rememberCheck) rememberCheck.checked = true;
    }

    // Kullanıcı giriş yapmışsa ve oturum geri yüklenebiliyorsa
    if (userState && userState.email) {
        const restored = restoreUserSession();
        if (!restored) {
            // Eğer geri yüklenemezse ana sayfaya git
            hideAllScreens();
            document.getElementById("screen-categories").classList.remove("hidden");
            document.getElementById("bottom-nav-bar").classList.remove("hidden");
            setActiveNav('home');
            initCategoryButtons();
            updateStreakDisplay();
            showBannerAd();
            updateHeartsAndHints();
        }
        checkDailyLaunchAd(); // Günlük giriş ödülünü kontrol et
    } else {
        hideAllScreens();
        document.getElementById("screen-login").classList.remove("hidden");
        document.getElementById("bottom-nav-bar").classList.add("hidden");
    }

    // İletişim formu karakter sayacı
    const textarea = document.getElementById('contact-message');
    if (textarea) {
        textarea.addEventListener('input', function() {
            const count = document.getElementById('contact-char-count');
            if (count) count.innerText = this.value.length;
        });
    }

    // Ses modu seçici
    const soundSelect = document.getElementById('sound-mode-select');
    if (soundSelect && userState.soundMode) {
        soundSelect.value = userState.soundMode;
    }

    // Banner reklam göster (gizli olduğu için etkisiz)
    if (userState && userState.email) {
        showBannerAd();
    }

    // Web indir butonu kontrolü
    const downloadBtn = document.getElementById('web-download-btn');
    if (downloadBtn) {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
            downloadBtn.style.display = 'block';
        } else {
            downloadBtn.style.display = 'none';
        }
    }
});

// Mecelle ilerlemesini yükle
loadMecelleProgress();
// Sayfa yüklendiğinde hafızadaki mail ve şifreyi otomatik doldurur
// Sayfa yüklendiğinde kaydedilen bilgileri alanlara doldur
document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    const rememberCheckbox = document.getElementById('remember-me');

    // E-postayı her zaman getir ve yaz
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }

    // Şifreyi sadece daha önce "Şifreyi Hatırla" seçildiyse getir
    const savedPass = localStorage.getItem('saved_password');
    if (savedPass && passInput) {
        passInput.value = savedPass;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
});

function goBackFromPolicy() {
    if (policySourceScreen === 'register') {
        hideAllScreens();
        document.getElementById("screen-register")?.classList.remove("hidden");
        policySourceScreen = null;
    } else {
        navigateToTab('home');
    }
}
