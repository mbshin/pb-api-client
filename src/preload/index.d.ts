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
      readConfig: () => Promise<{ ok: true; data: any } | { ok: false; error: string }>,
      connect : (host, port) => void,
      send: (data) => Promise<{ ok: true; data: any } | { ok: false; error: string }>,
      onData: (callback: (msg: string) => void) => void;
    },
  }

  type ReadConfigResult = { ok: true; data: any } | { ok: false; error: string }
}



