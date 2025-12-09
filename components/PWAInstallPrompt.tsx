import React, { useState, useEffect } from 'react';
import { X, Share, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Detect standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    if (isStandalone) return;

    // Handle Android install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt for iOS after a delay if not standalone
    if (isIosDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-col gap-3 max-w-md mx-auto">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Install App</h3>
                  <p className="text-slate-400 text-sm">Add to home screen for full experience</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrompt(false)}
                className="p-1 hover:bg-slate-800 rounded-full"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-sm text-slate-300 bg-slate-800 p-3 rounded-lg flex items-center gap-2">
                <span>Tap</span>
                <Share size={16} className="inline text-blue-400" />
                <span>then "Add to Home Screen"</span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors active:scale-95"
              >
                Install Now
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};