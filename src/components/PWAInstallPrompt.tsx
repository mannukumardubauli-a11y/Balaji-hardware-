import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, MoreVertical, Sparkles } from 'lucide-react';
import { HanumanLogo } from './HanumanLogo';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running in standalone / fullscreen mode
    const isAppStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isAppStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isAppStandalone) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowBanner(false);
      setShowModal(false);
      setInstalledSuccessfully(true);
      setTimeout(() => setInstalledSuccessfully(false), 5000);
    });

    // On mobile, if not standalone, show banner by default after 2 seconds
    const timer = setTimeout(() => {
      if (!isAppStandalone) {
        setShowBanner(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
      } else {
        setShowModal(true);
      }
    } else {
      // If no native deferred prompt (e.g. iOS Safari or Chrome on some devices), show manual steps modal
      setShowModal(true);
    }
  };

  if (isStandalone) {
    return null; // App is already installed and running fullscreen
  }

  return (
    <>
      {/* Success Notification after install */}
      {installedSuccessfully && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-emerald-400">
          <Check className="w-5 h-5 text-emerald-200" />
          <span className="font-semibold text-sm">App Mobile Screen Par Add Ho Gaya Hai! 🎉</span>
        </div>
      )}

      {/* Top Banner or Sticky Install Bar */}
      {showBanner && (
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm border-b border-orange-500/40 sticky top-0 z-40">
          <div className="flex items-center gap-2.5 min-w-0">
            <HanumanLogo size={36} className="shrink-0 rounded-xl" />
            <div className="truncate">
              <div className="font-bold text-white flex items-center gap-1">
                <span>Sri Balaji Hardware Mobile App</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              </div>
              <p className="text-orange-100 text-[11px] truncate">Mobile Screen me Fullscreen chalaane ke liye install karein</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-white hover:bg-orange-50 text-orange-700 font-bold px-3.5 py-1.5 rounded-xl shadow-md transition-all text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-orange-600" />
              <span>Install Karein</span>
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1.5 hover:bg-black/20 rounded-lg text-orange-200 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button for Easy Access */}
      {!showBanner && !showModal && (
        <button
          onClick={handleInstallClick}
          className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-4 py-2.5 rounded-full shadow-2xl border border-orange-400/30 flex items-center gap-2 text-xs transition-all hover:scale-105 active:scale-95 animate-pulse"
        >
          <Smartphone className="w-4 h-4" />
          <span>App Download / Install</span>
        </button>
      )}

      {/* Manual Installation Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <HanumanLogo size={48} className="shrink-0 rounded-2xl shadow-lg" />
              <div>
                <h3 className="text-lg font-bold text-white">Mobile Screen me App Add Karein</h3>
                <p className="text-xs text-orange-400 font-medium">Sri Balaji Hardware & Paint Store</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-5 leading-relaxed bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
              Aap is app ko apne Mobile phone me Web App ki tarah bilkul asli App jaisa fullscreen me chala sakte hain!
            </p>

            {/* Android / Chrome Instructions */}
            {!isIOS ? (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-orange-500" />
                  <span>Android / Chrome Users Ke Liye Steps:</span>
                </h4>
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="flex items-start gap-2.5 bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-700/50">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                    <div>
                      Mobile Browser me top right par <strong className="text-white inline-flex items-center gap-1"><MoreVertical className="w-3.5 h-3.5 text-amber-400" /> 3 Dots (Menu)</strong> par click karein.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-700/50">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                    <div>
                      Menu me <strong className="text-amber-400">"Add to Home screen"</strong> ya <strong className="text-amber-400">"Install app"</strong> par tap karein.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-700/50">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                    <div>
                      "Add" par confirm karein. Ab aapke mobile screen par Balaji Hardware ka logo/icon aagaya hoga!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* iOS / Safari Instructions */
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-orange-500" />
                  <span>iPhone / Safari Users Ke Liye Steps:</span>
                </h4>
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="flex items-start gap-2.5 bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-700/50">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                    <div>
                      Safari Browser ke bottom bar me <strong className="text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 text-blue-400" /> Share Icon</strong> par tap karein.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-700/50">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                    <div>
                      Options scroll karke <strong className="text-amber-400">"Add to Home Screen"</strong> par click karein.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-700/50">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                    <div>
                      Top right "Add" par tap karein. App aapke iPhone home screen par install ho jaayega.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full py-3 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg text-xs"
            >
              Samajh Gaya (Close)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
