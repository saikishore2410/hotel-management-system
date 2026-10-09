import { BOOKING_STATUS, ROOM_STATUS } from '../lib/status';

const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset';

export function RoomStatusBadge({ status }) {
  const tone = ROOM_STATUS[status];
  if (!tone) return null;
  const Icon = tone.icon;
  return (
    <span className={`${base} ${tone.badge}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {tone.label}
    </span>
  );
}

export function BookingStatusBadge({ status }) {
  const tone = BOOKING_STATUS[status];
  if (!tone) return null;
  return <span className={`${base} ${tone.badge}`}>{tone.label}</span>;
}
