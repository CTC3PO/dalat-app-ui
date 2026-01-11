"use client";

import Link from "next/link";
import { ShieldCheck, Clock, XCircle, HelpCircle, ArrowRight } from "lucide-react";
import type { VerificationQueueStats } from "@/lib/admin/analytics";

interface VerificationQueueCardProps {
  stats: VerificationQueueStats | null;
}

export function VerificationQueueCard({ stats }: VerificationQueueCardProps) {
  if (!stats) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          Unable to load verification stats
        </div>
      </div>
    );
  }

  const items = [
    {
      label: "Pending",
      value: stats.pending_count,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Approved",
      value: stats.approved_count,
      icon: ShieldCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Rejected",
      value: stats.rejected_count,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Need Info",
      value: stats.more_info_count,
      icon: HelpCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Verification Queue</h3>
          <p className="text-sm text-muted-foreground">
            Organizer verification requests
          </p>
        </div>
        {stats.pending_count > 0 && (
          <Link
            href="/admin/verifications"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Review
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div
              className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${item.bgColor}`}
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
      {stats.pending_count > 0 && (
        <div className="mt-4 rounded-lg bg-yellow-500/10 p-3 text-center">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            {stats.pending_count} request{stats.pending_count !== 1 ? "s" : ""}{" "}
            awaiting review
          </p>
        </div>
      )}
    </div>
  );
}
