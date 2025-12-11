'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Star, User } from 'lucide-react';
import type { SafetyContact } from '@/types';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<SafetyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('safety_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });

    setContacts(data || []);
    setLoading(false);
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isPrimary = contacts.length === 0;

    const { error } = await supabase.from('safety_contacts').insert({
      user_id: user.id,
      name,
      phone,
      relationship,
      is_primary: isPrimary,
    });

    if (!error) {
      setName('');
      setPhone('');
      setRelationship('');
      setShowForm(false);
      loadContacts();
    }
  };

  const deleteContact = async (id: string) => {
    const supabase = createClient();
    await supabase.from('safety_contacts').delete().eq('id', id);
    loadContacts();
  };

  const setPrimary = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('safety_contacts')
      .update({ is_primary: false })
      .eq('user_id', user.id);

    await supabase
      .from('safety_contacts')
      .update({ is_primary: true })
      .eq('id', id);

    loadContacts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Safety Contacts</h1>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Your Emergency Contacts</CardTitle>
            <CardDescription>
              These people will be called when you request a safety check-in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : contacts.length === 0 ? (
              <p className="text-muted-foreground">No contacts yet. Add your first safety contact below.</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contact.name}</p>
                          {contact.is_primary && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!contact.is_primary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPrimary(contact.id)}
                          title="Set as primary"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteContact(contact.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addContact} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    placeholder="Friend, Family, Partner..."
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Contact
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button className="w-full" size="lg" onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Safety Contact
          </Button>
        )}
      </div>
    </div>
  );
}
