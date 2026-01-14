import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { NotificationMode } from '@/lib/types';

const VALID_MODES: NotificationMode[] = [
  'sound_and_vibration',
  'sound_only',
  'vibration_only',
  'silent',
];

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { mode } = await request.json();

  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  // Update all subscriptions for this user
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ notification_mode: mode })
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to update notification preference:', error);
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get the mode from any active subscription
  const { data } = await supabase
    .from('push_subscriptions')
    .select('notification_mode')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  return NextResponse.json({ mode: data?.notification_mode || 'sound_and_vibration' });
}
