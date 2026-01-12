import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams { params: Promise<{ code: string }>; }

export async function GET(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { code } = await params;

  const { data: tribes } = await supabase.rpc('get_tribe_by_code', { p_code: code });
  const tribe = tribes?.[0];

  if (!tribe) return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });

  return NextResponse.json({
    tribe: { slug: tribe.slug, name: tribe.name, description: tribe.description, cover_image_url: tribe.cover_image_url, access_type: tribe.access_type },
  });
}
