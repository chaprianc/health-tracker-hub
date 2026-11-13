import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "installPromptDismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    const inIframe = window.self !== window.top;
    if (standalone || inIframe || localStorage.getItem(DISMISS_KEY)) return;

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    if (isIos) {
      setShowIos(true);
      setHidden(false);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
  };

  return (
    <div dir="rtl" className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-card p-4 shadow-xl md:bottom-4">
      <button onClick={dismiss} aria-label="סגור" className="absolute left-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-bold text-card-foreground">התקן את "הדיאטה שלי"</p>
          {deferred ? (
            <button onClick={install} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              <Download className="h-3.5 w-3.5" /> התקן למסך הבית
            </button>
          ) : showIos ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              לחץ על <Share className="inline h-3.5 w-3.5 text-primary" /> "שתף" בספארי, ואז בחר "הוסף למסך הבית".
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
