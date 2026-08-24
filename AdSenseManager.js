/**
 * islamiilimlersorubankasi.com - WEB REKLAM YÖNETİM SİSTEMİ
 * Google AdSense & GPT ile optimize edilmiş web reklam stratejisi
 */

// ==========================================
// 1. OYUNCU DURUM YÖNETİMİ (Can / İpucu Mantığı)
// ==========================================

// Sayfa yüklendiğinde mevcut can ve ipuçlarını ekrana yazdırır
document.addEventListener("DOMContentLoaded", function () {
  guncelleArayuz();
});

function getCan() {
  return parseInt(localStorage.getItem("user_can") || "5");
}

function getIpucu() {
  return parseInt(localStorage.getItem("user_ipucu") || "1");
}

function ekleCan(miktar) {
  let yeniCan = getCan() + miktar;
  localStorage.setItem("user_can", yeniCan);
  guncelleArayuz();
  // UI'dan erişilebilir olması için global fonksiyon
  if (typeof window.updateHeartsAndHints === 'function') {
    window.updateHeartsAndHints();
  }
  showToast(`${miktar} Can hesabınıza eklendi!`);
}

function ekleIpucu(miktar) {
  let yeniIpucu = getIpucu() + miktar;
  localStorage.setItem("user_ipucu", yeniIpucu);
  guncelleArayuz();
  if (typeof window.updateHeartsAndHints === 'function') {
    window.updateHeartsAndHints();
  }
  showToast(`${miktar} İpucu hesabınıza eklendi!`);
}

function guncelleArayuz() {
  const canEl = document.getElementById("canSayisi");
  const ipucuEl = document.getElementById("ipucuSayisi");

  if (canEl) canEl.innerText = getCan();
  if (ipucuEl) ipucuEl.innerText = getIpucu();
}

// ==========================================
// 2. GOOGLE ADSENSE & GPT REKLAM YÖNETİMİ (WEB OPTİMİZE)
// ==========================================

window.googletag = window.googletag || { cmd: [] };

// --- REKLAM BİRİM KİMLİKLERİNİZİ BURAYA GİRİN ---
const AD_UNITS = {
    REWARDED: '/123456789/rewarded_ad_unit',        // Ödüllü Reklam Birimi
    INTERSTITIAL: '/123456789/interstitial_ad_unit', // Geçiş Reklamı Birimi
    BANNER_HOME: '/123456789/banner_home',           // Ana Sayfa Banner
    BANNER_BOTTOM: '/123456789/banner_bottom'        // Alt Sabit Banner
};

// --- Global Değişkenler ---
let rewardedSlot = null;
let interstitialSlot = null;
let bannerBottomSlot = null;
window.currentRewardType = null; // 'CAN' veya 'IPUCU'

googletag.cmd.push(function () {
  // --- A. ÖDÜLLÜ REKLAM (Rewarded Ad) ---
  rewardedSlot = googletag.defineOutOfPageSlot(
    AD_UNITS.REWARDED,
    googletag.enums.OutOfPageFormat.REWARDED
  );

  if (rewardedSlot) {
    rewardedSlot.addService(googletag.pubads());

    // Reklam başarıyla izlendiğinde çalışacak olay
    googletag.pubads().addEventListener('rewardedSlotGranted', function () {
      if (window.currentRewardType === 'CAN') {
        ekleCan(3);
        if (typeof window.showToast === 'function') {
          window.showToast('🎉 +3 Can kazandınız!');
        }
      } else if (window.currentRewardType === 'IPUCU') {
        ekleIpucu(1);
        if (typeof window.showToast === 'function') {
          window.showToast('💡 +1 İpucu kazandınız!');
        }
      }
      window.currentRewardType = null;
    });

    // Reklam kapatıldığında slotu temizle
    googletag.pubads().addEventListener('rewardedSlotClosed', function () {
      window.currentRewardType = null;
    });
  }

  // --- B. GEÇİŞ REKLAMI (Interstitial Ad) ---
  interstitialSlot = googletag.defineOutOfPageSlot(
    AD_UNITS.INTERSTITIAL,
    googletag.enums.OutOfPageFormat.INTERSTITIAL
  );

  if (interstitialSlot) {
    interstitialSlot.addService(googletag.pubads());
  }

  // --- C. ALT SABİT BANNER (Sticky Ad) ---
  bannerBottomSlot = googletag.defineSlot(
    AD_UNITS.BANNER_BOTTOM,
    [728, 90], // Masaüstü için
    'banner-ad-bottom'
  );

  if (bannerBottomSlot) {
    bannerBottomSlot.addService(googletag.pubads());
    // Responsive ayarları - mobilde 320x50 göster
    googletag.pubads().setTargeting('device', 'desktop');
  }

  googletag.enableServices();

  // Alt banner'ı hemen göster
  if (document.getElementById('banner-ad-bottom')) {
    googletag.display('banner-ad-bottom');
  }
});

// ==========================================
// 3. DIŞARIYA AÇIK REKLAM ÇAĞIRMA FONKSİYONLARI
// ==========================================

/**
 * Butonlara basıldığında Ödüllü Reklamı başlatır
 * @param {'CAN' | 'IPUCU'} tip 
 */
function gosterRewardedAd(tip) {
  window.currentRewardType = tip;
  
  googletag.cmd.push(function () {
    if (rewardedSlot) {
      googletag.display(rewardedSlot);
    } else {
      // Reklam yüklenemediyse veya engellendiyse bildirim ver
      if (typeof window.showToast === 'function') {
        window.showToast("Reklam şu an hazır değil, lütfen tekrar deneyin.");
      } else {
        alert("Reklam şu an hazır değil, lütfen bağlantınızı kontrol edip tekrar deneyin.");
      }
    }
  });
}

/**
 * Test bittiğinde veya ünite geçişlerinde Geçiş Reklamını başlatır
 * @param {Function} callback - Reklam kapandıktan sonra çalışacak fonksiyon
 */
function gosterInterstitialAd(callback) {
  googletag.cmd.push(function () {
    if (interstitialSlot) {
      googletag.display(interstitialSlot);
    }
    // Kullanıcı reklamı kapattıktan veya reklam açılmadıysa akış bozulmasın diye yönlendir
    if (typeof callback === "function") {
      setTimeout(callback, 500);
    }
  });
}

/**
 * Alt Sabit Banner'ı yeniden yükler (sayfa değişimlerinde)
 */
function refreshBottomBanner() {
  googletag.cmd.push(function () {
    if (bannerBottomSlot) {
      googletag.pubads().refresh([bannerBottomSlot]);
    }
  });
}

// ==========================================
// 4. YEDEK SİMÜLASYON (AdSense Yoksa veya Test Aşamasında)
// ==========================================

// Eğer AdSense entegre değilse veya test aşamasındaysanız,
// aşağıdaki simülasyon fonksiyonları çalışır.

let adDeposu = [];
const MAX_AD_DEPO = 10;

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

function showAdSimulation(callback) {
    if (adDeposu.length === 0) {
        reklamlariDepola();
        if (adDeposu.length === 0) {
            if (typeof window.showCustomModal === 'function') {
                window.showCustomModal("Uyarı", "📡 Reklamlar yüklenemedi. Lütfen internet bağlantınızı kontrol edin.");
            } else {
                alert("Reklamlar yüklenemedi. Lütfen internet bağlantınızı kontrol edin.");
            }
            if (callback) callback();
            return;
        }
    }
    const ad = adDeposu.shift();
    showAdSimulationWithContent(ad, callback);
    setTimeout(() => reklamlariDepola(), 1000);
}

function showAdSimulationWithContent(ad, callback) {
    const modal = document.createElement('div');
    modal.id = 'ad-simulation-modal';
    modal.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.8); z-index:9999;
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
    document.body.appendChild(modal);

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

// Basit Toast bildirimi (ui.js'deki showToast kullanılamazsa)
function showToast(message) {
    if (typeof window.showToast === 'function') {
        window.showToast(message);
        return;
    }
    // Fallback toast
    let toast = document.getElementById("app-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "app-toast";
        toast.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: #1e293b; color: white; padding: 14px 28px;
            border-radius: 14px; font-weight: 700; font-size: 0.9rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 100;
            opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
            max-width: 90vw; text-align: center;
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = "1";
    setTimeout(() => {
        toast.style.opacity = "0";
    }, 2500);
}

// Web ortamında çalıştığını kontrol et
function isWebEnvironment() {
    return !(window.Capacitor && window.Capacitor.isNativePlatform());
}

// ==========================================
// 5. DIŞARIYA AÇIK GLOBAL FONKSİYONLAR
// ==========================================

window.gosterRewardedAd = gosterRewardedAd;
window.gosterInterstitialAd = gosterInterstitialAd;
window.refreshBottomBanner = refreshBottomBanner;
window.showAdSimulation = showAdSimulation;
window.ekleCan = ekleCan;
window.ekleIpucu = ekleIpucu;
window.getCan = getCan;
window.getIpucu = getIpucu;

// UI'dan erişilebilir olması için
console.log('✅ AdSenseManager.js yüklendi - Web Reklam Yönetimi Aktif');
