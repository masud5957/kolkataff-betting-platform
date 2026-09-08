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

type View = 'overview' | 'recharge' | 'withdraw' | 'activity' | 'profile' | 'about'

const navItems: { label: string; view: View; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', view: 'overview', icon: LayoutDashboard },
  { label: 'Recharge wallet', view: 'recharge', icon: WalletCards },
  { label: 'Withdraw funds', view: 'withdraw', icon: ArrowUpRight },
  { label: 'Activity', view: 'activity', icon: ClipboardList },
  { label: 'Profile & settings', view: 'profile', icon: Settings },
  { label: 'About KolkataFF', view: 'about', icon: CircleHelp },
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
      const response = await fetch('/api/auth/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, name, email, password, code: otp }) })
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
          {mode !== 'forgot' && <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setVerificationPending(false); setOtp(''); setError(''); setMessage('') }}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setVerificationPending(false); setOtp(''); setError(''); setMessage('') }}>Create account</button></div>}
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



function Sidebar({ view, setView, onSignOut, userName }: { view: View; setView: (v: View) => void; onSignOut: () => void; userName: string }) {
  return <aside className="sidebar"><div className="side-head"><Logo compact /><span className="live-badge">LIVE</span></div><div className="side-section"><p className="side-label">WORKSPACE</p>{navItems.map(({ label, view: itemView, icon: Icon }) => <button key={itemView} className={view === itemView ? 'side-link active' : 'side-link'} onClick={() => setView(itemView)}><Icon size={18} />{label}{itemView === 'recharge' && <span className="side-plus">+</span>}</button>)}</div><div className="side-section"><p className="side-label">SUPPORT</p><button className="side-link"><CircleHelp size={18} />Help centre</button></div><div className="side-bottom"><div className="profile-mini"><div className="avatar">{userName.slice(0, 2).toUpperCase()}</div><div><strong>{userName}</strong><small>Verified account</small></div><MoreHorizontal size={18} /></div><button className="side-link signout" onClick={onSignOut}><LogOut size={18} />Sign out</button></div></aside>
}

function Topbar({ title, onMenu, userName }: { title: string; onMenu: () => void; userName: string }) { return <header className="topbar"><button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu /></button><div><p className="breadcrumb">KOLKATAFF <ChevronRight size={13} /> ACCOUNT</p><h1>{title}</h1></div><div className="top-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">{userName.slice(0, 2).toUpperCase()}</div></div></header> }

function Overview({ setView, balance, userName, transactions }: { setView: (v: View) => void; balance: number | null; userName: string; transactions: Array<{ id: string; amountPaise: number; note: string; createdAt: string }> }) {
  return <><div className="welcome-row"><div><p className="muted-label">TUESDAY, 18 JUNE 2024</p><h2>Good morning, {userName.split(' ')[0]} <span>✦</span></h2><p className="subtle">Your account is ready. Here&apos;s your latest overview.</p></div><button className="outline-action" onClick={() => setView('recharge')}><ArrowDownToLine size={16} /> Add funds</button></div><div className="stats-grid"><div className="balance-card"><div className="card-top"><span className="muted-label">AVAILABLE BALANCE</span><WalletCards size={19} /></div><strong>{balance === null ? '—' : `₹${(balance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</strong><div className="balance-footer"><span className="positive"><ShieldCheck size={14} /> Live wallet balance</span><span>From backend</span></div></div><div className="stat-card"><span className="muted-label">TOTAL PLAYED</span><strong>₹0</strong><span className="stat-hint">No games played yet</span></div><div className="stat-card"><span className="muted-label">WIN RATE</span><strong>0%</strong><span className="stat-hint">No games played yet</span></div></div><div className="content-grid"><section className="panel activity-panel"><div className="panel-heading"><div><p className="muted-label">RECENT ACTIVITY</p><h3>Your money, clearly tracked.</h3></div><button className="text-action" onClick={() => setView('activity')}>View all <ArrowUpRight size={15} /></button></div><div className="transaction-list">{transactions.length ? transactions.slice(0, 3).map(tx => <div className="transaction" key={tx.id}><div className={tx.amountPaise >= 0 ? 'tx-icon credit' : 'tx-icon debit'}>{tx.amountPaise >= 0 ? <ArrowDownToLine size={17} /> : <ArrowUpRight size={17} />}</div><div className="tx-info"><strong>{tx.note}</strong><span>{new Date(tx.createdAt).toLocaleString('en-IN')}</span></div><div className="tx-amount"><strong className={tx.amountPaise >= 0 ? 'positive' : ''}>{tx.amountPaise >= 0 ? '+' : '−'}₹{(Math.abs(tx.amountPaise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong><span><Check size={12} /> Completed</span></div></div>) : <p className="empty-state">No wallet transactions yet.</p>}</div></section><section className="panel quick-panel"><div className="quick-icon"><QrCode size={23} /></div><p className="muted-label">QUICK RECHARGE</p><h3>Top up in seconds.</h3><p>Use UPI, bank transfer or scan a QR. Funds are reviewed securely.</p><button className="primary-action small" onClick={() => setView('recharge')}>Recharge wallet <ArrowUpRight size={16} /></button><div className="payment-marks"><span>UPI</span><span>IMPS</span><span>NEFT</span></div></section></div><section className="notice-bar"><div className="notice-symbol"><ShieldCheck size={19} /></div><div><strong>Your account is fully verified</strong><p>Phone verification complete. You&apos;re all set to play responsibly.</p></div><button onClick={() => setView('profile')}>View profile <ChevronRight size={16} /></button></section></>
}

function PaymentInstructions() { const [settings, setSettings] = useState<{ accountName: string | null; accountNumber: string | null; ifsc: string | null; upiId: string | null; qrUrl: string | null } | null>(null); const [loading, setLoading] = useState(true); const [copied, setCopied] = useState(''); useEffect(() => { fetch('/api/payment-settings').then(r => r.ok ? r.json() : null).then(data => setSettings(data?.settings ?? null)).catch(() => setSettings(null)).finally(() => setLoading(false)) }, []); const copy = async (value: string, label: string) => { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(''), 1600) }; if (loading) return <div className="payment-instructions"><p className="subtle">Loading payment details…</p></div>; if (!settings) return <div className="payment-instructions missing"><strong>Payment details unavailable</strong><span>Our payment team has not configured the receiving account yet. Please try again later.</span></div>; return <div className="payment-instructions"><div className="payment-instructions-heading"><div><p className="muted-label">SECURE PAYMENT</p><h3>Pay KolkataFF</h3><p className="payment-caption">Scan the QR or use the verified UPI ID below.</p></div>{settings.qrUrl && <div className="qr-frame"><img src={settings.qrUrl} alt="KolkataFF payment QR code" className="payment-qr" /><span>Scan to pay</span></div>}</div>{settings.upiId && <div className="upi-highlight"><div><span>PAY USING UPI</span><strong>{settings.upiId}</strong></div><button type="button" onClick={() => copy(settings.upiId!, 'upi')}>{copied === 'upi' ? 'Copied' : 'Copy UPI ID'}</button></div>}<div className="payment-details-heading"><span>BANK TRANSFER DETAILS</span><small>Use only the details shown here</small></div>{settings.accountName && <div className="payment-detail"><span>Account name</span><strong>{settings.accountName}</strong></div>}{settings.accountNumber && <div className="payment-detail"><span>Account number</span><strong>{settings.accountNumber}</strong><button type="button" onClick={() => copy(settings.accountNumber!, 'account')}>{copied === 'account' ? 'Copied' : 'Copy'}</button></div>}{settings.ifsc && <div className="payment-detail"><span>IFSC code</span><strong>{settings.ifsc}</strong><button type="button" onClick={() => copy(settings.ifsc!, 'ifsc')}>{copied === 'ifsc' ? 'Copied' : 'Copy'}</button></div>}<p className="secure-note">Complete your transfer first, then submit the payment reference below. Payments are credited after admin verification.</p></div> }

function Recharge() { const [amount, setAmount] = useState('2000'); const [submitted, setSubmitted] = useState(false); const [utr, setUtr] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const submit = async () => { setBusy(true); setError(''); try { const response = await fetch('/api/wallet/recharge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, method: 'upi', utr }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to submit recharge'); setSubmitted(true) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to submit recharge') } finally { setBusy(false) } }; return <div className="recharge-page"><div className="page-intro"><p className="muted-label">WALLET MANAGEMENT</p><h2>Add funds securely.</h2><p>Choose an amount and payment method. Your recharge is reviewed before being added to your balance.</p></div><div className="recharge-layout"><PaymentInstructions /><section className="panel recharge-card"><div className="step-line"><span className="step active">1</span><div><strong>Choose amount</strong><small>Select the amount you want to add</small></div></div><div className="amount-chips">{['500', '1,000', '2,000', '5,000', '10,000'].map(v => <button key={v} className={amount === v.replace(',', '') ? 'selected' : ''} onClick={() => setAmount(v.replace(',', ''))}>₹{v}</button>)}</div><div className="step-line second"><span className="step">2</span><div><strong>Payment reference</strong><small>Complete your transfer, then enter the UTR</small></div></div><label>UPI / bank UTR reference<input value={utr} onChange={e => setUtr(e.target.value)} placeholder="Enter the payment reference" /></label>{error && <p role="alert" className="error-message">{error}</p>}<div className="payment-options"><button className="payment-option selected"><div className="method-icon upi">UPI</div><span><strong>UPI / QR code</strong><small>Instant transfer</small></span><Check size={18} /></button><button className="payment-option"><div className="method-icon bank"><CreditCard size={18} /></div><span><strong>Bank transfer</strong><small>NEFT / IMPS</small></span><ChevronRight size={18} /></button></div><button className="primary-action" onClick={submit} disabled={busy || submitted}>Continue to payment <ArrowUpRight size={18} /></button>{submitted && <div className="success-message"><Check size={17} /> Recharge request created for ₹{Number(amount).toLocaleString('en-IN')}. Awaiting admin review.</div>}</section><aside className="panel payment-aside"><div className="qr-placeholder"><QrCode size={88} strokeWidth={1.2} /><span>QR will appear here</span></div><p className="muted-label">SECURE PAYMENTS</p><h3>Every rupee, accounted for.</h3><ul><li><ShieldCheck size={16} /> Manual review on every recharge</li><li><LockKeyhole size={16} /> Your payment details stay private</li><li><Headphones size={16} /> Support when you need it</li></ul></aside></div></div> }

function Withdraw() { const [amount, setAmount] = useState(''); const [upiId, setUpiId] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const submit = async () => { setBusy(true); setError(''); setMessage(''); try { const response = await fetch('/api/wallet/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, upiId }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to submit withdrawal'); setMessage('Withdrawal request submitted for admin review.'); setAmount(''); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to submit withdrawal') } finally { setBusy(false) } }; return <div className="withdraw-page"><div className="page-intro"><p className="muted-label">WALLET MANAGEMENT</p><h2>Withdraw your winnings.</h2><p>Enter the UPI ID where you want to receive your approved withdrawal.</p></div><section className="panel withdraw-card"><div className="step-line"><span className="step active">1</span><div><strong>Withdrawal amount</strong><small>Minimum ₹100 · Admin approval required</small></div></div><div className="amount-input"><span>₹</span><input inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="0" /></div><div className="step-line second"><span className="step">2</span><div><strong>Receiving UPI ID</strong><small>Double-check this before submitting</small></div></div><label>UPI ID<input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" /></label>{error && <p role="alert" className="error-message">{error}</p>}{message && <p className="secure-note">{message}</p>}<button className="primary-action" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Request withdrawal'} <ArrowUpRight size={18} /></button></section></div> }

function About() { return <div className="about-page"><div className="page-intro"><p className="muted-label">ABOUT KOLKATAFF</p><h2>Play smart. Stay ahead.</h2><p>KolkataFF is built around clear wallet movements, responsible play, and human-reviewed payments.</p></div><section className="panel about-card"><h3>Trust is part of the product.</h3><p>Every recharge and withdrawal is recorded in your account ledger. Deposits and withdrawals are reviewed by our payment team before your balance changes.</p><div className="about-points"><div><strong>Transparent</strong><span>See every wallet movement in your transaction history.</span></div><div><strong>Secure</strong><span>Your account and payment details are protected.</span></div><div><strong>Human reviewed</strong><span>Payment requests are checked before approval.</span></div></div></section></div> }

function Activity() {
  const [items, setItems] = useState<Array<{ type: string; amountPaise: number; note: string | null; createdAt: string }>>([])
  useEffect(() => { fetch('/api/wallet/ledger').then(r => r.ok ? r.json() : null).then(data => setItems(data?.ledger ?? [])).catch(() => undefined) }, [])
  return <div className="activity-page"><div className="page-intro"><p className="muted-label">LEDGER</p><h2>Transaction history.</h2><p>A clear record of every wallet movement.</p></div><section className="panel table-panel"><div className="table-toolbar"><div className="filter-tabs"><button className="active">All activity</button><button>Recharges</button><button>Transfers</button></div><button className="outline-action"><ArrowDownToLine size={15} /> Export</button></div><div className="table-wrap"><table><thead><tr><th>DESCRIPTION</th><th>DATE</th><th>METHOD</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{items.map((tx, i) => <tr key={i}><td><strong>{tx.note || (tx.type === 'recharge_credit' ? 'Wallet recharge' : 'Wallet movement')}</strong></td><td>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</td><td>Wallet</td><td className={tx.amountPaise >= 0 ? 'positive' : ''}>{tx.amountPaise >= 0 ? '+' : '−'}₹{(Math.abs(tx.amountPaise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td><span className="status-pill"><Check size={12} /> Completed</span></td></tr>)}</tbody></table></div></section></div> }

function Profile() {
  const [profile, setProfile] = useState<{ name: string; email?: string | null; phone: string; phoneVerified: boolean; emailVerified?: boolean } | null>(null)
  const [name, setName] = useState(''); const [currentPassword, setCurrentPassword] = useState(''); const [newPassword, setNewPassword] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { fetch('/api/me').then(r => r.ok ? r.json() : null).then(data => { setProfile(data?.user ?? null); setName(data?.user?.name ?? '') }).catch(() => undefined) }, [])
  const save = async () => { setBusy(true); setMessage(''); setError(''); try { const response = await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, currentPassword, newPassword }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to update profile'); setProfile(data.user); setCurrentPassword(''); setNewPassword(''); setMessage('Profile updated successfully.') } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update profile') } finally { setBusy(false) } }
  return <div className="profile-page"><div className="page-intro"><p className="muted-label">YOUR ACCOUNT</p><h2>Profile & settings.</h2><p>Manage your identity and password using your live account.</p></div><section className="panel profile-card"><div className="profile-hero"><div className="large-avatar">{profile?.name?.slice(0, 2).toUpperCase() ?? '--'}</div><div><h3>{profile?.name ?? 'Loading profile'}</h3><p>{profile?.email ?? 'Email unavailable'} <span className="verified-pill"><Check size={12} /> {profile?.emailVerified ? 'Verified' : 'Pending'}</span></p></div></div><div className="profile-form"><label>Display name<input value={name} onChange={e => setName(e.target.value)} maxLength={80} /></label><label>Email address<input value={profile?.email ?? ''} readOnly /></label><label>Current password<input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Required to change password" /></label><label>New password<input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" /></label>{error && <p role="alert" className="error-message">{error}</p>}{message && <p className="secure-note">{message}</p>}<button className="primary-action" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save profile changes'} <Check size={17} /></button></div></section></div> }

function Admin() { const [saved, setSaved] = useState(false); const [requests, setRequests] = useState<Array<{ id: string; userId: string; amountPaise: number; method: string; utr: string }>>([]); const [settings, setSettings] = useState({ upiId: '', accountName: '', accountNumber: '', ifsc: '', qrUrl: '' }); useEffect(() => { Promise.all([fetch('/api/admin/recharges'), fetch('/api/admin/payment-settings')]).then(async ([queueResponse, settingsResponse]) => { if (queueResponse.ok) setRequests((await queueResponse.json()).requests ?? []); if (settingsResponse.ok) { const data = await settingsResponse.json(); if (data.settings) setSettings(data.settings) } }).catch(() => undefined) }, []); const review = async (id: string, status: 'approved' | 'rejected') => { await fetch('/api/admin/recharges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); setRequests(current => current.filter(request => request.id !== id)) }; const saveSettings = async () => { const response = await fetch('/api/admin/payment-settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); if (response.ok) setSaved(true) }; return <div className="admin-page"><div className="page-intro admin-intro"><div><p className="muted-label">CONTROL ROOM · DEMO</p><h2>Operations overview.</h2><p>Manage players, payments and the KolkataFF experience.</p></div><button className="primary-action small" onClick={saveSettings}><Check size={16} /> {saved ? 'Changes saved' : 'Save changes'}</button></div><div className="admin-stats"><div className="stat-card"><Users size={19} /><span className="muted-label">TOTAL USERS</span><strong>12,482</strong><small className="positive">+8.2% this month</small></div><div className="stat-card"><WalletCards size={19} /><span className="muted-label">PENDING RECHARGES</span><strong>24</strong><small>₹46,800 awaiting review</small></div><div className="stat-card"><TrendingUp size={19} /><span className="muted-label">TODAY&apos;S VOLUME</span><strong>₹2.84L</strong><small className="positive">+12.4% vs yesterday</small></div></div><div className="admin-grid"><section className="panel table-panel"><div className="panel-heading"><div><p className="muted-label">PAYMENT QUEUE</p><h3>Recharge requests</h3></div><button className="text-action">View queue <ArrowUpRight size={15} /></button></div><div className="admin-requests">{requests.map(request => <div className="request-row" key={request.id}><div className="avatar small-avatar">₹</div><div><strong>Pending recharge</strong><small>{request.method.toUpperCase()} · UTR {request.utr}</small></div><b>₹{(request.amountPaise / 100).toLocaleString('en-IN')}</b><button className="approve" onClick={() => review(request.id, 'approved')}><Check size={15} /> Approve</button><button className="icon-button" onClick={() => review(request.id, 'rejected')} aria-label="Reject recharge"><X size={17} /></button></div>)}</div></section><section className="panel admin-settings"><p className="muted-label">PAYMENT SETTINGS</p><h3>Where money lands.</h3><p className="subtle">Update details shown to players on the recharge screen.</p><label>UPI ID<input defaultValue="kolkataff@upi" /></label><label>Account holder<input defaultValue="KolkataFF Gaming Pvt. Ltd." /></label><label>Bank account<input defaultValue="•••• •••• 4821" /></label><button className="outline-action"><QrCode size={16} /> Replace QR code</button></section></div></div> }

export default function Page() {
  const [authed, setAuthed] = useState(false)
  const [view, setView] = useState<View>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; phone: string; role: string } | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Array<{ id: string; amountPaise: number; note: string; createdAt: string }>>([])

  useEffect(() => {
    Promise.all([fetch('/api/me'), fetch('/api/wallet')]).then(async ([userResponse, walletResponse]) => {
      if (!userResponse.ok) return
      const userData = await userResponse.json()
      const walletData = walletResponse.ok ? await walletResponse.json() : null
      setUser(userData.user)
      setBalance(walletData?.wallet?.balancePaise ?? walletData?.balancePaise ?? 0)
      setTransactions(walletData?.transactions ?? [])
      setAuthed(true)
    }).catch(() => undefined)
  }, [])

  if (!authed) return <AuthScreen onAuthenticated={() => { setAuthed(true); window.location.reload() }} />
  const titles: Record<View, string> = { overview: 'Overview', recharge: 'Recharge wallet', withdraw: 'Withdraw funds', activity: 'Activity', profile: 'Profile & settings', about: 'About KolkataFF' }
  const signOut = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setAuthed(false); setUser(null) }
  return <main className="app-shell"><div className={mobileOpen ? 'sidebar-wrap open' : 'sidebar-wrap'}><Sidebar view={view} setView={v => { setView(v); setMobileOpen(false) }} onSignOut={signOut} userName={user?.name ?? 'Player'} />{mobileOpen && <button className="drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></button>}</div><div className="main-area"><Topbar title={titles[view]} onMenu={() => setMobileOpen(true)} userName={user?.name ?? 'Player'} /><div className="page-content">{view === 'overview' && <Overview setView={setView} balance={balance} userName={user?.name ?? 'Player'} transactions={transactions} />}{view === 'recharge' && <Recharge />}{view === 'withdraw' && <Withdraw />}{view === 'activity' && <Activity />}{view === 'profile' && <Profile />}{view === 'about' && <About />}</div></div></main>
}
