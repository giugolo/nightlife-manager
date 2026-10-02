import { Event, Guest, Table, GuestList } from '../types';

/**
 * Pure event metrics / revenue logic, extracted from EventDetail.tsx so it can be
 * unit-tested directly (the component memoizes the result with useMemo).
 */
export interface EventMetrics {
  totalGuests: number;
  checkedInGuests: number;
  capacityPercentage: number;
  occupiedTables: number;
  chartData: { name: string; count: number }[];
  maleListGuests: number;
  femaleListGuests: number;
  revenueFromLists: number;
  revenueFromTables: number;
  totalRevenue: number;
}

export function computeMetrics(
  event: Event,
  guests: Guest[],
  tables: Table[],
  lists: GuestList[]
): EventMetrics {
  const totalGuests = guests.length;
  const checkedInGuests = guests.filter(g => g.checkedIn).length;
  const capacityPercentage = Math.round((totalGuests / event.capacity) * 100);
  const occupiedTables = tables.filter(t => guests.some(g => g.tableId === t.id)).length;

  // Chart data: guests per list (lists with zero guests are hidden).
  const chartData = lists
    .map(l => ({
      name: l.name,
      count: guests.filter(g => g.listId === l.id).length,
    }))
    .filter(d => d.count > 0);

  // Revenue: only guests NOT assigned to a table and with a defined gender.
  const listGuests = guests.filter(g => !g.tableId);
  const maleListGuests = listGuests.filter(g => g.isFemale === false).length;
  const femaleListGuests = listGuests.filter(g => g.isFemale === true).length;
  const revenueFromLists =
    maleListGuests * (event.priceListMale || 0) + femaleListGuests * (event.priceListFemale || 0);

  // Table revenue: flat price, or price-per-person * assigned guests.
  const revenueFromTables = tables.reduce((sum, table) => {
    if (!table.price) return sum;
    const tableGuestCount = guests.filter(g => g.tableId === table.id).length;
    if (table.pricePerPerson) {
      return sum + table.price * tableGuestCount;
    }
    return sum + table.price;
  }, 0);

  const totalRevenue = revenueFromLists + revenueFromTables;

  return {
    totalGuests,
    checkedInGuests,
    capacityPercentage,
    occupiedTables,
    chartData,
    maleListGuests,
    femaleListGuests,
    revenueFromLists,
    revenueFromTables,
    totalRevenue,
  };
}
