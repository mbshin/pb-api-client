import type { PreloadTcpApi } from '../../dist-electron/preload'
declare global { interface Window { tcp: PreloadTcpApi } }
export {}
