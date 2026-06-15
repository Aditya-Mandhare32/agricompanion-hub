import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'agri360-install-dismissed';

function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as any).standalone === true
  );
}

export function InstallPrompt() {
  const { language } = useApp();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;
    if (!isMobile()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const installed = () => { setVisible(false); localStorage.setItem(DISMISS_KEY, '1'); };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') dismiss();
  };

  const t = (en: string, hi: string, mr: string) => language === 'hi' ? hi : language === 'mr' ? mr : en;

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-emerald-50 p-3 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <Smartphone className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">
          📱 {t('Install Agri360 on your phone for quick access',
                'त्वरित पहुंच के लिए Agri360 अपने फोन पर इंस्टॉल करें',
                'त्वरित प्रवेशासाठी Agri360 तुमच्या फोनवर इंस्टॉल करा')}
        </p>
      </div>
      <Button size="sm" onClick={install} className="shrink-0">
        <Download className="h-4 w-4 mr-1" />
        {t('Install App', 'इंस्टॉल करें', 'इंस्टॉल करा')}
      </Button>
      <Button size="sm" variant="ghost" onClick={dismiss} className="shrink-0">
        {t('Not Now', 'अभी नहीं', 'आता नाही')}
      </Button>
      <button onClick={dismiss} aria-label="Dismiss" className="sr-only"><X /></button>
    </Card>
  );
}
