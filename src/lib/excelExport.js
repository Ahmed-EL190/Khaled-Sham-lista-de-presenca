import * as XLSX from "xlsx";

// بيحول قايمة صفوف (array of objects) لملف Excel حقيقي (.xlsx) وينزّله على جهاز المستخدم.
// rows: [{ "اسم العمود": قيمة, ... }, ...]
// fileName: من غير امتداد، هيتضاف .xlsx تلقائي
// sheetName: اسم الشيت جوه الملف (اختياري)
export function exportRowsToExcel(rows, fileName, sheetName = "Sheet1") {
  if (!rows || rows.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // عرض تلقائي معقول للأعمدة بدل ما تبقى ضيقة جدًا
  const colWidths = Object.keys(rows[0]).map((key) => {
    const maxLen = rows.reduce(
      (max, row) => Math.max(max, String(row[key] ?? "").length),
      key.length
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
  worksheet["!cols"] = colWidths;

  const safeName = (fileName || "تصدير").replace(/[\\/:*?"<>|]/g, "-");
  XLSX.writeFile(workbook, `${safeName}.xlsx`);
}

// زي exportRowsToExcel بس بيصدّر أكتر من شيت في نفس ملف الـ Excel.
// sheets: [{ name: "اسم الشيت", rows: [{...}, ...] }, ...]
// شيت مالوش صفوف بيتسجل فيه سطر واحد "مفيش بيانات" عشان الشيت متبقاش فاضية تمامًا.
export function exportSheetsToExcel(sheets, fileName) {
  const usable = (sheets || []).filter(Boolean);
  if (usable.length === 0) return;

  const workbook = XLSX.utils.book_new();

  for (const sheet of usable) {
    const rows = sheet.rows && sheet.rows.length > 0 ? sheet.rows : [{ " ": "مفيش بيانات" }];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0]).map((key) => {
      const maxLen = rows.reduce(
        (max, row) => Math.max(max, String(row[key] ?? "").length),
        key.length
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });
    worksheet["!cols"] = colWidths;
    // اسم الشيت في Excel محدود بـ 31 حرف ومينفعش فيه رموز زي / \ ? * [ ]
    const safeSheetName = (sheet.name || "Sheet").replace(/[\\/?*[\]]/g, "-").slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  }

  const safeName = (fileName || "تصدير").replace(/[\\/:*?"<>|]/g, "-");
  XLSX.writeFile(workbook, `${safeName}.xlsx`);
}