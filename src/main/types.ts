export type Framing = 'ascii' | 'binary'
export type Endian  = 'BE' | 'LE'

export interface AppConfig {
  host: string
  port: number
  framing: Framing
  endian?: Endian
  length_includes_header: boolean
  charset: 'EUC-KR' | 'UTF-8'
  normalize?: boolean
  log_recv_hex?: boolean
  log_send_hex?: boolean
}

export type FieldType = 'char' | 'number' | 'price' | 'enum'

export interface SpecField {
  name: string
  len: number
  type: FieldType
  fixed?: string
  scale?: number
  pad?: 'left' | 'right'
  fill?: string
  map?: Record<string, string>
}

export type MessageType = 'NEW_ORDER' | 'CANCEL' | 'AMEND'
export interface MessageSpec { header: SpecField[]; body: SpecField[] }

export interface OrderSpec {
  messages: Record<MessageType, MessageSpec>
}

export type Payload = Record<string, string | number>
