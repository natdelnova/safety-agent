'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'otp';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setLoading(true);
    setError(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      } else if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Check your email for the confirmation link!');
      } else if (authMode === 'otp') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
        });
        if (error) throw error;
        setError('Check your email for the sign-in link!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (authMode) {
      case 'login':
        return 'Sign in to your account';
      case 'signup':
        return 'Create a new account';
      case 'otp':
        return 'Sign in with email code';
      default:
        return 'Sign in to your account';
    }
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    switch (authMode) {
      case 'login':
        return 'Sign In';
      case 'signup':
        return 'Sign Up';
      case 'otp':
        return 'Send Code';
      default:
        return 'Sign In';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-orange-50/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Pronto</CardTitle>
          <CardDescription>{getTitle()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {authMode !== 'otp' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}
            {error && (
              <p className={`text-sm ${error.includes('Check your email') ? 'text-green-600' : 'text-destructive'}`}>
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {getButtonText()}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {authMode === 'login' && (
              <>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary block w-full"
                  onClick={() => setAuthMode('otp')}
                >
                  Sign in with email code instead
                </button>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary block w-full"
                  onClick={() => setAuthMode('signup')}
                >
                  Don't have an account? Sign up
                </button>
              </>
            )}
            {authMode === 'signup' && (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={() => setAuthMode('login')}
              >
                Already have an account? Sign in
              </button>
            )}
            {authMode === 'otp' && (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={() => setAuthMode('login')}
              >
                Sign in with password instead
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
