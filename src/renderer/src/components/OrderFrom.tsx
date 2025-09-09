import React, { useMemo, useState } from 'react'

type MsgType = 'NEW_ORDER' | 'CANCEL' | 'AMEND'

type Props = {
  onSent: (type: MsgType, payload: Record<string, string>) => void
  disabled?: boolean
}

type FieldKey =
  | 'ACNT_NO'
  | 'ISIN'
  | 'SIDE'
  | 'ORD_TYPE'
  | 'QTY'
  | 'PRICE'
  | 'TIF'
  | 'SHORT_CD'
  | 'CL_ORD_ID'
  | 'ORIG_CL_ID'
  | 'REASON'
  | 'NEW_QTY'
  | 'NEW_PRICE'

type FieldConfig = {
  label: string
  type: 'text' | 'number' | 'select'
  options?: string[]
  required?: boolean
  size?: number            // <-- size info shown in UI
  placeholder?: string
  min?: number             // numeric minimum (UI validation only)
  desc?: string            // optional inline hint
}

const CONFIG: Record<MsgType, Record<FieldKey, FieldConfig | undefined>> = {
  NEW_ORDER: {
    ACNT_NO:   { label: 'Account',      type: 'text',   required: true, size: 12, placeholder: '12 chars' },
    ISIN:      { label: 'ISIN',         type: 'text',   required: true, size: 12, placeholder: 'KR7005930003' },
    SIDE:      { label: 'Side',         type: 'select', required: true, options: ['BUY', 'SELL'], size: 1 },
    ORD_TYPE:  { label: 'Order Type',   type: 'select', required: true, options: ['LIMIT', 'MARKET'], size: 1 },
    QTY:       { label: 'Qty',          type: 'number', required: true, size: 10, min: 1, desc: 'digits only' },
    PRICE:     { label: 'Price',        type: 'number', required: true, size: 13, min: 0, desc: 'scaled or integer' },
    TIF:       { label: 'TIF',          type: 'select', required: true, options: ['DAY', 'IOC', 'FOK'], size: 3 },
    SHORT_CD:  { label: 'Short Sell',   type: 'select', required: true, options: ['General', 'Borrowed', 'Other'], size: 1 },
    CL_ORD_ID: { label: 'Client Ord ID',type: 'text',   required: true, size: 20, placeholder: 'unique id' },
    ORIG_CL_ID: undefined, REASON: undefined, NEW_QTY: undefined, NEW_PRICE: undefined
  },
  CANCEL: {
    ACNT_NO:    { label: 'Account',       type: 'text',   required: true, size: 12 },
    ORIG_CL_ID: { label: 'Orig Client ID',type: 'text',   required: true, size: 20 },
    REASON:     { label: 'Reason',        type: 'select', required: true, options: ['UserReq', 'Policy'], size: 1 },
    CL_ORD_ID:  { label: 'New Client ID', type: 'text',   required: true, size: 20 },
    ISIN: undefined, SIDE: undefined, ORD_TYPE: undefined, QTY: undefined, PRICE: undefined, TIF: undefined, SHORT_CD: undefined, NEW_QTY: undefined, NEW_PRICE: undefined
  },
  AMEND: {
    ACNT_NO:    { label: 'Account',       type: 'text',   required: true, size: 12 },
    ORIG_CL_ID: { label: 'Orig Client ID',type: 'text',   required: true, size: 20 },
    NEW_QTY:    { label: 'New Qty',       type: 'number', required: true, size: 10, min: 1 },
    NEW_PRICE:  { label: 'New Price',     type: 'number', required: true, size: 13, min: 0 },
    CL_ORD_ID:  { label: 'New Client ID', type: 'text',   required: true, size: 20 },
    ISIN: undefined, SIDE: undefined, ORD_TYPE: undefined, QTY: undefined, PRICE: undefined, TIF: undefined, SHORT_CD: undefined, REASON: undefined
  }
}

export default function OrderForm({ onSent, disabled }: Props) {
  const [type, setType] = useState<MsgType>('NEW_ORDER')
  const [f, setF] = useState<Record<string, string>>({
    SIDE: 'BUY',
    ORD_TYPE: 'LIMIT',
    TIF: 'DAY',
    SHORT_CD: 'General',
    REASON: 'UserReq'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formErr, setFormErr] = useState<string | undefined>(undefined)

  const fields = useMemo(
    () => Object.entries(CONFIG[type]).filter(([, v]) => v) as [FieldKey, FieldConfig][],
    [type]
  )

  function setField(k: FieldKey, v: string, meta: FieldConfig) {
    // enforce ascii field size limit in UI for text fields
    let next = v
    if (meta.type !== 'number' && meta.size) {
      next = next.slice(0, meta.size)
    }
    // numeric sanitization (digits only)
    if (meta.type === 'number') {
      next = next.replace(/\D+/g, '')
    }
    setF((prev) => ({ ...prev, [k]: next }))
    setErrors((e) => { const copy = { ...e }; delete copy[k]; return copy })
  }

  function validate(): boolean {
    const newErrs: Record<string, string> = {}
    for (const [k, meta] of fields) {
      const val = (f[k] ?? '').trim()
      if (meta.required && !val) newErrs[k] = 'Required'
      if (meta.type === 'number' && val) {
        const n = Number(val)
        if (!Number.isFinite(n)) newErrs[k] = 'Invalid number'
        else if (meta.min != null && n < meta.min) newErrs[k] = `Min ${meta.min}`
      }
      if (meta.size && meta.type !== 'number' && val.length > meta.size) {
        newErrs[k] = `Max ${meta.size} chars`
      }
      if (k === 'ISIN' && val && !/^[A-Za-z0-9]{12}$/.test(val)) {
        newErrs[k] = 'ISIN must be 12 alnum'
      }
    }
    setErrors(newErrs)
    return Object.keys(newErrs).length === 0
  }

  function buildPayload(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [k, meta] of fields) {
      const raw = (f[k] ?? '').trim()
      out[k] = raw
    }
    // Normalize casing for ISIN/UI choices (serialization will map to wire codes)
    if (out.ISIN) out.ISIN = out.ISIN.toUpperCase()
    return out
  }

  function send() {
    try {
      setFormErr(undefined)
      // if (!validate()) return
      const payload = buildPayload()
      onSent(type, payload)

    } catch (e: any) {
      setFormErr(e?.message ?? 'Failed to send.')
    }
  }

  const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-3 items-start gap-2">{children}</div>
  )

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Order Message</div>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as MsgType)}
          disabled={disabled}
        >
          <option value="NEW_ORDER">NEW_ORDER</option>
          <option value="CANCEL">CANCEL</option>
          <option value="AMEND">AMEND</option>
        </select>
      </div>

      {/* Fields */}
      <div className="grid gap-2">
        {fields.map(([k, meta]) => {
          const val = f[k] ?? ''
          const err = errors[k]
          const count = meta.type === 'number' ? val.length : [...val].length
          const over = meta.size ? count > meta.size : false

          return (
            <div key={k} className="rounded-lg border border-gray-200 p-2">
              <Row>
                <div className="text-[13px] text-gray-700">
                  <div className="font-medium">{meta.label}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {meta.size && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${over ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                        size {meta.size}
                      </span>
                    )}
                    {meta.desc && <span className="text-[11px] text-gray-500">{meta.desc}</span>}
                  </div>
                </div>

                <div className="col-span-2">
                  {meta.type === 'select' ? (
                    <select
                      className={`w-full border rounded-lg px-3 py-2 text-sm ${err ? 'border-rose-400' : 'border-gray-300'}`}
                      value={val}
                      onChange={(e) => setField(k, e.target.value, meta)}
                      disabled={disabled}
                    >
                      {meta.options!.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={`w-full border rounded-lg px-3 py-2 text-sm ${err || over ? 'border-rose-400' : 'border-gray-300'}`}
                      type={meta.type === 'number' ? 'text' : 'text'}
                      inputMode={meta.type === 'number' ? 'numeric' : undefined}
                      placeholder={meta.placeholder}
                      value={val}
                      onChange={(e) => setField(k, e.target.value, meta)}
                      disabled={disabled}
                      maxLength={meta.type !== 'number' && meta.size ? meta.size : undefined}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          send()
                        }
                      }}
                    />
                  )}

                  {/* Counter & error */}
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-[11px] text-gray-500">
                      {meta.size ? (
                        <span className={over ? 'text-rose-600' : ''}>
                          {count}/{meta.size}
                        </span>
                      ) : (
                        <span>{count}</span>
                      )}
                    </div>
                    {err && <div className="text-[11px] text-rose-600">{err}</div>}
                  </div>
                </div>
              </Row>
            </div>
          )
        })}
      </div>

      {formErr && <div className="text-rose-600 text-sm mt-3">{formErr}</div>}

      {/* Actions */}
      <div className="flex justify-end mt-4">
        <button
          disabled={disabled}
          onClick={send}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
