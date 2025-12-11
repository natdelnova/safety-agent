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
    const { name, phone, code_word, emergency_name, emergency_phone, scheduled_time } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Call the guardian webhook
    const payload: Record<string, string | undefined> = { name, phone, code_word, emergency_name, emergency_phone };
    if (scheduled_time) {
      payload.scheduled_time = scheduled_time;
    }
    console.log('[trigger-call] Calling webhook:', GUARDIAN_WEBHOOK_URL);
    console.log('[trigger-call] Payload:', JSON.stringify(payload));

    const webhookResponse = await fetch(GUARDIAN_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[trigger-call] Response status:', webhookResponse.status);
    const responseText = await webhookResponse.text();
    console.log('[trigger-call] Response body:', responseText);

    if (!webhookResponse.ok) {
      console.error('[trigger-call] Webhook failed:', responseText);
      throw new Error(`Webhook failed: ${webhookResponse.status} - ${responseText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[trigger-call] Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger call', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
