import React, { useState, useMemo } from 'react';
import {
  Users, Home as HomeIcon, Table as TableIcon, Edit2, Trash2, CheckCircle, RefreshCw,
} from 'lucide-react';
import { Event, Tab } from '../types';
import { computeMetrics } from '../services/metrics';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { EventHome, GuestsTab, TablesTab, useEventData } from './event';

interface EventDetailProps {
  event: Event;
  onBack: () => void;
  onUpdate: () => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, onBack, onUpdate }) => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  /** When opening a list from the Home, the Ospiti view pre-filters on it. */
  const [guestsListFilter, setGuestsListFilter] = useState('');

  // Event collections (load lifecycle lives in the hook).
  const { prs, lists, guests, tables, loading, loadData, setGuests, setLoading } = useEventData(event.id);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editEventData, setEditEventData] = useState<Partial<Event>>({});

  // Confirmation dialog state (owned here; passed to children via props)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  };

  const isAdmin = userProfile?.role === 'admin';

  // Derived metrics (pure logic lives in services/metrics.ts so it can be unit-tested)
  const metrics = useMemo(
    () => computeMetrics(event, guests, tables, lists),
    [guests, event, tables, lists]
  );

  const handleDeleteEvent = () => {
    showConfirmDialog(
      'Elimina Evento',
      'ATTENZIONE: Sei sicuro di voler eliminare questo evento?\n\nVerranno eliminati permanentemente:\n- Tutti i PR associati\n- Tutte le liste\n- Tutti gli ospiti\n- Tutti i tavoli\n\nQuesta azione non può essere annullata.',
      async () => {
        await firestoreService.deleteEvent(event.id);
        onUpdate();
        onBack();
        closeConfirmDialog();
      }
    );
  };

  const openEditModal = () => {
    setEditEventData({ ...event });
    setShowEditModal(true);
  };

  const handleSaveEvent = async () => {
    if (!editEventData.name || !editEventData.date) return;
    await firestoreService.saveEvent({
      ...event,
      name: editEventData.name,
      date: editEventData.date,
      location: editEventData.location || '',
      capacity: editEventData.capacity || 100,
    });
    setShowEditModal(false);
    showToast('Evento aggiornato', 'success');
    onUpdate();
  };

  const handleRefresh = async () => {
    setLoading(true);
    await onUpdate();
    await loadData();
    setLoading(false);
    showToast('Dati aggiornati', 'success');
  };

  const openListInGuests = (listId: string) => {
    setGuestsListFilter(listId);
    setActiveTab(Tab.GUESTS);
  };

  const tabIcons: Record<Tab, React.ReactNode> = {
    [Tab.HOME]: <HomeIcon className="w-5 h-5" />,
    [Tab.GUESTS]: <Users className="w-5 h-5" />,
    [Tab.TABLES]: <TableIcon className="w-5 h-5" />,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-ink-950">
      {/* Event Header */}
      <div className="border-b border-white/10 bg-ink-900 p-6">
        <div className="flex justify-between items-start">
          <button onClick={onBack} className="text-slate-400 hover:text-white mb-4 flex items-center gap-1 text-sm transition-colors">
            &larr; Torna agli eventi
          </button>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors disabled:opacity-50"
                title="Aggiorna Dati"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Aggiorna</span>
              </button>
              <button
                onClick={openEditModal}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors"
                title="Modifica Evento"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteEvent}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-red-400 transition-colors"
                title="Elimina Evento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{event.name}</h1>
            <div className="flex gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> {new Date(event.date).toLocaleDateString()}</span>
              <span>•</span>
              <span>{event.location}</span>
              <span>•</span>
              <span>Capienza: {event.capacity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 bg-ink-900/50 px-4 md:px-6">
        <nav className="flex gap-1 md:gap-4 overflow-x-auto mobile-hide-scrollbar -mx-1 px-1">
          {Object.values(Tab).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex items-center gap-2 py-4 px-3 md:px-4 text-sm font-medium
                border-b-2 transition-all whitespace-nowrap
                min-h-[56px] touch-target haptic-feedback
                ${activeTab === tab
                  ? 'border-brand-500 text-brand-300 bg-brand-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }
              `}
            >
              {tabIcons[tab]}
              <span className="hidden sm:inline">{tab}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === Tab.HOME && (
            <EventHome
              event={event}
              metrics={metrics}
              prs={prs}
              lists={lists}
              guests={guests}
              tables={tables}
              isAdmin={isAdmin}
              loadData={loadData}
              onUpdate={onUpdate}
              onOpenList={openListInGuests}
              showConfirmDialog={showConfirmDialog}
              closeConfirmDialog={closeConfirmDialog}
            />
          )}
          {activeTab === Tab.GUESTS && (
            <GuestsTab
              event={event}
              guests={guests}
              lists={lists}
              tables={tables}
              setGuests={setGuests}
              loadData={loadData}
              initialListFilter={guestsListFilter}
              showConfirmDialog={showConfirmDialog}
              closeConfirmDialog={closeConfirmDialog}
            />
          )}
          {activeTab === Tab.TABLES && (
            <TablesTab
              event={event}
              tables={tables}
              guests={guests}
              lists={lists}
              isAdmin={isAdmin}
              loadData={loadData}
              showConfirmDialog={showConfirmDialog}
              closeConfirmDialog={closeConfirmDialog}
            />
          )}
        </div>
      </div>

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-ink-900 ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/60 w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">Modifica Evento</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Evento</label>
                <input
                  type="text"
                  className="w-full bg-ink-950/60 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  value={editEventData.name}
                  onChange={(e) => setEditEventData({ ...editEventData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Data e Ora</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-ink-950/60 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={editEventData.date}
                    onChange={(e) => setEditEventData({ ...editEventData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Capacità</label>
                  <input
                    type="number"
                    className="w-full bg-ink-950/60 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={editEventData.capacity}
                    onChange={(e) => setEditEventData({ ...editEventData, capacity: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Luogo</label>
                <input
                  type="text"
                  className="w-full bg-ink-950/60 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  value={editEventData.location}
                  onChange={(e) => setEditEventData({ ...editEventData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveEvent}
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl transition-all hover:brightness-110 font-medium shadow-glow"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-ink-900 ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/60 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">{confirmDialog.title}</h2>
            <p className="text-slate-300 whitespace-pre-line mb-6">{confirmDialog.message}</p>
            <div className="flex gap-4">
              <button
                onClick={closeConfirmDialog}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors font-medium"
              >
                Annulla
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
