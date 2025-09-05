import { AppConfig, MessageType, OrderSpec, SpecField, Payload } from './types.js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import iconv from 'iconv-lite'
import YAML from 'yaml'

function normalizeIfNeeded(s: string, on: boolean | undefined): string {
  return on === false ? s : s.normalize('NFC')
}

function encodeTruncateBytes(s: string, maxLen: number, charset: 'EUC-KR' | 'UTF-8'): Buffer {
  const encName = charset === 'EUC-KR' ? 'euckr' : 'utf8'
  const out = Buffer.allocUnsafe(maxLen)
  let used = 0
  for (const ch of s) {
    const b = iconv.encode(ch, encName)
    if (used + b.length > maxLen) break
    b.copy(out, used)
    used += b.length
  }
  return out.subarray(0, used)
}

function padToLengthBytes(content: Buffer, totalLen: number, padSide: 'left'|'right', padChar: string, charset: 'EUC-KR' | 'UTF-8'): Buffer {
  if (content.length >= totalLen) return content.subarray(0, totalLen)
  const encName = charset === 'EUC-KR' ? 'euckr' : 'utf8'
  let padB = iconv.encode(padChar, encName)
  if (padB.length !== 1) padB = iconv.encode(' ', encName)
  const need = totalLen - content.length
  const pad = Buffer.alloc(need, padB[0])
  return padSide === 'left' ? Buffer.concat([pad, content]) : Buffer.concat([content, pad])
}

export class OrderBuilder {
  private spec: OrderSpec
  private cfg: AppConfig

  constructor(cfg: AppConfig) {
    this.cfg = cfg
    const cfgDir = process.env.VITE_DEV_SERVER_URL
      ? path.join(process.cwd(), 'config')
      : path.join(process.resourcesPath, 'config')
    const specPath = path.join(cfgDir, 'order_spec.yaml')
    const specStr = fs.readFileSync(specPath, 'utf-8')
    this.spec = YAML.parse(specStr) as OrderSpec
  }

  private encodeFieldString(s: string, f: SpecField): Buffer {
    const charset = this.cfg.charset
    const normed  = normalizeIfNeeded(s, this.cfg.normalize)
    const content = encodeTruncateBytes(normed, f.len, charset)
    const side = f.pad ?? (f.type === 'number' || f.type === 'price' ? 'left' : 'right')
    const fill = f.fill ?? (f.type === 'number' || f.type === 'price' ? '0' : ' ')
    return padToLengthBytes(content, f.len, side, fill, charset)
  }

  build(type: MessageType, payload: Payload): Buffer {
    const msgSpec = this.spec.messages[type]
    if (!msgSpec) throw new Error(`Unknown message type: ${type}`)

    const parts: Buffer[] = []
    const pushField = (f: SpecField, value?: string) => {
      if (f.fixed !== undefined) { parts.push(this.encodeFieldString(f.fixed, f)); return }
      if (f.type === 'enum' && f.map) {
        if (value === undefined) throw new Error(`Missing enum for ${f.name}`)
        const mapped = f.map[value]
        if (mapped === undefined) throw new Error(`Enum value ${value} not in map for ${f.name}`)
        parts.push(this.encodeFieldString(mapped, f)); return
      }
      if (f.type === 'number' || f.type === 'price') {
        if (value === undefined) throw new Error(`Missing number for ${f.name}`)
        const scale = f.scale ?? 0
        const num   = Number(value)
        if (Number.isNaN(num)) throw new Error(`Invalid number for ${f.name}: ${value}`)
        const scaled = Math.round(num * Math.pow(10, scale))
        parts.push(this.encodeFieldString(String(scaled), f)); return
      }
      parts.push(this.encodeFieldString(value ?? '', f))
    }

    for (const f of msgSpec.header) pushField(f)
    for (const f of msgSpec.body)   pushField(f, payload[f.name] !== undefined ? String(payload[f.name]) : undefined)

    const bodyBuf = Buffer.concat(parts)

    const includeHdr = this.cfg.length_includes_header
    const totalLen   = bodyBuf.length + (includeHdr ? 4 : 0)

    let frame: Buffer
    if (this.cfg.framing === 'ascii') {
      frame = Buffer.from(String(totalLen).padStart(4, '0'), 'ascii')
    } else {
      const be = (this.cfg.endian ?? 'BE') === 'BE'
      frame = Buffer.alloc(4)
      be ? frame.writeUInt32BE(totalLen, 0) : frame.writeUInt32LE(totalLen, 0)
    }
    return Buffer.concat([frame, bodyBuf])
  }
}
