import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams { params: Promise<{ slug: string }>; }

export async function GET(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const includeBanned = searchParams.get('banned') === 'true';

  const { data: tribe } = await supabase.from('tribes').select('id').eq('slug', slug).single();
  if (!tribe) return NextResponse.json({ error: 'Tribe not found' }, { status: 404 });

  let query = supabase
    .from('tribe_members')
    .select(`*, profiles:user_id(id, display_name, avatar_url, username)`)
    .eq('tribe_id', tribe.id)
    .order('joined_at', { ascending: true });

  if (!includeBanned) {
    query = query.eq('status', 'active');
  }

  const { data: members, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ members });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { slug } = await params;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { user_id, role, status } = body;

  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const { data: tribe } = await supabase.from('tribes').select('id, created_by').eq('slug', slug).single();
  if (!tribe) return NextResponse.json({ error: 'Tribe not found' }, { status: 404 });

  const { data: membership } = await supabase.from('tribe_members').select('role').eq('tribe_id', tribe.id).eq('user_id', user.id).single();
  const isAdmin = tribe.created_by === user.id || membership?.role === 'leader' || membership?.role === 'admin';
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  if (user_id === tribe.created_by) return NextResponse.json({ error: 'Cannot modify creator' }, { status: 400 });

  // Only leaders can promote to leader or demote from leader
  if (role === 'leader' || role === 'admin') {
    const { data: targetMember } = await supabase.from('tribe_members').select('role').eq('tribe_id', tribe.id).eq('user_id', user_id).single();
    if (targetMember?.role === 'leader' && membership?.role !== 'leader' && tribe.created_by !== user.id) {
      return NextResponse.json({ error: 'Only leaders can modify other leaders' }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (role) updates.role = role;
  if (status) updates.status = status;

  await supabase.from('tribe_members').update(updates).eq('tribe_id', tribe.id).eq('user_id', user_id);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { slug } = await params;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const { data: tribe } = await supabase.from('tribes').select('id, created_by').eq('slug', slug).single();
  if (!tribe) return NextResponse.json({ error: 'Tribe not found' }, { status: 404 });

  const { data: membership } = await supabase.from('tribe_members').select('role').eq('tribe_id', tribe.id).eq('user_id', user.id).single();
  const isAdmin = tribe.created_by === user.id || membership?.role === 'leader' || membership?.role === 'admin';
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  if (user_id === tribe.created_by) return NextResponse.json({ error: 'Cannot remove creator' }, { status: 400 });

  await supabase.from('tribe_members').delete().eq('tribe_id', tribe.id).eq('user_id', user_id);

  return NextResponse.json({ success: true });
}
