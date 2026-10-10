import '@testing-library/jest-dom';

// Mock window.dabber (Electron bridge) for tests
Object.defineProperty(window, 'dabber', {
  writable: true,
  value: {
    openVideo: async () => null,
    openFolder: async () => null,
    saveDialog: async () => null,
    getAppVersion: async () => '1.0.0',
    readFile: async () => ({ ok: false, error: 'mock' }),
    platform: 'test',
  },
});
