import { describe, it, expect } from 'vitest';
import type { Event, Guest, Table, GuestList } from '../types';
import { computeMetrics } from '../services/metrics';

/**
 * Tests the REAL pure metrics/revenue logic extracted to services/metrics.ts
 * (used by EventDetail.tsx via useMemo).
 */

// --- Test fixtures -----------------------------------------------------------

const event: Event = {
  id: 'e1',
  name: 'Saturday Night',
  date: '2026-07-01T23:00:00Z',
  location: 'Club',
  capacity: 100,
  priceListMale: 20,
  priceListFemale: 10,
};

const lists: GuestList[] = [
  { id: 'l1', name: 'Lista A', prId: 'p1', eventId: 'e1' },
  { id: 'l2', name: 'Lista B', prId: 'p2', eventId: 'e1' },
  { id: 'l3', name: 'Lista Vuota', prId: 'p3', eventId: 'e1' },
];

const tables: Table[] = [
  { id: 't1', number: '1', capacity: 4, eventId: 'e1', price: 200 }, // flat price
  { id: 't2', number: '2', capacity: 6, eventId: 'e1', price: 50, pricePerPerson: true },
  { id: 't3', number: '3', capacity: 4, eventId: 'e1' }, // no price -> ignored
];

const guests: Guest[] = [
  // list guests (no tableId)
  { id: 'g1', name: 'Uomo1', listId: 'l1', eventId: 'e1', isFemale: false, checkedIn: true },
  { id: 'g2', name: 'Uomo2', listId: 'l1', eventId: 'e1', isFemale: false },
  { id: 'g3', name: 'Donna1', listId: 'l2', eventId: 'e1', isFemale: true, checkedIn: true },
  // gender undefined -> excluded from revenue, still counted in totals
  { id: 'g4', name: 'NoGender', listId: 'l2', eventId: 'e1' },
  // table guests
  { id: 'g5', name: 'Tav1A', listId: 'l1', eventId: 'e1', isFemale: true, tableId: 't1' },
  { id: 'g6', name: 'Tav2A', listId: 'l1', eventId: 'e1', isFemale: false, tableId: 't2' },
  { id: 'g7', name: 'Tav2B', listId: 'l2', eventId: 'e1', isFemale: true, tableId: 't2' },
];

describe('computeMetrics', () => {
  const m = computeMetrics(event, guests, tables, lists);

  it('counts total and checked-in guests', () => {
    expect(m.totalGuests).toBe(7);
    expect(m.checkedInGuests).toBe(2);
  });

  it('computes capacity percentage rounded', () => {
    // 7 / 100 = 7%
    expect(m.capacityPercentage).toBe(7);
  });

  it('counts only tables that have at least one assigned guest', () => {
    // t1 (g5) and t2 (g6, g7) occupied; t3 empty
    expect(m.occupiedTables).toBe(2);
  });

  it('excludes empty lists from chart data', () => {
    expect(m.chartData).toEqual([
      { name: 'Lista A', count: 4 }, // g1, g2, g5, g6 (chartData counts by listId, table guests included)
      { name: 'Lista B', count: 3 }, // g3, g4, g7
    ]);
  });

  it('counts list-only guests by gender, ignoring table guests and undefined gender', () => {
    expect(m.maleListGuests).toBe(2); // g1, g2
    expect(m.femaleListGuests).toBe(1); // g3 (g4 undefined excluded)
  });

  it('computes list revenue from gendered list guests only', () => {
    // 2 men * 20 + 1 woman * 10 = 50
    expect(m.revenueFromLists).toBe(50);
  });

  it('computes table revenue: flat price + per-person price, ignoring priceless tables', () => {
    // t1 flat 200; t2 per-person 50 * 2 guests = 100; t3 no price = 0
    expect(m.revenueFromTables).toBe(300);
  });

  it('sums total revenue', () => {
    expect(m.totalRevenue).toBe(350);
  });
});

describe('computeMetrics edge cases', () => {
  it('handles an event with no guests', () => {
    const m = computeMetrics(event, [], tables, lists);
    expect(m.totalGuests).toBe(0);
    expect(m.capacityPercentage).toBe(0);
    expect(m.occupiedTables).toBe(0);
    expect(m.chartData).toEqual([]);
    expect(m.revenueFromLists).toBe(0);
    // tables with flat price still count even with no guests on them
    expect(m.revenueFromTables).toBe(200);
    expect(m.totalRevenue).toBe(200);
  });

  it('treats missing prices as zero', () => {
    const freeEvent: Event = { ...event, priceListMale: undefined, priceListFemale: undefined };
    const m = computeMetrics(freeEvent, guests, [], lists);
    expect(m.revenueFromLists).toBe(0);
    expect(m.revenueFromTables).toBe(0);
  });
});
