import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TribeForm } from "@/components/tribes/tribe-form";

interface PageProps { params: Promise<{ locale: string }>; }

export default async function NewTribePage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect=/tribes/new`);
  return <main className="min-h-screen"><TribeForm locale={locale} /></main>;
}
