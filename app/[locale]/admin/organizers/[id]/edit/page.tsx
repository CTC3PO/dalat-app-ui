import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizerForm } from "@/components/admin/organizer-form";
import type { Organizer } from "@/lib/types";

interface EditOrganizerPageProps {
  params: Promise<{ id: string }>;
}

async function getOrganizer(id: string): Promise<Organizer | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizers")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export default async function EditOrganizerPage({
  params,
}: EditOrganizerPageProps) {
  const { id } = await params;
  const organizer = await getOrganizer(id);

  if (!organizer) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Organizer</h1>
        <p className="text-muted-foreground">{organizer.name}</p>
      </div>
      <OrganizerForm organizer={organizer} />
    </div>
  );
}
