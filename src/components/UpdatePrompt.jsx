import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// بيسجل الـ Service Worker ويظبط تحديثات التطبيق.
// مهم: مابنعملش ريفريش تلقائي فجأة، عشان لو حد بيسجل حضور دلوقتي مانضيعوش
// عليه اللي بيعمله. بدل كده بنوريه رسالة وهو يختار يحدّث إمتى — لكن الرسالة
// دي بتفضل تظهر تاني كل مرة يفتح فيها الموقع (حتى لو داس "لاحقًا" قبل كده)
// لحد ما يعمل التحديث فعليًا.
export default function UpdatePrompt() {
  const [updating, setUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      // 1) فحص فوري أول ما الموقع يفتح ويتسجل الـ Service Worker،
      //    من غير ما نستنى أي فترة زمنية.
      registration.update().catch(() => {});

      // 2) فحص تاني كل مرة المستخدم يرجع للتاب/الموقع (بعد ما كان
      //    مقفول في الخلفية أو مبدّل تطبيق تاني)، عشان نمسكه أول لحظة
      //    يفتح فيها الموقع من جديد.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      });

      // 3) وفحص دوري احتياطي كل نص ساعة لو الموقع فاضل فاتح فترة طويلة.
      setInterval(() => {
        registration.update().catch(() => {});
      }, 30 * 60 * 1000);
    },
  });

  // لو المستخدم داس "لاحقًا" والموقع لسه محتاج تحديث، نفضّل نفكّره تاني
  // كل شوية من غير ما يضطر يقفل ويفتح الموقع من الأول.
  useEffect(() => {
    if (!needRefresh) return;
    const reminder = setInterval(() => {
      setNeedRefresh(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(reminder);
  }, [needRefresh, setNeedRefresh]);

  function close() {
    // "لاحقًا" بيقفل الرسالة دلوقتي بس، مش بيلغي التحديث؛ هتظهر تاني
    // أول ما يفتح الموقع تاني أو بعد شوية زي ما شرحنا فوق.
    setNeedRefresh(false);
    setOfflineReady(false);
  }

  async function handleUpdate() {
    setUpdating(true);
    // شبكة أمان: لو لأي سبب (كاش على السيرفر، متصفح غريب، إلخ) الصفحة
    // ما عملتش ريفريش لوحدها خلال 4 ثواني من الضغط على "تحديث"، بنجبرها
    // تعمل ريفريش يدوي إجباري بدل ما تفضل واقفة من غير أي رد فعل.
    const fallback = setTimeout(() => {
      window.location.reload();
    }, 4000);
    try {
      await updateServiceWorker(true);
    } catch (err) {
      console.warn("تعذّر تحديث الـ Service Worker، هنعمل ريفريش يدوي:", err);
      clearTimeout(fallback);
      window.location.reload();
    }
  }

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-lg">
        {needRefresh ? (
          <>
            <span className="flex-1 text-xs font-semibold text-ink">
              🔄 في نسخة جديدة من التطبيق — حدّث دلوقتي؟
            </span>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={updating}
              className="rounded-lg bg-steel px-3 py-1.5 text-xs font-bold text-white hover:bg-steel-light disabled:opacity-60"
            >
              {updating ? "بيحدّث…" : "تحديث"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={updating}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-out hover:bg-out-soft disabled:opacity-60"
            >
              لاحقًا
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-xs font-semibold text-ink">
              ✅ التطبيق بقى جاهز يشتغل من غير نت
            </span>
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-out hover:bg-out-soft"
            >
              تمام
            </button>
          </>
        )}
      </div>
    </div>
  );
}