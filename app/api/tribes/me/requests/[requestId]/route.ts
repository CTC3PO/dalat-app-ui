import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams { params: Promise<{ requestId: string }>; }

export async function DELETE(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { requestId } = await params;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: existingRequest } = await supabase
    .from('tribe_requests')
    .select('id, user_id, status')
    .eq('id', requestId)
    .single();

  if (!existingRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (existingRequest.user_id !== user.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  if (existingRequest.status !== 'pending') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

  await supabase
    .from('tribe_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId);

  return NextResponse.json({ success: true });
}
