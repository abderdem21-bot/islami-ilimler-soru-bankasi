// ========== SETTINGS ==========
function changeTheme(primaryColor, hoverColor, accentColor) {
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-hover', hoverColor);
    document.documentElement.style.setProperty('--accent', accentColor);
    const backBtns = document.querySelectorAll('.back-btn');
    backBtns.forEach(btn => {
        btn.style.borderColor = primaryColor;
    });
    const navBg = lightenColor(primaryColor, 0.8);
    document.documentElement.style.setProperty('--bottom-nav-bg', navBg);
    showToast("Uygulama teması başarıyla değiştirildi!");
    playSound('click');
}

function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + Math.floor(255 * percent));
    const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.floor(255 * percent));
    const b = Math.min(255, (num & 0x0000FF) + Math.floor(255 * percent));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function toggleDarkMode(checkbox) {
    if (checkbox.checked) {
        document.body.classList.add('dark-mode');
        showToast("Karanlık mod aktif edildi.");
    } else {
        document.body.classList.remove('dark-mode');
        showToast("Karanlık mod kapatıldı.");
    }
    playSound('click');
}

function toggleNotifications(checkbox) {
    showToast(checkbox.checked ? "Bildirimler açıldı." : "Bildirimler kapatıldı.");
    playSound('click');
}

function changePassword() {
    const oldP = document.getElementById("old-pass").value;
    const newP = document.getElementById("new-pass").value;
    const newPConfirm = document.getElementById("new-pass-confirm").value;
    if (!oldP || !newP || !newPConfirm) {
        showCustomModal("Uyarı", "Lütfen tüm alanları doldurun!");
        return;
    }
    if (newP !== newPConfirm) {
        showCustomModal("Uyarı", "Yeni şifreler eşleşmiyor!");
        return;
    }
    if (oldP !== userState.password) {
        showCustomModal("Uyarı", "Mevcut şifre yanlış.");
        return;
    }
    userState.password = newP;
    saveUserState();
    showToast("Şifreniz başarıyla güncellendi!");
    document.getElementById("old-pass").value = "";
    document.getElementById("new-pass").value = "";
    document.getElementById("new-pass-confirm").value = "";
    playSound('success');
}

function clearFavorites() {
    showConfirmModal("Favorileri Temizle", "Tüm favorileri silmek istediğinize emin misiniz?", () => {
        userState.favorites = [];
        saveUserState();
        showToast('⭐ Favoriler temizlendi.');
        playSound('click');
    });
}

function deleteAccount() {
    showCustomModal('⚠️ Hesabı Sil', `
        <p style="font-size:1.1rem; margin-bottom:20px;">Hesabınızı kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz. Tüm verileriniz kaybolacaktır.</p>
        <p style="color:var(--danger); font-weight:700;">Emin misiniz?</p>
        <div style="display:flex; gap:10px; justify-content:center;">
            <button class="btn-primary" style="flex:1; background:var(--danger);" onclick="confirmDeleteAccount()">Evet, Sil</button>
            <button class="btn-primary muted" style="flex:1;" onclick="closeCustomModal()">Vazgeç</button>
        </div>
    `);
    playSound('click');
}

function confirmDeleteAccount() {
    closeCustomModal();
    showConfirmModal("Son Uyarı", "Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.", () => {
        localStorage.removeItem('islami_soru_bankasi_v1');
        localStorage.removeItem('islami_user_state');
        localStorage.removeItem('admin_custom_questions');
        unlockedUnits = {};
        completedUnits = {};
        totalSolvedCount = 0;
        categoryStats = {};
        userState = {
            email: '',
            nickname: '',
            password: '',
            adRewardCounts: { hardQuestion: 0, hint: 0, wrongAnalysis: 0, wrongRetry: 0, dailyTestExtra: 0 },
            dailyTestDate: null,
            dailyTestCount: 0,
            hintCount: 0,
            featureUnlocked: { hardQuestion: false, hint: false, wrongAnalysis: false, wrongRetry: false },
            favorites: [],
            wrongQuestions: [],
            vitalCardIndex: 0,
            hearts: 3,
            lastHeartReset: null,
            shareRewardClaimed: false,
            statsAdWatchedToday: false,
            statsAdDate: null,
            streakCount: 0,
            lastStreakDate: null,
            leaderboardScore: 0,
            soundMode: 'sound'
        };
        showToast("Hesabınız silindi.");
        navigateToTab('logout');
        playSound('click');
    });
}

// ========== ÖZEL MODAL ==========
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
    document.getElementById('custom-modal').classList.add('hidden');
}

function closeCustomModalOutside(e) {
    if (e.target.id === 'custom-modal') closeCustomModal();
}

function showConfirmModal(title, message, onConfirm) {
    showCustomModal(title, `
        <p>${message}</p>
        <div style="display:flex; gap:10px; justify-content:center; margin-top:16px;">
            <button class="btn-primary" style="flex:1; background:var(--accent);" onclick="closeCustomModal(); if(typeof onConfirm === 'function') onConfirm();">Evet</button>
            <button class="btn-primary muted" style="flex:1;" onclick="closeCustomModal()">Hayır</button>
        </div>
    `);
}