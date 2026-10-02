/**
 * Shared shape for the parent-owned confirmation dialog, passed down to the
 * tab components so destructive actions can request confirmation.
 */
export interface ConfirmControls {
  showConfirmDialog: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirmDialog: () => void;
}
