// Change currency here if the property bills in a different currency.
const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});
export const formatCurrency = (amount) => currency.format(Number(amount ?? 0));
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export const todayISO = () => toISODate(new Date());
function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}
export function addDaysISO(iso, days) {
  const { y, m, d } = parseISO(iso);
  return toISODate(new Date(y, m - 1, d + days));
}
export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const a = parseISO(checkIn); const b = parseISO(checkOut);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}
export function formatDate(iso) {
  const { y, m, d } = parseISO(iso);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
export const formatLongDate = (date = new Date()) =>
  date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const ROOM_TYPE_LABEL = { SINGLE: 'Single', DOUBLE: 'Double', SUITE: 'Suite', DELUXE: 'Deluxe' };
export const roomTypeLabel = (type) => ROOM_TYPE_LABEL[type] ?? type;
export function floorOf(roomNumber) {
  const n = parseInt(roomNumber, 10);
  return Number.isNaN(n) ? 0 : Math.floor(n / 100);
}
export const floorLabel = (floor) => (floor === 0 ? 'Other rooms' : `Floor ${floor}`);
export const byRoomNumber = (a, b) =>
  String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true });
