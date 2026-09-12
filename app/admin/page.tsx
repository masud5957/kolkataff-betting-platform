'use client'

import { useEffect, useState } from 'react'
import { Check, QrCode, Search, X } from 'lucide-react'

export default function AdminPage() {
  const [requests, setRequests] = useState<Array<{ id: string; userId: string; amountPaise: number; method: string; utr: string; name: string | null; email: string | null; phone: string }>>([])
  const [settings, setSettings] = useState({ upiId: '', accountName: '', accountNumber: '', ifsc: '', qrUrl: '' })
  const [withdrawals, setWithdrawals] = useState<Array<{ id: string; userId: string; amountPaise: number; method: string; name: string | null; email: string | null; phone: string }>>([])
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [depositSearch, setDepositSearch] = useState('')
  const [withdrawalSearch, setWithdrawalSearch] = useState('')
  useEffect(() => { fetch('/api/admin/login').then(response => response.json()).then(data => setAllowed(data.authenticated)).catch(() => setAllowed(false)) }, [])
  useEffect(() => {
    if (!allowed) return
    Promise.all([fetch('/api/admin/recharges', { cache: 'no-store' }), fetch('/api/admin/withdrawals', { cache: 'no-store' }), fetch('/api/admin/payment-settings', { cache: 'no-store' })]).then(async ([queue, withdrawalQueue, config]) => {
      if (queue.ok) setRequests((await queue.json()).requests ?? [])
      if (withdrawalQueue.ok) setWithdrawals((await withdrawalQueue.json()).requests ?? [])
      if (config.ok) { const data = await config.json(); if (data.settings) setSettings(data.settings) }
    })
  }, [allowed])
  const review = async (id: string, status: 'approved' | 'rejected') => {
    const response = await fetch('/api/admin/recharges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    if (response.ok) setRequests(current => current.filter(item => item.id !== id))
    else setSaveError((await response.json().catch(() => null))?.error ?? 'Unable to update recharge request.')
  }
  const reviewWithdrawal = async (id: string, status: 'approved' | 'rejected') => {
    const response = await fetch('/api/admin/withdrawals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    if (response.ok) setWithdrawals(current => current.filter(item => item.id !== id))
    else setSaveError((await response.json().catch(() => null))?.error ?? 'Unable to update withdrawal request.')
  }
  const save = async () => {
    if (savingSettings) return
    setSavingSettings(true)
    setMessage('')
    setSaveError('')
    try {
      const response = await fetch('/api/admin/payment-settings', {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ upiId: settings.upiId, accountName: settings.accountName, accountNumber: settings.accountNumber, ifsc: settings.ifsc, qrUrl: settings.qrUrl }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setSaveError(data?.error ?? `Unable to save payment settings (HTTP ${response.status}).`)
        return
      }
      if (data?.settings) setSettings(current => ({ ...current, ...data.settings }))
      setMessage('Payment settings saved to the database.')
    } catch {
      setSaveError('Unable to reach the payment settings service. Please try again.')
    } finally {
      setSavingSettings(false)
    }
  }

  if (allowed === null) return <main className="admin-page"><p className="subtle">Checking admin access…</p></main>
  const login = async (event: React.FormEvent) => { event.preventDefault(); setLoggingIn(true); setLoginError(''); const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }); if (response.ok) { setAllowed(true); setPassword('') } else { setLoginError('Invalid admin username or password.') } setLoggingIn(false) }
  if (!allowed) return <main className="admin-page"><div className="panel admin-login-card"><p className="muted-label">KOLKATAFF · ADMIN</p><h1>Control room login</h1><p className="subtle">Sign in with the admin credentials configured in Render environment variables.</p><form onSubmit={login}><label>Admin username<input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required /></label><label>Admin password<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label>{loginError && <p role="alert" className="error-message">{loginError}</p>}<button className="primary-action" disabled={loggingIn}>{loggingIn ? 'Signing in…' : 'Sign in to admin panel'}</button></form></div></main>
  const filteredDeposits = requests.filter(item => `${item.name ?? ''} ${item.email ?? ''} ${item.phone ?? ''} ${item.userId} ${item.utr}`.toLowerCase().includes(depositSearch.toLowerCase().trim()))
  const filteredWithdrawals = withdrawals.filter(item => `${item.name ?? ''} ${item.email ?? ''} ${item.phone ?? ''} ${item.userId} ${item.method}`.toLowerCase().includes(withdrawalSearch.toLowerCase().trim()))
  const refreshQueues = async () => { const [queue, withdrawalQueue, config] = await Promise.all([fetch('/api/admin/recharges', { cache: 'no-store' }), fetch('/api/admin/withdrawals', { cache: 'no-store' }), fetch('/api/admin/payment-settings', { cache: 'no-store' })]); if (queue.ok) setRequests((await queue.json()).requests ?? []); if (withdrawalQueue.ok) setWithdrawals((await withdrawalQueue.json()).requests ?? []); if (config.ok) { const data = await config.json(); if (data.settings) setSettings(data.settings) } }
  return <main className="admin-page"><header className="admin-topbar"><div className="brand-lockup"><span className="brand-mark">K</span><div><strong>KolkataFF</strong><small>Operations console</small></div></div><div className="admin-topbar-actions"><span className="live-status"><i /> Live</span><button className="outline-action" onClick={refreshQueues}>Refresh queues</button><button className="outline-action" onClick={async () => { await fetch('/api/admin/login', { method: 'DELETE' }); setAllowed(false) }}>Sign out</button></div></header><div className="admin-hero"><div><p className="muted-label">KOLKATAFF · CONTROL ROOM</p><h1>Payments, under control.</h1><p>Verify deposits and withdrawals before money moves.</p></div><div className="admin-date">Today<br /><strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div></div><div className="admin-metrics"><div><span>Awaiting review</span><strong>{requests.length + withdrawals.length}</strong><small>All queues</small></div><div><span>Deposits</span><strong>{requests.length}</strong><small>Need verification</small></div><div><span>Withdrawals</span><strong>{withdrawals.length}</strong><small>Need verification</small></div><div><span>System status</span><strong className="metric-live">Healthy</strong><small>Database connected</small></div></div><section className="panel payment-settings-panel"><div className="panel-heading"><div><p className="muted-label">PLAYER PAYMENT DESTINATION</p><h2>Payment settings</h2><p className="subtle">These details are read from the same database by the player recharge screen.</p></div><QrCode size={24} aria-hidden="true" /></div><div className="settings-form"><label>UPI ID<input value={settings.upiId} onChange={event => setSettings(current => ({ ...current, upiId: event.target.value }))} /></label><label>Account name<input value={settings.accountName} onChange={event => setSettings(current => ({ ...current, accountName: event.target.value }))} /></label><label>Account number<input value={settings.accountNumber} onChange={event => setSettings(current => ({ ...current, accountNumber: event.target.value }))} /></label><label>IFSC code<input value={settings.ifsc} onChange={event => setSettings(current => ({ ...current, ifsc: event.target.value }))} /></label><label>ImgBB QR image URL<input type="url" value={settings.qrUrl} onChange={event => setSettings(current => ({ ...current, qrUrl: event.target.value }))} placeholder="https://i.ibb.co/.../qr.png" /></label>{settings.qrUrl && <img className="payment-qr" src={settings.qrUrl} alt="Payment QR preview" />}<button className="primary-action" type="button" onClick={save} disabled={savingSettings}>{savingSettings ? 'Saving…' : 'Save payment settings'}</button>{message && <p className="secure-note" role="status">{message}</p>}{saveError && <p className="error-message" role="alert">{saveError}</p>}</div></section><section className="panel admin-requests withdrawal-panel"><div className="panel-heading"><div><p className="muted-label">WITHDRAWAL REQUESTS</p><h2>Pending withdrawals</h2><p className="subtle">Review player payout requests before releasing funds.</p></div><strong>{filteredWithdrawals.length}</strong></div><div className="queue-toolbar"><input value={withdrawalSearch} onChange={event => setWithdrawalSearch(event.target.value)} placeholder="Search withdrawals" aria-label="Search withdrawals" /></div>{filteredWithdrawals.length === 0 ? <p className="empty-state">No pending withdrawal requests.</p> : <div className="request-list">{filteredWithdrawals.map(item => <article className="request-card" key={item.id}><div><strong>{item.method.replace(/^withdrawal:/, '')}</strong><p>{item.name ?? 'Player'} · {item.email ?? item.userId}</p><small>₹{(item.amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</small></div><div className="request-actions"><button className="outline-action" type="button" onClick={() => reviewWithdrawal(item.id, 'rejected')}>Reject</button><button className="primary-action" type="button" onClick={() => reviewWithdrawal(item.id, 'approved')}>Approve</button></div></article>)}</div>}</section><div className="admin-grid"><section className="panel admin-requests"><div className="panel-heading"><div><p className="muted-label">DEPOSIT QUEUE</p><h2>Pending deposits</h2></div><span className="queue-count">{filteredDeposits.length} of {requests.length}</span></div><label className="queue-search"><Search size={15} /><input value={depositSearch} onChange={event => setDepositSearch(event.target.value)} placeholder="Search name, email, ID or UTR" aria-label="Search deposits" /></label>{filteredDeposits.length === 0 ? <p className="subtle">No deposits are waiting for review.</p> : requests.map(item => <div className="request-row" key={item.id}><div className="request-person"><span className="person-avatar">{(item.name ?? item.email ?? 'P').slice(0, 1).toUpperCase()}</span><div><strong>{item.name || 'Unnamed player'}</strong><small>{item.email || item.phone} · ID {item.userId.slice(0, 8)}</small><small>₹{(item.amountPaise / 100).toLocaleString('en-IN')} · {item.method.toUpperCase()} · UTR {item.utr}</small></div></div><div className="request-actions"><button className="approve" onClick={() => review(item.id, 'approved')} aria-label="Approve deposit"><Check size={15} /></button><button className="reject" onClick={() => review(item.id, 'rejected')} aria-label="Reject deposit"><X size={15} /></button></div></div>)}</section><section className="panel admin-requests"><div className="panel-heading"><div><p className="muted-label">WITHDRAWAL QUEUE</p><h2>Pending withdrawals</h2></div><span className="queue-count">{filteredWithdrawals.length} of {withdrawals.length}</span></div><label className="queue-search"><Search size={15} /><input value={withdrawalSearch} onChange={event => setWithdrawalSearch(event.target.value)} placeholder="Search name, email, ID or UPI" aria-label="Search withdrawals" /></label>{filteredWithdrawals.length === 0 ? <p className="subtle">No withdrawals are waiting for review.</p> : withdrawals.map(item => <div className="request-row" key={item.id}><div className="request-person"><span className="person-avatar">{(item.name ?? item.email ?? 'P').slice(0, 1).toUpperCase()}</span><div><strong>{item.name || 'Unnamed player'}</strong><small>{item.email || item.phone} · ID {item.userId.slice(0, 8)}</small><small>₹{(item.amountPaise / 100).toLocaleString('en-IN')} · UPI {item.method.replace('withdrawal:', '')}</small></div></div><div className="request-actions"><button className="approve" onClick={() => reviewWithdrawal(item.id, 'approved')} aria-label="Approve withdrawal"><Check size={15} /></button><button className="reject" onClick={() => reviewWithdrawal(item.id, 'rejected')} aria-label="Reject withdrawal"><X size={15} /></button></div></div>)}</section><section className="panel settings-panel"><div className="panel-heading"><div><p className="muted-label">PLAYER PAYMENT DESTINATION</p><h2>UPI & QR settings</h2></div><QrCode size={20} /></div><label>UPI ID<input value={settings.upiId} onChange={event => setSettings({ ...settings, upiId: event.target.value })} placeholder="payments@upi" /></label><label>Account name<input value={settings.accountName} onChange={event => setSettings({ ...settings, accountName: event.target.value })} placeholder="KolkataFF Payments" /></label><label>QR code URL<input value={settings.qrUrl} onChange={event => setSettings({ ...settings, qrUrl: event.target.value })} placeholder="https://..." /></label><button className="primary-action" type="button" onClick={save} disabled={savingSettings}>Save payment settings</button>{message && <p className="secure-note">{message}</p>}</section></div></main>
}
