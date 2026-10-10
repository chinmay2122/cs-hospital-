'use strict';
const nodemailer = require('nodemailer');
const { quote } = require('./_lib/pricing');
const { validate, clean } = require('./_lib/validate');

const MAIL_TO = process.env.MAIL_TO || 'chinmaysganiga2005@gmail.com, umeshgalatage@gmail.com';
const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const istNow = () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';

// Best-effort rate limit (per warm server instance).
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = 5;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < win)) hits.delete(k);
  return list.length > max;
}

function makeTransport() {
  if (process.env.MAIL_DRY_RUN === '1') return nodemailer.createTransport({ jsonTransport: true });
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: SMTP_HOST, port, secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000,
  });
}

function buildMessages(c, q, submissionId) {
  const lines = [
    'New Website Form Submission',
    '===========================',
    'Form Type: Hospital Website Order',
    `Submission ID: ${submissionId}`,
    `Submitted At: ${istNow()}`,
    '',
    '--- Visitor Contact Details ---',
    `Name: ${c.name}`,
    `Hospital / Clinic: ${c.hospital}`,
    `Phone: ${c.phone}`,
    `Email: ${c.email || '(Not provided)'}`,
    '',
    '--- Order Details ---',
    `Package: ${q.tierName} — ${inr(q.tierPrice)}`,
    'Add-ons: ' + (q.addons.length ? q.addons.map((a) => `${a.name} (${inr(a.price)})`).join(', ') : 'None'),
  ];
  if (q.sub) {
    lines.push(`Add-ons subtotal: ${inr(q.sub)}`);
    lines.push(`10% Coupon discount: -${inr(q.discount)}`);
  }
  lines.push(`Total (One-time): ${inr(q.total)}`);
  if (q.monthly) lines.push(`Recurring: ${inr(q.monthly)}/month for SEO & GEO (from the second month)`);
  lines.push('', 'Recipients: chinmaysganiga2005@gmail.com, umeshgalatage@gmail.com');
  const text = lines.join('\n');

  const row = (k, v) => `<tr><td style="padding:6px 14px 6px 0;color:#555">${esc(k)}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
<h2 style="margin:0 0 12px">New Website Form Submission</h2>
<p style="color:#666;margin:0 0 16px">Form Type: <b>Hospital Website Order</b> · Ref: ${esc(submissionId)} · Received: ${esc(istNow())}</p>
<table style="border-collapse:collapse">${row('Name', c.name)}${row('Hospital', c.hospital)}${row('Phone', c.phone)}${row('Email', c.email || '(Not provided)')}</table>
<h3 style="margin:18px 0 6px">Order Breakdown</h3>
<table style="border-collapse:collapse">${row('Package', `${q.tierName} — ${inr(q.tierPrice)}`)}
${q.addons.map((a) => row('Add-on', `${a.name} — ${inr(a.price)}`)).join('') || row('Add-ons', 'None')}
${q.sub ? row('Add-ons subtotal', inr(q.sub)) + row('10% Coupon discount', '-' + inr(q.discount)) : ''}
${row('Total (One-time)', inr(q.total))}${q.monthly ? row('Recurring', `${inr(q.monthly)}/month for SEO & GEO (from month 2)`) : ''}</table>
<p style="color:#888;font-size:12px;margin-top:20px">Delivered to: chinmaysganiga2005@gmail.com, umeshgalatage@gmail.com</p></div>`;
  return { text, html };
}

async function sendMail(c, q, submissionId) {
  const t = makeTransport();
  if (!t) throw new Error('SMTP is not configured');
  const { text, html } = buildMessages(c, q, submissionId);
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'support@donornearby.in';
  await t.sendMail({
    from: `"Chitta Studios" <${from}>`,
    to: MAIL_TO,
    replyTo: c.email || undefined,
    subject: clean(`New Form Submission: ${q.tierName} · ${c.hospital}`, 150),
    text, html,
  });
}

async function saveToSheet(c, q, submissionId) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) throw new Error('Sheet is not configured');
  const secret = process.env.SHEET_SECRET || '';
  const res = await fetch(url, {
    method: 'POST', redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      submissionId,
      formType: 'Website Form Submissions',
      name: c.name,
      hospital: c.hospital,
      phone: c.phone,
      email: c.email || '',
      package: q.tierName,
      addons: q.addons.length ? q.addons.map((a) => a.name).join(', ') : 'None',
      subtotal: q.sub,
      discount: q.discount,
      total: q.total,
      monthly: q.monthly,
      submittedAt: istNow(),
    }),
    signal: AbortSignal.timeout(9000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || (!j.ok && !j.success)) throw new Error(j.error || 'Sheet rejected the row');
  return j;
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const send = (code, obj) => res.status(code).json(obj);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { ok: false, error: 'Method not allowed.' }); }

  const origin = req.headers.origin;
  if (origin) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    let ok = false;
    try { ok = new URL(origin).host === host; } catch (_) {}
    if (!ok) return send(403, { ok: false, error: 'Request not allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
  if (!body || typeof body !== 'object') return send(400, { ok: false, error: 'Invalid request.' });

  // Honeypot: bots fill the hidden field. Pretend success, do nothing.
  if (body._honey) return send(200, { ok: true });

  const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'unknown').split(',')[0].trim();
  if (limited(ip)) return send(429, { ok: false, error: 'Too many requests. Please try again in a few minutes.' });

  const v = validate(body);
  if (v.error) return send(400, { ok: false, error: v.error });
  let q;
  try { q = quote(body.tier, body.addons); } catch (e) { return send(400, { ok: false, error: e.message }); }

  const submissionId = 'SUB-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();

  let sheetSaved = false;
  let emailSent = false;

  // 1. Save to Google Sheets
  try {
    const sheetRes = await saveToSheet(v.value, q, submissionId);
    sheetSaved = true;
    if (sheetRes && (sheetRes.emailStatus === 'Sent' || sheetRes.emailStatus === true)) {
      emailSent = true;
    }
  } catch (err) {
    console.error('[order] sheet save failed:', err.message);
  }

  // 2. Send email via SMTP if configured
  try {
    await sendMail(v.value, q, submissionId);
    emailSent = true;
  } catch (err) {
    console.error('[order] SMTP email failed:', err.message);
  }

  // If both failed completely, return error so the client can notify the user
  if (!sheetSaved && !emailSent) {
    return send(502, { ok: false, error: 'We could not send your request just now. Please try again.' });
  }

  return send(200, {
    ok: true,
    total: q.total,
    submissionId,
    sheetSaved,
    emailSent,
    notice: !emailSent ? 'Your submission has been safely saved in Google Sheets. Email notification is queued.' : undefined
  });
}

module.exports = handler;
