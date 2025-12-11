import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const GUARDIAN_WEBHOOK_URL = 'https://ea-one.app.n8n.cloud/webhook/guardian-start';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, code_word, immediate } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Call the guardian webhook
    const webhookResponse = await fetch(GUARDIAN_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        code_word,
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error('Failed to trigger guardian alert');
    }

    // Log the call in the database
    if (immediate) {
      await supabase.from('scheduled_calls').insert({
        user_id: user.id,
        scheduled_time: new Date().toISOString(),
        status: 'completed',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering call:', error);
    return NextResponse.json(
      { error: 'Failed to trigger call' },
      { status: 500 }
    );
  }
}
