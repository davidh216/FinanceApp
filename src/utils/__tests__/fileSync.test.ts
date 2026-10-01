import {
  FILE_SYNC_STORAGE_KEY,
  loadSyncMeta,
  reconnectAction,
  saveSyncMeta,
} from '../fileSync';
import { formatSavedTime } from '../../components/import/FileSyncPanel';

describe('reconnectAction', () => {
  const meta = (pending: boolean) => ({ lastSyncedAt: 'T1', pending });

  it('does nothing when neither side changed', () => {
    expect(reconnectAction('T1', meta(false))).toBe('none');
  });

  it("saves this browser's changes to an unchanged file", () => {
    expect(reconnectAction('T1', meta(true))).toBe('save');
  });

  it('loads a file changed elsewhere', () => {
    expect(reconnectAction('T2', meta(false))).toBe('load');
    // Nothing known about the file: it's the one to trust.
    expect(reconnectAction('T2', null)).toBe('load');
  });

  it('asks when both changed', () => {
    expect(reconnectAction('T2', meta(true))).toBe('conflict');
  });
});

describe('sync meta', () => {
  beforeEach(() => window.localStorage.clear());

  it('round-trips and clears', () => {
    expect(loadSyncMeta()).toBeNull();
    saveSyncMeta({ lastSyncedAt: 'T1', pending: true });
    expect(loadSyncMeta()).toEqual({ lastSyncedAt: 'T1', pending: true });
    saveSyncMeta(null);
    expect(loadSyncMeta()).toBeNull();
  });

  it('ignores anything unreadable', () => {
    window.localStorage.setItem(FILE_SYNC_STORAGE_KEY, '{nope');
    expect(loadSyncMeta()).toBeNull();
    window.localStorage.setItem(FILE_SYNC_STORAGE_KEY, '{"pending":true}');
    expect(loadSyncMeta()).toBeNull();
  });
});

describe('formatSavedTime', () => {
  const now = new Date(2025, 5, 15, 12, 0);

  it('shows the time today, and the date before', () => {
    expect(
      formatSavedTime(new Date(2025, 5, 15, 9, 5).toISOString(), now)
    ).toBe('9:05 AM');
    expect(
      formatSavedTime(new Date(2025, 5, 14, 21, 30).toISOString(), now)
    ).toBe('Jun 14, 9:30 PM');
  });
});
