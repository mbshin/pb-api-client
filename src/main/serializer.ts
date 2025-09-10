// --- from earlier (schemas, encodeMessage, etc.) ---
export type MsgType = 'NEW_ORDER' | 'CANCEL' | 'AMEND'

type Kind = 'ascii' | 'num'
type FieldSpec = { key: string; size: number; kind: Kind }
type MessageSpec = { type: MsgType; fields: FieldSpec[] }

const NEW_ORDER: MessageSpec = {
  type: 'NEW_ORDER',
  fields: [
    { key: 'ACNT_NO',   size: 12, kind: 'ascii' },
    { key: 'ISIN',      size: 12, kind: 'ascii' },
    { key: 'SIDE',      size: 1,  kind: 'ascii' },
    { key: 'ORD_TYPE',  size: 1,  kind: 'ascii' },
    { key: 'QTY',       size: 10, kind: 'num'   },
    { key: 'PRICE',     size: 13, kind: 'num'   },
    { key: 'TIF',       size: 3,  kind: 'ascii' },
    { key: 'SHORT_CD',  size: 1,  kind: 'ascii' },
    { key: 'CL_ORD_ID', size: 20, kind: 'ascii' },
  ],
}

const CANCEL: MessageSpec = {
  type: 'CANCEL',
  fields: [
    { key: 'ACNT_NO',    size: 12, kind: 'ascii' },
    { key: 'ORIG_CL_ID', size: 20, kind: 'ascii' },
    { key: 'REASON',     size: 1,  kind: 'ascii' },
    { key: 'CL_ORD_ID',  size: 20, kind: 'ascii' },
  ],
}

const AMEND: MessageSpec = {
  type: 'AMEND',
  fields: [
    { key: 'ACNT_NO',    size: 12, kind: 'ascii' },
    { key: 'ORIG_CL_ID', size: 20, kind: 'ascii' },
    { key: 'NEW_QTY',    size: 10, kind: 'num'   },
    { key: 'NEW_PRICE',  size: 13, kind: 'num'   },
    { key: 'CL_ORD_ID',  size: 20, kind: 'ascii' },
  ],
}

const SCHEMAS: Record<MsgType, MessageSpec> = {
  NEW_ORDER, CANCEL, AMEND,
}

// --- Encoding helpers ---
function encodeField({ kind, size }: FieldSpec, val: any): Buffer {
  if (kind === 'ascii') {
    const s = (val ?? '').toString()
    return Buffer.from(s.padEnd(size).slice(0, size), 'ascii')
  }
  if (kind === 'num') {
    const s = (val ?? '').toString().replace(/\D/g, '')
    return Buffer.from(s.padStart(size, '0').slice(-size), 'ascii')
  }
  throw new Error(`Unknown kind: ${kind}`)
}

/** Encode body buffer for given message type */
export function encodeBody(type: MsgType, payload: Record<string, any>): Buffer {
  const spec = SCHEMAS[type]
  if (!spec) throw new Error(`Unknown message type: ${type}`)

  const parts = spec.fields.map(f => encodeField(f, payload[f.key]))
  return Buffer.concat(parts)
}

/** Frame body with 4-byte length prefix (big-endian) */
export function encodeMessage(type: MsgType, payload: Record<string, any>) {
  const body = encodeBody(type, payload)
  const frame = Buffer.allocUnsafe(4 + body.length)
  frame.writeUInt32BE(body.length, 0)
  body.copy(frame, 4)

  return {
    body,
    frame,
    hexBody: body.toString('hex'),
    hexFrame: frame.toString('hex'),
  }
}

// --- decode helper ---
function decodeField({ kind, size }: FieldSpec, buf: Buffer): string {
  const raw = buf.toString('ascii')
  if (kind === 'ascii') {
    return raw.trim()
  }
  if (kind === 'num') {
    return raw.replace(/^0+/, '') || '0'
  }
  return raw
}

/**
 * Deserialize a framed message:
 * - strips 4-byte length header
 * - slices fields according to schema
 * - returns { payload, hexBody }
 */
export function decodeMessage(type: MsgType, frame: Buffer) {
  const spec = SCHEMAS[type]
  if (!spec) throw new Error(`Unknown type ${type}`)

  const bodyLen = frame.readUInt32BE(0)
  const body = frame.subarray(4, 4 + bodyLen)

  let offset = 0
  const payload: Record<string, string> = {}
  for (const f of spec.fields) {
    const slice = body.subarray(offset, offset + f.size)
    offset += f.size
    payload[f.key] = decodeField(f, slice)
  }

  return { payload, hexBody: body.toString('hex') }
}
