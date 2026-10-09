import { useCallback, useEffect, useMemo, useState } from 'react';
import * as hms from '../api/hms';
import { todayISO } from '../lib/format';
import { ACTIVE_BOOKING } from '../lib/status';

const REFRESH_MS = 60_000;

function computeMetrics(rooms, bookings) {
  const today = todayISO();
  const active = bookings.filter((b) => ACTIVE_BOOKING.includes(b.status));
  const inHouse = active.filter((b) => b.status === 'CHECKED_IN').length;
  const availableRooms = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'BOOKED').length;
  const arrivalsToday = active.filter((b) => b.checkInDate === today);

  return {
    totalRooms: rooms.length,
    activeReservations: active.length,
    inHouse,
    upcoming: active.length - inHouse,
    availableRooms,
    occupiedRooms,
    occupancyPct: rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0,
    expectedCheckIns: arrivalsToday.length,
    checkedInToday: arrivalsToday.filter((b) => b.status === 'CHECKED_IN').length,
  };
}

/** Loads rooms and bookings, keeps them fresh, and exposes the two write actions. */
export function useDashboardData() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [roomData, bookingData] = await Promise.all([hms.listRooms(), hms.listBookings()]);
      setRooms(roomData);
      setBookings(bookingData);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const metrics = useMemo(() => computeMetrics(rooms, bookings), [rooms, bookings]);

  const createBooking = useCallback(
    async (payload) => {
      const booking = await hms.createBookingForGuest(payload);
      await load();
      return booking;
    },
    [load],
  );

  const changeBookingStatus = useCallback(
    async (id, status) => {
      const booking = await hms.updateBookingStatus(id, status);
      await load();
      return booking;
    },
    [load],
  );

  return { rooms, bookings, metrics, loading, refreshing, error, refresh: load, createBooking, changeBookingStatus };
}
