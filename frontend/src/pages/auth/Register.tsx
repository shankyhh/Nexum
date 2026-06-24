import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['CA', 'TAXPAYER']),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'TAXPAYER' },
  });

  const role = watch('role');

  async function onSubmit(data: FormData) {
    setError('');
    try {
      const res = await api.post('/auth/register', data);
      const { user, token } = res.data.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.');
    }
  }

  const field = 'w-full bg-surface-elev border border-border rounded-md px-3 py-2.5 text-[13.5px] text-content outline-none placeholder:text-content-faint focus:border-brand transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, var(--brand), transparent)' }} />
      </div>

      <div className="w-full max-w-[460px] relative">
        <div className="flex flex-col items-center mb-7 text-center">
          <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-brand mb-4">N</div>
          <h1 className="text-2xl font-bold text-content tracking-tight">Create your account</h1>
          <p className="text-content-dim text-[13.5px] mt-1">Join NEXUM — tax filing made intelligent</p>
        </div>

        <div className="bg-surface-panel border border-border rounded-xl p-7 shadow-card">
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-content-dim mb-1.5">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {(['TAXPAYER', 'CA'] as const).map((r) => (
                  <label
                    key={r}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-[13px] font-medium ${
                      role === r ? 'bg-brand/10 border-brand text-content' : 'border-border text-content-dim hover:border-brand/50'
                    }`}
                  >
                    <input type="radio" {...register('role')} value={r} className="hidden" />
                    {r === 'CA' ? '👔 CA / Firm' : '👤 Individual / Business'}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-dim mb-1.5">Full name <span className="text-red-400">*</span></label>
              <input {...register('name')} placeholder="Rahul Sharma" className={field} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-dim mb-1.5">Email address <span className="text-red-400">*</span></label>
              <input {...register('email')} type="email" placeholder="you@example.com" autoComplete="email" className={field} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-dim mb-1.5">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" autoComplete="new-password" className={`${field} pr-10`} />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-faint hover:text-content">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-content-dim mb-1.5">PAN</label>
                <input {...register('pan')} placeholder="ABCDE1234F" className={field} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-dim mb-1.5">GSTIN</label>
                <input {...register('gstin')} placeholder="29ABCDE1234F1Z5" className={field} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-dim mb-1.5">Phone</label>
              <input {...register('phone')} placeholder="+91 98765 43210" className={field} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-bg text-white font-semibold py-2.5 rounded-md shadow-brand hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : <Sparkles size={15} />}
              Create account
            </button>
          </form>

          <div className="mt-5 text-center text-[13px] text-content-faint">
            Already have an account?{' '}
            <Link to="/login" className="text-brand font-semibold hover:brightness-110">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
