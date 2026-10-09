import { useEffect } from 'react';
import { X } from 'lucide-react';
import { BOOKING_ACTIONS } from '../lib/status';
import { formatCurrency, formatDate, roomTypeLabel } from '../lib/format';
import { RoomStatusBadge, BookingStatusBadge } from './StatusBadge';

const NOT_BOOKABLE_REASON = { BOOKED: 'This room is occupied.', MAINTENANCE: 'This room is under maintenance.' };
function BookingRow({ booking, busy, onStatusChange }) {
  const actions = BOOKING_ACTIONS[booking.status] ?? [];
  return <li className="border-b border-line py-4 last:border-0">
    <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{booking.guestName}</p><p className="mt-1 text-sm text-ink/70">{formatDate(booking.checkInDate)} – {formatDate(booking.checkOutDate)}</p></div><BookingStatusBadge status={booking.status} /></div>
    <div className="mt-3 flex items-center justify-between gap-2"><span className="text-sm font-semibold">{formatCurrency(booking.totalAmount)}</span><div className="flex flex-wrap justify-end gap-2">{actions.map(({ status, label, icon: Icon, kind }) => <button key={status} type="button" disabled={busy} onClick={() => onStatusChange(booking, status)} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50 ${kind === 'danger' ? 'border-occ/30 text-occ-ink hover:bg-occ-tint' : 'border-line hover:bg-paper'}`}><Icon className="size-3.5" aria-hidden="true" />{label}</button>)}</div></div>
  </li>;
}
export default function RoomDrawer({ room, bookings, busyBookingId, onClose, onBookRoom, onStatusChange }) {
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  const roomBookings = bookings.filter((b) => b.roomId === room.id && ['PENDING','CONFIRMED','CHECKED_IN'].includes(b.status));
  const current = roomBookings.find((b) => b.status === 'CHECKED_IN');
  return <div className="fixed inset-0 z-40 flex justify-end bg-ink/45" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <aside role="dialog" aria-modal="true" aria-labelledby="room-drawer-title" className="flex h-full w-full max-w-lg animate-drawer-in flex-col overflow-y-auto bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-line px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-widest text-brass">Room details</p><h2 id="room-drawer-title" className="mt-1 font-display text-3xl font-extrabold">Room {room.roomNumber}</h2><p className="mt-1 text-sm text-ink/65">{roomTypeLabel(room.type)}</p></div><button type="button" onClick={onClose} aria-label="Close room details" className="rounded-md p-2 hover:bg-paper"><X className="size-5" /></button></div>
      <dl className="grid grid-cols-2 divide-x divide-line border-b border-line"><div className="px-6 py-4"><dt className="text-xs font-semibold uppercase tracking-wider text-ink/60">Status</dt><dd className="mt-2"><RoomStatusBadge status={room.status} /></dd></div><div className="px-6 py-4"><dt className="text-xs font-semibold uppercase tracking-wider text-ink/60">Per night</dt><dd className="mt-1 font-display text-2xl font-bold">{formatCurrency(room.pricePerNight)}</dd></div></dl>
      <div className="flex-1 px-6 py-5">{current && <div className="mb-6 rounded-lg bg-occ-tint px-4 py-3 text-occ-ink"><p className="text-sm font-semibold">In the room now</p><p className="font-display text-lg font-bold">{current.guestName}</p><p className="text-sm">Checked in {formatDate(current.checkInDate)}, leaves {formatDate(current.checkOutDate)}</p></div>}
        <h3 className="mb-3 font-display text-lg font-bold">Reservations</h3>{roomBookings.length === 0 ? <p className="rounded-lg border border-dashed border-line px-4 py-6 text-sm text-ink/70">No active reservations for this room.</p> : <ul>{roomBookings.map((booking) => <BookingRow key={booking.id} booking={booking} busy={busyBookingId === booking.id} onStatusChange={onStatusChange} />)}</ul>}
      </div>
      <div className="sticky bottom-0 border-t border-line bg-white px-6 py-4">{room.status === 'AVAILABLE' ? <button type="button" onClick={() => onBookRoom(room)} className="w-full rounded-md bg-brass px-4 py-3 text-sm font-semibold text-white hover:bg-brass-dark">Book room {room.roomNumber}</button> : <p className="text-sm text-ink/75">{NOT_BOOKABLE_REASON[room.status]}</p>}</div>
    </aside>
  </div>;
}
