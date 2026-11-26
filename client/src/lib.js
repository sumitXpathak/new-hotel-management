export const BRAND = 'Haveli';

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const localISO = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
export const nightsLabel = (n) => `${n} ${n === 1 ? 'night' : 'nights'}`;
export const statusLabel = {
  booked: 'Booked',
  'checked-in': 'Checked in',
  'checked-out': 'Checked out',
  cancelled: 'Cancelled',
};
