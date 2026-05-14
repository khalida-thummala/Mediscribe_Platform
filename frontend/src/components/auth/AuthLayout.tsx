import Logo from '@/components/shared/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  wide?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, wide = false }) => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      style={{ background: 'var(--bg-2)' }}
    >
      <div 
        className={`w-full rounded-2xl p-8 md:p-10 transition-all duration-300 ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" className="mb-6" />
          <h1 
            className="text-3xl font-serif font-bold mb-2"
            style={{ color: 'var(--text-1)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p 
              className="text-sm"
              style={{ color: 'var(--text-3)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
