import ExcelJS from "exceljs";

// ألوان مأخوذة من هوية الموقع نفسه (نفس الأزرق الأساسي المستخدم في الواجهة)
const BRAND_BLUE = "FF1E6FBF";
const HEADER_TEXT = "FFFFFFFF";
const BORDER_COLOR = "FFD9DEE7";
const STRIPE_FILL = "FFF3F7FC";
const NEGATIVE_TEXT = "FFB42318";

const thinBorder = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

// أي عمود اسمه بيدل على مبلغ فلوس بيتنسق برقم + "Kz"
function isMoneyColumn(key) {
  return /مرتب|مبلغ|أساسي|اليومية|مستحق|خصوم|سلف|دين|ضمان|صافي|أكل|Almoco/i.test(
    key
  );
}

function styleWorksheet(worksheet, keys) {
  worksheet.views = [
    { rightToLeft: true, state: "frozen", ySplit: 1 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_BLUE },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = thinBorder;
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    row.height = 20;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = thinBorder;
      cell.alignment = { horizontal: "right", vertical: "middle" };

      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: STRIPE_FILL },
        };
      }

      const key = keys[colNumber - 1];

      if (isMoneyColumn(key) && typeof cell.value === "number") {
        cell.numFmt = '#,##0 "Kz"';

        if (cell.value < 0) {
          cell.font = { color: { argb: NEGATIVE_TEXT }, bold: true };
        }
      }
    });
  });

  worksheet.columns.forEach((col, i) => {
    const key = keys[i] || "";
    let maxLen = key.length;

    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > maxLen) maxLen = len;
    });

    col.width = Math.min(Math.max(maxLen + 3, 12), 42);
  });
}

async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const safeName = (fileName || "تصدير").replace(/[\\/:*?"<>|]/g, "-");

  link.href = url;
  link.download = `${safeName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// بيحول قايمة صفوف (array of objects) لملف Excel منسّق بألوان الموقع، وينزّله.
// rows: [{ "اسم العمود": قيمة, ... }, ...]
// fileName: من غير امتداد، هيتضاف .xlsx تلقائي
// sheetName: اسم الشيت جوه الملف (اختياري)
export async function exportRowsToExcel(
  rows,
  fileName,
  sheetName = "Sheet1"
) {
  if (!rows || rows.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "نظام إدارة الحضور والرواتب";
  workbook.created = new Date();

  const safeSheetName = (sheetName || "Sheet")
    .replace(/[\\/?*[\]]/g, "-")
    .slice(0, 31);

  const worksheet = workbook.addWorksheet(safeSheetName);

  const keys = Object.keys(rows[0]);
  worksheet.columns = keys.map((k) => ({ header: k, key: k }));
  rows.forEach((r) => worksheet.addRow(r));

  styleWorksheet(worksheet, keys);
  await downloadWorkbook(workbook, fileName);
}

// زي exportRowsToExcel بس بيصدّر أكتر من شيت في نفس ملف الـ Excel، كل شيت بنفس التنسيق.
// sheets: [{ name: "اسم الشيت", rows: [{...}, ...] }, ...]
// شيت مالوش صفوف بيتسجل فيه سطر واحد "مفيش بيانات" عشان الشيت متبقاش فاضية تمامًا.
export async function exportSheetsToExcel(sheets, fileName) {
  const usable = (sheets || []).filter(Boolean);
  if (usable.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "نظام إدارة الحضور والرواتب";
  workbook.created = new Date();

  for (const sheet of usable) {
    const rows =
      sheet.rows && sheet.rows.length > 0
        ? sheet.rows
        : [{ " ": "مفيش بيانات" }];

    const safeSheetName = (sheet.name || "Sheet")
      .replace(/[\\/?*[\]]/g, "-")
      .slice(0, 31);

    const worksheet = workbook.addWorksheet(safeSheetName);

    const keys = Object.keys(rows[0]);
    worksheet.columns = keys.map((k) => ({ header: k, key: k }));
    rows.forEach((r) => worksheet.addRow(r));

    styleWorksheet(worksheet, keys);
  }

  await downloadWorkbook(workbook, fileName);
}