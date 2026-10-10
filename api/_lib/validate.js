'use strict';
const clean = (v, max) =>
  String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

function validate(body) {
  const b = body && typeof body === 'object' ? body : {};
  const name = clean(b.name, 80);
  const hospital = clean(b.hospital, 120);
  const phone = clean(b.phone, 25);
  const email = clean(b.email, 120);
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2) return { error: 'Please enter your name.' };
  if (hospital.length < 2) return { error: 'Please enter your hospital name.' };
  if (!/^\+?[\d\s\-().]+$/.test(phone) || digits.length < 7 || digits.length > 15)
    return { error: 'Please enter a valid phone number.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'That email address does not look right.' };
  return { value: { name, hospital, phone, email } };
}

module.exports = { validate, clean };
