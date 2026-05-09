import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfileSettings: React.FC = () => {
  const { user, setAuth, accessToken, refreshToken, logout } = useAuthStore();
  const qc = useQueryClient();

  // Always fetch fresh profile from backend on mount
  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getProfile(),
    staleTime: 0,
  });

  // Merge stored user with fresh profile — fresh profile wins
  const effectiveUser = profile ?? user;

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    timezone: 'UTC',
    language_preference: 'en',
  });

  // Populate form once profile is loaded
  useEffect(() => {
    if (effectiveUser) {
      setFormData({
        full_name: (effectiveUser as any).full_name ?? '',
        phone: (effectiveUser as any).phone ?? '',
        timezone: (effectiveUser as any).timezone ?? 'UTC',
        language_preference: (effectiveUser as any).language_preference ?? 'en',
      });
    }
  }, [effectiveUser]);

  const mutation = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: async (updated) => {
      toast.success('Profile updated successfully');
      // Refresh the full profile in the store
      setAuth(updated, accessToken!, refreshToken!);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone && formData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    mutation.mutate(formData);
  };

  const handleSignOut = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Profile Information</h3>
        <p className="text-sm text-gray-500">Update your personal details and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          />
        </div>

        {/* Phone Number — pre-filled from registration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.phone}
            maxLength={10}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
              setFormData((prev) => ({ ...prev, phone: val }));
            }}
            placeholder="9876543210"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          />
          <p className="text-[10px] text-gray-500 mt-1">Please enter exactly 10 digits (Numbers only)</p>
        </div>

        {/* Email — read-only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
          <input
            value={(effectiveUser as any)?.email ?? ''}
            disabled
            className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* License No — read-only, pre-filled from registration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">License No. (Read-only)</label>
          <input
            value={(effectiveUser as any)?.license_number ?? ''}
            disabled
            className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            value={formData.language_preference}
            onChange={(e) => setFormData({ ...formData, language_preference: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        {/* Actions row */}
        <div className="md:col-span-2 flex justify-between items-center pt-6 border-t border-gray-100">
          {/* Sign Out — prominent button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 font-medium text-sm transition-colors"
          >
            <LogOut size={15} />
            Sign Out of Account
          </button>

          {/* Save Changes */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-[#0d6e6e] hover:bg-[#0a5060] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
