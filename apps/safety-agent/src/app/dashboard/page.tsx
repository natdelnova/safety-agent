'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Phone, Clock, Users, LogOut, Calendar } from 'lucide-react';
import type { SafetyContact, ScheduledCall, UserProfile } from '@/types';

export default function DashboardPage() {
  const [contacts, setContacts] = useState<SafetyContact[]>([]);
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, contactsRes, callsRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('safety_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false }),
      supabase
        .from('scheduled_calls')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('scheduled_time', { ascending: true }),
    ]);

    setProfile(profileRes.data);
    setContacts(contactsRes.data || []);
    setScheduledCalls(callsRes.data || []);
  };

  const scheduleCall = async (minutesFromNow: number | null) => {
    setScheduling(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // If immediate call (0 minutes), trigger the webhook
    const primaryContact = contacts.find((c) => c.is_primary);
    if (minutesFromNow === 0 && profile?.phone) {
      try {
        const res = await fetch('/api/trigger-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: profile.phone,
            code_word: profile.safe_word,
            emergency_phone: primaryContact?.phone,
            immediate: true,
          }),
        });
        if (res.ok) {
          setCallStatus('success');
          setTimeout(() => setCallStatus('idle'), 3000);
        } else {
          setCallStatus('error');
          setTimeout(() => setCallStatus('idle'), 3000);
        }
      } catch (err) {
        console.error('Failed to trigger call:', err);
        setCallStatus('error');
        setTimeout(() => setCallStatus('idle'), 3000);
      }
      setScheduling(false);
      return;
    }

    let callTime: Date;
    if (minutesFromNow === null) {
      callTime = new Date(scheduledTime);
    } else {
      callTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
    }

    const { error } = await supabase.from('scheduled_calls').insert({
      user_id: user.id,
      scheduled_time: callTime.toISOString(),
      status: 'pending',
    });

    if (!error) {
      setShowScheduler(false);
      setScheduledTime('');
      loadData();
    }
    setScheduling(false);
  };

  const cancelCall = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from('scheduled_calls')
      .update({ status: 'cancelled' })
      .eq('id', id);
    loadData();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const primaryContact = contacts.find((c) => c.is_primary);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50/30 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {profile ? `Hey, ${profile.first_name}` : 'Pronto'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile ? `Safe word: ${profile.safe_word}` : ''}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Request Safety Call
            </CardTitle>
            <CardDescription>
              {primaryContact
                ? `We'll call you and connect you to ${primaryContact.name} if you say the safe phrase`
                : 'Add a safety contact first'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className={`w-full h-16 text-lg ${
                callStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                callStatus === 'error' ? 'bg-red-600 hover:bg-red-700' :
                'bg-emerald-600 hover:bg-emerald-700'
              }`}
              size="xl"
              onClick={() => scheduleCall(0)}
              disabled={scheduling || !profile?.phone}
            >
              <Phone className="w-6 h-6 mr-3" />
              {callStatus === 'success' ? 'Call Triggered!' :
               callStatus === 'error' ? 'Failed - Try Again' :
               scheduling ? 'Calling...' : 'Call Me Now'}
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14"
                onClick={() => scheduleCall(15)}
                disabled={scheduling || contacts.length === 0}
              >
                <Clock className="w-4 h-4 mr-2" />
                In 15 min
              </Button>
              <Button
                variant="outline"
                className="h-14"
                onClick={() => scheduleCall(60)}
                disabled={scheduling || contacts.length === 0}
              >
                <Clock className="w-4 h-4 mr-2" />
                In 1 hour
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowScheduler(!showScheduler)}
              disabled={contacts.length === 0}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Custom Time
            </Button>

            {showScheduler && (
              <div className="pt-3 space-y-3 border-t">
                <div className="space-y-2">
                  <Label htmlFor="scheduled-time">Choose date and time</Label>
                  <Input
                    id="scheduled-time"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => scheduleCall(null)}
                  disabled={!scheduledTime || scheduling}
                >
                  Schedule Call
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Calls */}
        {scheduledCalls.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scheduledCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-medium">{formatTime(call.scheduled_time)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelCall(call.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Safety Contacts
            </CardTitle>
            <CardDescription>
              {contacts.length === 0
                ? 'You need at least one contact'
                : `${contacts.length} contact${contacts.length !== 1 ? 's' : ''} configured`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant={contacts.length === 0 ? 'default' : 'outline'}
              className="w-full"
              onClick={() => router.push('/contacts')}
            >
              {contacts.length === 0 ? 'Add Safety Contacts' : 'Manage Contacts'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
