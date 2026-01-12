import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Get user's tribes
  const { data: memberships } = await supabase
    .from('tribe_members')
    .select(`*, tribes(id, slug, name, cover_image_url, access_type)`)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false });

  // Get pending requests
  const { data: pendingRequests } = await supabase
    .from('tribe_requests')
    .select(`*, tribes(id, slug, name, cover_image_url)`)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return NextResponse.json({
    tribes: memberships || [],
    pending_requests: pendingRequests || [],
  });
}
