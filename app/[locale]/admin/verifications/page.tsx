import { Link } from "@/lib/i18n/routing";
import { ArrowLeft, ShieldCheck, Clock, XCircle, HelpCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { VerificationRequest } from "@/lib/types";
import { VerificationRequestCard } from "@/components/admin/verification-request-card";

async function getVerificationRequests() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("verification_requests")
    .select(
      `
      *,
      profiles:user_id (id, username, display_name, avatar_url),
      reviewer:reviewed_by (id, username, display_name)
    `
    )
    .order("created_at", { ascending: false });

  return (data ?? []) as (VerificationRequest & {
    profiles: { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
    reviewer: { id: string; username: string | null; display_name: string | null } | null;
  })[];
}

export default async function VerificationsPage() {
  const requests = await getVerificationRequests();

  // Group by status
  const pending = requests.filter((r) => r.status === "pending");
  const moreInfo = requests.filter((r) => r.status === "more_info_needed");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  const statusSections = [
    {
      title: "Pending Review",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      requests: pending,
    },
    {
      title: "More Info Needed",
      icon: HelpCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      requests: moreInfo,
    },
    {
      title: "Approved",
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      requests: approved,
    },
    {
      title: "Rejected",
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      requests: rejected,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin"
              className="-ml-3 flex items-center gap-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all px-3 py-2 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold">Verification Requests</h1>
          </div>
          <p className="text-muted-foreground">
            Review and approve organizer verification requests
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-sm font-medium">{pending.length} pending</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statusSections.map((section) => (
          <div
            key={section.title}
            className={`p-4 rounded-lg ${section.bgColor} flex items-center gap-3`}
          >
            <section.icon className={`h-8 w-8 ${section.color}`} />
            <div>
              <p className="text-2xl font-bold">{section.requests.length}</p>
              <p className="text-xs text-muted-foreground">{section.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Request Lists */}
      {statusSections.map(
        (section) =>
          section.requests.length > 0 && (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-4">
                <section.icon className={`h-5 w-5 ${section.color}`} />
                <h2 className="font-semibold">{section.title}</h2>
                <span className="text-sm text-muted-foreground">
                  ({section.requests.length})
                </span>
              </div>
              <div className="space-y-4">
                {section.requests.map((request) => (
                  <VerificationRequestCard
                    key={request.id}
                    request={request}
                    isPending={request.status === "pending" || request.status === "more_info_needed"}
                  />
                ))}
              </div>
            </div>
          )
      )}

      {/* Empty State */}
      {requests.length === 0 && (
        <div className="text-center py-20 border rounded-lg bg-card">
          <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Verification Requests</h3>
          <p className="text-muted-foreground">
            When users request organizer verification, they&apos;ll appear here.
          </p>
        </div>
      )}
    </div>
  );
}
