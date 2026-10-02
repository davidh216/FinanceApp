import '@testing-library/jest-dom';
import { pinClock } from './test/clock';

// Runs before each test file's imports, so mock data generated at import
// time already sees the pinned date.
pinClock();

// jsdom has no Web Crypto or TextEncoder; Node's are the same standard
// APIs the browser provides.
/* eslint-disable @typescript-eslint/no-var-requires */
const nodeCrypto = require('crypto');
const nodeUtil = require('util');
/* eslint-enable @typescript-eslint/no-var-requires */
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: nodeCrypto.webcrypto,
    configurable: true,
  });
}
if (typeof globalThis.TextEncoder === 'undefined') {
  Object.assign(globalThis, {
    TextEncoder: nodeUtil.TextEncoder,
    TextDecoder: nodeUtil.TextDecoder,
  });
}
