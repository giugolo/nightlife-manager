import React, { useState, useRef } from 'react';
import {
  Plus, Trash2, Search, Filter, Check, Table as TableIcon,
} from 'lucide-react';
import { Event, GuestList, Guest, Table } from '../../types';
import { firestoreService } from '../../services/firestoreService';
import { useToast } from '../../contexts/ToastContext';
import { Modal, Button } from '../ui';
import { ConfirmControls } from './confirm';

interface GuestsTabProps extends ConfirmControls {
  event: Event;
  guests: Guest[];
  lists: GuestList[];
  tables: Table[];
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  loadData: () => Promise<void> | void;
  /** Pre-select a list filter (used when opening a list from the Home). */
  initialListFilter?: string;
}

type AddMode = 'single' | 'bulk';

const GuestsTab: React.FC<GuestsTabProps> = ({
  event, guests, lists, tables, setGuests, loadData, initialListFilter = '',
  showConfirmDialog, closeConfirmDialog,
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterListId, setFilterListId] = useState(initialListFilter);

  // Single, unified "add guests" modal with two modes.
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('single');
  const [addListId, setAddListId] = useState(initialListFilter);
  // single mode
  const [name, setName] = useState('');
  const [tableId, setTableId] = useState('');
  const [isFemale, setIsFemale] = useState(false);
  // bulk mode
  const [bulkNamesMale, setBulkNamesMale] = useState('');
  const [bulkNamesFemale, setBulkNamesFemale] = useState('');

  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesList = filterListId ? g.listId === filterListId : true;
    return matchesSearch && matchesList;
  });

  const openAddModal = () => {
    setAddMode('single');
    setAddListId(filterListId || '');
    setName('');
    setTableId('');
    setIsFemale(false);
    setBulkNamesMale('');
    setBulkNamesFemale('');
    setShowAddModal(true);
  };

  const bulkCount = (s: string) => s.split('\n').filter(n => n.trim()).length;

  const handleSubmitAdd = async () => {
    if (!addListId) return;

    if (addMode === 'single') {
      if (!name.trim()) return;
      await firestoreService.saveGuest({
        id: crypto.randomUUID(),
        eventId: event.id,
        name: name.trim(),
        listId: addListId,
        tableId: tableId || undefined,
        checkedIn: false,
        isFemale,
      } as Guest);
      setShowAddModal(false);
      showToast(`${name.trim()} aggiunto alla lista`, 'success');
      loadData();
      return;
    }

    // bulk
    const maleNames = bulkNamesMale.split('\n').map(n => n.trim()).filter(Boolean);
    const femaleNames = bulkNamesFemale.split('\n').map(n => n.trim()).filter(Boolean);
    if (maleNames.length === 0 && femaleNames.length === 0) return;
    try {
      for (const n of maleNames) {
        await firestoreService.saveGuest({ id: crypto.randomUUID(), eventId: event.id, name: n, listId: addListId, checkedIn: false, isFemale: false } as Guest);
      }
      for (const n of femaleNames) {
        await firestoreService.saveGuest({ id: crypto.randomUUID(), eventId: event.id, name: n, listId: addListId, checkedIn: false, isFemale: true } as Guest);
      }
      setShowAddModal(false);
      showToast(`${maleNames.length + femaleNames.length} ospiti aggiunti`, 'success');
      await loadData();
    } catch (error) {
      console.error('Error adding guests:', error);
      showToast('Errore durante l\'aggiunta degli ospiti', 'error');
    }
  };

  const handleDeleteGuest = (guest: Guest) => {
    showConfirmDialog('Rimuovi Ospite', `Rimuovere ${guest.name} dalla lista?`, async () => {
      try {
        await firestoreService.deleteGuest(guest);
        showToast(`${guest.name} rimosso`, 'info');
        await loadData();
      } catch (error) {
        console.error('Error deleting guest:', error);
        showToast('Errore durante la cancellazione', 'error');
      }
      closeConfirmDialog();
    });
  };

  const handleToggleCheckIn = async (guest: Guest) => {
    const newStatus = !guest.checkedIn;
    setGuests(prev => prev.map(g => g.id === guest.id
      ? { ...g, checkedIn: newStatus, checkedInAt: newStatus ? new Date().toISOString() : undefined }
      : g));
    try {
      await firestoreService.saveGuest({ ...guest, checkedIn: newStatus, checkedInAt: newStatus ? new Date().toISOString() : undefined });
      if (newStatus) showToast(`✓ ${guest.name} - Check-in`, 'success');
    } catch {
      setGuests(prev => prev.map(g => g.id === guest.id
        ? { ...g, checkedIn: guest.checkedIn, checkedInAt: guest.checkedInAt }
        : g));
      showToast('Errore durante il check-in', 'error');
    }
  };

  // Binary gender toggle (Uomo/Donna) — the old 3-state cycle was confusing.
  const handleToggleGender = async (guest: Guest) => {
    const newGender = !(guest.isFemale === true);
    await firestoreService.saveGuest({ ...guest, isFemale: newGender });
    loadData();
  };

  // Swipeable row for quick mobile check-in.
  const SwipeableGuestRow: React.FC<{ guest: Guest; listName: string; tableName?: string }> = ({ guest, listName, tableName }) => {
    const rowRef = useRef<HTMLTableRowElement>(null);
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const SWIPE_THRESHOLD = 80;

    const onTouchStart = (e: React.TouchEvent) => {
      if (guest.checkedIn) return;
      setStartX(e.touches[0].clientX);
      setIsSwiping(true);
    };
    const onTouchMove = (e: React.TouchEvent) => {
      if (!isSwiping || guest.checkedIn) return;
      const diff = e.touches[0].clientX - startX;
      if (diff > 0) setCurrentX(Math.min(diff, 120));
    };
    const onTouchEnd = () => {
      if (currentX > SWIPE_THRESHOLD && !guest.checkedIn) handleToggleCheckIn(guest);
      setCurrentX(0);
      setIsSwiping(false);
    };
    const showSwipeHint = currentX > SWIPE_THRESHOLD;

    return (
      <tr
        ref={rowRef}
        className={`hover:bg-white/5 transition-colors ${guest.checkedIn ? 'bg-emerald-900/10' : ''}`}
        style={{
          transform: isSwiping ? `translateX(${currentX}px)` : undefined,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
          backgroundColor: showSwipeHint ? 'rgba(16, 185, 129, 0.2)' : undefined,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-white">
          <div className="flex items-center gap-2">
            {guest.checkedIn && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            <span className={guest.checkedIn ? 'text-emerald-300' : ''}>{guest.name}</span>
          </div>
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 hidden sm:table-cell">
          <button
            onClick={() => handleToggleGender(guest)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${guest.isFemale === true
              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            title="Cambia genere"
          >
            {guest.isFemale === true ? '♀ Donna' : '♂ Uomo'}
          </button>
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 hidden md:table-cell">
          <span className="bg-white/10 px-2 py-1 rounded text-xs text-emerald-400 border border-emerald-400/20">{listName}</span>
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 hidden lg:table-cell">
          {tableName ? (
            <span className="flex items-center gap-1 text-amber-400"><TableIcon className="w-3 h-3" /> {tableName}</span>
          ) : <span className="text-slate-600">-</span>}
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4">
          <button
            onClick={() => handleToggleCheckIn(guest)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[90px] ${guest.checkedIn
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30'
              }`}
          >
            {guest.checkedIn ? <><Check className="w-4 h-4" /> Entrato</> : 'Check-in'}
          </button>
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 text-right">
          <button onClick={() => handleDeleteGuest(guest)} className="text-red-400 hover:text-red-300 transition-colors p-2">
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca ospite..."
              className="w-full pl-10 bg-ink-900 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <select
              className="w-full pl-10 bg-ink-900 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 text-white appearance-none"
              value={filterListId}
              onChange={(e) => setFilterListId(e.target.value)}
            >
              <option value="">Tutte le liste</option>
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="bg-brand-600 hover:brightness-110 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" /> Aggiungi ospiti
        </button>
      </div>

      {/* Guest table */}
      <div className="bg-ink-900 rounded-xl border border-white/10 overflow-hidden">
        <div className="md:hidden px-4 py-2 bg-ink-950/50 border-b border-white/10 text-xs text-slate-500 text-center">
          👆 Scorri a destra per check-in rapido
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-ink-950/50 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 md:px-6 py-3">Nome</th>
                <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Genere</th>
                <th className="px-4 md:px-6 py-3 hidden md:table-cell">Lista</th>
                <th className="px-4 md:px-6 py-3 hidden lg:table-cell">Tavolo</th>
                <th className="px-4 md:px-6 py-3">Check-in</th>
                <th className="px-4 md:px-6 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredGuests.map(guest => {
                const listName = lists.find(l => l.id === guest.listId)?.name || '-';
                const tableName = tables.find(t => t.id === guest.tableId)?.number;
                return <SwipeableGuestRow key={guest.id} guest={guest} listName={listName} tableName={tableName} />;
              })}
              {filteredGuests.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Nessun ospite trovato</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Add Guests Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Aggiungi ospiti"
        size={addMode === 'bulk' ? 'xl' : 'md'}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowAddModal(false)}>Annulla</Button>
            <Button
              fullWidth
              onClick={handleSubmitAdd}
              disabled={!addListId || (addMode === 'single' ? !name.trim() : (!bulkNamesMale.trim() && !bulkNamesFemale.trim()))}
            >
              {addMode === 'single' ? 'Salva' : `Aggiungi ${bulkCount(bulkNamesMale) + bulkCount(bulkNamesFemale) || ''}`.trim()}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Mode switch */}
          <div className="grid grid-cols-2 gap-1 bg-ink-950/60 p-1 rounded-xl">
            {(['single', 'bulk'] as AddMode[]).map(m => (
              <button
                key={m}
                onClick={() => setAddMode(m)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${addMode === m ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {m === 'single' ? 'Singolo' : 'Incolla lista'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Lista</label>
            <select
              className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              value={addListId}
              onChange={(e) => setAddListId(e.target.value)}
            >
              <option value="">Seleziona lista...</option>
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {addMode === 'single' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome completo</label>
                <input
                  type="text"
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Assegna tavolo (opzionale)</label>
                <select
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                >
                  <option value="">Nessun tavolo</option>
                  {tables.map(t => {
                    const occupied = guests.filter(g => g.tableId === t.id).length;
                    return <option key={t.id} value={t.id} disabled={occupied >= t.capacity}>Tavolo {t.number} ({occupied}/{t.capacity})</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Genere</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFemale(false)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${!isFemale ? 'bg-blue-500/30 text-blue-400 border-2 border-blue-500' : 'bg-ink-900 text-slate-400 border border-white/10 hover:border-blue-500/50'}`}
                  >
                    ♂ Uomo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFemale(true)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${isFemale ? 'bg-pink-500/30 text-pink-400 border-2 border-pink-500' : 'bg-ink-900 text-slate-400 border border-white/10 hover:border-pink-500/50'}`}
                  >
                    ♀ Donna
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-400 mb-1">♂ Uomini (uno per riga)</label>
                <textarea
                  className="w-full bg-ink-900 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[150px] resize-y"
                  placeholder={"Mario Rossi\nGiuseppe Verdi"}
                  value={bulkNamesMale}
                  onChange={(e) => setBulkNamesMale(e.target.value)}
                />
                <p className="text-xs text-blue-400 mt-1">{bulkCount(bulkNamesMale)} uomini</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-pink-400 mb-1">♀ Donne (uno per riga)</label>
                <textarea
                  className="w-full bg-ink-900 border border-pink-500/30 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none min-h-[150px] resize-y"
                  placeholder={"Anna Bianchi\nGiulia Verdi"}
                  value={bulkNamesFemale}
                  onChange={(e) => setBulkNamesFemale(e.target.value)}
                />
                <p className="text-xs text-pink-400 mt-1">{bulkCount(bulkNamesFemale)} donne</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default GuestsTab;
