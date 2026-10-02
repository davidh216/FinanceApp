import {
  WrongPasswordError,
  decryptText,
  encryptText,
  isEncrypted,
  openSealed,
} from '../encryption';

// Few iterations keep the tests quick; the app uses 600,000.
const FAST = 1000;

describe('encryption', () => {
  it('round-trips text with the right password', async () => {
    const text = JSON.stringify({ app: 'FinanceApp', accounts: ['café ☕'] });
    const sealed = await encryptText(text, 'correct horse', FAST);
    expect(isEncrypted(sealed)).toBe(true);
    expect(sealed).not.toContain('café');
    expect(await decryptText(sealed, 'correct horse')).toBe(text);
  });

  it('turns down a wrong password', async () => {
    const sealed = await encryptText('secret', 'correct horse', FAST);
    await expect(decryptText(sealed, 'wrong horse')).rejects.toBeInstanceOf(
      WrongPasswordError
    );
  });

  it('notices a changed file', async () => {
    const sealed = JSON.parse(await encryptText('secret', 'pw12345678', FAST));
    sealed.data = sealed.data.replace(/^./, (c: string) =>
      c === 'A' ? 'B' : 'A'
    );
    await expect(
      decryptText(JSON.stringify(sealed), 'pw12345678')
    ).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it('uses a new salt and nonce every time', async () => {
    const a = JSON.parse(await encryptText('same', 'pw12345678', FAST));
    const b = JSON.parse(await encryptText('same', 'pw12345678', FAST));
    expect(a.kdf.salt).not.toBe(b.kdf.salt);
    expect(a.cipher.iv).not.toBe(b.cipher.iv);
    expect(a.data).not.toBe(b.data);
  });

  it('tells plain files apart', () => {
    expect(isEncrypted('{"app":"FinanceApp","version":1}')).toBe(false);
    expect(isEncrypted('not json')).toBe(false);
  });
});

describe('openSealed', () => {
  it('gives a sealer that saves again with the same password', async () => {
    const sealed = await encryptText('first', 'pw12345678', FAST);
    const { text, sealer } = await openSealed(sealed, 'pw12345678');
    expect(text).toBe('first');
    const again = await sealer.seal('second');
    expect(JSON.parse(again).kdf.salt).toBe(JSON.parse(sealed).kdf.salt);
    expect(JSON.parse(again).cipher.iv).not.toBe(JSON.parse(sealed).cipher.iv);
    expect(await decryptText(again, 'pw12345678')).toBe('second');
  });
});
