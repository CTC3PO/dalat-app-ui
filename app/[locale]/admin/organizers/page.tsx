import { Link } from "@/lib/i18n/routing";
import { Plus, Building2, BadgeCheck, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Organizer } from "@/lib/types";

async function getOrganizers(): Promise<Organizer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizers")
    .select("*")
    .order("is_verified", { ascending: false })
    .order("name");
  return data ?? [];
}

export default async function OrganizersPage() {
  const organizers = await getOrganizers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizers</h1>
          <p className="text-muted-foreground">
            Manage venues and organizations
          </p>
        </div>
        <Link href="/admin/organizers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Organizer
          </Button>
        </Link>
      </div>

      {organizers.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No organizers yet</h2>
          <p className="text-muted-foreground mb-4">
            Add your first organizer to start linking events.
          </p>
          <Link href="/admin/organizers/new">
            <Button>Add Organizer</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizers.map((org) => (
            <Link
              key={org.id}
              href={`/admin/organizers/${org.id}/edit`}
              className="group rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="shrink-0 w-16 h-16 rounded-lg bg-muted overflow-hidden">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{org.name}</h3>
                    {org.is_verified && (
                      <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    /{org.slug}
                  </p>
                  {org.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {org.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Links */}
              {(org.website_url || org.facebook_url) && (
                <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
                  {org.website_url && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </span>
                  )}
                  {org.facebook_url && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Facebook
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
