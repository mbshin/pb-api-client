export type Status = 'Disconnected' | 'Connecting' | 'Connected'

export interface Message {
  id: number
  type: 'sent' | 'received'
  text: string
  timestamp: Date
}

export type Msg = {
  id: string
  dir: 'in' | 'out'
  ascii?: string
  hex?: string
  ts: string
}

// type LoadState =
//   | { kind: 'idle' }
//   | { kind: 'loading' }
//   | { kind: 'error'; msg: string }
//   | { kind: 'ready'; cfg: string }
