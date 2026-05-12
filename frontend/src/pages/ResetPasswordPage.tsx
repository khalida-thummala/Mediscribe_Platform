import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'

export default function ResetPasswordPage() {
  const navigate        = useNavigate()
  const [params]        = useSearchParams()
  const token           = params.get('token') ?? ''

  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew,         setShowNew]         = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [isSubmitting,    setIsSubmitting]    = useState(false)
  const [done,            setDone]            = useState(false)

  /* password strength */
  const strength = newPassword.length === 0 ? 0
    : newPassword.length < 8  ? 1
    : newPassword.length < 12 ? 2
    : newPassword.length < 16 ? 3
    : 4
  const strengthLabel = ['', 'Too short', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'][strength]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!token) {
      toast.error('Invalid or missing reset token')
      return
    }
    setIsSubmitting(true)
    try {
      await authApi.resetPassword(token, newPassword)
      setDone(true)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Reset failed. The link may have expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inp = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d6e6e] focus:border-transparent outline-none transition-all pr-10'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d6e6e] to-[#0a5060] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10">

        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0d6e6e] mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        {!done ? (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-[#0d6e6e]/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound size={26} className="text-[#0d6e6e]" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#0d6e6e] mb-2">Reset Password</h1>
              <p className="text-sm text-gray-500">
                Choose a strong new password for your MediScribe account.
              </p>
            </div>

            {!token && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
                Invalid or expired reset link. Please request a new one.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    required
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inp}
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400">{strengthLabel}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    required
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inp} ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-400 focus:ring-red-400'
                        : confirmPassword && confirmPassword === newPassword
                        ? 'border-green-400 focus:ring-green-400'
                        : ''
                    }`}
                    placeholder="Re-enter new password"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="text-[11px] text-green-600 mt-1">✓ Passwords match</p>
                )}
              </div>

              {/* Password requirements */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Requirements</p>
                {[
                  { label: 'At least 8 characters',          met: newPassword.length >= 8 },
                  { label: 'Contains a number',              met: /\d/.test(newPassword) },
                  { label: 'Contains a letter',              met: /[a-zA-Z]/.test(newPassword) },
                ].map(({ label, met }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${met ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {met ? '✓' : '·'}
                    </div>
                    <span className={`text-[11px] ${met ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full bg-[#0d6e6e] hover:bg-[#0a5060] text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating password…' : 'Update Password'}
              </button>
            </form>
          </>
        ) : (
          /* Success */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Password Updated!</h2>
            <p className="text-sm text-gray-500 mb-8">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#0d6e6e] hover:bg-[#0a5060] text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
