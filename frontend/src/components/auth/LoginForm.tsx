import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const authRes = await authApi.login({ email, password });

      // Temporarily store tokens so getProfile() can use the auth header
      setAuth(
        { ...authRes.user, user_id: authRes.user.id } as any,
        authRes.access_token,
        authRes.refresh_token
      );

      // Fetch the full profile (includes phone, license_number, etc.)
      try {
        const fullProfile = await authApi.getProfile();
        setAuth(fullProfile, authRes.access_token, authRes.refresh_token);
      } catch {
        // Non-fatal — minimal user object is already stored
      }

      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] focus:border-transparent outline-none transition-all"
          placeholder="doctor@clinic.com"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] focus:border-transparent outline-none transition-all"
          placeholder="••••••••"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" className="rounded text-[#0d6e6e] focus:ring-[#0d6e6e]" />
          <span>Remember me</span>
        </label>
        <a href="#" className="text-sm font-medium text-[#0d6e6e] hover:underline">
          Forgot password?
        </a>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0d6e6e] hover:bg-[#0a5060] text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In to MediScribe'}
      </button>
    </form>
  );
};

export default LoginForm;
