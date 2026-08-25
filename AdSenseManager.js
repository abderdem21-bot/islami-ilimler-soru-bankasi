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
// 2. GOOGLE ADSENSE & GPT REKLAM YÖNETİMİ
// ==========================================

window.googletag = window.googletag || { cmd: [] };

// --- REKLAM BİRİM KİMLİKLERİNİZİ BURAYA GİRİN ---
const AD_UNITS = {
    REWARDED: '/123456789/rewarded_ad_unit',
    INTERSTITIAL: '/123456789/interstitial_ad_unit',
    BANNER_BOTTOM: '/123456789/banner_bottom'
};

let rewardedSlot = null;
let interstitialSlot = null;
let bannerBottomSlot = null;
window.currentRewardType = null;

googletag.cmd.push(function () {
  // Ödüllü Reklam
  rewardedSlot = googletag.defineOutOfPageSlot(
    AD_UNITS.REWARDED,
    googletag.enums.OutOfPageFormat.REWARDED
  );

  if (rewardedSlot) {
    rewardedSlot.addService(googletag.pubads());
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
    googletag.pubads().addEventListener('rewardedSlotClosed', function () {
      window.currentRewardType = null;
    });
  }

  // Geçiş Reklamı
  interstitialSlot = googletag.defineOutOfPageSlot(
    AD_UNITS.INTERSTITIAL,
    googletag.enums.OutOfPageFormat.INTERSTITIAL
  );

  if (interstitialSlot) {
    interstitialSlot.addService(googletag.pubads());
  }

  // Alt Sabit Banner
  bannerBottomSlot = googletag.defineSlot(
    AD_UNITS.BANNER_BOTTOM,
    [728, 90],
    'banner-ad-bottom'
  );

  if (bannerBottomSlot) {
    bannerBottomSlot.addService(googletag.pubads());
    googletag.pubads().setTargeting('device', 'desktop');
  }

  googletag.enableServices();

  if (document.getElementById('banner-ad-bottom')) {
    googletag.display('banner-ad-bottom');
  }
});

function gosterRewardedAd(tip, callback) {
  window.currentRewardType = tip;
  googletag.cmd.push(function () {
    if (rewardedSlot) {
      googletag.display(rewardedSlot);
    } else {
      console.warn("Ödüllü reklam hazır değil, içerik doğrudan açılıyor.");
      // Reklam olmasa dahi takılmayı önlemek için ödülü/içeriği doğrudan ver veya geç
      if (typeof callback === 'function') callback();
    }
  });
}

function gosterInterstitialAd(callback) {
  googletag.cmd.push(function () {
    let adDisplayed = false;
    if (interstitialSlot) {
      adDisplayed = googletag.display(interstitialSlot);
    }
    
    // Reklam yüklense de yüklenmese de ünite açılışının devam etmesini garantiliyoruz
    if (typeof callback === "function") {
      setTimeout(callback, adDisplayed ? 500 : 50);
    }
  });
}

function refreshBottomBanner() {
  googletag.cmd.push(function () {
    if (bannerBottomSlot) {
      googletag.pubads().refresh([bannerBottomSlot]);
    }
  });
}

// ==========================================
// 3. YEDEK SİMÜLASYON
// ==========================================

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
            // Reklam olmasa bile uyarı modalı ÇIKARMADAN doğrudan üniteye/içeriğe geçiş yapıyoruz
            console.warn("📡 Reklam deposu boş. İçeriğe doğrudan yönlendiriliyor.");
            if (typeof callback === 'function') callback();
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
            if (typeof callback === 'function') callback();
        }
    }, 300);
}

function showToast(message) {
    if (typeof window.showToast === 'function') {
        window.showToast(message);
        return;
    }
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

window.gosterRewardedAd = gosterRewardedAd;
window.gosterInterstitialAd = gosterInterstitialAd;
window.refreshBottomBanner = refreshBottomBanner;
window.showAdSimulation = showAdSimulation;
window.ekleCan = ekleCan;
window.ekleIpucu = ekleIpucu;
window.getCan = getCan;
window.getIpucu = getIpucu;

console.log('✅ AdSenseManager.js yüklendi - Web Reklam Yönetimi Aktif');
