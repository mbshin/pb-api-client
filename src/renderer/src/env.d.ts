/// <reference types="vite/client" />
declare global {
  interface Window {
    api: { ping: () => string },
    readConfig: () => Promise<{ ok: true; data: any } | { ok: false; error: string }>
  }
}
