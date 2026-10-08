// Dán toàn bộ file này vào Google Sheet → Tiện ích mở rộng → Apps Script (thay code mặc định).
// File này KHÔNG cần upload lên hosting.

// Email nhận thông báo khi có đăng ký mới. Để trống "" nếu không muốn nhận email.
const NOTIFY_EMAIL = "";

// ID của file Google Sheet (đoạn giữa /d/ và /edit trong link Sheet)
const SPREADSHEET_ID = "1KEOSMKb_MDijMOoPIZumZ1z1RpPQixfhbuep1eaTYcI";
const SHEET_NAME = "Đăng ký";
const HEADERS = ["Thời gian", "Phụ huynh", "Số điện thoại", "Học sinh", "Lớp", "Mục tiêu", "Ghi chú", "Đã liên hệ"];

function doPost(e) {
  const p = e.parameter;

  // Bot điền vào ô ẩn → bỏ qua nhưng vẫn trả về thành công
  if (p.website) return json({ ok: true });

  const parent = clean(p.parent, 100);
  const phone = clean(p.phone, 20).replace(/\D/g, "");
  if (!parent || !/^0\d{9}$/.test(phone)) return json({ ok: false, error: "invalid" });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet();
    sheet.appendRow([
      new Date(),
      safe(parent),
      "'" + phone, // giữ số 0 ở đầu
      safe(clean(p.student, 100)),
      safe(clean(p.grade, 20)),
      safe(clean(p.goal, 200)),
      safe(clean(p.note, 1000)),
      false,
    ]);
    sheet.getRange(sheet.getLastRow(), HEADERS.length).insertCheckboxes();
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      "Đăng ký học thử mới: " + parent,
      `Phụ huynh: ${parent}\nSĐT: ${phone}\nHọc sinh: ${p.student || ""}\nLớp: ${p.grade || ""}\n` +
        `Mục tiêu: ${p.goal || ""}\nGhi chú: ${p.note || ""}\n\nXem danh sách: ${SpreadsheetApp.openById(SPREADSHEET_ID).getUrl()}`
    );
  }

  return json({ ok: true });
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#e0e7ff");
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setNumberFormat("dd/MM/yyyy HH:mm");
  }
  return sheet;
}

function clean(v, max) {
  return String(v || "").trim().slice(0, max);
}

// Chặn chèn công thức vào Sheet (ô bắt đầu bằng = + - @)
function safe(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
