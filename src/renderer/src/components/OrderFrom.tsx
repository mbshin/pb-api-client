import React, { useState } from 'react'

type MsgType = 'NEW_ORDER' | 'CANCEL' | 'AMEND'

type Props = { onSent: (hex: string) => void; disabled?: boolean }

export default function OrderForm({ onSent, disabled }: Props) {
  const [type, setType] = useState<MsgType>('NEW_ORDER')
  const [f, setF] = useState<any>({
    ACNT_NO: '',
    ISIN: '',
    SIDE: 'BUY',
    ORD_TYPE: 'LIMIT',
    QTY: '1',
    PRICE: '0',
    TIF: 'DAY',
    SHORT_CD: 'General',
    CL_ORD_ID: ''
  })
  const [err, setErr] = useState<string | undefined>()

  const send = async () => {
    try {
      setErr(undefined)
      let payload: any = {}
      if (type === 'NEW_ORDER') {
        const req = [
          'ACNT_NO',
          'ISIN',
          'SIDE',
          'ORD_TYPE',
          'QTY',
          'PRICE',
          'TIF',
          'SHORT_CD',
          'CL_ORD_ID'
        ]
        for (const k of req) if (!f[k]) throw new Error(`Missing ${k}`)
        payload = {
          ACNT_NO: f.ACNT_NO,
          ISIN: f.ISIN,
          SIDE: f.SIDE,
          ORD_TYPE: f.ORD_TYPE,
          QTY: f.QTY,
          PRICE: f.PRICE,
          TIF: f.TIF,
          SHORT_CD: f.SHORT_CD,
          CL_ORD_ID: f.CL_ORD_ID
        }
      } else if (type === 'CANCEL') {
        const req = ['ACNT_NO', 'ORIG_CL_ID', 'REASON', 'CL_ORD_ID']
        for (const k of req) if (!f[k]) throw new Error(`Missing ${k}`)
        payload = {
          ACNT_NO: f.ACNT_NO,
          ORIG_CL_ID: f.ORIG_CL_ID,
          REASON: f.REASON,
          CL_ORD_ID: f.CL_ORD_ID
        }
      } else {
        const req = ['ACNT_NO', 'ORIG_CL_ID', 'NEW_QTY', 'NEW_PRICE', 'CL_ORD_ID']
        for (const k of req) if (!f[k]) throw new Error(`Missing ${k}`)
        payload = {
          ACNT_NO: f.ACNT_NO,
          ORIG_CL_ID: f.ORIG_CL_ID,
          NEW_QTY: f.NEW_QTY,
          NEW_PRICE: f.NEW_PRICE,
          CL_ORD_ID: f.CL_ORD_ID
        }
      }
      const hex = await window.koscom.send(type, payload)
      onSent(hex)
    } catch (e: any) {
      setErr(e.message)
    }
  }

  const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-3 items-center gap-3">{children}</div>
  )

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold">Message</div>
        <select
          className="border rounded-xl px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value as MsgType)}
        >
          <option value="NEW_ORDER">NEW_ORDER</option>
          <option value="CANCEL">CANCEL</option>
          <option value="AMEND">AMEND</option>
        </select>
      </div>

      {type === 'NEW_ORDER' && (
        <div className="grid gap-3">
          <Row>
            <label>Account</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.ACNT_NO}
              onChange={(e) => setF({ ...f, ACNT_NO: e.target.value })}
            />
          </Row>
          <Row>
            <label>ISIN</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.ISIN}
              onChange={(e) => setF({ ...f, ISIN: e.target.value })}
            />
          </Row>
          <Row>
            <label>Side</label>
            <select
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.SIDE}
              onChange={(e) => setF({ ...f, SIDE: e.target.value })}
            >
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </Row>
          <Row>
            <label>Order Type</label>
            <select
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.ORD_TYPE}
              onChange={(e) => setF({ ...f, ORD_TYPE: e.target.value })}
            >
              <option>LIMIT</option>
              <option>MARKET</option>
            </select>
          </Row>
          <Row>
            <label>Qty</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.QTY}
              onChange={(e) => setF({ ...f, QTY: e.target.value })}
            />
          </Row>
          <Row>
            <label>Price</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.PRICE}
              onChange={(e) => setF({ ...f, PRICE: e.target.value })}
            />
          </Row>
          <Row>
            <label>TIF</label>
            <select
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.TIF}
              onChange={(e) => setF({ ...f, TIF: e.target.value })}
            >
              <option>DAY</option>
              <option>IOC</option>
              <option>FOK</option>
            </select>
          </Row>
          <Row>
            <label>Short Sell</label>
            <select
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.SHORT_CD}
              onChange={(e) => setF({ ...f, SHORT_CD: e.target.value })}
            >
              <option>General</option>
              <option>Borrowed</option>
              <option>Other</option>
            </select>
          </Row>
          <Row>
            <label>Client Ord ID</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.CL_ORD_ID}
              onChange={(e) => setF({ ...f, CL_ORD_ID: e.target.value })}
            />
          </Row>
        </div>
      )}

      {type === 'CANCEL' && (
        <div className="grid gap-3">
          <Row>
            <label>Account</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.ACNT_NO || ''}
              onChange={(e) => setF({ ...f, ACNT_NO: e.target.value })}
            />
          </Row>
          <Row>
            <label>Orig Client ID</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.ORIG_CL_ID || ''}
              onChange={(e) => setF({ ...f, ORIG_CL_ID: e.target.value })}
            />
          </Row>
          <Row>
            <label>Reason</label>
            <select
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.REASON || 'UserReq'}
              onChange={(e) => setF({ ...f, REASON: e.target.value })}
            >
              <option value="UserReq">UserReq</option>
              <option value="Policy">Policy</option>
            </select>
          </Row>
          <Row>
            <label>New Client ID</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.CL_ORD_ID || ''}
              onChange={(e) => setF({ ...f, CL_ORD_ID: e.target.value })}
            />
          </Row>
        </div>
      )}

      {type === 'AMEND' && (
        <div className="grid gap-3">
          <Row>
            <label>Account</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.ACNT_NO || ''}
              onChange={(e) => setF({ ...f, ACNT_NO: e.target.value })}
            />
          </Row>
          <Row>
            <label>Orig Client ID</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.ORIG_CL_ID || ''}
              onChange={(e) => setF({ ...f, ORIG_CL_ID: e.target.value })}
            />
          </Row>
          <Row>
            <label>New Qty</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.NEW_QTY || ''}
              onChange={(e) => setF({ ...f, NEW_QTY: e.target.value })}
            />
          </Row>
          <Row>
            <label>New Price</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.NEW_PRICE || ''}
              onChange={(e) => setF({ ...f, NEW_PRICE: e.target.value })}
            />
          </Row>
          <Row>
            <label>New Client ID</label>
            <input
              className="col-span-2 border rounded-xl px-3 py-2"
              value={f.CL_ORD_ID || ''}
              onChange={(e) => setF({ ...f, CL_ORD_ID: e.target.value })}
            />
          </Row>
        </div>
      )}

      {err && <div className="text-red-600 text-sm mt-3">{err}</div>}
      <div className="flex justify-end mt-4">
        <button
          disabled={!!disabled}
          onClick={send}
          className="px-3 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
