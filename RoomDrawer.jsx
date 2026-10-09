import { useEffect, useRef } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { ACTIVE_BOOKING, BOOKING_ACTIONS, ROOM_STATUS } from '../lib/status';
import { floorLabel, floorOf, formatCurrency, formatDate, roomTypeLabel } from '../lib/format';
import { BookingStatusBadge, RoomStatusBadge } from './StatusBadge';

const NOT_BOOKABLE_REASON = {
  BOOKED: 'This room is occupied. It can be booked again after check-out.',
  MAINTENANCE: 'This room is under maintenance. An admin needs to return it to service before it can be booked.',
};

function BookingRow({ booking, busy, onStatusChange }) {
  const actions = BOOKING_ACTIONS[booking.status] ?? [];
  const nights = `${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'}`;

  const handle = (status) => {
    if (status === 'CANCELLED' && !window.confirm(`Cancel booking #${booking.id} for ${booking.guestName}?`)) return;
    onStatusChange(booking, status);
  };

  return (
    <li className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{booking.guestName}</p>
          <p className="text-sm text-ink/70">
            {formatDate(booking.checkInDate)} to {formatDate(booking.checkOutDate)}, {nights}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
      <p className="mt-1 text-sm text-ink/70">
        Booking #{booking.id}, total {formatCurrency(booking.totalAmount)}
      </p>
      {actions.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          {actions.map(({ status, label, icon: Icon, kind }) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              onClick={() => handle(status)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                kind === 'primary'
                  ? 'bg-ink text-white hover:bg-ink/90'
                  : 'border border-occ/50 text-occ-ink hover:bg-occ-tint'
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
          {busy && (
            <span className="inline-flex items-center gap-1.5 text-sm text-ink/70" role="status">
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Updating
            </span>
          )}
        </div>
      )}
    </li>
  );
}

export default function RoomDrawer({ room, bookings, busyBookingId, onClose, onBookRoom, onStatusChange }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const tone = ROOM_STATUS[room.status] ?? ROOM_STATUS.MAINTENANCE;

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Focus the close button, lock page scroll, close on Escape, and hand focus back on exit.
  useEffect(() => {
    const previous = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
      previous?.focus?.();
    };
  }, []);

  const roomBookings = bookings
    .filter((b) => b.roomId === room.id && ACTIVE_BOOKING.includes(b.status))
    .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  const current = roomBookings.find((b) => b.status === 'CHECKED_IN');

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 animate-fade-in bg-ink/50 motion-reduce:animate-none" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md animate-drawer-in flex-col overflow-y-auto bg-white shadow-2xl motion-reduce:animate-none"
      >
        <div className={`h-2 shrink-0 ${tone.strip}`} aria-hidden="true" />

        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <p className="text-sm text-ink/70">
              {roomTypeLabel(room.type)} room on {floorLabel(floorOf(room.roomNumber)).toLowerCase()}
            </p>
            <h2 id="drawer-title" className="font-display text-4xl font-extrabold leading-tight">
              Room {room.roomNumber}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close room details"
            className="rounded-md p-2 text-ink/70 hover:bg-paper hover:text-ink"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 pt-3">
          <RoomStatusBadge status={room.status} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line px-6 py-5">
          <div>
            <dt className="text-sm text-ink/70">Price per night</dt>
            <dd className="font-display text-2xl font-bold">{formatCurrency(room.pricePerNight)}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink/70">Room type</dt>
            <dd className="font-display text-2xl font-bold">{roomTypeLabel(room.type)}</dd>
          </div>
        </dl>

        <div className="flex-1 px-6 py-5">
          {current && (
            <div className="mb-6 rounded-lg bg-occ-tint px-4 py-3 text-occ-ink">
              <p className="text-sm font-semibold">In the room now</p>
              <p className="font-display text-lg font-bold">{current.guestName}</p>
              <p className="text-sm">
                Checked in {formatDate(current.checkInDate)}, leaves {formatDate(current.checkOutDate)}
              </p>
            </div>
          )}

          <h3 className="mb-3 font-display text-lg font-bold">Reservations</h3>
          {roomBookings.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-4 py-6 text-sm text-ink/70">
              No active reservations for this room.
            </p>
          ) : (
            <ul>
              {roomBookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  busy={busyBookingId === booking.id}
                  onStatusChange={onStatusChange}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-line bg-white px-6 py-4">
          {room.status === 'AVAILABLE' ? (
            <button
              type="button"
              onClick={() => onBookRoom(room)}
              className="w-full rounded-md bg-brass px-4 py-3 text-sm font-semibold text-white hover:bg-brass-dark"
            >
              Book room {room.roomNumber}
            </button>
          ) : (
            <p className="text-sm text-ink/75">{NOT_BOOKABLE_REASON[room.status]}</p>
          )}
        </div>
      </aside>
    </div>
  );
}
