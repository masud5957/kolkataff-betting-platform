'use client'

import { useEffect, useState } from 'react'
import { Check, QrCode, X } from 'lucide-react'

export default function AdminPage() {
  const [requests, setRequests] = useState<Array<{ id: string; userId: string; amountPaise: number; method: string; utr: string }>>([])
  const [settings, setSettings] = useState({ upiId: '', accountName: '', qrUrl: '' })
  const [withdrawals, setWithdrawals] = useState<Array<{ id: string; userId: string; amountPaise: number; method: string }>>([])
  const [message, setMessage] = useState('')
  const [allowed, setAllowed] = useState<boolean | null>(null)
  useEffect(() => {
    fetch('/api/me').then(response => response.ok ? response.json() : null).then(data => setAllowed(data?.user?.role === 'admin')).catch(() => setAllowed(false))
    Promise.all([fetch('/api/admin/recharges'), fetch('/api/admin/withdrawals'), fetch('/api/admin/payment-settings')]).then(async ([queue, withdrawalQueue, config]) => {
      if (queue.ok) setRequests((await queue.json()).requests ?? [])
      if (withdrawalQueue.ok) setWithdrawals((await withdrawalQueue.json()).requests ?? [])
      if (config.ok) { const data = await config.json(); if (data.settings) setSettings(data.settings) }
    })
  }, [])
  const review = async (id: string, status: 'approved' | 'rejected') => {
    const response = await fetch('/api/admin/recharges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    if (response.ok) setRequests(current => current.filter(item => item.id !== id))
  }
  const reviewWithdrawal = async (id: string, status: 'approved' | 'rejected') => { const response = await fetch('/api/admin/withdrawals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); if (response.ok) setWithdrawals(current => current.filter(item => item.id !== id)) }
  const save = async () => {
    const response = await fetch('/api/admin/payment-settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setMessage(response.ok ? 'Payment settings saved.' : 'Admin access required.')
  }
  if (allowed === null) return <main className="admin-page"><p className="subtle">Checking admin access…</p></main>
  if (!allowed) return <main className="admin-page"><div className="panel"><h1>Admin access required</h1><p className="subtle">This control room is restricted to authorized administrators.</p></div></main>
  return <main className="admin-page"><div className="page-intro"><p className="muted-label">KOLKATAFF · CONTROL ROOM</p><h1>Payments, under control.</h1><p>Review deposits before crediting player wallets.</p></div><div className="admin-grid"><section className="panel admin-requests"><div className="panel-heading"><div><p className="muted-label">DEPOSIT QUEUE</p><h2>Pending deposits</h2></div><span className="queue-count">{requests.length} pending</span></div>{requests.length === 0 ? <p className="subtle">No deposits are waiting for review.</p> : requests.map(item => <div className="request-row" key={item.id}><div><strong>Player {item.userId.slice(0, 8)}</strong><small>₹{(item.amountPaise / 100).toLocaleString('en-IN')} · {item.method.toUpperCase()} · UTR {item.utr}</small></div><div className="request-actions"><button className="approve" onClick={() => review(item.id, 'approved')} aria-label="Approve deposit"><Check size={15} /></button><button className="reject" onClick={() => review(item.id, 'rejected')} aria-label="Reject deposit"><X size={15} /></button></div></div>)}</section><section className="panel admin-requests"><div className="panel-heading"><div><p className="muted-label">WITHDRAWAL QUEUE</p><h2>Pending withdrawals</h2></div><span className="queue-count">{withdrawals.length} pending</span></div>{withdrawals.length === 0 ? <p className="subtle">No withdrawals are waiting for review.</p> : withdrawals.map(item => <div className="request-row" key={item.id}><div><strong>Player {item.userId.slice(0, 8)}</strong><small>₹{(item.amountPaise / 100).toLocaleString('en-IN')} · {item.method.replace('withdrawal:', '')}</small></div><div className="request-actions"><button className="approve" onClick={() => reviewWithdrawal(item.id, 'approved')} aria-label="Approve withdrawal"><Check size={15} /></button><button className="reject" onClick={() => reviewWithdrawal(item.id, 'rejected')} aria-label="Reject withdrawal"><X size={15} /></button></div></div>)}</section><section className="panel settings-panel"><div className="panel-heading"><div><p className="muted-label">PLAYER PAYMENT DESTINATION</p><h2>UPI & QR settings</h2></div><QrCode size={20} /></div><label>UPI ID<input value={settings.upiId} onChange={event => setSettings({ ...settings, upiId: event.target.value })} placeholder="payments@upi" /></label><label>Account name<input value={settings.accountName} onChange={event => setSettings({ ...settings, accountName: event.target.value })} placeholder="KolkataFF Payments" /></label><label>QR code URL<input value={settings.qrUrl} onChange={event => setSettings({ ...settings, qrUrl: event.target.value })} placeholder="https://..." /></label><button className="primary-action" onClick={save}>Save payment settings</button>{message && <p className="secure-note">{message}</p>}</section></div></main>
}
