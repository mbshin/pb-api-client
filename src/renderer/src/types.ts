export type Status = 'Disconnected' | 'Connecting' | 'Connected'

export interface Message {
  id: number
  type: 'sent' | 'received'
  text: string
  timestamp: Date
}





// type LoadState =
//   | { kind: 'idle' }
//   | { kind: 'loading' }
//   | { kind: 'error'; msg: string }
//   | { kind: 'ready'; cfg: string }
