import React, { useState, useEffect } from 'react';
import { X, Share, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 2. Detect Standalone Mode (Already Installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // 3. Android/Chrome: Listen for the native install event
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. iOS: Show prompt after a delay since there is no native event
    if (isIosDevice) {
      // Check if we have already shown it this session to avoid annoyance
      const hasSeenPrompt = sessionStorage.getItem('ios_install_prompt_seen');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 4000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      // Optionally, send analytics event with outcome of user choice
      console.log(`User response to the install prompt: ${outcome}`);
      
      // We've used the prompt, and can't use it again, throw it away
      setDeferredPrompt(null);
      // Hide our custom UI
      setShowPrompt(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    if (isIOS) {
      sessionStorage.setItem('ios_install_prompt_seen', 'true');
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-safe"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-col gap-3 max-w-md mx-auto">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/50">
                  {isIOS ? <Download className="w-6 h-6 text-white" /> : <Smartphone className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">Install Campus Complete</h3>
                  <p className="text-slate-400 text-sm">
                    {isIOS ? "Add to Home Screen for the best experience" : "Install as a native app for offline access"}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-1 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-sm text-slate-300 bg-slate-800 p-3 rounded-lg flex items-center gap-2 mt-2">
                <span>Tap</span>
                <Share size={16} className="inline text-blue-400 mx-1" />
                <span>then "Add to Home Screen"</span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/30 mt-1"
              >
                Install Application
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};