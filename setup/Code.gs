// Bind this script to the RSVP spreadsheet. Run setup once, then deploy as a web app.
function setup() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet) throw new Error('Open this script from the RSVP spreadsheet.');
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('SPREADSHEET_ID', sheet.getId());
  if (!properties.getProperty('RSVP_SECRET')) properties.setProperty('RSVP_SECRET', Utilities.getUuid()+Utilities.getUuid());
}

function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || e.postData.contents.length > 20000) return json_({ok:false});
    const envelope = JSON.parse(e.postData.contents);
    const properties = PropertiesService.getScriptProperties();
    const secret = properties.getProperty('RSVP_SECRET');
    if (!secret || typeof envelope.payload !== 'string') return json_({ok:false});
    const signature = Utilities.computeHmacSha256Signature(envelope.payload,secret,Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
    if (signature !== envelope.signature) return json_({ok:false});
    const data = JSON.parse(envelope.payload);
    if (!Number.isFinite(data.sentAt) || Math.abs(Date.now()-data.sentAt)>300000 || !/^[a-zA-Z0-9-]{20,80}$/.test(data.requestId) || typeof data.name !== 'string' || !data.name.trim() || data.name.length>120 || !['yes','no'].includes(data.attending) || typeof data.wishes !== 'string' || data.wishes.length>2000) return json_({ok:false});
    lock.waitLock(15000);
    const sheet = SpreadsheetApp.openById(properties.getProperty('SPREADSHEET_ID')).getSheetByName('Responses');
    if (!sheet) throw new Error('Responses sheet missing');
    const last = sheet.getLastRow();
    if (last>1 && sheet.getRange(2,5,last-1,1).createTextFinder(data.requestId).matchEntireCell(true).findNext()) return json_({ok:true,requestId:data.requestId});
    const safe = value => /^[=+@\-\t\r\n]/.test(value) ? "'"+value : value;
    sheet.appendRow([Utilities.formatDate(new Date(),'Africa/Cairo','yyyy-MM-dd HH:mm:ss'),safe(data.name.trim()),data.attending==='yes'?'Yes':'No',safe(data.wishes.trim()),data.requestId]);
    SpreadsheetApp.flush();
    return json_({ok:true,requestId:data.requestId});
  } catch (_) { return json_({ok:false}); }
  finally { if (lock.hasLock()) lock.releaseLock(); }
}
