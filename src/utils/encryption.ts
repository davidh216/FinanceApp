// src/utils/encryption.ts
// Password protection for backups and the auto-save file, with the
// browser's own cryptography: a key derived from the password (PBKDF2,
// SHA-256) encrypts the file with AES-GCM, which also detects a wrong
// password or a changed file. The password itself is never stored.
import { BACKUP_APP } from './backup';

export const ENCRYPTED_FORMAT = 'FinanceApp-encrypted';
const ITERATIONS = 600000;
export const MIN_PASSWORD_LENGTH = 8;

export interface EncryptedFile {
  app: typeof BACKUP_APP;
  format: typeof ENCRYPTED_FORMAT;
  version: 1;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { name: 'AES-GCM'; iv: string };
  data: string;
}

// Browsers offer encryption only on secure pages: https, or the app on
// this computer (localhost).
export const encryptionAvailable = (): boolean =>
  typeof crypto !== 'undefined' && crypto.subtle !== undefined;

export const NO_ENCRYPTION_MESSAGE =
  "This browser can't use passwords here. Open FinanceApp at localhost or over https.";

export class WrongPasswordError extends Error {
  constructor() {
    super("That password doesn't open this file.");
  }
}

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (text: string): Uint8Array =>
  Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

const deriveKey = async (
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> => {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Whether a file's text is a password-protected FinanceApp file.
export const isEncrypted = (text: string): boolean => {
  try {
    const data = JSON.parse(text);
    return data?.app === BACKUP_APP && data?.format === ENCRYPTED_FORMAT;
  } catch {
    return false;
  }
};

// Encrypts text again and again with one key, as the auto-save file does
// on every change: deriving a key is slow on purpose, so it's done once per
// password. Each file still gets a fresh nonce.
export interface Sealer {
  seal: (text: string) => Promise<string>;
}

const sealerFor = (
  key: CryptoKey,
  salt: Uint8Array,
  iterations: number
): Sealer => ({
  seal: async (text) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(text)
      )
    );
    const file: EncryptedFile = {
      app: BACKUP_APP,
      format: ENCRYPTED_FORMAT,
      version: 1,
      kdf: {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations,
        salt: toBase64(salt),
      },
      cipher: { name: 'AES-GCM', iv: toBase64(iv) },
      data: toBase64(data),
    };
    return JSON.stringify(file, null, 2);
  },
});

export const createSealer = async (
  password: string,
  iterations: number = ITERATIONS
): Promise<Sealer> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return sealerFor(
    await deriveKey(password, salt, iterations),
    salt,
    iterations
  );
};

// Opens a protected file, returning its text and a sealer that saves it
// again with the same password. Throws WrongPasswordError for a wrong
// password (or a file changed since it was saved).
export const openSealed = async (
  text: string,
  password: string
): Promise<{ text: string; sealer: Sealer }> => {
  const file = JSON.parse(text) as EncryptedFile;
  const salt = fromBase64(file.kdf.salt);
  const key = await deriveKey(password, salt, file.kdf.iterations);
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(file.cipher.iv) },
      key,
      fromBase64(file.data)
    );
    return {
      text: new TextDecoder().decode(plain),
      sealer: sealerFor(key, salt, file.kdf.iterations),
    };
  } catch {
    throw new WrongPasswordError();
  }
};

export const encryptText = async (
  text: string,
  password: string,
  iterations: number = ITERATIONS
): Promise<string> => (await createSealer(password, iterations)).seal(text);

export const decryptText = async (
  text: string,
  password: string
): Promise<string> => (await openSealed(text, password)).text;
