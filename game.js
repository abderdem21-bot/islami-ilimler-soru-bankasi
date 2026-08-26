// ========== GAME LOGIC ==========

// ----- REKLAM DEPOSU -----
function reklamlariDepola() {
    if (adDeposu.length >= MAX_AD_DEPO) return;
    fetch('reklamlar.json')
        .then(res => {
            if (!res.ok) throw new Error('Reklam dosyası bulunamadı');
            return res.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                const yeni = data.filter(r => !adDeposu.some(d => d.id === r.id));
                adDeposu.push(...yeni.slice(0, MAX_AD_DEPO - adDeposu.length));
            }
        })
        .catch(() => {});
}

// ===== ADMOB KONTROLÜ (Web / Mobil) =====
function showAdMobIfAvailable() {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        console.log("📱 AdMob reklamı gösteriliyor (mobil)");
    } else {
        console.log("🌐 Web ortamı – AdMob devre dışı");
    }
}

function depodanReklamGoster(callback) {
    if (adDeposu.length === 0) {
        reklamlariDepola();
        if (adDeposu.length === 0) {
            // ❌ UYARI KALDIRILDI - Reklam yoksa doğrudan devam et
            console.warn("📡 Reklam deposu boş. İçeriğe doğrudan yönlendiriliyor.");
            if (callback) callback();
            return;
        }
    }
    const ad = adDeposu.shift();
    showAdSimulationWithContent(ad, callback);
    setTimeout(() => reklamlariDepola(), 1000);
}

// ❌ showFallbackAd fonksiyonu TAMAMEN KALDIRILDI

function showAdSimulationWithContent(ad, callback) {
    const modal = document.createElement('div');
    modal.id = 'ad-simulation-modal';
    modal.style.cssText = `
        position: absolute; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.8); z-index:50;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        color: white; font-size: 1.2rem; backdrop-filter: blur(4px);
    `;
    modal.innerHTML = `
        <div style="text-align:center; max-width:300px;">
            <div style="font-size: 3rem; margin-bottom: 20px;">📺</div>
            <p><strong>${ad.content || 'Reklam'}</strong></p>
            <div style="width: 200px; height: 4px; background: #333; margin: 20px auto; border-radius: 4px;">
                <div id="ad-progress-bar" style="width:0%; height:100%; background: #f59e0b; border-radius: 4px; transition: width 0.1s;"></div>
            </div>
            <p style="font-size: 0.8rem; color: #aaa;">3 saniye sonra devam edilecek</p>
        </div>
    `;
    document.querySelector('.container').appendChild(modal);

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        const bar = document.getElementById('ad-progress-bar');
        if (bar) bar.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            if (modal.parentNode) modal.remove();
            if (callback) callback();
        }
    }, 300);
}

function showAdSimulation(callback) {
    depodanReklamGoster(callback);
}

// ----- OYUN -----
let remainingTime = 0;
let totalTime = 0;
let timerInterval = null;
let generalReviewCorrectCount = 0;

let lastTestResult = null;

function startUnit(unitNum, forceStart = false) {
    const maxUnlocked = unlockedUnits[currentCategory] || 1;
    const totalUnits = getUnitCount(currentCategory);
    if (totalUnits === 0) {
        showToast('Bu kategoride henüz soru yok.');
        return;
    }
    // Döngü: eğer unitNum > totalUnits ise reklam izleyip 1. üniteye dön
    if (unitNum > totalUnits) {
        showAdSimulation(() => {
            startUnit(1, true);
        });
        return;
    }
    const prevUnitCompleted = completedUnits[currentCategory] && completedUnits[currentCategory][unitNum - 1] === true;
    const isCompleted = completedUnits[currentCategory] && completedUnits[currentCategory][unitNum] === true;

    if (isCompleted && !forceStart) {
        showAdSimulation(() => {
            startUnit(unitNum, true);
        });
        return;
    }

    if (unitNum <= maxUnlocked) {
        currentUnit = unitNum;
        currentQuestionIndex = 0;
        isAnswered = false;
        isTestMode = false;
        isYanlislarimMode = false;
        isFromBilgic = false;
        clearInterval(timerInterval);
        document.getElementById("timer-display").innerText = '';

        const pool = categoryQuestions[currentCategory];
        if (pool && pool[unitNum - 1]) {
            currentQuestions = pool[unitNum - 1].slice(0, 20);
        } else {
            currentQuestions = [];
            showToast('Bu ünitede soru bulunamadı.');
            return;
        }

        if (hearts <= 0) {
            showGameOverScreen();
            return;
        }

        document.getElementById("unit-title").innerText = `${currentCategory} - Ünite ${unitNum}`;
        hideAllScreens();
        document.getElementById("screen-game").classList.remove("hidden");
        document.getElementById("bottom-nav-bar").classList.remove("hidden");
        renderQuestion();
        return;
    }

    if (unitNum === maxUnlocked + 1 && prevUnitCompleted) {
        currentUnit = unitNum - 1;
        window._pendingUnit = unitNum;
        hideAllScreens();
        document.getElementById("screen-victory").classList.remove("hidden");
        document.getElementById("bottom-nav-bar").classList.remove("hidden");
        document.getElementById("victory-text").innerHTML = `
            📢 ${currentCategory} - Ünite ${unitNum} için reklam izleyerek açın!<br>
            <span class="subtitle-text">Reklam izledikten sonra ünite açılacaktır.</span>
        `;
        const btn = document.querySelector("#screen-victory .btn-primary");
        if (btn) {
            btn.innerText = "📺 Reklam İzle & Üniteyi Aç";
            btn.onclick = function() {
                showAdSimulation(() => {
                    unlockedUnits[currentCategory] = unitNum;
                    saveProgress();
                    showToast(`🎉 ${currentCategory} Ünite ${unitNum} açıldı!`);
                    startUnit(unitNum);
                    window._pendingUnit = null;
                });
            };
        }
        return;
    }

    showCustomModal("Uyarı", "Bu ünite henüz açılmamış!");
}

function renderQuestion() {
    isAnswered = false;
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById("question-text").innerText = q.q;
    document.getElementById("progress-display").innerText = `Soru: ${currentQuestionIndex + 1} / ${currentQuestions.length}`;

    if (isYanlislarimMode || isFromBilgic) {
        document.getElementById("timer-display").innerText = '';
        clearInterval(timerInterval);
    }

    const optsContainer = document.getElementById("options-container");
    optsContainer.innerHTML = "";

    q.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.setAttribute("aria-label", `Seçenek ${idx + 1}: ${opt}`);
        btn.onclick = () => handleOptionClick(idx, btn);
        optsContainer.appendChild(btn);
    });

    let favBtn = document.getElementById('favorite-btn');
    if (!favBtn) {
        favBtn = document.createElement('button');
        favBtn.id = 'favorite-btn';
        favBtn.className = 'btn-primary muted';
        favBtn.style.marginTop = '10px';
        document.getElementById('options-container').parentNode.appendChild(favBtn);
    }
    favBtn.innerText = '⭐ Favorilere Ekle';
    favBtn.onclick = () => toggleFavorite(q);
    updateFavoriteButton(q._uid);

    let prevBtn = document.getElementById('prev-question-btn');
    if (!prevBtn) {
        prevBtn = document.createElement('button');
        prevBtn.id = 'prev-question-btn';
        prevBtn.className = 'btn-primary muted';
        prevBtn.style.marginTop = '10px';
        document.getElementById('options-container').parentNode.appendChild(prevBtn);
    }
    prevBtn.innerText = '⏪ Önceki Soru';
    prevBtn.onclick = goToPreviousQuestion;
    if (currentQuestionIndex === 0) {
        prevBtn.style.opacity = '0.4';
        prevBtn.style.pointerEvents = 'none';
    } else {
        prevBtn.style.opacity = '1';
        prevBtn.style.pointerEvents = 'auto';
    }

    updateHintBadge();
    
    // Soru altı reklamı göster (AdSense aktifse)
    if (typeof window.showQuestionAd === 'function') {
        window.showQuestionAd();
    }
}

function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
        playSound('click');
    }
}

function updateHintBadge() {
    const hintBtn = document.getElementById('hint-btn-header');
    if (!hintBtn) return;
    const count = userState.hintCount || 0;
    hintBtn.innerText = `💡 ${count}`;
    hintBtn.title = `${count} ipucu kaldı`;
    if (count <= 0) {
        hintBtn.style.opacity = '0.5';
    } else {
        hintBtn.style.opacity = '1';
    }
}

function handleOptionClick(selectedIndex, btnElement) {
    if (isAnswered) return;
    isAnswered = true;

    const q = currentQuestions[currentQuestionIndex];
    const allBtns = document.querySelectorAll(".option-btn");

    const category = q.category || 'Genel';
    if (!categoryStats[category]) categoryStats[category] = { solved: 0, correct: 0 };
    categoryStats[category].solved++;
    totalSolvedCount++;

    allBtns.forEach(btn => btn.disabled = true);

    if (selectedIndex === q.answer) {
        btnElement.classList.add("correct");
        categoryStats[category].correct++;
        if (isTestMode) testCorrectCount++;
        if (currentCategory === "GENEL TEKRAR") {
            generalReviewCorrectCount++;
        }
        updateLeaderboard(1);
        playSound('success');
        setTimeout(() => {
            nextQuestion();
        }, 800);
    } else {
        btnElement.classList.add("wrong");
        allBtns[q.answer].classList.add("correct");

        if (!userState.wrongQuestions.some(wq => wq._uid === q._uid)) {
            userState.wrongQuestions.push({ ...q });
            saveUserState();
        }

        addHearts(-1);
        updateHearts();
        saveProgress();

        if (hearts <= 0) {
            clearInterval(timerInterval);
            gameResumeData = {
                questions: currentQuestions,
                index: currentQuestionIndex,
                category: currentCategory,
                unit: currentUnit,
                isTestMode: isTestMode,
                isYanlislarimMode: isYanlislarimMode,
                remainingTime: remainingTime,
                totalTime: totalTime,
            };
            showGameOverScreen();
            return;
        }

        setTimeout(() => {
            nextQuestion();
        }, 1200);
    }
    updateStats();
    saveProgress();
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= currentQuestions.length) {
        if (currentCategory === "GENEL TEKRAR") {
            showGeneralReviewResult();
            return;
        }

        if (isFromBilgic) {
            showAdSimulation(() => {
                openZorSoruContentDirect();
            });
            return;
        }

        if (isTestMode) {
            clearInterval(timerInterval);
            endTest(false);
            return;
        }

        if (isYanlislarimMode) {
            showTestResult(testCorrectCount, testQuestions.length, testQuestions.length - testCorrectCount, Math.round((testCorrectCount / testQuestions.length) * 100), false);
            return;
        }

        if (!completedUnits[currentCategory]) completedUnits[currentCategory] = {};
        completedUnits[currentCategory][currentUnit] = true;
        saveProgress();

        userState.unitCompletionCount = (userState.unitCompletionCount || 0) + 1;
        saveUserState();

        hideAllScreens();
        document.getElementById("screen-victory").classList.remove("hidden");
        document.getElementById("bottom-nav-bar").classList.remove("hidden");
        document.getElementById("victory-text").innerHTML = `
            🎉 Tebrikler! ${currentCategory} - Ünite ${currentUnit} tamamlandı!<br>
            <span class="subtitle-text">Bir sonraki üniteye geçmek için reklam izleyin.</span>
        `;
        const btn = document.querySelector("#screen-victory .btn-primary");
        if (btn) {
            btn.innerText = "📺 Reklam İzle & Üniteyi Aç";
            btn.onclick = function() {
                showAdSimulation(() => {
                    unlockedUnits[currentCategory] = currentUnit + 1;
                    saveProgress();
                    showToast(`🎉 ${currentCategory} Ünite ${currentUnit+1} açıldı!`);
                    startUnit(currentUnit + 1);
                    window._pendingUnit = null;
                });
            };
        }
        playSound('success');
    } else {
        renderQuestion();
    }
}

function showGeneralReviewResult() {
    const total = currentQuestions.length;
    const correct = generalReviewCorrectCount;
    const wrong = total - correct;
    const percent = Math.round((correct / total) * 100);

    userState.unitCompletionCount = (userState.unitCompletionCount || 0) + 1;
    saveUserState();

    hideAllScreens();
    document.getElementById("screen-test-result").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.remove("hidden");
    document.getElementById("test-result-text").innerHTML = `
        <p style="font-size:1.5rem; font-weight:800; margin-bottom:16px;">📚 Genel Tekrar Tamamlandı!</p>
        <p>✅ Doğru: <strong>${correct}</strong></p>
        <p>❌ Yanlış: <strong>${wrong}</strong></p>
        <p>📈 Başarı Oranı: <strong>%${percent}</strong></p>
        <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
        </div>
        <button class="btn-primary" onclick="restartGeneralReview()" style="margin-top:20px;">🔄 Tekrar Dene (reklam)</button>
        <button class="btn-primary muted" onclick="navigateToTab('home')" style="margin-top:10px;">Ana Sayfaya Dön</button>
    `;
    // Sonuç ekranı reklamını göster
    if (typeof window.showResultAd === 'function') {
        window.showResultAd();
    }
    generalReviewCorrectCount = 0;
    playSound('success');
}

function restartGeneralReview() {
    showAdSimulation(() => {
        openCategoryMenu('GENEL TEKRAR');
    });
}

function updateHearts() {
    const el = document.getElementById("hearts-display");
    if (el) el.innerText = "❤️ " + hearts;
}

function startTestInternal(timeLimit) {
    const allPool = [];
    Object.keys(categoryQuestions).forEach(cat => {
        if (categoryQuestions[cat] && categoryQuestions[cat].length > 0) {
            categoryQuestions[cat].forEach(unit => {
                unit.forEach(q => {
                    allPool.push({ ...q, category: cat });
                });
            });
        }
    });
    if (allPool.length === 0) {
        showCustomModal("Uyarı", "Henüz hiç soru yüklenmedi. Lütfen kategorileri kontrol edin.");
        return;
    }
    const selected = shuffleArray(allPool).slice(0, 20);
    testQuestions = selected;
    testCorrectCount = 0;
    isTestMode = true;
    isYanlislarimMode = false;
    isFromBilgic = false;
    currentQuestions = testQuestions;
    currentQuestionIndex = 0;
    if (hearts <= 0) {
        showGameOverScreen();
        return;
    }
    document.getElementById("unit-title").innerText = "📝 GENEL TEST";
    hideAllScreens();
    document.getElementById("screen-game").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.remove("hidden");
    startTimer(timeLimit);
    renderQuestion();
}

function startTimer(minutes) {
    totalTime = minutes * 60;
    remainingTime = totalTime;
    const timerEl = document.getElementById("timer-display");
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        remainingTime--;
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            endTest(true);
            return;
        }
        const mins = Math.floor(remainingTime / 60);
        const secs = remainingTime % 60;
        timerEl.innerText = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function endTest(timeUp = false) {
    clearInterval(timerInterval);
    isTestMode = false;
    const correct = testCorrectCount;
    const total = testQuestions.length;
    const wrong = total - correct;
    const percent = Math.round((correct / total) * 100);

    userState.unitCompletionCount = (userState.unitCompletionCount || 0) + 1;
    userState.totalTestsCompleted = (userState.totalTestsCompleted || 0) + 1;
    saveUserState();

    showTestResult(correct, total, wrong, percent, timeUp);
    playSound('success');
}

function showTestResult(correct, total, wrong, percent, timeUp) {
    lastTestResult = { correct, total, wrong, percent, timeUp };

    hideAllScreens();
    document.getElementById("screen-test-result").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.remove("hidden");

    document.getElementById("test-result-text").innerHTML = `
        <p style="font-size: 1.5rem; font-weight: 800; margin-bottom: 16px;">${timeUp ? '⏰ Süre Bitti!' : '🎉 Test Tamamlandı!'}</p>
        <p>✅ Doğru: <strong>${correct}</strong></p>
        <p>❌ Yanlış: <strong>${wrong}</strong></p>
        <p>📈 Başarı Oranı: <strong>%${percent}</strong></p>
        <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
        </div>
        <button class="btn-primary" onclick="watchAdForFeature('wrongAnalysis')">📊 Yanlış Analiz (reklam)</button>
        <button class="btn-primary" onclick="watchAdForFeature('wrongRetry')">🔄 Hatalı Soru Tekrarı (reklam)</button>
        <button class="btn-primary muted" onclick="navigateToTab('home')" style="margin-top:10px;">Ana Sayfaya Dön</button>
    `;
    
    // Sonuç ekranı reklamını göster
    if (typeof window.showResultAd === 'function') {
        window.showResultAd();
    }
}

function showWrongAnalysisUI() {
    if (userState.wrongQuestions.length === 0) {
        showToast('Hiç yanlış sorunuz yok.');
        return;
    }
    const reversed = [...userState.wrongQuestions].reverse();
    let html = '<h3>Yanlış Yapılan Sorular ve Çözümleri (En Yeni En Başta)</h3>';
    reversed.forEach((q, idx) => {
        html += `<div class="profile-card"><p><strong>${idx+1}. Soru:</strong> ${q.q}</p>`;
        html += `<p><strong>Doğru Cevap:</strong> ${q.options[q.answer]}</p>`;
        html += `</div>`;
    });
    html += `<button class="btn-primary muted" onclick="showTestResult(lastTestResult.correct, lastTestResult.total, lastTestResult.wrong, lastTestResult.percent, lastTestResult.timeUp)" style="margin-top:20px;">⬅️ Geri</button>`;

    document.getElementById('test-result-text').innerHTML = html;
    hideAllScreens();
    document.getElementById('screen-test-result').classList.remove('hidden');
    document.getElementById('bottom-nav-bar').classList.remove('hidden');
    playSound('click');
}

function resumeGameAfterAd() {
    if (!gameResumeData) {
        navigateToTab('home');
        return;
    }
    currentQuestions = gameResumeData.questions;
    currentQuestionIndex = gameResumeData.index;
    currentCategory = gameResumeData.category;
    currentUnit = gameResumeData.unit;
    isTestMode = gameResumeData.isTestMode;
    isYanlislarimMode = gameResumeData.isYanlislarimMode;
    const savedRemaining = gameResumeData.remainingTime || 0;
    const savedTotal = gameResumeData.totalTime || 0;
    gameResumeData = null;

    hideAllScreens();
    document.getElementById("screen-game").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.remove("hidden");
    document.getElementById("unit-title").innerText = isTestMode ? "📝 GENEL TEST" : `${currentCategory} - Ünite ${currentUnit}`;
    renderQuestion();

    if (isTestMode && savedTotal > 0) {
        totalTime = savedTotal;
        remainingTime = savedRemaining > 0 ? savedRemaining : totalTime;
        const timerEl = document.getElementById("timer-display");
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            remainingTime--;
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                endTest(true);
                return;
            }
            const mins = Math.floor(remainingTime / 60);
            const secs = remainingTime % 60;
            timerEl.innerText = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    showToast("❤️ Kaldığınız yerden devam edin!");
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

function startHardQuestion() {
    if (!userState.featureUnlocked.hardQuestion) {
        watchAdForFeature('hardQuestion');
        return;
    }
    const allHard = [];
    Object.keys(categoryQuestions).forEach(cat => {
        categoryQuestions[cat].forEach(unit => {
            unit.forEach(q => {
                if (q.hard === true) {
                    allHard.push({ ...q, category: cat });
                }
            });
        });
    });
    if (allHard.length === 0) {
        showToast('Henüz zor soru yok.');
        return;
    }
    const randomQ = shuffleArray(allHard)[0];
    currentQuestions = [randomQ];
    currentQuestionIndex = 0;
    isTestMode = false;
    isYanlislarimMode = false;
    isFromBilgic = true;
    clearInterval(timerInterval);
    document.getElementById("timer-display").innerText = '';
    hideAllScreens();
    document.getElementById("screen-game").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.remove("hidden");
    document.getElementById("unit-title").innerText = '⚡ ZOR SORU';
    renderQuestion();
    playSound('click');
}

function useHint() {
    if (userState.hintCount <= 0) {
        showToast("💡 İpucun kalmadı! Ödül ekranından kazan.");
        return;
    }

    if (!currentQuestions || currentQuestions.length === 0 || currentQuestionIndex >= currentQuestions.length) {
        showToast("Geçerli bir soru yok.");
        return;
    }

    const q = currentQuestions[currentQuestionIndex];
    if (!q) return;

    const correctOpt = q.options[q.answer];
    showToast(`💡 İpucu: Doğru cevap "${correctOpt}" olabilir.`);

    userState.hintCount -= 1;
    saveUserState();
    updateHintBadge();

    const allBtns = document.querySelectorAll(".option-btn");
    allBtns.forEach((btn, idx) => {
        if (idx === q.answer) {
            btn.classList.add('hint-glow');
            setTimeout(() => {
                btn.classList.remove('hint-glow');
            }, 1000);
        }
    });

    updateRewardCounts();
    playSound('click');
}

function startWrongRetry() {
    if (!userState.featureUnlocked.wrongRetry) {
        watchAdForFeature('wrongRetry');
        return;
    }
    if (userState.wrongQuestions.length === 0) {
        showToast('Hiç yanlış sorunuz yok.');
        return;
    }
    currentQuestions = shuffleArray(userState.wrongQuestions);
    currentQuestionIndex = 0;
    isTestMode = false;
    isYanlislarimMode = false;
    isFromBilgic = false;
    if (hearts <= 0) {
        showGameOverScreen();
        return;
    }
    hideAllScreens();
    document.getElementById("screen-game").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.remove("hidden");
    document.getElementById("unit-title").innerText = '🔄 Hatalı Soru Tekrarı';
    renderQuestion();
    playSound('click');
}

let isYanlislarimMode = false;
let isFromBilgic = false;

function startYanlislarim() {
    showAdSimulation(() => {
        startYanlislarimTest();
    });
}

function startYanlislarimTest() {
    const wrongs = userState.wrongQuestions;
    let selected = [];
    if (wrongs.length > 0) {
        selected = shuffleArray(wrongs).slice(0, 5);
        if (selected.length < 5) {
            const allQuestions = [];
            Object.keys(categoryQuestions).forEach(cat => {
                categoryQuestions[cat].forEach(unit => {
                    unit.forEach(q => {
                        if (!selected.some(s => s._uid === q._uid)) {
                            allQuestions.push({ ...q, category: cat });
                        }
                    });
                });
            });
            const extra = shuffleArray(allQuestions).slice(0, 5 - selected.length);
            selected = selected.concat(extra);
        }
    } else {
        const allQuestions = [];
        Object.keys(categoryQuestions).forEach(cat => {
            categoryQuestions[cat].forEach(unit => {
                unit.forEach(q => {
                    allQuestions.push({ ...q, category: cat });
                });
            });
        });
        if (allQuestions.length === 0) {
            showToast("Henüz soru yok.");
            return;
        }
        selected = shuffleArray(allQuestions).slice(0, 5);
    }

    testQuestions = selected;
    testCorrectCount = 0;
    isTestMode = true;
    isYanlislarimMode = true;
    isFromBilgic = false;
    currentQuestions = testQuestions;
    currentQuestionIndex = 0;
    if (hearts <= 0) {
        showGameOverScreen();
        return;
    }
    document.getElementById("unit-title").innerText = "🤔 Yanlışlarım (5 Soru)";
    hideAllScreens();
    document.getElementById("screen-game").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.remove("hidden");
    document.getElementById("timer-display").innerText = '';
    clearInterval(timerInterval);
    renderQuestion();
    playSound('click');
}

function toggleFavorite(question) {
    const uid = question._uid;
    if (!uid) return;
    const index = userState.favorites.indexOf(uid);
    if (index > -1) {
        userState.favorites.splice(index, 1);
        showToast('⭐ Favorilerden çıkarıldı.');
    } else {
        userState.favorites.push(uid);
        showToast('⭐ Favorilere eklendi.');
    }
    saveUserState();
    updateFavoriteButton(uid);
    playSound('click');
}

function isFavorite(uid) {
    return userState.favorites.includes(uid);
}

function updateFavoriteButton(uid) {
    const btn = document.getElementById('favorite-btn');
    if (!btn) return;
    if (isFavorite(uid)) {
        btn.innerText = '⭐ Favorilerde';
        btn.classList.add('favorited');
    } else {
        btn.innerText = '⭐ Favorilere Ekle';
        btn.classList.remove('favorited');
    }
}

function unlockVitalCard() {
    if (!knowledgeData || knowledgeData.length === 0) {
        showToast('Henüz bilgi kartı yüklenmedi.');
        return;
    }
    if (userState.vitalCardIndex >= knowledgeData.length) {
        showToast('Tüm kartları açtınız!');
        return;
    }
    const card = knowledgeData[userState.vitalCardIndex];
    showToast(`📇 Hayati Bilgi: ${card.title}\n${card.content}`);
    userState.vitalCardIndex += 1;
    saveUserState();
    playSound('click');
}

function openBilgicCategory(type) {
    showAdSimulation(() => {
        if (type === 'zor') {
            openZorSoruContentDirect();
        } else if (type === 'kart') {
            openBilgiKartiContent();
        }
        playSound('click');
    });
}

function openZorSoruContentDirect() {
    if (!zorSoruData || zorSoruData.length === 0) {
        showToast('Zor soru verisi yüklenemedi.');
        isFromBilgic = false;
        navigateToTab('bilgic');
        return;
    }
    const random = shuffleArray(zorSoruData)[0];
    const q = {
        q: random.soru || random.q || 'Soru metni yok',
        options: random.secenekler || random.options || [],
        answer: random.answer !== undefined ? random.answer : 0,
        hard: true,
        _uid: 'zor-' + Date.now(),
        category: 'ZOR SORU'
    };
    if (!Array.isArray(q.options) || q.options.length === 0) {
        q.options = ["A seçeneği", "B seçeneği", "C seçeneği", "D seçeneği"];
        q.answer = 0;
    }
    currentQuestions = [q];
    currentQuestionIndex = 0;
    isTestMode = false;
    isYanlislarimMode = false;
    isFromBilgic = true;
    clearInterval(timerInterval);
    document.getElementById("timer-display").innerText = '';
    hideAllScreens();
    document.getElementById("screen-game").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.remove("hidden");
    document.getElementById("unit-title").innerText = '⚡ Zor Soru (Bilgiç)';
    renderQuestion();
    showToast('⚡ Zor soru başladı!');
    playSound('click');
}

function openZorSoruContent() {
    openZorSoruContentDirect();
}

let bilgiKartiSirasi = 0;

function openBilgiKartiContent() {
    if (!knowledgeData || knowledgeData.length === 0) {
        showToast('Bilgi kartı verisi yüklenemedi.');
        return;
    }
    const randomIndex = Math.floor(Math.random() * knowledgeData.length);
    bilgiKartiSirasi = randomIndex;
    showBilgiKartiModal(knowledgeData[randomIndex].title, knowledgeData[randomIndex].content);
    navigateToTab('bilgic');
    playSound('click');
}

function showBilgiKartiModal(title, content) {
    const modal = document.getElementById('bilgi-karti-modal');
    const titleEl = document.getElementById('bilgi-karti-title');
    const bodyEl = document.getElementById('bilgi-karti-body');
    if (!modal || !titleEl || !bodyEl) return;
    titleEl.innerText = '📇 Bilgi Kartı';
    bodyEl.innerHTML = `
        <h3>${title}</h3>
        <p>${content}</p>
        <button class="btn-primary" id="bilgi-karti-tamam-btn" onclick="handleBilgiKartiTamam()">✅ Tamam</button>
    `;
    modal.classList.remove('hidden');
    playSound('click');
}

function handleBilgiKartiTamam() {
    closeBilgiKartiModal();
    showAdSimulation(() => {
        if (knowledgeData.length === 0) {
            showToast('Kart kalmadı.');
            return;
        }
        const newIndex = Math.floor(Math.random() * knowledgeData.length);
        bilgiKartiSirasi = newIndex;
        showBilgiKartiModal(knowledgeData[newIndex].title, knowledgeData[newIndex].content);
        playSound('click');
    });
}

function closeBilgiKartiModal() {
    document.getElementById('bilgi-karti-modal').classList.add('hidden');
}

function closeBilgiKartiModalOutside(e) {
    if (e.target.id === 'bilgi-karti-modal') closeBilgiKartiModal();
}

function saveProgress() {
    const payload = {
        unlockedUnits: unlockedUnits,
        completedUnits: completedUnits,
        totalSolvedCount: totalSolvedCount,
        categoryStats: categoryStats,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('islami_soru_bankasi_v1', JSON.stringify(payload));
}

function loadProgress() {
    const saved = localStorage.getItem('islami_soru_bankasi_v1');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            unlockedUnits = parsed.unlockedUnits || {};
            completedUnits = parsed.completedUnits || {};
            totalSolvedCount = parsed.totalSolvedCount || 0;
            categoryStats = parsed.categoryStats || {};
        } catch (e) { console.error("Save parse error", e); }
    }
}

function updateStats() {
    const el = document.getElementById("stat-solved");
    if (el) el.innerText = totalSolvedCount;
    const testsEl = document.getElementById("stat-tests");
    if (testsEl) testsEl.innerText = userState.totalTestsCompleted || 0;
    const streakEl = document.getElementById("stat-streak");
    if (streakEl) streakEl.innerText = userState.streakCount || 0;

    const container = document.getElementById("stats-container");
    if (!container) return;
    container.innerHTML = '';
    const categories = Object.keys(categoryStats);
    if (categories.length === 0) {
        container.innerHTML = '<p class="profile-card">Henüz hiç soru çözülmemiş.</p>';
        return;
    }
    categories.forEach(cat => {
        const stats = categoryStats[cat];
        const percent = stats.solved > 0 ? Math.round((stats.correct / stats.solved) * 100) : 0;
        const div = document.createElement('div');
        div.className = 'profile-card';
        div.innerHTML = `
            <h3>${cat}</h3>
            <p>📘 Çözülen: ${stats.solved}  |  ✅ Doğru: ${stats.correct}  |  📈 Başarı: %${percent}</p>
            <div style="background: #e2e8f0; border-radius: 10px; height: 8px; width: 100%; margin-top: 6px;">
                <div style="background: var(--accent); width: ${percent}%; height: 8px; border-radius: 10px;"></div>
            </div>
        `;
        container.appendChild(div);
    });
}

function showToast(message) {
    let toast = document.getElementById("app-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "app-toast";
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = "1";
    setTimeout(() => {
        toast.style.opacity = "0";
    }, 2500);
}

function showGameOverScreen() {
    clearInterval(timerInterval);
    hideAllScreens();
    document.getElementById("screen-gameover").classList.remove("hidden");
    document.getElementById("bottom-nav-bar").classList.remove("hidden");
}

function goBackFromGame() {
    if (currentCategory === "GENEL TEKRAR") {
        navigateToTab('home');
        return;
    }
    if (isFromBilgic) {
        isFromBilgic = false;
        hideAllScreens();
        document.getElementById("screen-bilgic").classList.remove("hidden");
        document.getElementById("bottom-nav-bar").classList.remove("hidden");
        return;
    }
    if (isTestMode) {
        clearInterval(timerInterval);
        isTestMode = false;
        hideAllScreens();
        document.getElementById("screen-categories").classList.remove("hidden");
        document.getElementById("bottom-nav-bar").classList.remove("hidden");
        setActiveNav('home');
    } else {
        hideAllScreens();
        document.getElementById("screen-units").classList.remove("hidden");
        document.getElementById("bottom-nav-bar").classList.remove("hidden");
        setActiveNav('home');
    }
    playSound('click');
}
