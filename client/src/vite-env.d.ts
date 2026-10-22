/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Talma API. Defaults to the same-origin `/api` proxy. */
  readonly VITE_API_BASE_URL?: string
  /** Dev-only proxy target used by Vite. */
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
