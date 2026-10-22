/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

/**
 * Registers the jest-dom matcher types on Vitest's `expect`.
 *
 * The package's own `/vitest` entry point cannot be used because it resolves
 * `vitest` from the workspace root, so the matchers are wired up manually in
 * `src/test/setup.ts` and their types are declared here.
 */
declare module 'vitest' {
  interface Assertion<T = unknown> extends TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
