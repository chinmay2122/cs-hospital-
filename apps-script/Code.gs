/**
 * Chitta Studios - Google Apps Script Form Automation
 * Stores submissions in "Website Form Submissions" and sends email notifications to:
 * - chinmaysganiga2005@gmail.com
 * - umeshgalatage@gmail.com
 */

// OPTIONAL: If you want to connect a specific Google Sheet, paste its URL or ID here:
var SPREADSHEET_ID_OR_URL = 'https://docs.google.com/spreadsheets/d/1_sxUkU6deNJRRjFH9HF8mUmngDblBBndGPdZuKQDFBY/edit?gid=0#gid=0';

var SPREADSHEET_NAME = 'Website Form Submissions';
var RECIPIENTS = ['chinmaysganiga2005@gmail.com', 'umeshgalatage@gmail.com'];
var HEADERS = [
  'Submission Timestamp (IST)',
  'Submission ID',
  'Form Type',
  'Name',
  'Hospital / Clinic',
  'Phone',
  'Email',
  'Package',
  'Add-ons',
  'Subtotal (₹)',
  'Discount (₹)',
  'Total (₹)',
  'Monthly Recurring (₹)',
  'Email Delivery Status',
  'Status'
];

function getSpreadsheet() {
  var ss = null;
  // 1. Try by provided URL or ID
  if (SPREADSHEET_ID_OR_URL && SPREADSHEET_ID_OR_URL.trim()) {
    var raw = SPREADSHEET_ID_OR_URL.trim();
    var match = raw.match(/\/d\/([a-zA-Z0-9-_]+)/);
    var id = match ? match[1] : raw;
    try {
      ss = SpreadsheetApp.openById(id);
      return ss;
    } catch (e) {
      Logger.log('Could not open spreadsheet by ID: ' + e);
    }
  }

  // 2. Try active spreadsheet (if script was opened from Extensions > Apps Script inside a sheet)
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (_) {}

  // 3. Try finding spreadsheet by name in Google Drive
  try {
    var files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    if (files.hasNext()) {
      return SpreadsheetApp.open(files.next());
    }
    // 4. Create new spreadsheet in Drive if not found
    return SpreadsheetApp.create(SPREADSHEET_NAME);
  } catch (err) {
    Logger.log('DriveApp error: ' + err);
  }

  return null;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return reply({ success: false, ok: false, error: 'No data received.' });
    }

    var data = {};
    try {
      data = JSON.parse(e.postData.contents);
    } catch (_) {
      data = e.parameter || {};
    }

    // Optional secret check if configured in Script Properties
    var secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (secret && data.secret && data.secret !== secret) {
      return reply({ success: false, ok: false, error: 'Unauthorized.' });
    }

    // 1. Get or Open Spreadsheet
    var ss = getSpreadsheet();
    if (!ss) {
      return reply({ success: false, ok: false, error: 'Could not access or create Google Sheet.' });
    }

    // 2. Get or Create Sheet Tab
    var sheet = ss.getSheetByName(SPREADSHEET_NAME) || ss.getSheetByName('Orders') || ss.getActiveSheet();
    if (!sheet) {
      sheet = ss.insertSheet(SPREADSHEET_NAME);
    }

    // Initialize Header Row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#EAF3FF');
      sheet.setFrozenRows(1);
    }

    var when = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a') + ' IST';
    var subId = String(data.submissionId || ('SUB-' + Date.now())).trim();
    var formType = data.formType || 'Hospital Website Order';
    var name = String(data.name || '').trim();
    var hospital = String(data.hospital || '').trim();
    var phone = String(data.phone || '').trim();
    var email = String(data.email || '').trim();
    var pkg = String(data.package || '').trim();
    var addons = String(data.addons || 'None').trim();
    var subtotal = Number(data.subtotal) || 0;
    var discount = Number(data.discount) || 0;
    var total = Number(data.total) || 0;
    var monthly = Number(data.monthly) || 0;

    // Check for duplicate submission ID
    var lastRow = sheet.getLastRow();
    var isDuplicate = false;
    if (lastRow > 1) {
      var subIdCol = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < subIdCol.length; i++) {
        if (subIdCol[i][0] === subId) {
          isDuplicate = true;
          break;
        }
      }
    }

    // 3. Send email notifications to both recipients
    var emailStatus = 'Sent';
    try {
      var subject = 'New Form Submission: ' + (pkg ? pkg + ' · ' : '') + hospital;
      var body = [
        'New Form Submission received on Chitta Studios Website',
        '=======================================================',
        'Submission ID: ' + subId,
        'Date & Time: ' + when,
        'Form Type: ' + formType,
        '',
        '--- Visitor Contact Details ---',
        'Name: ' + name,
        'Hospital / Clinic: ' + hospital,
        'Phone Number: ' + phone,
        'Email Address: ' + (email || '(Not provided)'),
        '',
        '--- Order Breakdown ---',
        'Package: ' + pkg,
        'Add-ons: ' + addons,
        'Subtotal: ₹' + subtotal.toLocaleString('en-IN'),
        '10% Coupon Discount: -₹' + discount.toLocaleString('en-IN'),
        'Total (One-time): ₹' + total.toLocaleString('en-IN'),
        monthly ? 'Recurring (Monthly): ₹' + monthly.toLocaleString('en-IN') + '/month' : '',
        '=======================================================',
        'Sent to: ' + RECIPIENTS.join(', ')
      ].filter(Boolean).join('\n');

      for (var r = 0; r < RECIPIENTS.length; r++) {
        MailApp.sendEmail({
          to: RECIPIENTS[r],
          subject: subject,
          body: body
        });
      }
    } catch (mailError) {
      emailStatus = 'Failed: ' + mailError.toString();
      Logger.log('Mail error: ' + mailError.toString());
    }

    // 4. Record row in Google Sheet if not duplicate
    if (!isDuplicate) {
      sheet.appendRow([
        when,
        subId,
        formType,
        name,
        hospital,
        "'" + phone,
        email || '(Not provided)',
        pkg,
        addons,
        subtotal,
        discount,
        total,
        monthly,
        emailStatus,
        'New'
      ]);
    }

    return reply({
      success: true,
      ok: true,
      submissionId: subId,
      emailStatus: emailStatus,
      duplicate: isDuplicate,
      sheetUrl: ss.getUrl()
    });
  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return reply({ success: false, ok: false, error: err.toString() });
  }
}

function doGet(e) {
  var ss = getSpreadsheet();
  var info = "Website form automation is active.\n";
  if (ss) {
    info += "Connected Google Sheet: " + ss.getName() + "\n";
    info += "Sheet URL: " + ss.getUrl() + "\n";
    var sh = ss.getSheetByName(SPREADSHEET_NAME) || ss.getActiveSheet();
    if (sh) info += "Total rows: " + sh.getLastRow();
  } else {
    info += "No spreadsheet currently linked.";
  }
  return ContentService.createTextOutput(info);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
