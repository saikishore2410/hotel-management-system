import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, RefreshCw, TriangleAlert } from 'lucide-react';
import { apiMode } from './api/hms';
import { useDashboardData } from './hooks/useDashboardData';
import { formatLongDate } from './lib/format';
import MetricsRibbon from './components/MetricsRibbon';
import RoomGrid from './components/RoomGrid';
import RoomDrawer from './components/RoomDrawer';
import QuickBookingForm from './components/QuickBookingForm';
import Toast from './components/Toast';

const PAST_TENSE = {
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked in',
  CHECKED_OUT: 'checked out',
  CANCELLED: 'cancelled',
};

function LoadError({ error, onRetry, hasData }) {
  const missingEndpoint = apiMode === 'live' && error.status === 404;
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-start gap-4 border-l-4 border-occ bg-white px-5 py-4 ${hasData ? 'mb-6' : 'mb-8'}`}
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-occ" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{hasData ? "Couldn't refresh the dashboard" : "Couldn't load the dashboard"}</p>
        <p className="mt-1 text-sm text-ink/75">{error.message}</p>
        {missingEndpoint && (
          <p className="mt-2 text-sm text-ink/75">
            The rooms and guests endpoints aren't on the backend yet. Set VITE_USE_MOCK=true in .env to use demo data
            until they are.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-ink px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-white"
      >
        Try again
      </button>
    </div>
  );
}

export default function App() {
  const { rooms, bookings, metrics, loading, refreshing, error, refresh, createBooking, changeBookingStatus } =
    useDashboardData();

  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [preset, setPreset] = useState({ roomId: null, nonce: 0 });
  const [busyBookingId, setBusyBookingId] = useState(null);
  const [toast, setToast] = useState(null);

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId) ?? null, [rooms, selectedRoomId]);

  const notify = useCallback((message, tone = 'success') => setToast({ message, tone, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const closeDrawer = useCallback(() => setSelectedRoomId(null), []);

  const handleBookRoom = (room) => {
    setSelectedRoomId(null);
    setPreset((p) => ({ roomId: room.id, nonce: p.nonce + 1 }));
  };

  async function handleCreate(payload) {
    const booking = await createBooking(payload);
    notify(`Booking #${booking.id} created for ${booking.guestName} in room ${booking.roomNumber}.`);
    return booking;
  }

  async function handleStatusChange(booking, status) {
    setBusyBookingId(booking.id);
    try {
      await changeBookingStatus(booking.id, status);
      notify(`Booking #${booking.id} for ${booking.guestName} ${PAST_TENSE[status]}.`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyBookingId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-ink text-white">
        <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-brass-light text-ink">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-display text-xl font-bold leading-tight">Front desk</h1>
                <p className="text-sm text-white/70">{formatLongDate()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {apiMode === 'demo' && (
                <span
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85"
                  title="Showing built-in sample data. Set VITE_USE_MOCK=false to use the Spring Boot backend."
                >
                  Demo data
                </span>
              )}
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-md border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline-brass-light disabled:opacity-60"
              >
                <RefreshCw
                  className={`size-4 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`}
                  aria-hidden="true"
                />
                Refresh
              </button>
            </div>
          </div>
          <MetricsRibbon metrics={metrics} loading={loading} />
        </div>
      </header>

      <main className="mx-auto max-w-[88rem] px-4 py-8 sm:px-6 lg:px-8">
        {error && <LoadError error={error} onRetry={refresh} hasData={rooms.length > 0} />}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
          <RoomGrid rooms={rooms} loading={loading} selectedId={selectedRoomId} onSelect={setSelectedRoomId} />
          <QuickBookingForm rooms={rooms} preset={preset} onSubmit={handleCreate} />
        </div>
      </main>

      {selectedRoom && (
        <RoomDrawer
          room={selectedRoom}
          bookings={bookings}
          busyBookingId={busyBookingId}
          onClose={closeDrawer}
          onBookRoom={handleBookRoom}
          onStatusChange={handleStatusChange}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
