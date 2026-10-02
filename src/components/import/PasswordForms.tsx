import React, { useId, useState } from 'react';
import { Button } from '../ui/Button';
import { MIN_PASSWORD_LENGTH } from '../../utils/encryption';

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// The warning that comes with every new password.
export const FORGOTTEN_PASSWORD_WARNING =
  "If you forget the password, the file can't be opened by anyone, you included. The data in this browser isn't affected.";

// Choosing a password, typed twice.
export const NewPasswordForm: React.FC<{
  submitLabel: string;
  onSubmit: (password: string) => void | Promise<void>;
  onCancel?: () => void;
}> = ({ submitLabel, onSubmit, onCancel }) => {
  const id = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const tooShort = password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm !== '' && confirm !== password;

  return (
    <form
      className="space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (tooShort || confirm !== password) return;
        setBusy(true);
        try {
          await onSubmit(password);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs text-amber-800 bg-amber-50 rounded p-2">
        {FORGOTTEN_PASSWORD_WARNING}
      </p>
      <label className="block" htmlFor={`${id}-password`}>
        <span className="block text-sm text-gray-700 mb-1">
          Password (at least {MIN_PASSWORD_LENGTH} characters)
        </span>
        <input
          id={`${id}-password`}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClasses}
        />
      </label>
      <label className="block" htmlFor={`${id}-confirm`}>
        <span className="block text-sm text-gray-700 mb-1">Password again</span>
        <input
          id={`${id}-confirm`}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          aria-invalid={mismatch}
          className={fieldClasses}
        />
      </label>
      {mismatch && (
        <p className="text-sm text-red-600" role="alert">
          The passwords don't match.
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={tooShort || confirm !== password || busy}
        >
          {busy ? 'Encrypting…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

// Entering the password of a protected file.
export const UnlockForm: React.FC<{
  label: string;
  onUnlock: (password: string) => Promise<boolean>;
}> = ({ label, onUnlock }) => {
  const id = useId();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!password) return;
        setBusy(true);
        const opened = await onUnlock(password);
        setBusy(false);
        if (!opened) setPassword('');
      }}
    >
      <label className="flex-1 min-w-[12rem]" htmlFor={id}>
        <span className="block text-sm text-gray-700 mb-1">{label}</span>
        <input
          id={id}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClasses}
        />
      </label>
      <Button type="submit" size="sm" disabled={!password || busy}>
        {busy ? 'Opening…' : 'Unlock'}
      </Button>
    </form>
  );
};
