'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CreditCard,
  Headphones,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  LogOut,
  Menu,
  MoreHorizontal,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

type View = 'overview' | 'recharge' | 'activity' | 'profile' | 'admin'

const navItems: { label: string; view: View; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', view: 'overview', icon: LayoutDashboard },
  { label: 'Recharge wallet', view: 'recharge', icon: WalletCards },
  { label: 'Activity', view: 'activity', icon: ClipboardList },
  { label: 'Profile & settings', view: 'profile', icon: Settings },
]

const transactions = [
  { label: 'Wallet recharge', meta: 'UPI · Today, 10:42 AM', amount: '+₹2,000', status: 'Success', positive: true },
  { label: 'KolkataFF wallet', meta: 'Transfer · Yesterday, 8:15 PM', amount: '−₹500', status: 'Completed', positive: false },
  { label: 'Wallet recharge', meta: 'Bank transfer · 12 Jun, 4:20 PM', amount: '+₹5,000', status: 'Success', positive: true },
]

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark" aria-label="KolkataFF">
      <div className="brand-sun"><Sparkles size={compact ? 15 : 18} strokeWidth={2.4} /></div>
      {!compact && <div><strong>Kolkata<span>FF</span></strong><small>PLAY SMART · STAY AHEAD</small></div>}
    </div>
  )
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [verificationPending, setVerificationPending] = useState(false)
  const [otp, setOtp] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)
  const otpInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (resendSeconds <= 0) return; const timer = window.setInterval(() => setResendSeconds(value => value - 1), 1000); return () => window.clearInterval(timer) }, [resendSeconds])
  const submit = async (action = mode) => {
    if (action === 'resend-verification' && resendSeconds > 0) return
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/auth/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, name, email, password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to continue')
      if (action === 'login') onAuthenticated(); else if (action === 'verify-signup-otp') onAuthenticated(); else { setMessage(result.message); if (action === 'signup' || action === 'resend-verification') { setVerificationPending(true); setResendSeconds(45); window.setTimeout(() => otpInputRef.current?.focus(), 50) } }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to continue') } finally { setBusy(false) }
  }
  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="auth-top"><Logo /></div>
        <div className="auth-copy">
          <div className="eyebrow"><span className="pulse-dot" /> INDIA&apos;S SMARTER GAME DESK</div>
          <h1>Play with<br /><em>clarity.</em></h1>
          <p>One secure wallet for your KolkataFF experience. Simple, transparent, always in your control.</p>
          <div className="trust-row"><ShieldCheck size={18} /><span>Trusted by 12,000+ verified players</span></div>
        </div>
        <div className="auth-grid-art" aria-hidden="true"><div /><div /><div /><div /><div /><div /></div>
        <div className="auth-foot">© 2024 KolkataFF <span>•</span> Responsible play only</div>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-logo"><Logo /></div>
        <div className="auth-form-wrap">
          <div className="auth-heading"><p className="muted-label">{mode === 'login' ? 'WELCOME BACK' : mode === 'signup' ? 'JOIN KOLKATAFF' : 'ACCOUNT RECOVERY'}</p><h2>{mode === 'login' ? 'Good to see you.' : mode === 'signup' ? 'Make your next move.' : 'Reset your password.'}</h2><p>{mode === 'login' ? 'Sign in to access your wallet and games.' : mode === 'signup' ? 'Create your secure KolkataFF account.' : 'We will send a secure reset link to your inbox.'}</p></div>
          {mode !== 'forgot' && <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setMessage('') }}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Create account</button></div>}
          {mode === 'signup' && <label>Full name<input autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /></label>}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></label>
          {mode !== 'forgot' && <label>Password<div className="password-input"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>}
          {mode === 'login' && <div className="form-row"><label className="checkbox-label"><input type="checkbox" /> Remember me</label><button type="button" className="forgot" onClick={() => { setMode('forgot'); setError(''); setMessage('') }}>Forgot password?</button></div>}
          {error && <p role="alert" className="error-message">{error}</p>}{message && <p className="secure-note">{message}</p>}
          {verificationPending ? <div className="otp-verification-card"><div className="otp-card-icon"><Mail size={20} /></div><strong>Enter your verification code</strong><span>We sent a 6-digit code to <b>{email}</b></span><input ref={otpInputRef} className="otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" aria-label="6-digit email verification code" /><button className="primary-action" onClick={() => submit('verify-signup-otp')} disabled={busy || otp.length !== 6}>{busy ? 'Verifying…' : 'Verify email'} <ArrowUpRight size={18} /></button><div className="otp-actions"><button type="button" className="forgot" onClick={() => submit('resend-verification')} disabled={busy || resendSeconds > 0}>{resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend code'}</button><button type="button" className="forgot" onClick={() => { setVerificationPending(false); setOtp(''); setError('') }}>Change email</button></div></div> : <button className="primary-action" onClick={() => submit()} disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : mode === 'signup' ? 'Send verification code' : 'Send reset link'} <ArrowUpRight size={18} /></button>}
          {mode === 'forgot' && <button type="button" className="forgot" onClick={() => setMode('login')}>Back to sign in</button>}
          <div className="secure-note"><ShieldCheck size={16} /> Your information is encrypted and protected</div>
          <p className="fine-print">By continuing, you agree to our <u>Terms of Service</u> and <u>Responsible Play Policy</u>.</p>
        </div>
        <div className="auth-help"><CircleHelp size={16} /> Need help? <u>Talk to support</u></div>
      </section>
    </main>
  )
}



function Sidebar({ view, setView, onSignOut }: { view: View; setView: (v: View) => void; onSignOut: () => void }) {
  return <aside className="sidebar"><div className="side-head"><Logo compact /><span className="live-badge">LIVE</span></div><div className="side-section"><p className="side-label">WORKSPACE</p>{navItems.map(({ label, view: itemView, icon: Icon }) => <button key={itemView} className={view === itemView ? 'side-link active' : 'side-link'} onClick={() => setView(itemView)}><Icon size={18} />{label}{itemView === 'recharge' && <span className="side-plus">+</span>}</button>)}</div><div className="side-section"><p className="side-label">MANAGE</p><button className={view === 'admin' ? 'side-link active' : 'side-link'} onClick={() => setView('admin')}><BarChart3 size={18} />Admin preview</button><button className="side-link"><CircleHelp size={18} />Help centre</button></div><div className="side-bottom"><div className="profile-mini"><div className="avatar">AR</div><div><strong>Arjun Roy</strong><small>Verified account</small></div><MoreHorizontal size={18} /></div><button className="side-link signout" onClick={onSignOut}><LogOut size={18} />Sign out</button></div></aside>
}

function Topbar({ title, onMenu }: { title: string; onMenu: () => void }) { return <header className="topbar"><button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu /></button><div><p className="breadcrumb">KOLKATAFF <ChevronRight size={13} /> ACCOUNT</p><h1>{title}</h1></div><div className="top-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">AR</div></div></header> }

function Overview({ setView, balance, userName }: { setView: (v: View) => void; balance: number | null; userName: string }) {
  return <><div className="welcome-row"><div><p className="muted-label">TUESDAY, 18 JUNE 2024</p><h2>Good morning, {userName.split(' ')[0]} <span>✦</span></h2><p className="subtle">Your account is ready. Here&apos;s your latest overview.</p></div><button className="outline-action" onClick={() => setView('recharge')}><ArrowDownToLine size={16} /> Add funds</button></div><div className="stats-grid"><div className="balance-card"><div className="card-top"><span className="muted-label">AVAILABLE BALANCE</span><WalletCards size={19} /></div><strong>{balance === null ? '—' : `₹${(balance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</strong><div className="balance-footer"><span className="positive"><TrendingUp size={14} /> +₹2,000 this month</span><span>Updated just now</span></div></div><div className="stat-card"><span className="muted-label">TOTAL PLAYED</span><strong>₹24,860</strong><span className="stat-hint">Across all games</span></div><div className="stat-card"><span className="muted-label">WIN RATE</span><strong>68.4%</strong><span className="stat-hint positive">↑ 4.2% this month</span></div></div><div className="content-grid"><section className="panel activity-panel"><div className="panel-heading"><div><p className="muted-label">RECENT ACTIVITY</p><h3>Your money, clearly tracked.</h3></div><button className="text-action" onClick={() => setView('activity')}>View all <ArrowUpRight size={15} /></button></div><div className="transaction-list">{transactions.map((tx) => <div className="transaction" key={tx.label + tx.meta}><div className={tx.positive ? 'tx-icon credit' : 'tx-icon debit'}>{tx.positive ? <ArrowDownToLine size={17} /> : <ArrowUpRight size={17} />}</div><div className="tx-info"><strong>{tx.label}</strong><span>{tx.meta}</span></div><div className="tx-amount"><strong className={tx.positive ? 'positive' : ''}>{tx.amount}</strong><span><Check size={12} /> {tx.status}</span></div></div>)}</div></section><section className="panel quick-panel"><div className="quick-icon"><QrCode size={23} /></div><p className="muted-label">QUICK RECHARGE</p><h3>Top up in seconds.</h3><p>Use UPI, bank transfer or scan a QR. Funds are reviewed securely.</p><button className="primary-action small" onClick={() => setView('recharge')}>Recharge wallet <ArrowUpRight size={16} /></button><div className="payment-marks"><span>UPI</span><span>IMPS</span><span>NEFT</span></div></section></div><section className="notice-bar"><div className="notice-symbol"><ShieldCheck size={19} /></div><div><strong>Your account is fully verified</strong><p>Phone verification complete. You&apos;re all set to play responsibly.</p></div><button onClick={() => setView('profile')}>View profile <ChevronRight size={16} /></button></section></>
}

function Recharge() { const [amount, setAmount] = useState('2000'); const [submitted, setSubmitted] = useState(false); const [utr, setUtr] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const submit = async () => { setBusy(true); setError(''); try { const response = await fetch('/api/wallet/recharge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, method: 'upi', utr }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to submit recharge'); setSubmitted(true) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to submit recharge') } finally { setBusy(false) } }; return <div className="recharge-page"><div className="page-intro"><p className="muted-label">WALLET MANAGEMENT</p><h2>Add funds securely.</h2><p>Choose an amount and payment method. Your recharge is reviewed before being added to your balance.</p></div><div className="recharge-layout"><section className="panel recharge-card"><div className="step-line"><span className="step active">1</span><div><strong>Choose amount</strong><small>Enter the amount you want to add</small></div></div><div className="amount-input"><span>₹</span><input value={amount} onChange={e => setAmount(e.target.value)} /></div><div className="amount-chips">{['500', '1,000', '2,000', '5,000', '10,000'].map(v => <button key={v} className={amount === v.replace(',', '') ? 'selected' : ''} onClick={() => setAmount(v.replace(',', ''))}>₹{v}</button>)}</div><div className="step-line second"><span className="step">2</span><div><strong>Payment reference</strong><small>Complete your transfer, then enter the UTR</small></div></div><label>UPI / bank UTR reference<input value={utr} onChange={e => setUtr(e.target.value)} placeholder="Enter the payment reference" /></label>{error && <p role="alert" className="error-message">{error}</p>}<div className="payment-options"><button className="payment-option selected"><div className="method-icon upi">UPI</div><span><strong>UPI / QR code</strong><small>Instant transfer</small></span><Check size={18} /></button><button className="payment-option"><div className="method-icon bank"><CreditCard size={18} /></div><span><strong>Bank transfer</strong><small>NEFT / IMPS</small></span><ChevronRight size={18} /></button></div><button className="primary-action" onClick={submit} disabled={busy || submitted}>Continue to payment <ArrowUpRight size={18} /></button>{submitted && <div className="success-message"><Check size={17} /> Recharge request created for ₹{Number(amount).toLocaleString('en-IN')}. Awaiting admin review.</div>}</section><aside className="panel payment-aside"><div className="qr-placeholder"><QrCode size={88} strokeWidth={1.2} /><span>QR will appear here</span></div><p className="muted-label">SECURE PAYMENTS</p><h3>Every rupee, accounted for.</h3><ul><li><ShieldCheck size={16} /> Manual review on every recharge</li><li><LockKeyhole size={16} /> Your payment details stay private</li><li><Headphones size={16} /> Support when you need it</li></ul></aside></div></div> }

function Activity() {
  const [items, setItems] = useState<Array<{ type: string; amountPaise: number; note: string | null; createdAt: string }>>([])
  useEffect(() => { fetch('/api/wallet/ledger').then(r => r.ok ? r.json() : null).then(data => setItems(data?.ledger ?? [])).catch(() => undefined) }, [])
  return <div className="activity-page"><div className="page-intro"><p className="muted-label">LEDGER</p><h2>Transaction history.</h2><p>A clear record of every wallet movement.</p></div><section className="panel table-panel"><div className="table-toolbar"><div className="filter-tabs"><button className="active">All activity</button><button>Recharges</button><button>Transfers</button></div><button className="outline-action"><ArrowDownToLine size={15} /> Export</button></div><div className="table-wrap"><table><thead><tr><th>DESCRIPTION</th><th>DATE</th><th>METHOD</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{items.map((tx, i) => <tr key={i}><td><strong>{tx.note || (tx.type === 'recharge_credit' ? 'Wallet recharge' : 'Wallet movement')}</strong></td><td>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</td><td>Wallet</td><td className={tx.amountPaise >= 0 ? 'positive' : ''}>{tx.amountPaise >= 0 ? '+' : '−'}₹{(Math.abs(tx.amountPaise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td><span className="status-pill"><Check size={12} /> Completed</span></td></tr>)}</tbody></table></div></section></div> }

function Profile() {
  const [profile, setProfile] = useState<{ name: string; email?: string | null; phone: string; phoneVerified: boolean; emailVerified?: boolean } | null>(null)
  useEffect(() => { fetch('/api/me').then(r => r.ok ? r.json() : null).then(data => setProfile(data?.user ?? null)).catch(() => undefined) }, [])
  return <div className="profile-page"><div className="page-intro"><p className="muted-label">YOUR ACCOUNT</p><h2>Profile & settings.</h2><p>Manage your identity, security and preferences.</p></div><section className="panel profile-card"><div className="profile-hero"><div className="large-avatar">{profile?.name?.slice(0, 2).toUpperCase() ?? '--'}</div><div><h3>{profile?.name ?? 'Loading profile'}</h3><p>Email account <span className="verified-pill"><Check size={12} /> {profile?.emailVerified ? 'Verified' : 'Pending'}</span></p></div><button className="outline-action">Edit profile</button></div><div className="settings-list"><div><div className="setting-icon"><Mail size={18} /></div><span><strong>Email address</strong><small>{profile?.email ?? 'Loading'} · {profile?.emailVerified ? 'Verified' : 'Not verified'}</small></span><ChevronRight size={17} /></div><div><div className="setting-icon"><LockKeyhole size={18} /></div><span><strong>Password & security</strong><small>Managed with email verification</small></span><ChevronRight size={17} /></div><div><div className="setting-icon"><Bell size={18} /></div><span><strong>Notifications</strong><small>Account notifications enabled</small></span><ChevronRight size={17} /></div></div></section></div> }

function Admin() { const [saved, setSaved] = useState(false); const [requests, setRequests] = useState<Array<{ id: string; userId: string; amountPaise: number; method: string; utr: string }>>([]); const [settings, setSettings] = useState({ upiId: '', accountName: '', accountNumber: '', ifsc: '', qrUrl: '' }); useEffect(() => { Promise.all([fetch('/api/admin/recharges'), fetch('/api/admin/payment-settings')]).then(async ([queueResponse, settingsResponse]) => { if (queueResponse.ok) setRequests((await queueResponse.json()).requests ?? []); if (settingsResponse.ok) { const data = await settingsResponse.json(); if (data.settings) setSettings(data.settings) } }).catch(() => undefined) }, []); const review = async (id: string, status: 'approved' | 'rejected') => { await fetch('/api/admin/recharges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); setRequests(current => current.filter(request => request.id !== id)) }; const saveSettings = async () => { const response = await fetch('/api/admin/payment-settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); if (response.ok) setSaved(true) }; return <div className="admin-page"><div className="page-intro admin-intro"><div><p className="muted-label">CONTROL ROOM · DEMO</p><h2>Operations overview.</h2><p>Manage players, payments and the KolkataFF experience.</p></div><button className="primary-action small" onClick={saveSettings}><Check size={16} /> {saved ? 'Changes saved' : 'Save changes'}</button></div><div className="admin-stats"><div className="stat-card"><Users size={19} /><span className="muted-label">TOTAL USERS</span><strong>12,482</strong><small className="positive">+8.2% this month</small></div><div className="stat-card"><WalletCards size={19} /><span className="muted-label">PENDING RECHARGES</span><strong>24</strong><small>₹46,800 awaiting review</small></div><div className="stat-card"><TrendingUp size={19} /><span className="muted-label">TODAY&apos;S VOLUME</span><strong>₹2.84L</strong><small className="positive">+12.4% vs yesterday</small></div></div><div className="admin-grid"><section className="panel table-panel"><div className="panel-heading"><div><p className="muted-label">PAYMENT QUEUE</p><h3>Recharge requests</h3></div><button className="text-action">View queue <ArrowUpRight size={15} /></button></div><div className="admin-requests">{requests.map(request => <div className="request-row" key={request.id}><div className="avatar small-avatar">₹</div><div><strong>Pending recharge</strong><small>{request.method.toUpperCase()} · UTR {request.utr}</small></div><b>₹{(request.amountPaise / 100).toLocaleString('en-IN')}</b><button className="approve" onClick={() => review(request.id, 'approved')}><Check size={15} /> Approve</button><button className="icon-button" onClick={() => review(request.id, 'rejected')} aria-label="Reject recharge"><X size={17} /></button></div>)}</div></section><section className="panel admin-settings"><p className="muted-label">PAYMENT SETTINGS</p><h3>Where money lands.</h3><p className="subtle">Update details shown to players on the recharge screen.</p><label>UPI ID<input defaultValue="kolkataff@upi" /></label><label>Account holder<input defaultValue="KolkataFF Gaming Pvt. Ltd." /></label><label>Bank account<input defaultValue="•••• •••• 4821" /></label><button className="outline-action"><QrCode size={16} /> Replace QR code</button></section></div></div> }

export default function Page() {
  const [authed, setAuthed] = useState(false)
  const [view, setView] = useState<View>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; phone: string; role: string } | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([fetch('/api/me'), fetch('/api/wallet')]).then(async ([userResponse, walletResponse]) => {
      if (!userResponse.ok) return
      const userData = await userResponse.json()
      const walletData = walletResponse.ok ? await walletResponse.json() : null
      setUser(userData.user)
      setBalance(walletData?.wallet?.balancePaise ?? 0)
      setAuthed(true)
    }).catch(() => undefined)
  }, [])

  if (!authed) return <AuthScreen onAuthenticated={() => { setAuthed(true); window.location.reload() }} />
  const titles: Record<View, string> = { overview: 'Overview', recharge: 'Recharge wallet', activity: 'Activity', profile: 'Profile & settings', admin: 'Admin preview' }
  const signOut = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setAuthed(false); setUser(null) }
  return <main className="app-shell"><div className={mobileOpen ? 'sidebar-wrap open' : 'sidebar-wrap'}><Sidebar view={view} setView={v => { setView(v); setMobileOpen(false) }} onSignOut={signOut} />{mobileOpen && <button className="drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></button>}</div><div className="main-area"><Topbar title={titles[view]} onMenu={() => setMobileOpen(true)} /><div className="page-content">{view === 'overview' && <Overview setView={setView} balance={balance} userName={user?.name ?? 'Player'} />}{view === 'recharge' && <Recharge />}{view === 'activity' && <Activity />}{view === 'profile' && <Profile />}{view === 'admin' && <Admin />}</div></div></main>
}
