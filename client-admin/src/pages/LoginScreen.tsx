import React, { useState } from 'react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'

interface LoginScreenProps {
  onLogin: () => void
}

type UserRole = 'super-admin' | 'organizer' | 'scanner'

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [role, setRole] = useState<UserRole>('super-admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [code, setCode] = useState('')

  function handleLogin() {
    setError('')
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    if (password !== 'demo') {
      setError('Invalid credentials. Please try again.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (role === 'super-admin') {
        setShow2FA(true)
      } else {
        onLogin()
      }
    }, 1200)
  }

  function handle2FA() {
    if (code !== '123456') {
      setError('Invalid 2FA code.')
      return
    }
    setShow2FA(false)
    onLogin()
  }

  const roles = [
    { id: 'super-admin', label: 'Super Admin', icon: '👑' },
    { id: 'organizer', label: 'Organizer', icon: '📋' },
    { id: 'scanner', label: 'Scanner Staff', icon: '📱' },
  ] as const

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Hero Section */}
      <div className="hidden lg:flex w-1/2 bg-[#1E293B] flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 20px 20px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="6" height="6" rx="1" />
                <rect x="15" y="3" width="6" height="6" rx="1" />
                <rect x="3" y="15" width="6" height="6" rx="1" />
                <path d="M21 15h-3v3M21 21h-3M18 15v6M15 21v-3" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-lg">QR Attend</div>
              <div className="text-slate-400 text-xs">Event Attendance Platform</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-12 rounded-lg ${i % 3 === 1 ? 'bg-emerald-500/30' : 'bg-white/10'} flex items-center justify-center`}
                  >
                    {i === 4 && <div className="w-6 h-6 bg-emerald-500 rounded" />}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">Check-in Verified</div>
                  <div className="text-slate-400 text-xs">Priya Sharma · Gate B – VIP</div>
                </div>
                <div className="ml-auto text-emerald-400 text-xs font-mono">09:14:22</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Registered', n: '1,240' },
                { label: 'Checked-in', n: '756' },
                { label: 'Rate', n: '61%' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-white font-bold text-lg">{s.n}</div>
                  <div className="text-slate-400 text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-400 text-sm">&quot;Real-time QR attendance — zero friction, full audit trail.&quot;</p>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your admin account</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {roles.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id as UserRole)
                  setError('')
                }}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all ${
                  role === r.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="text-base">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@qrattend.io"
              value={email}
              onChange={setEmail}
            />
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="hover:text-slate-600 transition-colors"
                >
                  {showPw ? (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              }
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-emerald-500" />
                Remember me
              </label>
              <button type="button" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating…
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              Demo: use password <span className="font-mono bg-slate-100 px-1 rounded">demo</span> · 2FA code{' '}
              <span className="font-mono bg-slate-100 px-1 rounded">123456</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2FA Verification Modal */}
      <Modal open={show2FA} onClose={() => setShow2FA(false)} title="Two-Factor Authentication">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-500">🔐</span>
            <p className="text-xs text-amber-800">
              Super Admin access requires 2FA verification. Enter the 6-digit code from your authenticator app.
            </p>
          </div>
          <Input
            label="Authentication Code"
            placeholder="000000"
            type="text"
            value={code}
            onChange={c => {
              setCode(c)
              setError('')
            }}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setShow2FA(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handle2FA} className="flex-1">
              Verify & Sign In
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}