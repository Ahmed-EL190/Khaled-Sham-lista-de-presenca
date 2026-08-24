import { useRegisterSW } from "virtual:pwa-register/react";

// بيسجل الـ Service Worker ويظبط تحديثات التطبيق.
// مهم: مابنعملش ريفريش تلقائي فجأة، عشان لو حد بيسجل حضور دلوقتي مانضيعوش
// عليه اللي بيعمله. بدل كده بنوريه رسالة صغيرة وهو يختار يحدّث إمتى.
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // بنتأكد كل نص ساعة إن مفيش نسخة جديدة من التطبيق، من غير ما نضايق المستخدم
      if (registration) {
        setInterval(() => {
          registration.update().catch(() => {});
        }, 30 * 60 * 1000);
      }
    },
  });

  function close() {
    setNeedRefresh(false);
    setOfflineReady(false);
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
              onClick={() => updateServiceWorker(true)}
              className="rounded-lg bg-steel px-3 py-1.5 text-xs font-bold text-white hover:bg-steel-light"
            >
              تحديث
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-out hover:bg-out-soft"
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