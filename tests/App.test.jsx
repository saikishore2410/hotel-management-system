import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';

vi.mock('../api/hms', () => {
  const rooms = [
    { id: 1, roomNumber: '101', type: 'SINGLE', pricePerNight: 2800, status: 'AVAILABLE' },
    { id: 2, roomNumber: '102', type: 'DOUBLE', pricePerNight: 4200, status: 'BOOKED' },
    { id: 3, roomNumber: '103', type: 'SUITE', pricePerNight: 7800, status: 'MAINTENANCE' },
  ];
  const bookings = [
    { id: 10, guestName: 'Riya Sen', roomId: 2, roomNumber: '102', roomType: 'DOUBLE', checkInDate: '2026-10-09', checkOutDate: '2026-10-10', totalAmount: 4200, status: 'CHECKED_IN' },
  ];
  return {
    apiMode: 'demo',
    listRooms: vi.fn(async () => structuredClone(rooms)),
    listBookings: vi.fn(async () => structuredClone(bookings)),
    createBookingForGuest: vi.fn(async (payload) => ({ id: 11, guestName: payload.guest.name, roomNumber: '101' })),
    updateBookingStatus: vi.fn(async (id, status) => ({ id, status })),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('front desk dashboard', () => {
  it('renders metrics, room grid and demo-mode indicator', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /front desk/i })).toBeInTheDocument();
    expect(screen.getByText(/demo data/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /room 101, single, available/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quick booking/i })).toBeInTheDocument();
  });

  it('filters rooms by availability and can clear the selection', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: /room 101, single, available/i });
    await user.click(screen.getByRole('button', { name: /available/i, pressed: false }));
    expect(screen.getByRole('button', { name: /room 101, single, available/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /room 102/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /all rooms/i }));
    expect(screen.getByRole('button', { name: /room 102/i })).toBeInTheDocument();
  });

  it('shows validation errors rather than submitting an empty booking', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: /room 101, single, available/i });
    await user.click(screen.getByRole('button', { name: /create booking/i }));
    expect(await screen.findByText(/enter the guest's full name/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  it('opens the room details dialog when a room tile is selected', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /room 102/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Reservations' })).toBeInTheDocument();
  });
});
