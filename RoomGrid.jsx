import { useMemo, useState } from 'react';
import { ROOM_STATUS } from '../lib/status';
import { byRoomNumber, floorLabel, floorOf, formatCurrency, roomTypeLabel, ROOM_TYPE_LABEL } from '../lib/format';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All rooms' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'BOOKED', label: 'Occupied' },
  { key: 'MAINTENANCE', label: 'Maintenance' },
];

function RoomTile({ room, selected, onSelect }) {
  const tone = ROOM_STATUS[room.status] ?? ROOM_STATUS.MAINTENANCE;
  const Icon = tone.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      aria-haspopup="dialog"
      aria-label={`Room ${room.roomNumber}, ${roomTypeLabel(room.type)}, ${tone.label}. Open details.`}
      className={`relative overflow-hidden rounded-lg border-2 px-3 pb-3 pt-6 text-left transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${tone.tile} ${
        selected ? 'ring-4 ring-ink/25' : ''
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-2 ${tone.strip}`} aria-hidden="true" />
      <span
        className="absolute right-3 top-3.5 size-2.5 rounded-full border-2 border-current/40 bg-paper"
        aria-hidden="true"
      />
      <span className="block font-display text-3xl font-extrabold leading-none">{room.roomNumber}</span>
      <span className="mt-1.5 block text-sm font-semibold">{roomTypeLabel(room.type)}</span>
      <span className="block text-xs">{formatCurrency(room.pricePerNight)} per night</span>
      <span className="mt-3 flex items-center gap-1.5 border-t border-current/25 pt-2 text-xs font-semibold">
        <Icon className="size-3.5" aria-hidden="true" />
        {tone.label}
      </span>
    </button>
  );
}

function SkeletonTiles() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-lg bg-line/60 motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export default function RoomGrid({ rooms, loading, selectedId, onSelect }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const counts = useMemo(() => {
    const result = { ALL: rooms.length, AVAILABLE: 0, BOOKED: 0, MAINTENANCE: 0 };
    rooms.forEach((r) => {
      if (result[r.status] !== undefined) result[r.status] += 1;
    });
    return result;
  }, [rooms]);

  const floors = useMemo(() => {
    const visible = rooms
      .filter((r) => statusFilter === 'ALL' || r.status === statusFilter)
      .filter((r) => typeFilter === 'ALL' || r.type === typeFilter)
      .sort(byRoomNumber);
    const map = new Map();
    visible.forEach((room) => {
      const floor = floorOf(room.roomNumber);
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor).push(room);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [rooms, statusFilter, typeFilter]);

  const clearFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
  };

  return (
    <section aria-labelledby="rooms-heading" className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="rooms-heading" className="font-display text-2xl font-bold">
          Rooms
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter rooms by status">
            {STATUS_FILTERS.map(({ key, label }) => {
              const active = statusFilter === key;
              const dot = ROOM_STATUS[key]?.dot;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors motion-reduce:transition-none ${
                    active ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink/40'
                  }`}
                >
                  {dot && <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />}
                  {label}
                  <span className={active ? 'text-white/70' : 'text-ink/55'}>{counts[key]}</span>
                </button>
              );
            })}
          </div>
          <label className="sr-only" htmlFor="type-filter">
            Filter by room type
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-sm font-medium"
          >
            <option value="ALL">All types</option>
            {Object.entries(ROOM_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {loading && <SkeletonTiles />}

        {!loading && floors.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center">
            <p className="font-semibold">No rooms match these filters</p>
            <p className="mt-1 text-sm text-ink/70">Show every room to see the full board again.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-md border border-ink px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-white"
            >
              Show all rooms
            </button>
          </div>
        )}

        {!loading &&
          floors.map(([floor, floorRooms]) => {
            const free = floorRooms.filter((r) => r.status === 'AVAILABLE').length;
            return (
              <div key={floor}>
                <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
                  <h3 className="font-display text-lg font-bold">{floorLabel(floor)}</h3>
                  <p className="text-sm text-ink/65">
                    {free} of {floorRooms.length} available
                  </p>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
                  {floorRooms.map((room) => (
                    <RoomTile key={room.id} room={room} selected={room.id === selectedId} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
