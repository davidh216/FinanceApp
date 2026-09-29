import '@testing-library/jest-dom';
import { pinClock } from './test/clock';

// Runs before each test file's imports, so mock data generated at import
// time already sees the pinned date.
pinClock();
