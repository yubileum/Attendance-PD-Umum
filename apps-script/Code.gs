// Normalize phone so every format compares equal:
// "0812-3456-789", "+62 812 3456 789", "628123456789", 8123456789 (number cell), "'0812..."
// -> "8123456789"
function normalizePhoneNumber(number) {
  if (number === null || number === undefined) return '';
  return String(number)
    .replace(/\D/g, '')   // keep digits only (removes +, spaces, dashes, apostrophes)
    .replace(/^0+/, '')   // strip leading zeros
    .replace(/^62/, '')   // strip Indonesian country code
    .replace(/^0+/, '');  // strip zeros left after country code (e.g. +62 0812...)
}

// Convert a cell value from Absensi column A into "yyyy-MM-dd" (works for Date objects and "dd/MM/yyyy HH:mm:ss" strings)
function toDateKey(value, tz) {
  if (value instanceof Date && !isNaN(value)) {
    return Utilities.formatDate(value, tz, 'yyyy-MM-dd');
  }
  var m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  }
  return '';
}

// Returns true if the normalized phone already has a check-in today in "Absensi Tim Pengurus"
function hasCheckedInToday(sheetAbsen, normalizedInput) {
  var lastRow = sheetAbsen.getLastRow();
  if (lastRow < 2) return false; // only header row

  var tz = Session.getScriptTimeZone();
  var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var rows = sheetAbsen.getRange(2, 1, lastRow - 1, 2).getValues(); // A: Timestamp, B: Nomor HP

  // Iterate from the bottom: today's entries are the most recent ones
  for (var i = rows.length - 1; i >= 0; i--) {
    if (normalizePhoneNumber(rows[i][1]) !== normalizedInput) continue;
    if (toDateKey(rows[i][0], tz) === today) return true;
  }
  return false;
}

function doGet(e) {
  var sheetForm = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data Tim Pengurus");
  var sheetAbsen = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Absensi Tim Pengurus");

  var data = sheetForm.getDataRange().getValues();
  var phoneNumber = e.parameter.phone;
  var response = { success: false, alreadyCheckedIn: false, name: "" };

  if (!phoneNumber) {
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  }

  var phoneIndex = 6;
  var nameIndex = 1;
  var lookup = {};

  function formatDate(date) {
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    var hours = String(date.getHours()).padStart(2, '0');
    var minutes = String(date.getMinutes()).padStart(2, '0');
    var seconds = String(date.getSeconds()).padStart(2, '0');
    return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
  }

  for (var i = 1; i < data.length; i++) {
    var normalizedPhone = normalizePhoneNumber(data[i][phoneIndex]);
    if (normalizedPhone) lookup[normalizedPhone] = data[i][nameIndex];
  }

  var normalizedInput = normalizePhoneNumber(phoneNumber);

  if (normalizedInput && lookup[normalizedInput]) {
    response.name = lookup[normalizedInput];

    // Lock so two simultaneous requests (double tap) can't both pass the duplicate check
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (hasCheckedInToday(sheetAbsen, normalizedInput)) {
        response.alreadyCheckedIn = true;
        return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
      }

      response.success = true;

      var lastRow = sheetAbsen.getLastRow() + 1;
      var now = new Date();

      sheetAbsen.getRange(lastRow, 1).setValue(formatDate(now));
      sheetAbsen.getRange(lastRow, 2).setValue(phoneNumber);

      var formulaNormalized =
        'REGEXREPLACE(REGEXREPLACE(TO_TEXT(B' + lastRow + '); "^\\\\+?0*"; ""); "[^0-9]"; "")';

      var formulaC =
        "=INDEX('Data Tim Pengurus'!B:B; MATCH(" +
          formulaNormalized +
          "; ARRAYFORMULA(REGEXREPLACE(REGEXREPLACE(TO_TEXT('Data Tim Pengurus'!G:G); \"^\\\\+?0*\"; \"\"); \"[^0-9]\"; \"\")); 0))";

      var formulaD =
        "=INDEX('Data Tim Pengurus'!H:H; MATCH(" +
          formulaNormalized +
          "; ARRAYFORMULA(REGEXREPLACE(REGEXREPLACE(TO_TEXT('Data Tim Pengurus'!G:G); \"^\\\\+?0*\"; \"\"); \"[^0-9]\"; \"\")); 0))";

      var formulaE =
        "=INDEX('Data Tim Pengurus'!I:I; MATCH(" +
          formulaNormalized +
          "; ARRAYFORMULA(REGEXREPLACE(REGEXREPLACE(TO_TEXT('Data Tim Pengurus'!G:G); \"^\\\\+?0*\"; \"\"); \"[^0-9]\"; \"\")); 0))";

      var formulaF =
        "=TEXT(A" + lastRow + '; "yyyy-mm-dd")';

      sheetAbsen.getRange(lastRow, 6).setFormula(formulaF);
      sheetAbsen.getRange(lastRow, 3).setFormula(formulaC);
      sheetAbsen.getRange(lastRow, 4).setFormula(formulaD);
      sheetAbsen.getRange(lastRow, 5).setFormula(formulaE);
      sheetAbsen.getRange(lastRow, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');

      SpreadsheetApp.flush(); // make sure the row is written before releasing the lock
    } finally {
      lock.releaseLock();
    }
  }

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

// Menambahkan function doPost untuk handle Registrasi Baru
function doPost(e) {
  var response = { success: false, error: "Unknown error" };
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No data received");
    }
    
    var payload = JSON.parse(e.postData.contents);
    
    if (payload.action === "register") {
      var sheetForm = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data Tim Pengurus");
      var data = payload.data;
      
      function formatDate(date) {
        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var year = date.getFullYear();
        var hours = String(date.getHours()).padStart(2, '0');
        var minutes = String(date.getMinutes()).padStart(2, '0');
        var seconds = String(date.getSeconds()).padStart(2, '0');
        return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
      }

      var now = new Date();
      var timestamp = formatDate(now);
      
      // Menyiapkan array untuk disisipkan ke row baru
      // Berdasarkan struktur:
      // Col 1 (A): Timestamp
      // Col 2 (B): Nama Lengkap
      // Col 3 (C): Nama Panggilan
      // Col 4 (D): Jenis Kelamin
      // Col 5 (E): Domisili Tempat Tinggal
      // Col 6 (F): Paroki/Lingkungan/Wilayah
      // Col 7 (G): No HP (Whatsapp)
      // Col 8 (H): Tanggal Lahir
      // Col 9 (I): Status Keanggotaan
      var newRow = [
        timestamp,
        data.namaLengkap,
        data.namaPanggilan,
        data.jenisKelamin,
        data.domisili,
        data.paroki,
        "'" + data.noHp, // Tambahkan ' agar Google Sheets tidak mengubah format nomor HP
        data.tanggalLahir,
        data.statusKeanggotaan
      ];
      
      sheetForm.appendRow(newRow);
      
      response.success = true;
      response.error = "";
    } else {
      throw new Error("Invalid action");
    }
  } catch (err) {
    response.error = err.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
