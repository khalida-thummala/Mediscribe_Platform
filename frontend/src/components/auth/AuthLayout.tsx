import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  wide?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, wide = false }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d6e6e] to-[#0a5060] p-4">
      <div className={`w-full bg-white rounded-2xl shadow-2xl p-8 md:p-10 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#0d6e6e] mb-2">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
