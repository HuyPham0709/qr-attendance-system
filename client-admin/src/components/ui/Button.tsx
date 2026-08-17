import React from 'react'

export function Button({
  children, variant = 'primary', size = 'md', onClick, disabled, className = '', type = 'button',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const v = {
    primary:   'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
    ghost:     'bg-transparent hover:bg-slate-100 text-slate-600',
    danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  }[variant]
  const s = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' }[size]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${v} ${s} ${className}`}
    >
      {children}
    </button>
  )
}