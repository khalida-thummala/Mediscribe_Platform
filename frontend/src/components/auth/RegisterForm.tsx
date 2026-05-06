import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';

interface RegisterFormProps {
  onSuccess: (email: string, userId: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    license_number: '',
    email: '',
    organization_name: '',
    password: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await authApi.register({
        ...formData,
        phone: formData.phone || '000-000-0000'
      });
      toast.success('Registration successful! You can now sign in.');
      onSuccess(formData.email, response.user_id);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
          <input
            required
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
            placeholder="Dr. John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">License No.</label>
          <input
            required
            name="license_number"
            value={formData.license_number}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
            placeholder="MCI-12345"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
        <input
          required
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          placeholder="doctor@clinic.com"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
        <div className="flex gap-2">
          <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm flex items-center">
            +91
          </div>
          <input
            required
            type="tel"
            name="phone"
            pattern="[0-9]{10}"
            maxLength={10}
            value={formData.phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              setFormData({ ...formData, phone: val });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
            placeholder="9876543210"
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Please enter your 10-digit mobile number</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Organization</label>
        <input
          required
          name="organization_name"
          value={formData.organization_name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          placeholder="City Medical Center"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
        <input
          required
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0d6e6e] hover:bg-[#0a5060] text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-70 mt-4"
      >
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;
