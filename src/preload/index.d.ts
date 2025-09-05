import { ElectronAPI } from "@electron-toolkit/preload";

// declare global {
//   interface Window {
//     electron: ElectronAPI
//     api: unknown
//   }
// }


declare global {
  interface Window {
    api: {
      ping: () => string,
      readConfig: () => Promise<{ ok: true; data: any } | { ok: false; error: string }>
    },
  }

  type ReadConfigResult = { ok: true; data: any } | { ok: false; error: string }
}



