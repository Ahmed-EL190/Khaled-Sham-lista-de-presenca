// backup.js
// سكريبت بسيط بيسحب كل بيانات التطبيق من Firestore ويحفظها في ملف JSON
// على جهازك، عشان لو حصل مسح أو تعديل غلط في الداتا يكون عندك نسخة.
//
// طريقة الاستخدام:
//   1) npm install firebase-admin
//   2) حط ملف مفتاح الخدمة (service-account.json) جنب السكريبت ده (شرح تحت)
//   3) شغّل: node backup.js
//
// هيطلع لك ملف باسم مثلاً: backup-2026-08-05.json في نفس الفولدر.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync } from "fs";

// ---------------------------------------------------------------------
// إزاي تجيب service-account.json (خطوة تعملها مرة واحدة بس):
//   1) روح Firebase Console → أيقونة الترس (⚙️) → Project settings
//   2) تاب "Service accounts"
//   3) دوس "Generate new private key" → هيتحمل ملف JSON
//   4) سمّيه service-account.json وحطه جنب backup.js
//   5) *مهم جدًا*: الملف ده سري زي كلمة سر، متحطوش على GitHub. لو عندك
//      .gitignore ضيف فيه سطر: service-account.json
// ---------------------------------------------------------------------

const serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// أسماء كل الـ collections المستخدمة في التطبيق
const COLLECTIONS = ["sites", "workers", "records", "deductions", "expenses"];

async function backup() {
  const result = {};

  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get();
    result[name] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`- ${name}: ${result[name].length} سجل`);
  }

  // إعدادات الجدول (أيام الإجازة/النص يوم) متخزنة في مستند واحد منفصل
  const scheduleDoc = await db.collection("settings").doc("schedule").get();
  result.settings = scheduleDoc.exists ? { schedule: scheduleDoc.data() } : {};

  const dateStr = new Date().toISOString().slice(0, 10); // مثلاً 2026-08-05
  const fileName = `backup-${dateStr}.json`;

  writeFileSync(fileName, JSON.stringify(result, null, 2), "utf8");
  console.log(`\nتم الحفظ في: ${fileName}`);
}

backup().catch((err) => {
  console.error("حصل خطأ أثناء عمل النسخة الاحتياطية:", err);
  process.exit(1);
});