'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    category: 'Navigation',
    keys: ['Ctrl', 'A'],
    description: 'Show all products',
  },
  {
    category: 'Navigation',
    keys: ['Ctrl', 'D'],
    description: 'Filter drafts',
  },
  {
    category: 'Navigation',
    keys: ['Ctrl', 'L'],
    description: 'Filter low stock products',
  },
  {
    category: 'Navigation',
    keys: ['Ctrl', 'R'],
    description: 'Filter recently added products',
  },
  {
    category: 'Actions',
    keys: ['Ctrl', 'N'],
    description: 'Create new product',
  },
  {
    category: 'Actions',
    keys: ['Ctrl', 'S'],
    description: 'Save (when in forms)',
  },
  {
    category: 'Actions',
    keys: ['Ctrl', 'F'],
    description: 'Focus search input',
  },
  {
    category: 'General',
    keys: ['?'],
    description: 'Show keyboard shortcuts',
  },
  {
    category: 'General',
    keys: ['Esc'],
    description: 'Close modals/dialogs',
  },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <div key={keyIndex} className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs px-2 py-1 min-w-[2rem] justify-center"
                          >
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs mx-1">+</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Tip: On Mac, use <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">Cmd</kbd> instead of{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">Ctrl</kbd>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

