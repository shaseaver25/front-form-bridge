import { useEffect, useCallback, useState } from 'react';
import { useBoardContext } from '@/contexts/BoardContext';

interface KeyboardShortcutsOptions {
  enabled?: boolean;
  onNewCard?: () => void;
  onOpenSearch?: () => void;
}

interface KeyboardShortcut {
  key: string;
  description: string;
  modifier?: 'ctrl' | 'shift' | 'alt';
}

export const BOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'n', description: 'New card' },
  { key: 'e', description: 'Edit selected card' },
  { key: '←', description: 'Move card left' },
  { key: '→', description: 'Move card right' },
  { key: 'Escape', description: 'Close modal' },
  { key: '/', description: 'Focus search' },
  { key: '?', description: 'Show shortcuts help' },
];

export function useBoardKeyboardShortcuts({
  enabled = true,
  onNewCard,
  onOpenSearch,
}: KeyboardShortcutsOptions = {}) {
  const { state, dispatch } = useBoardContext();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only handle Escape in inputs
        if (event.key === 'Escape') {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'n':
          // New card
          event.preventDefault();
          onNewCard?.();
          break;

        case 'e':
          // Edit selected card
          if (state.selectedCard) {
            event.preventDefault();
            dispatch.openCardModal(state.selectedCard);
          }
          break;

        case 'arrowleft':
          // Move card left
          if (state.selectedCard) {
            event.preventDefault();
            const currentColumnIndex = state.columns.findIndex(
              c => c.id === state.selectedCard?.column_id
            );
            if (currentColumnIndex > 0) {
              const prevColumn = state.columns[currentColumnIndex - 1];
              dispatch.moveCard(state.selectedCard.id, prevColumn.id, 0);
            }
          }
          break;

        case 'arrowright':
          // Move card right
          if (state.selectedCard) {
            event.preventDefault();
            const currentColumnIndex = state.columns.findIndex(
              c => c.id === state.selectedCard?.column_id
            );
            if (currentColumnIndex < state.columns.length - 1) {
              const nextColumn = state.columns[currentColumnIndex + 1];
              dispatch.moveCard(state.selectedCard.id, nextColumn.id, 0);
            }
          }
          break;

        case 'escape':
          // Close modal
          if (state.isCardModalOpen) {
            event.preventDefault();
            dispatch.closeCardModal();
          } else if (showShortcutsHelp) {
            setShowShortcutsHelp(false);
          }
          break;

        case '/':
          // Focus search
          event.preventDefault();
          onOpenSearch?.();
          break;

        case '?':
          // Show shortcuts help
          if (event.shiftKey) {
            event.preventDefault();
            setShowShortcutsHelp(prev => !prev);
          }
          break;
      }
    },
    [enabled, state, dispatch, onNewCard, onOpenSearch, showShortcutsHelp]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    showShortcutsHelp,
    setShowShortcutsHelp,
    shortcuts: BOARD_SHORTCUTS,
  };
}
