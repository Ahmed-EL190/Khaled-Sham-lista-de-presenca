import { useEffect, useState } from "react";

// بيتابع حالة النت من المتصفح (navigator.onLine + أحداث online/offline).
// ده بس مؤشر واجهة للمستخدم؛ Firestore نفسه بيدير الحفظ/الرفع لوحده
// (شوف src/firebase.js) سواء استخدمنا الهوك ده أو لأ.
export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    function goOnline() {
      setOnline(true);
    }
    function goOffline() {
      setOnline(false);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}