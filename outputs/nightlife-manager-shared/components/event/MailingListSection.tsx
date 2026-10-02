import React, { useState, useMemo } from 'react';
import { Users, Mail, Download, X } from 'lucide-react';
import { Guest, GuestList } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export const MailingListSection: React.FC<{ eventId: string; guests: Guest[]; lists: GuestList[] }> = ({ eventId, guests, lists }) => {
  const { showToast } = useToast();
  const [showMailingModal, setShowMailingModal] = useState(false);

  // Filter guests with email (public registrations)
  const guestsWithEmail = useMemo(() =>
    guests.filter(g => g.email && g.email.trim() !== ''),
    [guests]
  );

  const handleExportCSV = () => {
    if (guestsWithEmail.length === 0) return;

    const csvContent = [
      ['Nome', 'Email', 'Lista', 'Genere'].join(','),
      ...guestsWithEmail.map(g => {
        const listName = lists.find(l => l.id === g.listId)?.name || 'N/A';
        const gender = g.isFemale === true ? 'Donna' : g.isFemale === false ? 'Uomo' : 'N/A';
        return [g.name, g.email, listName, gender].join(',');
      })
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mailing-list-${eventId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Email esportate in CSV', 'success');
  };

  return (
    <>
      <div className="bg-ink-900 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-brand-400" /> Mailing List
        </h3>
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-brand-400 mb-1">{guestsWithEmail.length}</div>
          <div className="text-sm text-slate-400">email raccolte</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowMailingModal(true)}
            disabled={guestsWithEmail.length === 0}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" /> Visualizza
          </button>
          <button
            onClick={handleExportCSV}
            disabled={guestsWithEmail.length === 0}
            className="bg-brand-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Esporta CSV
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          Registrazioni da link pubblico
        </p>
      </div>

      {/* Mailing List Modal */}
      {showMailingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-ink-900 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-400" /> Mailing List ({guestsWithEmail.length})
              </h2>
              <button
                onClick={() => setShowMailingModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {guestsWithEmail.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Nessuna email raccolta</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-ink-950/50 text-slate-400 uppercase text-xs sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Lista</th>
                      <th className="px-4 py-3">Genere</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {guestsWithEmail.map(g => {
                      const listName = lists.find(l => l.id === g.listId)?.name || 'N/A';
                      return (
                        <tr key={g.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-white font-medium">{g.name}</td>
                          <td className="px-4 py-3 text-slate-300">{g.email}</td>
                          <td className="px-4 py-3">
                            <span className="bg-emerald-400/10 text-emerald-400 px-2 py-1 rounded text-xs">{listName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${g.isFemale === true ? 'bg-pink-500/20 text-pink-400' :
                              g.isFemale === false ? 'bg-blue-500/20 text-blue-400' :
                                'bg-white/10 text-slate-400'
                              }`}>
                              {g.isFemale === true ? '♀ Donna' : g.isFemale === false ? '♂ Uomo' : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={handleExportCSV}
                disabled={guestsWithEmail.length === 0}
                className="bg-brand-600 hover:brightness-110 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Esporta CSV
              </button>
              <button
                onClick={() => setShowMailingModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MailingListSection;
