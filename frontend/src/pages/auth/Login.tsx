import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      const { user, token } = res.data.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, var(--brand), transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, var(--brand-2), transparent)' }} />
      </div>

      <div className="w-full max-w-[400px] relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-brand mb-4">
            N
          </div>
          <h1 className="text-2xl font-bold text-content tracking-tight">Welcome to NEXUM</h1>
          <p className="text-content-dim text-[13.5px] mt-1">India's intelligent tax & compliance platform</p>
        </div>

        {/* Card */}
        <div className="bg-surface-panel border border-border rounded-xl p-7 shadow-card">
          <h2 className="font-semibold text-[15px] text-content mb-5">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-content-dim mb-1.5">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-surface-elev border border-border rounded-md px-3 py-2.5 text-[13.5px] text-content outline-none placeholder:text-content-faint focus:border-brand transition-colors"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-dim mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-surface-elev border border-border rounded-md px-3 py-2.5 pr-10 text-[13.5px] text-content outline-none placeholder:text-content-faint focus:border-brand transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-faint hover:text-content"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-bg text-white font-semibold py-2.5 rounded-md shadow-brand hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : <Sparkles size={15} />}
              Sign in
            </button>
          </form>

          <div className="mt-5 text-center text-[13px] text-content-faint">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand font-semibold hover:brightness-110">
              Create one
            </Link>
          </div>
        </div>

        <p className="text-center text-[11.5px] text-content-faint mt-5">
          NEXUM · DPDP Act 2023 compliant · Powered by Claude AI
        </p>
      </div>
    </div>
  );
}
