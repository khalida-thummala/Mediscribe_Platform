import { useState } from 'react';
import { User, Lock, Bell, Shield } from 'lucide-react';
import { ProfileSettings, SecuritySettings, OrganizationSettings } from './index';

type Tab = 'profile' | 'security' | 'notifications' | 'organization';

export default function SettingsPanel() {
  const [tab, setTab] = useState<Tab>('profile');

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'organization', label: 'Organization', icon: Shield },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="settings-grid">
      {/* Sidebar Navigation */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 8,
        height: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '10px 16px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s',
              background: tab === key ? 'var(--teal)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--text-3)',
              boxShadow: tab === key ? 'var(--shadow-teal)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (tab !== key) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-hover)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== key) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)';
              }
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 32,
        boxShadow: 'var(--shadow-sm)',
        minHeight: 500,
      }}>
        {tab === 'profile' && <ProfileSettings />}
        {tab === 'security' && <SecuritySettings />}
        {tab === 'organization' && <OrganizationSettings />}
        {tab === 'notifications' && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{
              background: 'var(--surface-2)',
              width: 64, height: 64,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Bell style={{ color: 'var(--text-4)' }} size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Notification Preferences
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 280, margin: '0 auto' }}>
              We're building a comprehensive notification system. Check back soon for email and SMS alerts.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .settings-grid {
            grid-template-columns: 260px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
