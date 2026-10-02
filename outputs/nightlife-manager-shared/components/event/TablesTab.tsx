import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Users, Table as TableIcon } from 'lucide-react';
import { Event, GuestList, Guest, Table } from '../../types';
import { firestoreService } from '../../services/firestoreService';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmControls } from './confirm';

interface TablesTabProps extends ConfirmControls {
  event: Event;
  tables: Table[];
  guests: Guest[];
  lists: GuestList[];
  isAdmin: boolean;
  loadData: () => Promise<void> | void;
}

const TablesTab: React.FC<TablesTabProps> = ({
  event, tables, guests, lists, isAdmin, loadData, showConfirmDialog, closeConfirmDialog,
}) => {
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditNotesModal, setShowEditNotesModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Simple mode: Nome + N persone
  const [newTable, setNewTable] = useState({
    number: '',
    primaryGuestName: '',
    extraPeople: 0,
    listId: '',
    notes: '',
    price: 0,
    pricePerPerson: false
  });

  // Bulk mode
  const [bulkTable, setBulkTable] = useState({
    number: '',
    listId: '',
    notes: '',
    names: '',
    price: 0,
    pricePerPerson: false
  });

  const handleCreateTableSimple = async () => {
    if (!newTable.number || !newTable.primaryGuestName || !newTable.listId) return;

    const tableId = crypto.randomUUID();
    const totalPeople = 1 + newTable.extraPeople;

    // Create table
    const autoPerPerson = totalPeople >= 10; // Auto per-person if 10+ guests
    await firestoreService.saveTable({
      id: tableId,
      eventId: event.id,
      number: newTable.number,
      capacity: totalPeople,
      primaryGuestName: newTable.primaryGuestName,
      notes: newTable.notes || undefined,
      price: newTable.price || undefined,
      pricePerPerson: autoPerPerson || newTable.pricePerPerson
    });

    // Create primary guest
    await firestoreService.saveGuest({
      id: crypto.randomUUID(),
      eventId: event.id,
      name: newTable.primaryGuestName,
      listId: newTable.listId,
      tableId: tableId,
      checkedIn: false
    } as Guest);

    // Create placeholder guests for extra people
    for (let i = 0; i < newTable.extraPeople; i++) {
      await firestoreService.saveGuest({
        id: crypto.randomUUID(),
        eventId: event.id,
        name: `Ospite Tavolo ${newTable.number} #${i + 2}`,
        listId: newTable.listId,
        tableId: tableId,
        checkedIn: false
      } as Guest);
    }

    setNewTable({ number: '', primaryGuestName: '', extraPeople: 0, listId: '', notes: '', price: 0, pricePerPerson: false });
    setShowCreateModal(false);
    showToast(`Tavolo ${newTable.number} creato`, 'success');
    loadData();
  };

  const handleCreateTableBulk = async () => {
    const names = bulkTable.names.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (!bulkTable.number || !bulkTable.listId || names.length === 0) return;

    const tableId = crypto.randomUUID();

    // Create table
    const autoPerPerson = names.length >= 10; // Auto per-person if 10+ guests
    await firestoreService.saveTable({
      id: tableId,
      eventId: event.id,
      number: bulkTable.number,
      capacity: names.length,
      primaryGuestName: names[0], // First name becomes primary
      notes: bulkTable.notes || undefined,
      price: bulkTable.price || undefined,
      pricePerPerson: autoPerPerson || bulkTable.pricePerPerson
    });

    // Create all guests
    for (const name of names) {
      await firestoreService.saveGuest({
        id: crypto.randomUUID(),
        eventId: event.id,
        name: name,
        listId: bulkTable.listId,
        tableId: tableId,
        checkedIn: false
      } as Guest);
    }

    setBulkTable({ number: '', listId: '', notes: '', names: '', price: 0, pricePerPerson: false });
    setShowBulkModal(false);
    showToast(`Tavolo ${bulkTable.number} creato con ${names.length} ospiti`, 'success');
    loadData();
  };

  const handleDeleteTable = async (table: Table) => {
    const tableGuests = guests.filter(g => g.tableId === table.id);
    showConfirmDialog(
      'Elimina Tavolo',
      `Eliminare questo tavolo?\n\nVerranno eliminati anche ${tableGuests.length} ospiti associati.`,
      async () => {
        try {
          // Delete all guests assigned to this table
          for (const guest of tableGuests) {
            await firestoreService.deleteGuest(guest);
          }
          await firestoreService.deleteTable(table);
          showToast(`Tavolo ${table.number} eliminato`, 'info');
          await loadData();
        } catch (error) {
          console.error('Error deleting table:', error);
          showToast('Errore durante la cancellazione', 'error');
        }
        closeConfirmDialog();
      }
    );
  };

  const openEditNotes = (table: Table) => {
    setEditingTable(table);
    setEditNotes(table.notes || '');
    setShowEditNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!editingTable) return;
    await firestoreService.saveTable({
      ...editingTable,
      notes: editNotes || undefined
    });
    setShowEditNotesModal(false);
    setEditingTable(null);
    showToast('Note salvate', 'success');
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {isAdmin && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Nuovo Tavolo
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Users className="w-5 h-5" /> Tavolo con Nomi
          </button>
        </div>
      )}

      {tables.length === 0 ? (
        <div className="bg-ink-900 rounded-xl border border-white/10 p-12 text-center">
          <TableIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nessun tavolo creato</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map(table => {
            const tableGuests = guests.filter(g => g.tableId === table.id);
            const occupied = tableGuests.length;
            const isFull = occupied >= table.capacity;
            const percentage = table.capacity > 0 ? (occupied / table.capacity) * 100 : 0;
            const listInfo = tableGuests.length > 0
              ? lists.find(l => l.id === tableGuests[0].listId)
              : null;

            return (
              <div key={table.id} className={`group relative p-5 rounded-xl border-2 transition-all ${isFull
                ? 'bg-red-900/20 border-red-500/50'
                : occupied > 0
                  ? 'bg-amber-900/20 border-amber-500/50'
                  : 'bg-ink-900 border-white/10'
                }`}>
                {isAdmin && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => openEditNotes(table)}
                      className="p-1.5 bg-ink-950/60 rounded-md text-slate-400 hover:text-amber-400 hover:bg-ink-900"
                      title="Modifica Note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table)}
                      className="p-1.5 bg-ink-950/60 rounded-md text-slate-400 hover:text-red-400 hover:bg-ink-900"
                      title="Elimina Tavolo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <div className="text-lg font-bold text-white">Tavolo {table.number}</div>
                  {isFull && <div className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">FULL</div>}
                </div>

                {/* Primary Guest Name Display */}
                {table.primaryGuestName && (
                  <div className="text-sm text-amber-400 font-medium mb-1 truncate">
                    {table.primaryGuestName} {table.capacity > 1 && `+${table.capacity - 1}`}
                  </div>
                )}

                {/* List badge */}
                {listInfo && (
                  <div className="mb-2">
                    <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-400/20">
                      {listInfo.name}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {table.notes && (
                  <div className="text-xs text-slate-400 italic mb-2 truncate" title={table.notes}>
                    📝 {table.notes}
                  </div>
                )}

                {/* Price */}
                {table.price && table.price > 0 && (
                  <div className="text-xs text-amber-400 font-medium mb-2">
                    💰 €{table.price}{table.pricePerPerson ? '/persona' : ''}
                    {table.pricePerPerson && <span className="text-slate-500 ml-1">(tot: €{(table.price * occupied).toFixed(0)})</span>}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Posti</span>
                  <span className={`font-mono font-medium ${isFull ? 'text-red-400' : 'text-slate-200'}`}>
                    {occupied} / {table.capacity}
                  </span>
                </div>

                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>

                {/* List of occupants preview */}
                <div className="mt-3 space-y-1">
                  {tableGuests.slice(0, 3).map(g => (
                    <div key={g.id} className="text-xs text-slate-400 truncate flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-slate-500"></div> {g.name}
                    </div>
                  ))}
                  {occupied > 3 && <div className="text-xs text-slate-500 italic">...e altri {occupied - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Table Modal (Simple Mode) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-ink-950/60 rounded-xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">Nuovo Tavolo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Numero/Nome Tavolo *</label>
                <input
                  type="text"
                  value={newTable.number}
                  onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="es. VIP-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nominativo Prenotazione *</label>
                <input
                  type="text"
                  value={newTable.primaryGuestName}
                  onChange={(e) => setNewTable({ ...newTable, primaryGuestName: e.target.value })}
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="es. Marco Rossi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Persone Extra (oltre al nominativo)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newTable.extraPeople === 0 ? '' : newTable.extraPeople}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNewTable({ ...newTable, extraPeople: val === '' ? 0 : parseInt(val) || 0 });
                  }}
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="0"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Totale: {1 + newTable.extraPeople} {1 + newTable.extraPeople === 1 ? 'persona' : 'persone'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Lista PR *</label>
                <select
                  value={newTable.listId}
                  onChange={(e) => setNewTable({ ...newTable, listId: e.target.value })}
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Seleziona lista...</option>
                  {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Note (opzionale)</label>
                <input
                  type="text"
                  value={newTable.notes}
                  onChange={(e) => setNewTable({ ...newTable, notes: e.target.value })}
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="es. Privé, compleanno"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Prezzo Tavolo (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newTable.price === 0 ? '' : newTable.price}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setNewTable({ ...newTable, price: val === '' ? 0 : parseFloat(val) || 0 });
                    }}
                    className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-ink-900 border border-white/10 rounded-lg px-3 py-2 w-full">
                    <input
                      type="checkbox"
                      checked={(1 + newTable.extraPeople) >= 10 || newTable.pricePerPerson}
                      disabled={(1 + newTable.extraPeople) >= 10}
                      onChange={(e) => setNewTable({ ...newTable, pricePerPerson: e.target.checked })}
                      className="rounded bg-white/10 border-slate-600 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-300">A persona</span>
                  </label>
                </div>
              </div>
              {newTable.price > 0 && (
                <div className="text-sm text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
                  Entrata stimata: €{((1 + newTable.extraPeople) >= 10 || newTable.pricePerPerson)
                    ? (newTable.price * (1 + newTable.extraPeople)).toFixed(2)
                    : newTable.price.toFixed(2)}
                  {((1 + newTable.extraPeople) >= 10) && <span className="text-xs ml-1">(auto a persona per 10+)</span>}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 bg-ink-900 hover:bg-white/10 text-white py-2 rounded-lg transition-colors">Annulla</button>
              <button
                onClick={handleCreateTableSimple}
                disabled={!newTable.number || !newTable.primaryGuestName || !newTable.listId}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 rounded-lg transition-colors font-medium"
              >
                Crea Tavolo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Table Modal (Bulk Mode) */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-ink-950/60 rounded-xl border border-white/10 p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">Tavolo con Tutti i Nomi</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Numero/Nome Tavolo *</label>
                <input
                  type="text"
                  value={bulkTable.number}
                  onChange={(e) => setBulkTable({ ...bulkTable, number: e.target.value })}
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="es. VIP-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Lista PR *</label>
                <select
                  value={bulkTable.listId}
                  onChange={(e) => setBulkTable({ ...bulkTable, listId: e.target.value })}
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Seleziona lista...</option>
                  {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nomi Ospiti (uno per riga) *</label>
                <textarea
                  value={bulkTable.names}
                  onChange={(e) => setBulkTable({ ...bulkTable, names: e.target.value })}
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[120px] resize-y"
                  placeholder={"Marco Rossi\nGiulia Verdi\nLuca Bianchi"}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {bulkTable.names.split('\n').filter(n => n.trim()).length} ospiti
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Note (opzionale)</label>
                <input
                  type="text"
                  value={bulkTable.notes}
                  onChange={(e) => setBulkTable({ ...bulkTable, notes: e.target.value })}
                  className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="es. Privé, compleanno"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Prezzo Tavolo (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={bulkTable.price}
                    onChange={(e) => setBulkTable({ ...bulkTable, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-ink-900 border border-white/10 rounded-lg px-3 py-2 w-full">
                    <input
                      type="checkbox"
                      checked={bulkTable.names.split('\n').filter(n => n.trim()).length >= 10 || bulkTable.pricePerPerson}
                      disabled={bulkTable.names.split('\n').filter(n => n.trim()).length >= 10}
                      onChange={(e) => setBulkTable({ ...bulkTable, pricePerPerson: e.target.checked })}
                      className="rounded bg-white/10 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-300">A persona</span>
                  </label>
                </div>
              </div>
              {bulkTable.price > 0 && (() => {
                const guestCount = bulkTable.names.split('\n').filter(n => n.trim()).length;
                const isPerPerson = guestCount >= 10 || bulkTable.pricePerPerson;
                return (
                  <div className="text-sm text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
                    Entrata stimata: €{isPerPerson ? (bulkTable.price * guestCount).toFixed(2) : bulkTable.price.toFixed(2)}
                    {guestCount >= 10 && <span className="text-xs ml-1">(auto a persona per 10+)</span>}
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 bg-ink-900 hover:bg-white/10 text-white py-2 rounded-lg transition-colors">Annulla</button>
              <button
                onClick={handleCreateTableBulk}
                disabled={!bulkTable.number || !bulkTable.listId || !bulkTable.names.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg transition-colors font-medium"
              >
                Crea Tavolo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {showEditNotesModal && editingTable && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-ink-950/60 rounded-xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">Modifica Note - Tavolo {editingTable.number}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Note</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="es. Privé, 30€ a testa"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditNotesModal(false)} className="flex-1 bg-ink-900 hover:bg-white/10 text-white py-2 rounded-lg transition-colors">Annulla</button>
              <button onClick={handleSaveNotes} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg transition-colors font-medium">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesTab;
