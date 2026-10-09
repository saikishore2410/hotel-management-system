import { BedDouble, ClipboardList, DoorOpen, LogIn } from 'lucide-react';

export default function MetricsRibbon({ metrics, loading }) {
  const items = [
    { key: 'active', label: 'Active reservations', value: metrics.activeReservations, note: `${metrics.inHouse} in house, ${metrics.upcoming} upcoming`, icon: ClipboardList },
    { key: 'available', label: 'Available rooms', value: metrics.availableRooms, note: `of ${metrics.totalRooms} rooms`, icon: DoorOpen, dot: 'bg-avail' },
    { key: 'occupied', label: 'Occupied rooms', value: metrics.occupiedRooms, note: `${metrics.occupancyPct}% occupancy`, icon: BedDouble, dot: 'bg-occ' },
    { key: 'checkins', label: "Today's expected check-ins", value: metrics.expectedCheckIns, note: `${metrics.checkedInToday} already checked in`, icon: LogIn },
  ];
  return <ul className="grid grid-cols-2 border-t border-white/10 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
    {items.map(({ key, label, value, note, icon: Icon, dot }) => <li key={key} className="flex items-start justify-between gap-3 px-1 py-5 even:border-l even:border-white/10 lg:px-6 lg:first:pl-0 lg:even:border-l-0 lg:last:pr-0">
      <div><p className="flex items-center gap-2 text-sm text-white/75">{dot && <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />}{label}</p>
        <p className={`mt-1 font-display text-5xl font-extrabold leading-none text-white ${loading ? 'animate-pulse text-white/30' : ''}`}>{loading ? '–' : value}</p>
        <p className="mt-2 text-sm text-white/60">{loading ? 'Loading' : note}</p></div>
      <Icon className="mt-0.5 size-5 shrink-0 text-brass-light" aria-hidden="true" />
    </li>)}
  </ul>;
}
