'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, MessageSquare, Type, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { matchesPhrase } from '@/lib/article-delete';
import { defaultScheduleTime, parseScheduleTime } from '@/lib/bulk-schedule';

export function AdminSecureActionDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'destructive',
  requirePassword = true,
  requirePhrase,
  requireDateTime = false,
  dateTimeLabel = 'Publish at',
  showAuthorNote = false,
  authorNoteRequired = false,
  authorNoteLabel = 'Note for author',
  authorNotePlaceholder = 'Explain what needs to change or why this action was taken…',
  loading = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'destructive' | 'primary' | 'success';
  requirePassword?: boolean;
  /** Words the user must type out before the action can be confirmed. */
  requirePhrase?: string;
  /** Ask for a future date and time — scheduling, not just confirming. */
  requireDateTime?: boolean;
  dateTimeLabel?: string;
  showAuthorNote?: boolean;
  authorNoteRequired?: boolean;
  authorNoteLabel?: string;
  authorNotePlaceholder?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    password?: string;
    authorNote?: string;
    phrase?: string;
    scheduledAt?: string;
  }) => void | Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [authorNote, setAuthorNote] = useState('');
  const [phrase, setPhrase] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) {
      setPassword('');
      setAuthorNote('');
      setPhrase('');
      setDateTime('');
    } else if (requireDateTime) {
      // Opened on the next round half hour rather than on "now", which would
      // already be in the past by the time the button is clicked.
      setDateTime((current) => current || defaultScheduleTime());
    }
  }, [open, requireDateTime]);

  if (!open || !mounted) return null;

  function handleClose() {
    setPassword('');
    setAuthorNote('');
    setPhrase('');
    setDateTime('');
    onClose();
  }

  const phraseSatisfied = !requirePhrase || matchesPhrase(phrase, requirePhrase);
  /* The same check the server runs. It is repeated here so the editor is told
     before the click rather than after it — the server still decides. */
  const schedule = requireDateTime ? parseScheduleTime(dateTime) : null;
  const dateTimeSatisfied = !requireDateTime || Boolean(schedule?.ok);
  const canConfirm = phraseSatisfied && dateTimeSatisfied;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Belt and braces: `required` does not stop a submit when the value is
    // merely wrong rather than empty.
    if (!canConfirm) return;
    await onConfirm({
      password: requirePassword ? password : undefined,
      authorNote: authorNote.trim() || undefined,
      phrase: requirePhrase ? phrase : undefined,
      scheduledAt: requireDateTime ? dateTime : undefined,
    });
  }

  return createPortal(
    <div className="admin-secure-dialog-backdrop" onClick={handleClose}>
      <div
        className="admin-secure-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-secure-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-secure-dialog-header">
          <div>
            <h3 id="admin-secure-dialog-title" className="admin-secure-dialog-title">{title}</h3>
            <p className="admin-secure-dialog-desc">{description}</p>
          </div>
          <button type="button" className="admin-secure-dialog-close ui-close-btn" onClick={handleClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-secure-dialog-body">
          {showAuthorNote && (
            <div>
              <label className="admin-secure-dialog-label">
                <MessageSquare className="h-3 w-3" />
                {authorNoteLabel}
              </label>
              <textarea
                value={authorNote}
                onChange={(e) => setAuthorNote(e.target.value)}
                placeholder={authorNotePlaceholder}
                rows={3}
                className="admin-secure-dialog-textarea"
                required={authorNoteRequired}
              />
            </div>
          )}

          {requireDateTime && (
            <div>
              <label className="admin-secure-dialog-label" htmlFor="admin-secure-dialog-datetime">
                <CalendarClock className="h-3 w-3" />
                {dateTimeLabel}
              </label>
              <Input
                id="admin-secure-dialog-datetime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="h-9"
                required
              />
              {schedule && !schedule.ok && dateTime && (
                <p className="admin-secure-dialog-hint admin-secure-dialog-hint--warn">{schedule.reason}</p>
              )}
            </div>
          )}

          {requirePhrase && (
            <div>
              <label className="admin-secure-dialog-label">
                <Type className="h-3 w-3" />
                Type <span className="admin-secure-dialog-phrase">{requirePhrase}</span> to confirm
              </label>
              <Input
                type="text"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder={requirePhrase}
                className="h-9"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-describedby="admin-secure-dialog-phrase-hint"
              />
              <p id="admin-secure-dialog-phrase-hint" className="admin-secure-dialog-hint">
                {phrase.trim() && !phraseSatisfied
                  ? 'That is not the phrase yet.'
                  : 'Capitals and extra spaces do not matter.'}
              </p>
            </div>
          )}

          {requirePassword && (
            <div>
              <label className="admin-secure-dialog-label">
                <Lock className="h-3 w-3" />
                Confirm your password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your admin password"
                className="h-9"
                required
                autoComplete="current-password"
              />
            </div>
          )}

          <div className="admin-secure-dialog-actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={loading}
              className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/30"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !canConfirm}
              className={cn(
                variant === 'destructive' && 'bg-destructive hover:bg-destructive/90',
                variant === 'success' && 'bg-emerald-600 hover:bg-emerald-500 text-white'
              )}
            >
              {loading ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}