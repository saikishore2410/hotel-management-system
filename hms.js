import { request } from './client';
import * as mock from './mock';

/**
 * Data access for the dashboard. One flag switches between the real backend and an
 * in-memory demo backend that follows the same contract.
 *
 *   VITE_USE_MOCK=false  -> call Spring Boot through the Vite proxy
 *   anything else        -> demo data (default)
 *
 * Booking endpoints exist today. The rooms and guests endpoints below are the contract the
 * dashboard expects from the backend still to be built.
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
export const apiMode = USE_MOCK ? 'demo' : 'live';

const real = {
  // GET /api/v1/rooms -> [{ id, roomNumber, type, pricePerNight, status }]  (or a PageResponse)
  async listRooms() {
    const data = await request('/rooms');
    return Array.isArray(data) ? data : data.content;
  },

  // GET /api/v1/bookings (exists) -> PageResponse<BookingResponse>
  async listBookings() {
    const page = await request('/bookings', { params: { size: 200, sort: 'checkInDate,asc' } });
    return page.content;
  },

  // GET /api/v1/guests?q=<email> then POST /api/v1/guests -> { id, name, email, phone }
  async findOrCreateGuest(guest) {
    const page = await request('/guests', { params: { q: guest.email, size: 5 } });
    const existing = page.content.find((g) => g.email.toLowerCase() === guest.email.toLowerCase());
    return existing ?? request('/guests', { method: 'POST', body: guest });
  },

  // POST /api/v1/bookings (exists)
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),

  // PATCH /api/v1/bookings/{id}/status (exists)
  updateBookingStatus: (id, status) =>
    request(`/bookings/${id}/status`, { method: 'PATCH', body: { status } }),
};

const impl = USE_MOCK ? mock : real;

export const listRooms = () => impl.listRooms();
export const listBookings = () => impl.listBookings();
export const updateBookingStatus = (id, status) => impl.updateBookingStatus(id, status);

/** The quick-booking flow: resolve the guest by email, then create the booking. */
export async function createBookingForGuest({ guest, roomId, checkInDate, checkOutDate }) {
  const { id: guestId } = await impl.findOrCreateGuest(guest);
  return impl.createBooking({ guestId, roomId, checkInDate, checkOutDate });
}
