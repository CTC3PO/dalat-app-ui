import { OrganizerForm } from "@/components/admin/organizer-form";

export default function NewOrganizerPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Organizer</h1>
        <p className="text-muted-foreground">
          Create a new venue or organization
        </p>
      </div>
      <OrganizerForm />
    </div>
  );
}
