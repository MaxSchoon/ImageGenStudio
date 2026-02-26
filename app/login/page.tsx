'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Wrong password');
        setPassword('');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-studio-bg px-4">
      <div className="w-full max-w-sm">
        <div className="bg-studio-surface rounded-xl p-8 border border-studio-border shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-studio-text">
              Image Studio
            </h1>
            <p className="text-studio-muted text-sm mt-2">
              Enter password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 bg-studio-elevated border border-studio-border rounded-lg text-studio-text placeholder-studio-muted focus:outline-none focus:border-studio-accent focus:ring-1 focus:ring-studio-accent transition-colors"
            />

            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full mt-4 py-3 bg-studio-accent hover:bg-studio-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
