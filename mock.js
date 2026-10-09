import { ApiError } from './client';
import { addDaysISO, nightsBetween, todayISO } from '../lib/format';

/**
 * In-memory demo backend. It reproduces the rules of BookingService so the UI behaves the
 * same against demo data as against Spring Boot: room must be AVAILABLE, no overlap with
 * active bookings, price = nights x price per night, and the same status transitions.
 */

const delay = (ms = 320) => new Promise((resolve) => setTimeout(resolve, ms));
const ACTIVE = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];
const TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  CANCELLED: [],
};

const TYPES = ['SINGLE', 'SINGLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DELUXE', 'SUITE', 'SUITE'];
const PRICES = { SINGLE: 2800, DOUBLE: 4200, DELUXE: 6200, SUITE: 7800 };
const UNDER_MAINTENANCE = new Set(['204', '307']);

const rooms = [1, 2, 3].flatMap((floor) =>
  TYPES.map((type, i) => ({
    id: (floor - 1) * TYPES.length + i + 1,
    roomNumber: `${floor}0${i + 1}`,
    type,
    pricePerNight: PRICES[type],
    status: UNDER_MAINTENANCE.has(`${floor}0${i + 1}`) ? 'MAINTENANCE' : 'AVAILABLE',
  })),
);

const guests = [
  { id: 1, name: 'Aarav Mehta', email: 'aarav.mehta@example.com', phone: '+91 98480 11223', idNumber: 'AADH-4471' },
  { id: 2, name: 'Priya Nair', email: 'priya.nair@example.com', phone: '+91 99890 55102', idNumber: 'PASS-K8821' },
  { id: 3, name: 'Rohan Iyer', email: 'rohan.iyer@example.com', phone: '+91 90000 24680', idNumber: 'DL-TS09-3382' },
  { id: 4, name: 'Meera Kapoor', email: 'meera.kapoor@example.com', phone: '+91 98660 70031', idNumber: 'AADH-9027' },
  { id: 5, name: 'Sanjay Reddy', email: 'sanjay.reddy@example.com', phone: '+91 93470 18844', idNumber: 'PASS-M1175' },
  { id: 6, name: 'Ananya Das', email: 'ananya.das@example.com', phone: '+91 97012 66390', idNumber: 'AADH-2256' },
  { id: 7, name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '+91 98490 40027', idNumber: 'DL-DL01-7710' },
  { id: 8, name: 'Lakshmi Rao', email: 'lakshmi.rao@example.com', phone: '+91 99120 31576', idNumber: 'PASS-R5530' },
];

const bookings = [];
let nextBookingId = 1;
let nextGuestId = guests.length + 1;

const roomByNumber = (n) => rooms.find((r) => r.roomNumber === n);
const now = () => new Date().toISOString();

function seed(roomNumber, guestId, status, inOffset, outOffset) {
  const room = roomByNumber(roomNumber);
  const today = todayISO();
  const checkInDate = addDaysISO(today, inOffset);
  const checkOutDate = addDaysISO(today, outOffset);
  bookings.push({
    id: nextBookingId++,
    guestId,
    roomId: room.id,
    checkInDate,
    checkOutDate,
    totalAmount: room.pricePerNight * nightsBetween(checkInDate, checkOutDate),
    status,
    createdAt: now(),
    updatedAt: now(),
  });
  if (status === 'CHECKED_IN') room.status = 'BOOKED';
}

// In house
seed('102', 1, 'CHECKED_IN', -1, 2);
seed('105', 2, 'CHECKED_IN', -2, 1);
seed('203', 3, 'CHECKED_IN', -3, 0);
seed('206', 4, 'CHECKED_IN', -1, 4);
seed('301', 5, 'CHECKED_IN', 0, 3);
seed('108', 6, 'CHECKED_IN', -4, 1);
// Arriving today and later
seed('103', 7, 'CONFIRMED', 0, 2);
seed('207', 8, 'CONFIRMED', 0, 3);
seed('106', 1, 'PENDING', 0, 1);
seed('305', 3, 'CONFIRMED', 1, 4);
seed('104', 2, 'PENDING', 2, 5);
// History
seed('302', 4, 'CHECKED_OUT', -5, -2);
seed('201', 5, 'CANCELLED', 1, 3);

function toResponse(b) {
  const guest = guests.find((g) => g.id === b.guestId);
  const room = rooms.find((r) => r.id === b.roomId);
  return {
    id: b.id,
    guestId: guest.id,
    guestName: guest.name,
    roomId: room.id,
    roomNumber: room.roomNumber,
    roomType: room.type,
    checkInDate: b.checkInDate,
    checkOutDate: b.checkOutDate,
    nights: nightsBetween(b.checkInDate, b.checkOutDate),
    totalAmount: b.totalAmount,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

const notFound = (what, id) => new ApiError(`${what} not found with id ${id}`, { status: 404 });
const conflict = (message) => new ApiError(message, { status: 409 });

// ---- public API (same shapes as the real backend) ----

export async function listRooms() {
  await delay();
  return structuredClone(rooms);
}

export async function listBookings() {
  await delay();
  return bookings.map(toResponse).sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
}

export async function findOrCreateGuest({ name, email, phone, idNumber }) {
  await delay(200);
  const existing = guests.find((g) => g.email.toLowerCase() === email.toLowerCase());
  if (existing) return { ...existing };
  const guest = { id: nextGuestId++, name, email, phone, idNumber };
  guests.push(guest);
  return { ...guest };
}

export async function createBooking({ guestId, roomId, checkInDate, checkOutDate }) {
  await delay(450);

  if (checkInDate < todayISO()) {
    throw new ApiError('Validation failed', {
      status: 400,
      fieldErrors: { checkInDate: 'Check-in date cannot be in the past' },
    });
  }
  if (checkOutDate <= checkInDate) {
    throw new ApiError('Check-out date must be after check-in date', { status: 400 });
  }
  const guest = guests.find((g) => g.id === guestId);
  if (!guest) throw notFound('Guest', guestId);
  const room = rooms.find((r) => r.id === roomId);
  if (!room) throw notFound('Room', roomId);

  if (room.status !== 'AVAILABLE') {
    throw conflict(`Room ${room.roomNumber} is not available (status: ${room.status})`);
  }
  const overlaps = bookings.some(
    (b) =>
      b.roomId === roomId &&
      ACTIVE.includes(b.status) &&
      b.checkInDate < checkOutDate &&
      b.checkOutDate > checkInDate,
  );
  if (overlaps) {
    throw conflict(
      `Room ${room.roomNumber} already has a reservation overlapping ${checkInDate} to ${checkOutDate}`,
    );
  }

  const booking = {
    id: nextBookingId++,
    guestId,
    roomId,
    checkInDate,
    checkOutDate,
    totalAmount: room.pricePerNight * nightsBetween(checkInDate, checkOutDate),
    status: 'PENDING',
    createdAt: now(),
    updatedAt: now(),
  };
  bookings.push(booking);
  return toResponse(booking);
}

export async function updateBookingStatus(id, status) {
  await delay(350);
  const booking = bookings.find((b) => b.id === id);
  if (!booking) throw notFound('Booking', id);
  if (!TRANSITIONS[booking.status].includes(status)) {
    throw conflict(`Cannot change booking status from ${booking.status} to ${status}`);
  }

  const room = rooms.find((r) => r.id === booking.roomId);
  if (status === 'CHECKED_IN') {
    if (room.status !== 'AVAILABLE') {
      throw conflict(`Room ${room.roomNumber} cannot be checked into (room status: ${room.status})`);
    }
    room.status = 'BOOKED';
  }
  if (status === 'CHECKED_OUT' && room.status === 'BOOKED') room.status = 'AVAILABLE';

  booking.status = status;
  booking.updatedAt = now();
  return toResponse(booking);
}
