import { useEffect, useState } from "react";
import { useOnlineStatus } from "../lib/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setShowReconnected(false);
      return;
    }
    if (wasOffline) {
      setWasOffline(false);
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  if (!online) {
    return (
      <div className="sticky top-0 z-40 flex items-center justify-center gap-3 border-b border-amber-200/80 bg-linear-to-r from-amber-50 to-amber-100/80 px-4 py-3 text-center text-xs font-semibold text-amber-800 shadow-sm backdrop-blur-sm transition-all sm:py-3.5 sm:text-sm">
        <span className="text-xl">📶</span>
        <span className="flex-1">
          مفيش نت دلوقتي — كمّل تسجيل الحضور عادي، هيترفع تلقائي لما النت يرجع
        </span>
        <span className="hidden h-2 w-2 animate-pulse rounded-full bg-amber-500 sm:block"></span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="sticky top-0 z-40 flex items-center justify-center gap-3 border-b border-emerald-200/80 bg-linear-to-r from-emerald-50 to-emerald-100/80 px-4 py-3 text-center text-xs font-semibold text-emerald-800 shadow-sm backdrop-blur-sm transition-all sm:py-3.5 sm:text-sm">
        <span className="text-xl">✅</span>
        <span className="flex-1">
          النت رجع — بيرفع اللي اتسجل أوفلاين دلوقتي
        </span>
        <span className="hidden h-2 w-2 animate-pulse rounded-full bg-emerald-500 sm:block"></span>
      </div>
    );
  }

  return null;
}