import { describe, expect, it } from 'vitest';
import {
  addDaysISO, byRoomNumber, floorLabel, floorOf, formatCurrency, nightsBetween, roomTypeLabel, toISODate,
} from '../format.js';

describe('date utilities', () => {
  it('formats local dates without UTC day drift', () => {
    expect(toISODate(new Date(2026, 0, 2))).toBe('2026-01-02');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDaysISO('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('calculates nights, including leap day, and handles missing values', () => {
    expect(nightsBetween('2024-02-28', '2024-03-01')).toBe(2);
    expect(nightsBetween('2026-04-01', '2026-04-01')).toBe(0);
    expect(nightsBetween('', '2026-04-01')).toBe(0);
  });
});

describe('display utilities', () => {
  it('formats currency in Indian rupees', () => {
    expect(formatCurrency(2800)).toContain('2,800');
    expect(formatCurrency(null)).toContain('0');
  });

  it('sorts room numbers numerically rather than lexicographically', () => {
    const rooms = [{ roomNumber: '101' }, { roomNumber: '12' }, { roomNumber: '2' }];
    expect(rooms.sort(byRoomNumber).map((room) => room.roomNumber)).toEqual(['2', '12', '101']);
  });

  it('maps numeric room IDs to a floor and readable label', () => {
    expect(floorOf('204')).toBe(2);
    expect(floorOf('suite-a')).toBe(0);
    expect(floorLabel(0)).toBe('Other rooms');
    expect(floorLabel(3)).toBe('Floor 3');
  });

  it('falls back to an unknown room type instead of crashing', () => {
    expect(roomTypeLabel('DELUXE')).toBe('Deluxe');
    expect(roomTypeLabel('PENTHOUSE')).toBe('PENTHOUSE');
  });
});
