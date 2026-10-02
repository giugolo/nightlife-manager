import React, { useState, useEffect, useRef } from 'react';
import {
  Users, List, Table as TableIcon, CheckCircle, Euro, Plus, Trash2, Share2,
  ChevronRight, ClipboardCheck, Clock, Mail,
} from 'lucide-react';
import { Event, PR, GuestList, Guest, Table } from '../../types';
import { EventMetrics } from '../../services/metrics';
import { firestoreService } from '../../services/firestoreService';
import { useToast } from '../../contexts/ToastContext';
import { Card, Button, Input, Modal, ShareCard } from '../ui';
import { ConfirmControls } from './confirm';
import MailingListSection from './MailingListSection';

interface EventHomeProps extends ConfirmControls {
  event: Event;
  metrics: EventMetrics;
  prs: PR[];
  lists: GuestList[];
  guests: Guest[];
  tables: Table[];
  isAdmin: boolean;
  loadData: () => Promise<void> | void;
  /** Refresh the parent event (after editing pricing). */
  onUpdate: () => void;
  /** Jump to the Ospiti view, pre-filtered on a list. */
  onOpenList: (listId: string) => void;
}

/** Small flat KPI tile (Apple look: no gradient, hairline border). */
const Kpi: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode; bar?: number }> = ({
  label, value, icon, bar,
}) => (
  <Card padding="none" className="p-5">
    <div className="flex items-center justify-between pb-2">
      <h3 className="text-sm font-medium text-slate-400">{label}</h3>
      {icon}
    </div>
    <div className="text-2xl font-bold text-white">{value}</div>
    {bar !== undefined && (
      <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.min(bar, 100)}%` }} />
      </div>
    )}
  </Card>
);

const EventHome: React.FC<EventHomeProps> = ({
  event, metrics, prs, lists, guests, tables, isAdmin,
  loadData, onUpdate, onOpenList, showConfirmDialog, closeConfirmDialog,
}) => {
  const { showToast } = useToast();

  // --- Lists / PR creation -------------------------------------------------
  const [newListName, setNewListName] = useState('');
  const [newListPrId, setNewListPrId] = useState('');
  const [newPrName, setNewPrName] = useState('');

  const handleAddList = async () => {
    if (!newListName.trim()) return;
    await firestoreService.saveList({
      id: crypto.randomUUID(),
      name: newListName.trim(),
      eventId: event.id,
      ...(newListPrId ? { prId: newListPrId } : {}),
    });
    showToast(`Lista ${newListName.trim()} creata`, 'success');
    setNewListName('');
    setNewListPrId('');
    loadData();
  };

  const handleDeleteList = (list: GuestList) => {
    const n = guests.filter(g => g.listId === list.id).length;
    showConfirmDialog('Elimina Lista', `Eliminare questa lista?\n\nVerranno eliminati anche ${n} ospiti associati.`, async () => {
      await firestoreService.deleteList(list);
      showToast(`Lista ${list.name} eliminata`, 'info');
      await loadData();
      closeConfirmDialog();
    });
  };

  const handleAddPR = async () => {
    if (!newPrName.trim()) return;
    await firestoreService.savePR({ id: crypto.randomUUID(), name: newPrName.trim(), eventId: event.id });
    showToast(`PR ${newPrName.trim()} aggiunto`, 'success');
    setNewPrName('');
    loadData();
  };

  const handleDeletePR = (pr: PR) => {
    const associatedLists = lists.filter(l => l.prId === pr.id);
    const associatedGuests = guests.filter(g => associatedLists.some(l => l.id === g.listId));
    showConfirmDialog('Elimina PR', `Eliminare questo PR?\n\nVerranno eliminate anche:\n- ${associatedLists.length} liste associate\n- ${associatedGuests.length} ospiti associati`, async () => {
      await firestoreService.deletePR(pr);
      showToast(`PR ${pr.name} eliminato`, 'info');
      await loadData();
      closeConfirmDialog();
    });
  };

  // --- Share a list (1-tap link + QR) --------------------------------------
  const [shareList, setShareList] = useState<{ name: string; url: string } | null>(null);
  // Cache tokens generated this session so re-sharing the same list never mints a
  // second token (which would invalidate an already-shared link). We intentionally
  // do NOT reload data here: loadData flips the global loading flag and would unmount
  // this view together with the share modal.
  const generatedTokens = useRef<Record<string, string>>({});

  const openShareList = async (list: GuestList) => {
    try {
      const token = list.publicToken || generatedTokens.current[list.id]
        || (generatedTokens.current[list.id] = await firestoreService.generateListPublicToken(list));
      setShareList({ name: list.name, url: `${window.location.origin}/lista/${token}` });
    } catch {
      showToast('Errore nella generazione del link', 'error');
    }
  };

  // --- Door link -----------------------------------------------------------
  const [doorLink, setDoorLink] = useState<string | null>(null);
  const [doorBusy, setDoorBusy] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    firestoreService.getDoorToken(event.id).then(token => {
      if (token) setDoorLink(`${window.location.origin}/checkin/${event.id}?token=${token}`);
    });
  }, [isAdmin, event.id]);

  const handleGenerateDoorLink = async () => {
    try {
      setDoorBusy(true);
      const token = await firestoreService.generateDoorToken(event.id);
      setDoorLink(`${window.location.origin}/checkin/${event.id}?token=${token}`);
      showToast('Nuovo link generato', 'success');
    } catch {
      showToast('Errore generazione link', 'error');
    } finally {
      setDoorBusy(false);
    }
  };

  // --- Pricing settings ----------------------------------------------------
  const [priceListMale, setPriceListMale] = useState<number>(event.priceListMale || 0);
  const [priceListFemale, setPriceListFemale] = useState<number>(event.priceListFemale || 0);
  const [listClosingHours, setListClosingHours] = useState<number>(event.listClosingHours ?? 6);

  const handleSavePricing = async () => {
    await firestoreService.saveEvent({ ...event, priceListMale, priceListFemale, listClosingHours });
    showToast('Impostazioni salvate', 'success');
    onUpdate();
  };

  const prName = (id?: string) => (id ? prs.find(p => p.id === id)?.name : undefined);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview ----------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Ospiti" value={<>{metrics.totalGuests} <span className="text-sm text-slate-500 font-normal">/ {event.capacity}</span></>} icon={<Users className="h-4 w-4 text-brand-400" />} bar={metrics.capacityPercentage} />
        <Kpi label="Check-in" value={<>{metrics.checkedInGuests} <span className="text-sm text-slate-500 font-normal">/ {metrics.totalGuests}</span></>} icon={<CheckCircle className="h-4 w-4 text-emerald-400" />} />
        <Kpi label="Liste" value={lists.length} icon={<List className="h-4 w-4 text-emerald-400" />} />
        <Kpi label="Tavoli" value={<>{metrics.occupiedTables} <span className="text-sm text-slate-500 font-normal">/ {tables.length}</span></>} icon={<TableIcon className="h-4 w-4 text-amber-400" />} />
      </div>

      {/* Lists (centerpiece) ----------------------------------------------- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Liste</h2>
          <span className="text-sm text-slate-500">· condividi il link e gli ospiti si iscrivono da soli</span>
        </div>

        {isAdmin && (
          <Card padding="sm" className="mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nome lista (es. Lista VIP)"
                className="flex-1 bg-ink-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
              />
              {prs.length > 0 && (
                <select
                  className="sm:w-52 bg-ink-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  value={newListPrId}
                  onChange={(e) => setNewListPrId(e.target.value)}
                >
                  <option value="">PR (opzionale)</option>
                  {prs.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                </select>
              )}
              <Button onClick={handleAddList} disabled={!newListName.trim()} className="shrink-0">
                <Plus className="w-4 h-4" /> Crea lista
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {lists.map(list => {
            const count = guests.filter(g => g.listId === list.id).length;
            const pr = prName(list.prId);
            return (
              <Card key={list.id} padding="none" className="p-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => onOpenList(list.id)}
                  className="flex-1 min-w-0 text-left group"
                >
                  <div className="font-medium text-white truncate flex items-center gap-2">
                    {list.name}
                    {pr && <span className="text-[10px] uppercase tracking-wide text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">{pr}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    {count} ospiti <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openShareList(list)}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Condividi</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteList(list)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-2"
                      title="Elimina lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
          {lists.length === 0 && (
            <Card padding="lg" className="text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <List className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">Nessuna lista. {isAdmin ? 'Creane una qui sopra per iniziare a raccogliere iscrizioni.' : ''}</p>
            </Card>
          )}
        </div>

        {/* Optional PR management, tucked away */}
        {isAdmin && (
          <details className="mt-4 group">
            <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-200 select-none">
              Organizza per PR (opzionale)
            </summary>
            <Card padding="sm" className="mt-3">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nome nuovo PR"
                  className="flex-1 bg-ink-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  value={newPrName}
                  onChange={(e) => setNewPrName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPR()}
                />
                <Button variant="secondary" onClick={handleAddPR} disabled={!newPrName.trim()}>Aggiungi</Button>
              </div>
              <div className="space-y-1.5">
                {prs.map(pr => (
                  <div key={pr.id} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                    <span className="text-sm text-slate-200">{pr.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{lists.filter(l => l.prId === pr.id).length} liste</span>
                      <button onClick={() => handleDeletePR(pr)} className="text-slate-500 hover:text-red-400 p-1" title="Elimina PR">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {prs.length === 0 && <p className="text-slate-500 text-xs">Nessun PR. I PR sono opzionali: servono solo per raggruppare le liste.</p>}
              </div>
            </Card>
          </details>
        )}
      </section>

      {/* Door / Ingresso ---------------------------------------------------- */}
      {isAdmin && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Ingresso (Door)</h2>
          </div>
          <Card>
            <p className="text-sm text-slate-400 mb-4">
              Link sicuro per lo staff all'ingresso: dà accesso solo alla lista ospiti e al check-in.
            </p>
            <ShareCard
              url={doorLink}
              emptyLabel="Genera Link Door"
              onGenerate={handleGenerateDoorLink}
              generating={doorBusy}
              regenerateLabel="Rigenera Token (invalida link precedenti)"
              onRegenerate={handleGenerateDoorLink}
              regenerating={doorBusy}
              qrCaption="Inquadra per aprire la pagina di check-in"
            />
          </Card>
        </section>
      )}

      {/* Revenue (sober, flat) --------------------------------------------- */}
      {isAdmin && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Euro className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Entrate stimate</h2>
          </div>
          <div className="grid grid-cols-3 divide-x divide-white/10">
            <div className="px-2">
              <div className="text-xs text-slate-400 mb-1">Liste</div>
              <div className="text-xl font-bold text-white">€{metrics.revenueFromLists.toFixed(2)}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {metrics.maleListGuests}♂×€{event.priceListMale || 0} + {metrics.femaleListGuests}♀×€{event.priceListFemale || 0}
              </div>
            </div>
            <div className="px-4">
              <div className="text-xs text-slate-400 mb-1">Tavoli</div>
              <div className="text-xl font-bold text-white">€{metrics.revenueFromTables.toFixed(2)}</div>
              <div className="text-[11px] text-slate-500 mt-1">{tables.length} tavoli</div>
            </div>
            <div className="px-4">
              <div className="text-xs text-slate-400 mb-1">Totale</div>
              <div className="text-xl font-bold text-emerald-400">€{metrics.totalRevenue.toFixed(2)}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Settings (tucked away) -------------------------------------------- */}
      {isAdmin && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-slate-400 hover:text-slate-200 select-none flex items-center gap-2">
            <Clock className="w-4 h-4" /> Impostazioni evento (prezzi, chiusura, mailing)
          </summary>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <h3 className="text-base font-semibold mb-4 text-white flex items-center gap-2">
                <Euro className="w-4 h-4 text-emerald-400" /> Prezzi ingresso liste
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  label="Prezzo Uomo (€)"
                  type="text"
                  inputMode="decimal"
                  value={priceListMale === 0 ? '' : priceListMale}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setPriceListMale(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  placeholder="0"
                />
                <Input
                  label="Prezzo Donna (€)"
                  type="text"
                  inputMode="decimal"
                  value={priceListFemale === 0 ? '' : priceListFemale}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setPriceListFemale(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-400 mb-2">Chiusura registrazioni</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-24 bg-ink-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={listClosingHours === 0 ? '' : listClosingHours}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setListClosingHours(val === '' ? 0 : Math.min(168, parseInt(val) || 0));
                    }}
                    placeholder="6"
                  />
                  <span className="text-slate-400 text-sm">ore prima dell'evento</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Le registrazioni pubbliche si chiuderanno automaticamente.</p>
              </div>
              <Button onClick={handleSavePricing} fullWidth>Salva impostazioni</Button>
            </Card>

            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-400 text-sm">
                <Mail className="w-4 h-4" /> Email raccolte dalle registrazioni
              </div>
              <MailingListSection eventId={event.id} guests={guests} lists={lists} />
            </div>
          </div>
        </details>
      )}

      {/* Share list modal --------------------------------------------------- */}
      <Modal
        open={shareList !== null}
        onClose={() => setShareList(null)}
        title={shareList ? `Condividi · ${shareList.name}` : 'Condividi'}
        size="md"
      >
        <p className="text-sm text-slate-400 mb-4">
          Manda questo link o mostra il QR: gli ospiti si iscrivono da soli alla lista.
        </p>
        {shareList && <ShareCard url={shareList.url} qrCaption="Inquadra per iscriverti alla lista" />}
      </Modal>
    </div>
  );
};

export default EventHome;
