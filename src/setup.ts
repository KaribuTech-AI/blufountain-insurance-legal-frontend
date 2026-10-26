import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// The member area loads on demand, and a slow or busy machine can take longer than a second to
// load it the first time. A wait that is too short only makes a test fail for no reason.
configure({ asyncUtilTimeout: 5000 });

// jsdom has no layout, so it cannot scroll. Tests check that the app asks to.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

afterEach(() => {
  cleanup();
  vi.mocked(window.scrollTo).mockClear();
  localStorage.clear();
  window.location.hash = '';
});
