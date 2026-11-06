/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django API. Empty in development (Vite proxy). */
  readonly VITE_API_URL?: string;
  /** Path the dashboard is served from, e.g. "/fh-console-7x2k9/". */
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
