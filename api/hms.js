import { request } from './client';
import * as mock from '../mock.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
export const apiMode = USE_MOCK ? 'demo' : 'live';

const real = {
  async listRooms() {
    const data = await request('/rooms');
    return Array.isArray(data) ? data : data.content ?? [];
  },
  async listBookings() {
    const page = await request('/bookings', { params: { size: 200, sort: 'checkInDate,asc' } });
    return page.content ?? [];
  },
  async findOrCreateGuest(guest) {
    const page = await request('/guests', { params: { q: guest.email, size: 5 } });
    const list = page.content ?? [];
    const existing = list.find((g) => g.email.toLowerCase() === guest.email.toLowerCase());
    return existing ?? request('/guests', { method: 'POST', body: guest });
  },
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  updateBookingStatus: (id, status) =>
    request(`/bookings/${id}/status`, { method: 'PATCH', body: { status } }),
};
const impl = USE_MOCK ? mock : real;
export const listRooms = () => impl.listRooms();
export const listBookings = () => impl.listBookings();
export const updateBookingStatus = (id, status) => impl.updateBookingStatus(id, status);
export async function createBookingForGuest({ guest, roomId, checkInDate, checkOutDate }) {
  const { id: guestId } = await impl.findOrCreateGuest(guest);
  return impl.createBooking({ guestId, roomId, checkInDate, checkOutDate });
}
