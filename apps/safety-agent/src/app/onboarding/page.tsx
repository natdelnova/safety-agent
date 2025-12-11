'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Check } from 'lucide-react';

const SAFE_WORD_OPTIONS = [
  'Pineapple',
  'Umbrella',
  'Butterfly',
  'Sunshine',
  'Coconut',
  'Rainbow',
  'Starfish',
  'Lavender',
];

export default function OnboardingPage() {
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [safeWord, setSafeWord] = useState('');
  const [customWord, setCustomWord] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSafeWord = useCustom ? customWord : safeWord;

    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (!finalSafeWord.trim()) {
      setError('Please select or enter a safe word');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase.from('user_profiles').insert({
        user_id: user.id,
        first_name: firstName.trim(),
        phone: phone.trim(),
        safe_word: finalSafeWord.trim(),
      });

      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectSafeWord = (word: string) => {
    setSafeWord(word);
    setUseCustom(false);
    setCustomWord('');
  };

  const handleCustomWordChange = (value: string) => {
    setCustomWord(value);
    setUseCustom(true);
    setSafeWord('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-orange-50/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to Pronto</CardTitle>
          <CardDescription>Let's set up your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">What should we call you?</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Your phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll call this number for safety check-ins
              </p>
            </div>

            <div className="space-y-3">
              <Label>Choose your safe word</Label>
              <p className="text-sm text-muted-foreground">
                This word will be used to verify it's really you during calls
              </p>

              <div className="grid grid-cols-2 gap-2">
                {SAFE_WORD_OPTIONS.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => selectSafeWord(word)}
                    className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between ${
                      safeWord === word && !useCustom
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <span>{word}</span>
                    {safeWord === word && !useCustom && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or choose your own</span>
                </div>
              </div>

              <Input
                type="text"
                placeholder="Enter custom safe word"
                value={customWord}
                onChange={(e) => handleCustomWordChange(e.target.value)}
                className={useCustom && customWord ? 'border-primary' : ''}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Setting up...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
