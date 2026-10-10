'use strict';
// Server-side source of truth for prices. Keep in sync with public/js/app.js.
const TIERS = {
  1: { name: 'Tier 1 · Presence', price: 19999 },
  2: { name: 'Tier 2 · Appointments', price: 29999 },
};
const ADDONS = {
  wa: { name: 'WhatsApp Booking', price: 9999 },
  gbp: { name: 'Google Business Profile', price: 9999 },
  seo: { name: 'SEO & GEO (first setup)', price: 9999, monthly: 4999 },
};
const ADDON_DISCOUNT = 0.10; // 10% coupon discount on add-ons

function quote(tier, ids) {
  const t = TIERS[tier];
  if (!t) throw new Error('Please choose a package.');
  const list = Array.isArray(ids) ? [...new Set(ids)] : [];
  if (list.length && Number(tier) === 1 && list.includes('seo')) {
    throw new Error('SEO & GEO is only available with Tier 2.');
  }
  const addons = list.map((id) => {
    if (!Object.prototype.hasOwnProperty.call(ADDONS, id)) throw new Error('Unknown add-on.');
    return { id, ...ADDONS[id] };
  });
  const sub = addons.reduce((s, a) => s + a.price, 0);
  const discount = Math.round(sub * ADDON_DISCOUNT);
  const monthly = addons.reduce((s, a) => s + (a.monthly || 0), 0);
  return { tier: Number(tier), tierName: t.name, tierPrice: t.price, addons, sub, discount, total: t.price + sub - discount, monthly };
}

module.exports = { TIERS, ADDONS, ADDON_DISCOUNT, quote };
