import '@testing-library/jest-dom/vitest'
import 'vitest-canvas-mock'

// jsdom does not implement window.matchMedia; Task 3's CRT overlay depends on it.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
