import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email,        setEmail]        = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent,         setSent]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await authApi.forgotPassword(email)
      setSent(true)
      // DEV ONLY: backend returns dev_token — auto-redirect to reset page
      if (res?.dev_token) {
        toast('Dev mode: redirecting to reset page', { icon: '🔧' })
        setTimeout(() => navigate(`/reset-password?token=${res.dev_token}`), 1200)
      }
    } catch {
      // Always show success to prevent email enumeration
      setSent(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d6e6e] to-[#0a5060] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10">

        {/* Back button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0d6e6e] mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        {!sent ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-[#0d6e6e]/10 flex items-center justify-center mx-auto mb-4">
                <Mail size={26} className="text-[#0d6e6e]" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#0d6e6e] mb-2">Forgot Password?</h1>
              <p className="text-sm text-gray-500">
                Enter the email address linked to your MediScribe account and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d6e6e] focus:border-transparent outline-none transition-all"
                  placeholder="doctor@clinic.com"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0d6e6e] hover:bg-[#0a5060] text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          /* Success state */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Check your inbox</h2>
            <p className="text-sm text-gray-500 mb-2">
              If <span className="font-semibold text-gray-700">{email}</span> is registered, you'll receive a password reset link shortly.
            </p>
            <p className="text-xs text-gray-400 mb-8">
              Didn't receive it? Check your spam folder or try again.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setSent(false)}
                className="w-full border border-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Try a different email
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#0d6e6e] hover:bg-[#0a5060] text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
