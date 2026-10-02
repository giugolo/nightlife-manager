import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { PR, GuestList, Guest, Table } from '../../types';
import { firestoreService } from '../../services/firestoreService';

export interface EventData {
  prs: PR[];
  lists: GuestList[];
  guests: Guest[];
  tables: Table[];
  loading: boolean;
  /** Reload all collections for the event from Firestore. */
  loadData: () => Promise<void>;
  /** Exposed for optimistic UI updates (e.g. check-in toggle). */
  setGuests: Dispatch<SetStateAction<Guest[]>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

/**
 * Loads and owns the four event collections (PRs, lists, guests, tables).
 * Extracted from EventDetail so the tab components can stay presentational and
 * so the data lifecycle is reusable/testable on its own.
 */
export function useEventData(eventId: string): EventData {
  const [prs, setPrs] = useState<PR[]>([]);
  const [lists, setLists] = useState<GuestList[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedPRs, fetchedLists, fetchedGuests, fetchedTables] = await Promise.all([
        firestoreService.getPRs(eventId),
        firestoreService.getLists(eventId),
        firestoreService.getGuests(eventId),
        firestoreService.getTables(eventId),
      ]);
      setPrs(fetchedPRs);
      setLists(fetchedLists);
      setGuests(fetchedGuests);
      setTables(fetchedTables);
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { prs, lists, guests, tables, loading, loadData, setGuests, setLoading };
}
