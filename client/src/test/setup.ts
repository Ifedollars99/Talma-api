import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

// The jest-dom matchers are wired up manually so the package does not need to
// resolve `vitest` from the workspace root.
expect.extend(matchers as unknown as Parameters<typeof expect.extend>[0])

// jsdom does not implement matchMedia, which some components query.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
