import React from 'react'

export function Input({ label, placeholder, type = 'text', error, value, onChange, suffix }: {
  label?: string; placeholder?: string; type?: string; error?: string
  value?: string; onChange?: (v: string) => void; suffix?: React.ReactNode
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white outline-none transition-all
            ${error ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}
            ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{suffix}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}