import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode, Link2 } from 'lucide-react';
import { cn } from './cn';
import { useToast } from '../../contexts/ToastContext';

export interface ShareCardProps {
  /** The shareable URL. When null, the "generate" affordance is shown instead. */
  url: string | null;
  /** Label for the generate button shown when there is no url yet. */
  emptyLabel?: string;
  onGenerate?: () => void | Promise<void>;
  generating?: boolean;
  /** Secondary action under the url (e.g. rotate the token). */
  regenerateLabel?: string;
  onRegenerate?: () => void | Promise<void>;
  regenerating?: boolean;
  /** Small caption under the QR code. */
  qrCaption?: string;
  className?: string;
}

/**
 * Reusable "Condividi" block: a read-only link with a 1-tap copy button and an
 * on-demand QR code. Used for both the public list link and the door link.
 * Flat Apple look (no gradient/glow), consistent with the rest of the UI.
 */
const ShareCard: React.FC<ShareCardProps> = ({
  url,
  emptyLabel = 'Genera Link',
  onGenerate,
  generating = false,
  regenerateLabel,
  onRegenerate,
  regenerating = false,
  qrCaption,
  className,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('Link copiato negli appunti', 'success');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast('Errore nella copia del link', 'error');
    }
  };

  if (!url) {
    return (
      <button
        onClick={onGenerate}
        disabled={generating}
        className={cn(
          'w-full bg-brand-600 hover:bg-brand-500 active:bg-brand-700 disabled:opacity-50',
          'text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2',
          className,
        )}
      >
        <Link2 className="w-4 h-4" /> {generating ? 'Generazione…' : emptyLabel}
      </button>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 bg-ink-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={handleCopy}
          aria-label="Copia link"
          className="shrink-0 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white px-3 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="hidden sm:inline">{copied ? 'Copiato' : 'Copia link'}</span>
        </button>
        <button
          onClick={() => setShowQr((v) => !v)}
          aria-label="Mostra QR"
          aria-pressed={showQr}
          className={cn(
            'shrink-0 px-3 py-2 rounded-xl border transition-colors flex items-center',
            showQr
              ? 'bg-white/10 border-white/15 text-white'
              : 'bg-transparent border-white/10 text-slate-400 hover:text-white hover:bg-white/5',
          )}
        >
          <QrCode className="w-4 h-4" />
        </button>
      </div>

      {showQr && (
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG value={url} size={168} level="M" />
          </div>
          {qrCaption && <p className="text-xs text-slate-500">{qrCaption}</p>}
        </div>
      )}

      {regenerateLabel && onRegenerate && (
        <div className="flex justify-end">
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="text-xs text-amber-500 hover:text-amber-400 underline decoration-dashed disabled:opacity-50"
          >
            {regenerating ? 'Rigenerazione…' : regenerateLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareCard;
