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
      <div className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-800">
        <span>📶 مفيش نت دلوقتي — كمّل تسجيل الحضور عادي، هيترفع تلقائي لما النت يرجع</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="flex items-center justify-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-xs font-semibold text-emerald-800">
        <span>✅ النت رجع — بيرفع اللي اتسجل أوفلاين دلوقتي</span>
      </div>
    );
  }

  return null;
}