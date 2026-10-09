import { BedDouble, Ban, Check, DoorOpen, LogIn, LogOut, Wrench } from 'lucide-react';

export const ROOM_STATUS = {
  AVAILABLE: { label: 'Available', icon: DoorOpen, tile: 'border-avail bg-avail-tint text-avail-ink', strip: 'bg-avail', dot: 'bg-avail', badge: 'bg-avail-tint text-avail-ink ring-avail/40' },
  BOOKED: { label: 'Occupied', icon: BedDouble, tile: 'border-occ bg-occ-tint text-occ-ink', strip: 'bg-occ', dot: 'bg-occ', badge: 'bg-occ-tint text-occ-ink ring-occ/40' },
  MAINTENANCE: { label: 'Maintenance', icon: Wrench, tile: 'border-maint bg-maint-tint text-maint-ink', strip: 'bg-maint', dot: 'bg-maint', badge: 'bg-maint-tint text-maint-ink ring-maint/40' },
};
export const BOOKING_STATUS = {
  PENDING: { label: 'Pending', badge: 'bg-slate-100 text-slate-700 ring-slate-300' },
  CONFIRMED: { label: 'Confirmed', badge: 'bg-sky-50 text-sky-800 ring-sky-300' },
  CHECKED_IN: { label: 'Checked in', badge: 'bg-avail-tint text-avail-ink ring-avail/40' },
  CHECKED_OUT: { label: 'Checked out', badge: 'bg-stone-100 text-stone-600 ring-stone-300' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-occ-tint text-occ-ink ring-occ/40' },
};
export const ACTIVE_BOOKING = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];
export const BOOKING_ACTIONS = {
  PENDING: [
    { status: 'CONFIRMED', label: 'Confirm', icon: Check, kind: 'primary' },
    { status: 'CANCELLED', label: 'Cancel', icon: Ban, kind: 'danger' },
  ],
  CONFIRMED: [
    { status: 'CHECKED_IN', label: 'Check in', icon: LogIn, kind: 'primary' },
    { status: 'CANCELLED', label: 'Cancel', icon: Ban, kind: 'danger' },
  ],
  CHECKED_IN: [{ status: 'CHECKED_OUT', label: 'Check out', icon: LogOut, kind: 'primary' }],
};
