import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/api/auth'

interface RegisterFormProps {
  onSuccess: (email: string, userId: string) => void
}

/* ── shared input style ─────────────────────────────────── */
const inp =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d6e6e] focus:border-transparent outline-none transition-all bg-white text-gray-900'
const sel =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d6e6e] focus:border-transparent outline-none transition-all bg-white text-gray-900 appearance-none'
const lbl = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide'

const TIMEZONES = [
  { value: 'UTC',                  label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata',         label: 'Asia/Kolkata — IST (UTC+5:30)' },
  { value: 'America/New_York',     label: 'America/New_York — EST (UTC-5)' },
  { value: 'America/Chicago',      label: 'America/Chicago — CST (UTC-6)' },
  { value: 'America/Denver',       label: 'America/Denver — MST (UTC-7)' },
  { value: 'America/Los_Angeles',  label: 'America/Los_Angeles — PST (UTC-8)' },
  { value: 'Europe/London',        label: 'Europe/London — GMT (UTC+0)' },
  { value: 'Europe/Paris',         label: 'Europe/Paris — CET (UTC+1)' },
  { value: 'Europe/Berlin',        label: 'Europe/Berlin — CET (UTC+1)' },
  { value: 'Asia/Dubai',           label: 'Asia/Dubai — GST (UTC+4)' },
  { value: 'Asia/Singapore',       label: 'Asia/Singapore — SGT (UTC+8)' },
  { value: 'Asia/Tokyo',           label: 'Asia/Tokyo — JST (UTC+9)' },
  { value: 'Australia/Sydney',     label: 'Australia/Sydney — AEST (UTC+10)' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish — Español' },
  { value: 'fr', label: 'French — Français' },
  { value: 'de', label: 'German — Deutsch' },
  { value: 'pt', label: 'Portuguese — Português' },
  { value: 'ar', label: 'Arabic — العربية' },
  { value: 'hi', label: 'Hindi — हिन्दी' },
  { value: 'zh', label: 'Chinese — 中文' },
]

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name:           '',
    license_number:      '',
    email:               '',
    organization_name:   '',
    phone:               '',
    password:            '',
    confirm_password:    '',
    role:                'practitioner',
    timezone:            'UTC',
    language_preference: 'en',
  })
  const [showPw,    setShowPw]    = useState(false)
  const [showCPw,   setShowCPw]   = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (formData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits')
      return
    }
    setIsSubmitting(true)
    try {
      const { confirm_password, ...payload } = formData
      const response = await authApi.register(payload)
      toast.success('Account created! You can now sign in.')
      onSuccess(formData.email, response.user_id)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Section: Personal Info ── */}
      <div className="pb-1">
        <p className="text-[10px] font-bold text-[#0d6e6e] uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-4 h-px bg-[#0d6e6e] inline-block" />
          Personal Information
          <span className="flex-1 h-px bg-gray-100 inline-block" />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Full Name *</label>
            <input required className={inp} placeholder="Dr. Jane Smith"
              value={formData.full_name}
              onChange={e => set('full_name', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Medical License No. *</label>
            <input required className={inp} placeholder="MCI-12345"
              value={formData.license_number}
              onChange={e => set('license_number', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Email Address *</label>
            <input required type="email" className={inp} placeholder="doctor@clinic.com"
              value={formData.email}
              onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Phone Number *</label>
            <div className="flex gap-2">
              <span className="px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm flex items-center shrink-0">+91</span>
              <input required type="tel" inputMode="numeric" maxLength={10} className={inp} placeholder="9876543210"
                value={formData.phone}
                onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">10-digit mobile number</p>
          </div>
        </div>
      </div>

      {/* ── Section: Organisation & Role ── */}
      <div className="pb-1">
        <p className="text-[10px] font-bold text-[#0d6e6e] uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-4 h-px bg-[#0d6e6e] inline-block" />
          Organisation Information
          <span className="flex-1 h-px bg-gray-100 inline-block" />
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={lbl}>Organisation / Clinic *</label>
            <input required className={inp} placeholder="City Medical Center"
              value={formData.organization_name}
              onChange={e => set('organization_name', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Section: Preferences ── */}
      <div className="pb-1">
        <p className="text-[10px] font-bold text-[#0d6e6e] uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-4 h-px bg-[#0d6e6e] inline-block" />
          Preferences
          <span className="flex-1 h-px bg-gray-100 inline-block" />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Timezone</label>
            <div className="relative">
              <select className={sel}
                value={formData.timezone}
                onChange={e => set('timezone', e.target.value)}>
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
            </div>
          </div>
          <div>
            <label className={lbl}>Language</label>
            <div className="relative">
              <select className={sel}
                value={formData.language_preference}
                onChange={e => set('language_preference', e.target.value)}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Password ── */}
      <div className="pb-1">
        <p className="text-[10px] font-bold text-[#0d6e6e] uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-4 h-px bg-[#0d6e6e] inline-block" />
          Set Password
          <span className="flex-1 h-px bg-gray-100 inline-block" />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Password *</label>
            <div className="relative">
              <input required type={showPw ? 'text' : 'password'} className={inp + ' pr-10'}
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={e => set('password', e.target.value)} />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={lbl}>Confirm Password *</label>
            <div className="relative">
              <input required type={showCPw ? 'text' : 'password'} className={inp + ' pr-10'}
                placeholder="Re-enter password"
                value={formData.confirm_password}
                onChange={e => set('confirm_password', e.target.value)} />
              <button type="button" tabIndex={-1}
                onClick={() => setShowCPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        {/* Password strength hint */}
        {formData.password && (
          <div className="mt-2 flex gap-1">
            {[8, 12, 16].map((len, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                formData.password.length >= len
                  ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-yellow-400' : 'bg-green-500'
                  : 'bg-gray-200'
              }`} />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">
              {formData.password.length < 8 ? 'Too short' : formData.password.length < 12 ? 'Fair' : formData.password.length < 16 ? 'Good' : 'Strong'}
            </span>
          </div>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full bg-[#0d6e6e] hover:bg-[#0a5060] text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
        {isSubmitting ? 'Creating account…' : 'Create Account'}
      </button>

      <div className="pt-4 text-center">
        <button
          type="button"
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#0d6e6e] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home Page
        </button>
      </div>
    </form>
  )
}

export default RegisterForm
