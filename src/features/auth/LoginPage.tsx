import { useState, type FormEvent } from 'react';
import { ShieldCheck, Loader2, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(
        signInError.message.includes('Invalid login credentials')
          ? 'Email or password is incorrect.'
          : signInError.message
      );
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md a-fi">
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl mx-auto grid place-items-center mb-3"
            style={{
              background: 'linear-gradient(135deg, var(--p), var(--pd))',
              boxShadow: '0 8px 20px rgba(200,96,28,0.3)',
            }}
          >
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h1 className="fd text-3xl font-medium tracking-tight">Upakaran Seva</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--tm)' }}>Gurutattva Foundation · Media Equipment</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[var(--b)] rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--tm)] mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ts)' }} />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--b)] text-sm"
                placeholder="you@gurutattva.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--tm)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ts)' }} />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--b)] text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--ds)', color: 'var(--di)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--p)' }}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-[11px] text-center" style={{ color: 'var(--ts)' }}>
            New users: contact your admin to receive a sign-in invitation.
          </p>
        </form>
      </div>
    </div>
  );
}
